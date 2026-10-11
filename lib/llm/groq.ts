import Groq from "groq-sdk";

export const GROQ_MODELS = {
  COMPOSER: "openai/gpt-oss-120b",
  ROUTER: "openai/gpt-oss-20b",
  CLASSIFIER: "openai/gpt-oss-20b",
  EXTRACTOR: "openai/gpt-oss-20b",
  VISION: "openai/gpt-oss-20b",
  WHISPER: "whisper-large-v3-turbo",
} as const;

export const FAST_MODEL = GROQ_MODELS.ROUTER;
export const DEEP_MODEL = GROQ_MODELS.COMPOSER;

let groqInstance: Groq | null = null;

export function getGroqClient(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not defined in environment variables");
    }
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

export default getGroqClient;
