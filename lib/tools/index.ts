import { connectToDatabase } from "@/lib/db/client";
import { Medicine, IMedicine } from "@/lib/db/models/Medicine";
import { Pharmacy, PharmacyPrice } from "@/lib/db/models/Pharmacy";
import { resolveMedicineCandidates } from "@/lib/guard/resolver";
import { checkSaltRestriction } from "@/lib/guard/saltCheck";
import { SUBSTITUTION_ADVISORY, MANDATED_PRESCRIPTION_PROMPT } from "@/lib/constants";

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  needsClarification?: boolean;
}

/**
 * Tool: lookup_medicine
 */
export async function lookupMedicine(query: string): Promise<ToolResult> {
  await connectToDatabase();
  const candidates = await resolveMedicineCandidates(query, 3);
  if (candidates.length === 0) {
    return { success: false, error: "Medicine not found in catalog" };
  }

  const top = candidates[0];
  const med = await Medicine.findById(top.medicineId).lean();
  if (!med) {
    return { success: false, error: "Medicine record not found" };
  }

  return {
    success: true,
    data: {
      id: (med as any)._id.toString(),
      name: med.name,
      manufacturer: med.manufacturer,
      mrp: med.mrp,
      packSize: med.packSize,
      form: med.form,
      composition: med.composition,
      compositionHash: med.compositionHash,
      schedule: med.schedule,
      uses: med.uses,
      sideEffects: med.sideEffects,
      interactions: med.interactions,
      howToUse: med.howToUse,
      isGenericJanAushadhi: med.isGenericJanAushadhi,
    },
  };
}

/**
 * Tool: get_alternatives
 * Hard requirement (DESIGN.md Rule 7 & §8.3):
 * Alternatives MUST have an identical compositionHash to source drug.
 * NEVER recommended for restricted drugs (info only).
 */
export async function getAlternatives(medicineId: string): Promise<ToolResult> {
  await connectToDatabase();
  const sourceMed = await Medicine.findById(medicineId).lean();
  if (!sourceMed) {
    return { success: false, error: "Source medicine not found" };
  }

  // Safety check: Never return alternative recommendations for Schedule H/restricted drugs
  const salts = sourceMed.composition.map((c) => c.saltNormalized);
  const saltCheck = await checkSaltRestriction(salts);
  if (saltCheck.restricted || sourceMed.schedule !== "OTC") {
    return {
      success: false,
      error: MANDATED_PRESCRIPTION_PROMPT,
      data: {
        restricted: true,
        mandatedPrompt: MANDATED_PRESCRIPTION_PROMPT,
      },
    };
  }

  // Find exact compositionHash matches excluding the current drug
  const matches = await Medicine.find({
    compositionHash: sourceMed.compositionHash,
    _id: { $ne: sourceMed._id },
  }).lean();

  const alternatives = matches.map((alt) => {
    const savingsPct =
      sourceMed.mrp > 0
        ? Number((((sourceMed.mrp - alt.mrp) / sourceMed.mrp) * 100).toFixed(1))
        : 0;

    return {
      id: (alt as any)._id.toString(),
      name: alt.name,
      manufacturer: alt.manufacturer,
      mrp: alt.mrp,
      packSize: alt.packSize,
      form: alt.form,
      compositionHash: alt.compositionHash,
      savingsPct: Math.max(0, savingsPct),
      isGenericJanAushadhi: alt.isGenericJanAushadhi,
    };
  });

  // Sort descending by savings
  alternatives.sort((a, b) => b.savingsPct - a.savingsPct);

  return {
    success: true,
    data: {
      sourceMedicine: {
        id: (sourceMed as any)._id.toString(),
        name: sourceMed.name,
        mrp: sourceMed.mrp,
        compositionHash: sourceMed.compositionHash,
      },
      alternatives,
      advisory: SUBSTITUTION_ADVISORY,
    },
  };
}

/**
 * Tool: compare_prices
 * Compares multi-pharmacy live/seeded prices
 */
export async function comparePrices(medicineId: string, pincode?: string): Promise<ToolResult> {
  await connectToDatabase();
  const med = await Medicine.findById(medicineId).lean();
  if (!med) {
    return { success: false, error: "Medicine not found" };
  }

  const prices = await PharmacyPrice.find({ medicineId }).populate("pharmacyId").lean();

  const items = prices.map((p: any) => {
    const pharmacy = p.pharmacyId;
    const prefix = pincode ? pincode.slice(0, 2) : null;
    const serviceable = prefix
      ? pharmacy.serviceablePincodePrefixes.includes(prefix)
      : true;

    return {
      pharmacyName: pharmacy.name,
      baseUrl: pharmacy.baseUrl,
      certified: pharmacy.certified,
      price: p.price,
      mrp: p.mrp,
      savingsPct: Number((((p.mrp - p.price) / p.mrp) * 100).toFixed(1)),
      inStock: p.inStock,
      etaHours: serviceable ? pharmacy.sla.standardHrs : null,
      etaText: serviceable ? `${pharmacy.sla.standardHrs} hrs delivery` : "Unserviceable",
      source: p.source,
      fetchedAt: p.fetchedAt,
    };
  });

  items.sort((a: any, b: any) => a.price - b.price);

  return {
    success: true,
    data: {
      medicineName: med.name,
      mrp: med.mrp,
      pincode: pincode || "National",
      prices: items,
      cheapestPharmacy: items[0] || null,
      disclaimer: "Demo data, updated recently.",
    },
  };
}
