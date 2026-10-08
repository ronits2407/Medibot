import { MANDATED_PRESCRIPTION_PROMPT, MANDATORY_DISCLAIMER } from "@/lib/constants";
import { GuardResult } from "@/lib/guard";

// Patterns that indicate illegal medical diagnosis or prescribing
const DIAGNOSIS_PATTERNS = [
  /\byou\s+(have|are\s+suffering\s+from|might\s+have|seem\s+to\s+have)\b/i,
  /\byour\s+diagnosis\s+is\b/i,
  /\bi\s+diagnose\s+you\b/i,
  /\byou\s+are\s+diagnosed\s+with\b/i,
];

const PRESCRIBING_PATTERNS = [
  /\byou\s+should\s+(take|consume|inject|use)\s+\d+\s*(mg|ml|tablets?|capsules?)\b/i,
  /\bi\s+recommend\s+you\s+take\b/i,
  /\bi\s+prescribe\b/i,
  /\btake\s+this\s+dose\b/i,
  /\bincrease\s+your\s+dosage\s+to\b/i,
];

export interface ValidationResult {
  valid: boolean;
  sanitizedMarkdown: string;
  cards: Array<Record<string, any>>;
  violations: string[];
}

/**
 * Output Validator - Code Authority over LLM generated responses
 * Prevents medical liability, hallucinatory numbers, and illegal prescribing.
 */
export function validateAndSanitizeOutput(
  rawMarkdown: string,
  cards: Array<Record<string, any>>,
  guardResult: GuardResult
): ValidationResult {
  const violations: string[] = [];
  let markdown = rawMarkdown;

  // 1. Diagnosis check
  for (const pattern of DIAGNOSIS_PATTERNS) {
    if (pattern.test(markdown)) {
      violations.push("DIAGNOSIS_DETECTED");
      markdown =
        "I cannot diagnose medical conditions. If you are experiencing symptoms, please consult a qualified healthcare professional immediately.";
      break;
    }
  }

  // 2. Prescribing check
  for (const pattern of PRESCRIBING_PATTERNS) {
    if (pattern.test(markdown)) {
      violations.push("PRESCRIBING_DETECTED");
      markdown =
        "I cannot prescribe medications or individual dosing schedules. Please consult your physician or pharmacist for accurate dosage guidance.";
      break;
    }
  }

  // 3. Restricted Invariant Check
  if (guardResult.verdict === "RESTRICTED") {
    // If restricted, the mandated prompt MUST be present character-for-character
    if (!markdown.includes(MANDATED_PRESCRIPTION_PROMPT)) {
      markdown = `${MANDATED_PRESCRIPTION_PROMPT}\n\n${markdown}`;
    }

    // Strip any purchase or substitution CTA cards for restricted items
    cards = cards.filter(
      (c) => c.type !== "alternatives" && c.type !== "price_table"
    );

    // Ensure RestrictedAlert card is present
    if (!cards.some((c) => c.type === "restricted_alert")) {
      cards.unshift({
        type: "restricted_alert",
        data: {
          mandatedPrompt: MANDATED_PRESCRIPTION_PROMPT,
          triggeredBy: guardResult.triggeredBy,
          entities: guardResult.entities,
        },
      });
    }
  }

  // 4. Composition re-verification for alternatives
  cards = cards.filter((card) => {
    if (card.type === "alternatives" && card.data) {
      const sourceHash = card.data.sourceCompositionHash;
      if (sourceHash && Array.isArray(card.data.items)) {
        // Discard any alternative whose compositionHash doesn't match exactly
        card.data.items = card.data.items.filter(
          (item: any) => item.compositionHash === sourceHash
        );
        return card.data.items.length > 0;
      }
    }
    return true;
  });

  // 5. Code-appended Disclaimer Footer
  if (!markdown.includes(MANDATORY_DISCLAIMER)) {
    markdown = `${markdown}\n\n---\n*Disclaimer: ${MANDATORY_DISCLAIMER}*`;
  }

  return {
    valid: violations.length === 0,
    sanitizedMarkdown: markdown,
    cards,
    violations,
  };
}
