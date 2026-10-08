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
