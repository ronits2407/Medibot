import { getGroqClient, GROQ_MODELS } from "@/lib/llm/groq";
import { IEntityMemory } from "@/lib/db/models/Chat";

export interface ExtractedMention {
  mention: string;
  type: "DRUG" | "SALT" | "CONDITION" | "OTHER";
  confidence?: number;
}

/**
 * Extract drug and medicine candidate mentions from user query.
 * Combines fast regex/n-gram heuristics, LLM entity extractor, and conversational memory resolution.
 */
export async function extractMentions(
  rawText: string,
  sessionMemory?: IEntityMemory
): Promise<ExtractedMention[]> {
  const mentions: ExtractedMention[] = [];
  const lower = rawText.toLowerCase().trim();

  // 1. Resolve conversational memory references
  // e.g. "the second one", "the first medicine", "what about that one?"
  if (sessionMemory) {
    if (lower.includes("first") && sessionMemory.lastAlternatives?.[0]) {
      mentions.push({
        mention: sessionMemory.lastAlternatives[0].name,
        type: "DRUG",
        confidence: 0.95,
      });
    } else if (lower.includes("second") && sessionMemory.lastAlternatives?.[1]) {
      mentions.push({
        mention: sessionMemory.lastAlternatives[1].name,
        type: "DRUG",
        confidence: 0.95,
      });
    } else if (lower.includes("third") && sessionMemory.lastAlternatives?.[2]) {
      mentions.push({
        mention: sessionMemory.lastAlternatives[2].name,
        type: "DRUG",
        confidence: 0.95,
      });
    } else if (
      (lower.includes("that") || lower.includes("this") || lower.includes("it")) &&
      sessionMemory.currentMedicine
    ) {
      mentions.push({
        mention: sessionMemory.currentMedicine.name,
        type: "DRUG",
        confidence: 0.9,
      });
    }
  }

  // 2. Fast LLM Entity Extraction via Groq
  try {
    const groq = getGroqClient();
    const systemPrompt = `You are an automated text parser extracting pharmaceutical tokens for search indexing.
Extract medicine brand names or active chemical salts mentioned in the input string.
Do not diagnose, advise, or converse. Return JSON ONLY:
{
  "mentions": [
    { "mention": "extracted drug or salt name", "type": "DRUG" | "SALT" }
  ]
}
If no specific medicine or salt is mentioned, return { "mentions": [] }.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.EXTRACTOR,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.mentions)) {
        for (const item of parsed.mentions) {
          if (item.mention && typeof item.mention === "string") {
            const clean = item.mention.trim();
            if (clean && !mentions.some((m) => m.mention.toLowerCase() === clean.toLowerCase())) {
              mentions.push({
                mention: clean,
                type: item.type === "SALT" ? "SALT" : "DRUG",
                confidence: 0.9,
              });
            }
          }
        }
      }
    }
  } catch {
    // Seamless fallback to heuristic tokenization if LLM is unavailable
  }

  // 3. Fallback Heuristics: N-gram extraction for common drug naming patterns
  // Clean punctuation and check words that look like drug names (especially with strengths like 500, 650, Duo, etc.)
  const tokens = rawText.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length > 0 && mentions.length === 0) {
    // If only 1-3 words, entire prompt could be a drug name query (e.g. "augmentin 625", "paracetamol")
    if (tokens.length <= 4) {
      mentions.push({
        mention: rawText.trim(),
        type: "DRUG",
        confidence: 0.6,
      });
    }
  }

  return mentions;
}
