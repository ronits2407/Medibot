/**
 * Backup Regex Net for explicit restricted classifications.
 * As mandated in DESIGN.md §7.2 step 6:
 * - Handles explicit phrases ("schedule h", "schedule h1", "schedule x", "narcotic", "prescription only")
 * - Strictly avoids broad terms like "antibiotic" or bare "rx" to prevent false positives on OTC products.
 */

export interface RegexNetResult {
  restricted: boolean;
  matchedPattern?: string;
  schedule?: "H" | "H1" | "X" | "NDPS";
}

const RESTRICTED_PATTERNS: Array<{ regex: RegExp; schedule: "H" | "H1" | "X" | "NDPS" }> = [
  { regex: /\b(schedule\s*h1)\b/i, schedule: "H1" },
  { regex: /\b(schedule\s*x)\b/i, schedule: "X" },
  { regex: /\b(schedule\s*h)\b/i, schedule: "H" },
  { regex: /\b(ndps\s*(act|drug)?|narcotic(\s*drug)?|psychotropic)\b/i, schedule: "NDPS" },
  { regex: /\b(prescription\s*(required|only|mandatory))\b/i, schedule: "H" },
  { regex: /\b(doctor'?s\s*prescription\s*(required|needed))\b/i, schedule: "H" },
  { regex: /\b(requires?\s*a\s*valid\s*prescription)\b/i, schedule: "H" },
  { regex: /\b(controlled\s*substance)\b/i, schedule: "H1" },
];

export function runRegexNet(query: string): RegexNetResult {
  const normalized = query.toLowerCase();

  for (const { regex, schedule } of RESTRICTED_PATTERNS) {
    const match = normalized.match(regex);
    if (match) {
      return {
        restricted: true,
        matchedPattern: match[0],
        schedule,
      };
    }
  }

  return { restricted: false };
}
