import { getGroqClient, GROQ_MODELS } from "@/lib/llm/groq";

export type ClassifierVerdict = "RESTRICTED" | "OTC" | "UNKNOWN";

export interface ClassifierResult {
  verdict: ClassifierVerdict;
  confidence: number;
  reasoning?: string;
}

/**
 * LLM Safety Classifier Net
 * Evaluates full queries (including indirect or deceptive phrasing) for prescription/Schedule H intent.
 * Runs at temperature 0 for maximum consistency.
 */
export async function classifySafetyWithLLM(query: string): Promise<ClassifierResult> {
  // Fast bypass for empty or trivial greetings
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed === "hi" || trimmed === "hello" || trimmed === "hey") {
    return { verdict: "UNKNOWN", confidence: 1.0 };
  }

  try {
    const groq = getGroqClient();
    const systemPrompt = `You are an Indian pharmaceutical prescription safety classifier under CDSCO regulations.
Classify the user's intent into exactly ONE enum:
- "RESTRICTED": If user mentions, requests, hints at, or asks about Schedule H, Schedule H1, Schedule X, NDPS, antibiotics, psychiatric sedatives, strong painkillers, or prescription-only medications (even if phrased indirectly like "the sleeping pill", "anxiety med", "strong infection medicine", "habit forming syrup").
- "OTC": If user is purely asking about verified Over-The-Counter medicines (paracetamol, cetirizine, ORS, antacids, throat lozenges, simple vitamins).
- "UNKNOWN": If no specific medicine is requested, general conversation, or ambiguous non-drug topic.

RESPOND ONLY WITH VALID JSON:
{
  "verdict": "RESTRICTED" | "OTC" | "UNKNOWN",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation"
}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.CLASSIFIER,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (
        parsed.verdict === "RESTRICTED" ||
        parsed.verdict === "OTC" ||
        parsed.verdict === "UNKNOWN"
      ) {
        return {
          verdict: parsed.verdict,
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
          reasoning: parsed.reasoning,
        };
      }
    }
  } catch {
    // Fallback safely to UNKNOWN if rate-limited or error occurs
  }

  return { verdict: "UNKNOWN", confidence: 0 };
}

export interface RestrictionConfirmationResult {
  proceed: boolean; // true = safe to proceed (not a restricted drug query); false = block with prescription caution
  confidence: number;
  reasoning: string;
}

/**
 * Two-stage Confirmation:
 * When deterministic checks flag a query as RESTRICTED (or potentially restricted),
 * query the LLM to verify whether it's a genuine restricted prescription inquiry
 * or a false positive (greeting, conversational filler, harmless question, OTC).
 */
export async function confirmRestrictionWithLLM(
  query: string,
  details: {
    triggeredBy?: string;
    schedule?: string;
    matchedSalt?: string;
    candidateName?: string;
    entities?: Array<{ name?: string; mention?: string; salts?: string[]; schedule?: string }>;
  }
): Promise<RestrictionConfirmationResult> {
  const trimmed = query.trim().toLowerCase();

  // 1. Fast path for obvious conversational greetings and pleasantries
  const GREETING_REGEX = /^(hi|hello|hey|hola|namaste|good\s+(morning|afternoon|evening)|howdy|sup|yo|thanks|thank\s+you|ok|okay|bye|goodbye)\b/i;
  if (GREETING_REGEX.test(trimmed) && trimmed.split(/\s+/).length <= 5) {
    return {
      proceed: true,
      confidence: 1.0,
      reasoning: "Conversational greeting or courtesy phrase; clearly not a prescription drug inquiry.",
    };
  }

  // 2. Fast check: If user query explicitly contains the matched restricted salt as a whole word,
  // this is definitively a prescription drug inquiry (e.g. asking for price, dose, or availability of cefixime/amoxicillin)
  if (details.matchedSalt && new RegExp(`\\b${details.matchedSalt}\\b`, "i").test(trimmed)) {
    return {
      proceed: false,
      confidence: 1.0,
      reasoning: `User explicitly mentioned restricted pharmaceutical active ingredient: ${details.matchedSalt}. Under CDSCO Schedule regulations, prescription caution is mandatory.`,
    };
  }

  // 3. Query LLM Adjudicator
  try {
    const groq = getGroqClient();
    const systemPrompt = `You are a medical prescription safety adjudicator under Indian pharmaceutical CDSCO regulations.
A deterministic safety filter flagged the user's message as potentially concerning / restricted under Schedule H / H1 / X / NDPS prescription regulations.

Your task is to determine:
1. Does the user's message mention, inquire about, compare prices of, or request a prescription-controlled drug (Schedule H, Schedule H1, Schedule X, NDPS, such as antibiotics, sedatives, opioids, or prescription-only medicines)?
   -> If YES, return: "proceed": false (meaning DO NOT proceed normally; MUST enforce prescription caution).
2. Or is this a FALSE POSITIVE (e.g. a greeting like "hi" or "hello", general conversational chatter, a safe non-drug question, symptom description without asking for restricted prescription drugs, or an Over-The-Counter item like paracetamol/antacid)?
   -> If YES, return: "proceed": true (meaning SAFE TO PROCEED without prescription caution).

RESPOND STRICTLY IN VALID JSON:
{
  "proceed": boolean,
  "confidence": number,
  "reasoning": "brief explanation"
}`;

    const contextStr = [
      `User Message: "${query}"`,
      `Flag Triggered By: ${details.triggeredBy || "deterministic_rule"}`,
      details.schedule ? `Schedule: ${details.schedule}` : null,
      details.matchedSalt ? `Matched Salt: ${details.matchedSalt}` : null,
      details.candidateName ? `Candidate Name: ${details.candidateName}` : null,
      details.entities && details.entities.length > 0
        ? `Detected Entities: ${details.entities.map((e) => `${e.name || e.mention} (${e.schedule || "unknown"})`).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.CLASSIFIER,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please adjudicate this flagged query:\n\n${contextStr}` },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (typeof parsed.proceed === "boolean") {
        return {
          proceed: parsed.proceed,
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
          reasoning: parsed.reasoning || "",
        };
      }
    }
  } catch (error) {
    console.warn("LLM confirmation check error:", error);
  }

  // If LLM call fails, fail safely: if deterministic matched a known Schedule H/H1/X/NDPS drug, do not proceed
  return {
    proceed: false,
    confidence: 0.5,
    reasoning: "Adjudication fallback: unable to confirm with LLM, adhering to safety guard.",
  };
}
