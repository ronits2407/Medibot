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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json().catch(() => ({}));
    const { chatId, message, language = "en" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message parameter" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Verify Disclaimer Compliance Gate
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email.toLowerCase() });
      if (!user?.disclaimerAckAt || user.disclaimerVersion !== DISCLAIMER_VERSION) {
        return NextResponse.json(
          { error: "Legal disclaimer must be acknowledged before using MediBot." },
          { status: 403 }
        );
      }
    }

    // 2. Fetch or initialize Chat session
    let chatDoc = null;
    if (chatId) {
      chatDoc = await Chat.findById(chatId);
    }
    if (!chatDoc) {
      chatDoc = await Chat.create({
        userId: session?.user?.id || "guest",
        title: message.slice(0, 35) + "...",
        entityMemory: { language: "en", mentionedMedicines: [] },
      });
    }

    // 3. Prescription Guard - Fail-Closed Execution (Rule 0 & §7)
    const guardResult = await guard(message, undefined, chatDoc.entityMemory);

    // Record Audit Log for judge dashboard and compliance tracking
    await AuditLog.create({
      userId: session?.user?.id || "guest",
      chatId: chatDoc._id.toString(),
      finalVerdict: guardResult.verdict,
      triggeredBy: guardResult.triggeredBy,
      resolvedEntities: guardResult.entities as any,
      layerVerdicts: guardResult.layers as any,
    });

    // 4. Intent Routing & Tool Execution
    const routerOut = await routeUserQuery(message);
    const cards: Array<Record<string, any>> = [];

    // If Guard blocked the request as RESTRICTED
    if (guardResult.verdict === "RESTRICTED") {
      cards.push({
        type: "restricted_alert",
        data: {
          mandatedPrompt: MANDATED_PRESCRIPTION_PROMPT,
          triggeredBy: guardResult.triggeredBy,
          entities: guardResult.entities,
        },
      });

      // Update chat memory
      if (guardResult.entities.length > 0) {
        const topEntity = guardResult.entities[0];
        chatDoc.entityMemory.currentMedicine = {
          id: topEntity.medicineId || "",
          name: topEntity.name || topEntity.mention,
        };
        await chatDoc.save();
      }

      const answerMarkdown = `${MANDATED_PRESCRIPTION_PROMPT}\n\nThis medicine is classified under Indian Schedule H / controlled pharmaceutical regulations. Under CDSCO guidelines, self-medication is unsafe and restricted. Please consult a registered medical practitioner for a valid prescription.`;

      const validated = validateAndSanitizeOutput(answerMarkdown, cards, guardResult);

      const savedMsg = await Message.create({
        chatId: chatDoc._id,
        role: "assistant",
        content: validated.sanitizedMarkdown,
        cards: validated.cards,
        sources: [],
        guard: {
          verdict: guardResult.verdict,
          triggeredBy: guardResult.triggeredBy,
          entities: guardResult.entities,
        },
      });

      return NextResponse.json({
        chatId: chatDoc._id.toString(),
        messageId: savedMsg._id.toString(),
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

      const savedMsg = await Message.create({
        chatId: chatDoc._id,
        role: "assistant",
        content: validated.sanitizedMarkdown,
        cards: [],
        sources: [],
        guard: { verdict: "NO_DRUG" },
      });

      return NextResponse.json({
        chatId: chatDoc._id.toString(),
        messageId: savedMsg._id.toString(),
        guard: guardResult,
        intent: "DIAGNOSIS_REQUEST",
        markdown: validated.sanitizedMarkdown,
        cards: [],
        disclaimer: MANDATORY_DISCLAIMER,
      });
    }

    // 5. Execute Tools based on Intent for Verified OTC queries
    let drugLookupData = null;
    if (guardResult.entities.length > 0) {
      const targetQuery = guardResult.entities[0].name || guardResult.entities[0].mention;
      const lookupRes = await lookupMedicine(targetQuery);
      if (lookupRes.success && lookupRes.data) {
        drugLookupData = lookupRes.data;
        cards.push({
          type: "medicine",
          data: drugLookupData,
        });

        // Price compare tool
        const priceRes = await comparePrices(drugLookupData.id, chatDoc.entityMemory.pincode);
        if (priceRes.success && priceRes.data) {
          cards.push({
            type: "price_table",
            data: priceRes.data,
          });
        }

        // Generic Alternatives tool
        const altRes = await getAlternatives(drugLookupData.id);
        if (altRes.success && altRes.data) {
          cards.push({
            type: "alternatives",
            data: altRes.data,
          });
        }

        // Update entity memory
        chatDoc.entityMemory.currentMedicine = {
          id: drugLookupData.id,
          name: drugLookupData.name,
        };
        await chatDoc.save();
      }
    }

    // 6. Generate Response via Groq Composer
    const groq = getGroqClient();
    const composerPrompt = `You are MediBot, an Indian pharmaceutical informational assistant.
Context:
- User query: "${message}"
- Drug Info: ${JSON.stringify(drugLookupData || {})}
Rules:
1. Provide accurate, clear medical facts derived strictly from the verified drug data above.
2. Never diagnose conditions or prescribe individual dosage instructions.
3. Highlight that generic alternatives have verifiably identical active salt compositions.
4. Keep the tone clinical, empathetic, and objective.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.COMPOSER,
      messages: [{ role: "system", content: composerPrompt }, { role: "user", content: message }],
      temperature: 0,
    });

    const rawReply = completion.choices[0]?.message?.content || "Here is the verified information for your inquiry:";
    const validated = validateAndSanitizeOutput(rawReply, cards, guardResult);

    const savedMsg = await Message.create({
      chatId: chatDoc._id,
      role: "assistant",
      content: validated.sanitizedMarkdown,
      cards: validated.cards,
      sources: [],
      guard: {
        verdict: guardResult.verdict,
        entities: guardResult.entities,
      },
    });

    return NextResponse.json({
      chatId: chatDoc._id.toString(),
      messageId: savedMsg._id.toString(),
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
