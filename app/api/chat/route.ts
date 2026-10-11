import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { Chat } from "@/lib/db/models/Chat";
import { Message } from "@/lib/db/models/Message";
import { User } from "@/lib/db/models/User";
import { AuditLog } from "@/lib/db/models/AuditLog";
import { guard } from "@/lib/guard";
import { routeUserQuery } from "@/lib/llm/router";
import { lookupMedicine, getAlternatives, comparePrices } from "@/lib/tools";
import { validateAndSanitizeOutput } from "@/lib/validators/output";
import { getGroqClient, GROQ_MODELS } from "@/lib/llm/groq";
import {
  MANDATED_PRESCRIPTION_PROMPT,
  MANDATORY_DISCLAIMER,
  DISCLAIMER_VERSION,
} from "@/lib/constants";

// In-memory session store fallback when MongoDB is offline
const inMemoryMemory = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const { chatId, message, language = "en", pincode = "110001" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message parameter" }, { status: 400 });
    }

    // 1. Try DB connection (fails-fast if offline)
    let isDbOnline = false;
    try {
      await connectToDatabase();
      isDbOnline = true;
    } catch {
      isDbOnline = false;
    }

    // 2. Fetch or initialize Chat session memory
    let effectiveChatId = chatId || `chat_${Date.now()}`;
    let sessionMemory: any = inMemoryMemory.get(effectiveChatId) || {
      language: "en",
      pincode: pincode || "110001",
      mentionedMedicines: [],
    };

    if (isDbOnline) {
      try {
        let chatDoc = null;
        if (chatId) chatDoc = await Chat.findById(chatId);
        if (!chatDoc) {
          chatDoc = await Chat.create({
            userId: session?.user?.id || "guest",
            title: message.slice(0, 35) + "...",
            entityMemory: sessionMemory,
          });
        }
        effectiveChatId = chatDoc._id.toString();
        const rawEntityMem = chatDoc.entityMemory as any;
        const dbMemory = rawEntityMem?.toObject ? rawEntityMem.toObject() : rawEntityMem;
        if (dbMemory) {
          sessionMemory = {
            ...sessionMemory,
            ...dbMemory,
            currentMedicine:
              dbMemory.currentMedicine?.name
                ? dbMemory.currentMedicine
                : sessionMemory.currentMedicine,
          };
        }
      } catch {}
    }

    // 3. Prescription Guard - Fail-Closed Execution (Rule 0 & §7)
    const guardResult = await guard(message, undefined, sessionMemory);

    // Record Audit Log if DB is online
    if (isDbOnline) {
      try {
        await AuditLog.create({
          userId: session?.user?.id || "guest",
          chatId: effectiveChatId,
          finalVerdict: guardResult.verdict,
          triggeredBy: guardResult.triggeredBy,
          resolvedEntities: guardResult.entities as any,
          layerVerdicts: guardResult.layers as any,
        });
      } catch {}
    }

    // 4. Intent Routing & Tool Execution
    const routerOut = await routeUserQuery(message);
    const cards: Array<Record<string, any>> = [];

    // Lookup target medicine if entity found
    let drugLookupData: any = null;
    let alternativesData: any = null;
    let priceTableData: any = null;

    if (guardResult.entities.length > 0) {
      const topEntity = guardResult.entities[0];
      const targetQuery = topEntity.name || topEntity.mention;
      const lookupRes = await lookupMedicine(targetQuery);
      if (lookupRes.success && lookupRes.data) {
        drugLookupData = lookupRes.data;

        // Fetch price comparison
        const priceRes = await comparePrices(drugLookupData.id, pincode);
        if (priceRes.success && priceRes.data) {
          priceTableData = priceRes.data;
        }

        // Fetch alternatives
        const altRes = await getAlternatives(drugLookupData.id);
        if (altRes.success && altRes.data) {
          alternativesData = altRes.data;
        }

        sessionMemory.currentMedicine = {
          id: drugLookupData.id,
          name: drugLookupData.name,
        };
        if (alternativesData?.alternatives?.length) {
          sessionMemory.lastAlternatives = alternativesData.alternatives.map((a: any) => ({
            id: a.id,
            name: a.name,
          }));
        }
      } else if (topEntity.name || topEntity.mention) {
        sessionMemory.currentMedicine = {
          id: topEntity.medicineId || `med_${Date.now()}`,
          name: topEntity.name || topEntity.mention,
        };
      }

      if (sessionMemory.currentMedicine?.name) {
        if (!sessionMemory.mentionedMedicines) sessionMemory.mentionedMedicines = [];
        if (!sessionMemory.mentionedMedicines.some((m: any) => m.name === sessionMemory.currentMedicine.name)) {
          sessionMemory.mentionedMedicines.push({
            id: sessionMemory.currentMedicine.id,
            name: sessionMemory.currentMedicine.name,
          });
        }
      }

      inMemoryMemory.set(effectiveChatId, sessionMemory);
      if (isDbOnline && effectiveChatId) {
        try {
          await Chat.findByIdAndUpdate(effectiveChatId, {
            $set: { entityMemory: sessionMemory },
          });
        } catch {}
      }
    }

    // If Guard blocked the request as RESTRICTED (Schedule H / H1 / X / NDPS)
    if (guardResult.verdict === "RESTRICTED") {
      // 1. Mandatory Intercept Card
      cards.push({
        type: "restricted_alert",
        data: {
          mandatedPrompt: MANDATED_PRESCRIPTION_PROMPT,
          triggeredBy: guardResult.triggeredBy,
          entities: guardResult.entities,
        },
      });

      // 2. Add Medicine details card if resolved
      if (drugLookupData) {
        cards.push({
          type: "medicine",
          data: drugLookupData,
        });
      }

      // 3. Add Verified Alternatives card if available (e.g. Moxikind-CV 625 for Augmentin)
      if (alternativesData && alternativesData.alternatives?.length > 0) {
        cards.push({
          type: "alternatives",
          data: alternativesData,
        });
      }

      // 4. Add Partner Quotes card
      if (priceTableData) {
        cards.push({
          type: "price_table",
          data: priceTableData,
        });
      }

      const answerMarkdown = `${MANDATED_PRESCRIPTION_PROMPT}\n\nThis medication is classified under Indian Schedule H / controlled pharmaceutical regulations. Under CDSCO guidelines, self-medication is unsafe and restricted.\n\n${
        drugLookupData
          ? `**Identified Compound:** ${drugLookupData.name}\n- **Active Composition:** ${drugLookupData.compositionStr || drugLookupData.composition?.map((c: any) => `${c.salt} (${c.strength}${c.unit})`).join(" + ")}\n- **Base MRP:** ₹${drugLookupData.mrp.toFixed(2)}\n\n${
              alternativesData?.alternatives?.length > 0
                ? `💡 **Verified Equivalent Substitutes Found:** ${alternativesData.alternatives.length} substitute(s) with 100% identical active composition. You may ask your physician or pharmacist about generic substitution to save up to **${alternativesData.alternatives[0].savingsPct}%**.`
                : ""
            }`
          : ""
      }`;

      const validated = validateAndSanitizeOutput(answerMarkdown, cards, guardResult);

      return NextResponse.json({
        chatId: effectiveChatId,
        messageId: `msg_${Date.now()}`,
        guard: guardResult,
        intent: routerOut.intent,
        markdown: validated.sanitizedMarkdown,
        cards: validated.cards,
        disclaimer: MANDATORY_DISCLAIMER,
      });
    }

    // Handle Prohibited Diagnosis Request
    if (routerOut.intent === "DIAGNOSIS_REQUEST") {
      const refusalMarkdown =
        "I cannot diagnose medical conditions or predict illnesses from symptoms. Medical symptoms require physical evaluation, diagnostic tests, and clinical assessment by a qualified doctor. Please visit a clinic or hospital for proper diagnosis.";

      const validated = validateAndSanitizeOutput(refusalMarkdown, [], guardResult);

      return NextResponse.json({
        chatId: effectiveChatId,
        messageId: `msg_${Date.now()}`,
        guard: guardResult,
        intent: "DIAGNOSIS_REQUEST",
        markdown: validated.sanitizedMarkdown,
        cards: [],
        disclaimer: MANDATORY_DISCLAIMER,
      });
    }

    // Handle Small Talk / Greetings
    if (routerOut.intent === "SMALL_TALK") {
      const greetingMarkdown =
        "Hello! I'm MediBot, your pharmacy and medicine information assistant. You can ask me to compare medicine prices across Jan Aushadhi and leading pharmacies, check generic equivalents, or find drug details. What medication or topic can I help you with today?";

      return NextResponse.json({
        chatId: effectiveChatId,
        messageId: `msg_${Date.now()}`,
        guard: guardResult,
        intent: "SMALL_TALK",
        markdown: greetingMarkdown,
        cards: [],
        disclaimer: MANDATORY_DISCLAIMER,
      });
    }

    // Verified OTC / general inquiry flow
    if (drugLookupData) {
      cards.push({
        type: "medicine",
        data: drugLookupData,
      });
    }
    if (priceTableData) {
      cards.push({
        type: "price_table",
        data: priceTableData,
      });
    }
    if (alternativesData && alternativesData.alternatives?.length > 0) {
      cards.push({
        type: "alternatives",
        data: alternativesData,
      });
    }

    // Generate informative text via Groq Composer
    let rawReply = "";
    try {
      const groq = getGroqClient();
      const composerPrompt = `You are MediBot, an Indian pharmaceutical informational assistant.
Context:
- User query: "${message}"
- Drug Info: ${JSON.stringify(drugLookupData || {})}
Rules:
1. Provide accurate, clear medical facts derived strictly from verified drug data.
2. Never diagnose conditions or prescribe individual dosage instructions.
3. Highlight that generic alternatives have verifiably identical active salt compositions.
4. Keep the tone clinical, empathetic, and objective.`;

      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.COMPOSER,
        messages: [{ role: "system", content: composerPrompt }, { role: "user", content: message }],
        temperature: 0,
      });

      rawReply = completion.choices[0]?.message?.content || "";
    } catch {
      rawReply = drugLookupData
        ? `Here is the verified information for **${drugLookupData.name}**:\n- **MRP:** ₹${drugLookupData.mrp.toFixed(2)}\n- **Uses:** ${drugLookupData.uses}\n- **How to use:** ${drugLookupData.howToUse}`
        : "Here is the verified information for your inquiry:";
    }

    const validated = validateAndSanitizeOutput(rawReply, cards, guardResult);

    return NextResponse.json({
      chatId: effectiveChatId,
      messageId: `msg_${Date.now()}`,
      guard: guardResult,
      intent: routerOut.intent,
      markdown: validated.sanitizedMarkdown,
      cards: validated.cards,
      disclaimer: MANDATORY_DISCLAIMER,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error during chat processing", details: error.message },
      { status: 500 }
    );
  }
}
