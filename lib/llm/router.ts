import { getGroqClient, GROQ_MODELS } from "./groq";
import { z } from "zod";

export const IntentEnum = z.enum([
  "PRICE_COMPARE",
  "FIND_ALTERNATIVE",
  "DRUG_INFO",
  "INTERACTION_CHECK",
  "REFILL_REMINDER",
  "DELIVERY_ETA",
  "PRESCRIPTION_UPLOAD",
  "GENERAL_HEALTH",
  "DIAGNOSIS_REQUEST",
  "SMALL_TALK",
  "OUT_OF_SCOPE",
]);

export type Intent = z.infer<typeof IntentEnum>;

export const RouterOutputSchema = z.object({
  intent: IntentEnum,
  entities: z.array(
    z.object({
      mention: z.string(),
      type: z.enum(["DRUG", "CONDITION", "PHARMACY", "PINCODE", "OTHER"]),
    })
  ),
  isFollowUp: z.boolean(),
  needsClarification: z.boolean(),
  language: z.string().default("en"),
});

export type RouterOutput = z.infer<typeof RouterOutputSchema>;

/**
 * Deterministic Intent Router
 * Classifies query intent and extracts mentions at temperature 0 with strict JSON output
 */
export async function routeUserQuery(
  query: string,
  historyContext?: string
): Promise<RouterOutput> {
  const groq = getGroqClient();

  const systemPrompt = `You are the intent router for MediBot, an Indian pharmaceutical and health information assistant.
Determine the primary intent and extract key entities.

Intents:
- "PRICE_COMPARE": User wants to compare medicine prices or find cheapest pharmacy.
- "FIND_ALTERNATIVE": User asks for generic, substitute, or cheaper equivalent with same composition.
- "DRUG_INFO": User asks what a medicine is, uses, side effects, how to take, interactions.
- "INTERACTION_CHECK": User asks if two drugs can be taken together.
- "REFILL_REMINDER": User asks to set a reminder or schedule refills.
- "DELIVERY_ETA": User asks about delivery time or pincode serviceability.
- "PRESCRIPTION_UPLOAD": User wants to upload an Rx or image.
- "GENERAL_HEALTH": General wellness or OTC queries.
- "DIAGNOSIS_REQUEST": User asks "what illness do I have?", "diagnose my symptoms", or asks for a diagnosis.
- "SMALL_TALK": Greetings, compliments, thanks.
- "OUT_OF_SCOPE": Non-health/non-pharmacy topics.

RESPOND ONLY IN VALID JSON matching:
{
  "intent": "PRICE_COMPARE" | "FIND_ALTERNATIVE" | "DRUG_INFO" | "INTERACTION_CHECK" | "REFILL_REMINDER" | "DELIVERY_ETA" | "PRESCRIPTION_UPLOAD" | "GENERAL_HEALTH" | "DIAGNOSIS_REQUEST" | "SMALL_TALK" | "OUT_OF_SCOPE",
  "entities": [{ "mention": "...", "type": "DRUG" | "CONDITION" | "PHARMACY" | "PINCODE" | "OTHER" }],
  "isFollowUp": boolean,
  "needsClarification": boolean,
  "language": "en" | "hi" | "..."
}`;

  const messages: Array<{ role: "system" | "user"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  if (historyContext) {
    messages.push({
      role: "user",
      content: `Previous Context:\n${historyContext}\n\nCurrent User Message:\n${query}`,
    });
  } else {
    messages.push({ role: "user", content: query });
  }

  try {
    const res = await groq.chat.completions.create({
      model: GROQ_MODELS.ROUTER,
      messages,
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content || "{}");
    const validated = RouterOutputSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
  } catch (error) {
    console.error("Router error:", error);
  }

  // Fallback heuristic
  const isDiag = /\b(what (do I have|illness|disease)|diagnose|symptoms)\b/i.test(query);
  return {
    intent: isDiag ? "DIAGNOSIS_REQUEST" : "DRUG_INFO",
    entities: [],
    isFollowUp: false,
    needsClarification: false,
    language: "en",
  };
}
