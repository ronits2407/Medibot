import { getGroqClient, GROQ_MODELS } from "@/lib/llm/groq";
import { IEntityMemory } from "@/lib/db/models/Chat";
import { MEDICINE_CATALOG } from "@/lib/data/catalog";
import { OTC_SALTS_ALLOWLIST, BUILTIN_RESTRICTED_SALTS } from "./saltCheck";

export interface ExtractedMention {
  mention: string;
  type: "DRUG" | "SALT" | "CONDITION" | "OTHER";
  confidence?: number;
}

export const COMMON_CONVERSATIONAL_TOKENS = new Set([
  "hi", "hello", "hey", "hola", "namaste", "good", "morning", "afternoon", "evening",
  "thanks", "thank", "you", "thx", "ty", "bye", "goodbye", "ok", "okay", "k",
  "yes", "no", "sure", "yep", "nope", "please", "help", "how", "what", "where",
  "why", "who", "when", "can", "could", "would", "should", "is", "are", "am",
  "i", "me", "my", "we", "our", "your", "he", "she", "it", "they",
  "test", "testing", "ping", "pong"
]);

/**
 * Extract drug and medicine candidate mentions from user query.
 * Combines fast regex/catalog heuristics, LLM entity extractor, and conversational memory resolution.
 */
export async function extractMentions(
  rawText: string,
  sessionMemory?: IEntityMemory
): Promise<ExtractedMention[]> {
  const mentions: ExtractedMention[] = [];
  const lower = rawText.toLowerCase().trim();

  // 1. Resolve conversational memory references
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

  // 2. Fast catalog & salt match heuristic (instant, sub-millisecond)
  for (const med of MEDICINE_CATALOG) {
    const brandLow = med.brandName.toLowerCase();
    if (new RegExp(`\\b${brandLow}\\b`, "i").test(lower)) {
      if (!mentions.some((m) => m.mention.toLowerCase() === brandLow)) {
        mentions.push({
          mention: med.brandName,
          type: "DRUG",
          confidence: 1.0,
        });
      }
    }
  }

  // Check known OTC salts
  for (const salt of Array.from(OTC_SALTS_ALLOWLIST)) {
    if (new RegExp(`\\b${salt}\\b`, "i").test(lower)) {
      if (!mentions.some((m) => m.mention.toLowerCase() === salt)) {
        mentions.push({
          mention: salt,
          type: "SALT",
          confidence: 1.0,
        });
      }
    }
  }

  // Check known restricted salts
  for (const salt of Object.keys(BUILTIN_RESTRICTED_SALTS)) {
    if (new RegExp(`\\b${salt}\\b`, "i").test(lower)) {
      if (!mentions.some((m) => m.mention.toLowerCase() === salt)) {
        mentions.push({
          mention: salt,
          type: "SALT",
          confidence: 1.0,
        });
      }
    }
  }

  // If already found catalog matches, return immediately without LLM overhead!
  if (mentions.length > 0) {
    return mentions;
  }

  // 3. Fallback: Fast LLM Entity Extraction via Groq for obscure or transliterated mentions
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
            if (
              clean &&
              !COMMON_CONVERSATIONAL_TOKENS.has(clean.toLowerCase()) &&
              !mentions.some((m) => m.mention.toLowerCase() === clean.toLowerCase())
            ) {
              mentions.push({
                mention: clean,
                type: item.type === "SALT" ? "SALT" : "DRUG",
                confidence: 0.85,
              });
            }
          }
        }
      }
    }
  } catch {
    // Graceful fallback
  }

  return mentions;
}
