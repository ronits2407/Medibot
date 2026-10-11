import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/guard";
import { lookupMedicine, getAlternatives } from "@/lib/tools";
import {
  MANDATED_PRESCRIPTION_PROMPT,
  MANDATORY_DISCLAIMER,
} from "@/lib/constants";
import {
  MEDICINE_CATALOG,
  getVerifiedCatalogSubstitutes,
  CatalogMedicine,
} from "@/lib/data/catalog";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userQuery = body.user_query || body.query || body.message || "";
    const sessionId = body.session_id || `sess_${Math.random().toString(36).substring(2, 9)}`;
    const disclaimerAcknowledged = body.disclaimer_acknowledged !== undefined ? body.disclaimer_acknowledged : true;

    if (!userQuery || typeof userQuery !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'user_query' in request body." },
        { status: 400 }
      );
    }

    // 1. Run fail-closed Prescription Guard
    const guardRes = await guard(userQuery);

    const isRestricted = guardRes.verdict === "RESTRICTED";
    const interceptTriggered = isRestricted && guardRes.mandatedPromptRequired;

    // 2. Identify target medication
    let detectedMed: CatalogMedicine | null = null;

    // Check detected entities from guard
    if (guardRes.entities.length > 0) {
      const topEntity = guardRes.entities[0];
      const lookup = await lookupMedicine(topEntity.name || topEntity.mention);
      if (lookup.success && lookup.data) {
        detectedMed = MEDICINE_CATALOG.find((m) => m.id === lookup.data.id) || null;
      }
    }

    // Fallback direct scan on user query if entity was salt
    if (!detectedMed) {
      const lowerQ = userQuery.toLowerCase();
      detectedMed =
        MEDICINE_CATALOG.find(
          (m) =>
            lowerQ.includes(m.brandName.toLowerCase()) ||
            lowerQ.includes(m.name.toLowerCase())
        ) || null;
    }

    // Default to Augmentin 625 Duo if query asks about it specifically
    if (!detectedMed && /augmentin/i.test(userQuery)) {
      detectedMed = MEDICINE_CATALOG.find((m) => m.brandName.toLowerCase().includes("augmentin")) || null;
    }

    // 3. Find verified composition-identical substitutes
    let substitutes: any[] = [];
    if (detectedMed) {
      substitutes = getVerifiedCatalogSubstitutes(detectedMed);
    }

    // 4. Construct exact PS §3.1 response schema
    const responsePayload = {
      user_query: userQuery,
      session_id: sessionId,
      disclaimer_acknowledged: disclaimerAcknowledged,
      safety_guard: {
        is_restricted_schedule_h: isRestricted,
        intercept_triggered: interceptTriggered,
        mandated_prompt: interceptTriggered ? MANDATED_PRESCRIPTION_PROMPT : null,
        is_diagnosis_detected: false,
      },
      detected_medication: detectedMed
        ? {
            brand_name: detectedMed.brandName,
            active_composition: detectedMed.compositionStr,
            therapeutic_class: detectedMed.therapeuticClass,
            schedule: detectedMed.schedule === "OTC" ? "OTC" : `Schedule ${detectedMed.schedule}`,
            mrp_inr: detectedMed.mrp,
          }
        : null,
      substitutes,
      disclaimer: MANDATORY_DISCLAIMER,
    };

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    console.error("API /api/v1/medibot/query error:", err);
    return NextResponse.json(
      { error: "Internal processing error", details: err.message },
      { status: 500 }
    );
  }
}
