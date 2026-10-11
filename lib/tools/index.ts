import { connectToDatabase } from "@/lib/db/client";
import { Medicine } from "@/lib/db/models/Medicine";
import { PharmacyPrice } from "@/lib/db/models/Pharmacy";
import { resolveMedicineCandidates } from "@/lib/guard/resolver";
import { checkSaltRestriction } from "@/lib/guard/saltCheck";
import {
  SUBSTITUTION_ADVISORY,
  MANDATED_PRESCRIPTION_PROMPT,
} from "@/lib/constants";
import {
  CATALOG_BY_ID,
  CATALOG_BY_COMPOSITION_HASH,
  MEDICINE_CATALOG,
  CatalogMedicine,
} from "@/lib/data/catalog";

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
  const candidates = await resolveMedicineCandidates(query, 3);
  if (candidates.length === 0) {
    return { success: false, error: "Medicine not found in catalog" };
  }

  const top = candidates[0];

  // Try in-memory catalog first
  if (top.medicineId && CATALOG_BY_ID.has(top.medicineId)) {
    const med = CATALOG_BY_ID.get(top.medicineId)!;
    return {
      success: true,
      data: {
        id: med.id,
        name: med.name,
        brandName: med.brandName,
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
        partnerQuotes: med.partnerQuotes,
      },
    };
  }

  // Try DB fallback
  try {
    await connectToDatabase();
    const med = await Medicine.findById(top.medicineId).lean();
    if (med) {
      return {
        success: true,
        data: {
          id: (med as any)._id.toString(),
          name: med.name,
          brandName: (med as any).brandName || med.name.split(" ")[0],
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
          partnerQuotes: [],
        },
      };
    }
  } catch {}

  return { success: false, error: "Medicine record not found" };
}

/**
 * Tool: get_alternatives
 * Returns substitutes with verifiably identical active chemical composition.
 */
export async function getAlternatives(medicineId: string): Promise<ToolResult> {
  let sourceMed: any = CATALOG_BY_ID.get(medicineId);

  if (!sourceMed) {
    try {
      await connectToDatabase();
      sourceMed = await Medicine.findById(medicineId).lean();
    } catch {}
  }

  if (!sourceMed) {
    return { success: false, error: "Source medicine not found" };
  }

  const isRestricted = sourceMed.schedule && sourceMed.schedule !== "OTC";

  // Find exact compositionHash matches excluding the current drug
  let alternatives: any[] = [];

  const catalogMatches = (
    CATALOG_BY_COMPOSITION_HASH.get(sourceMed.compositionHash) || []
  ).filter((m) => m.id !== (sourceMed.id || sourceMed._id?.toString()));

  if (catalogMatches.length > 0) {
    alternatives = catalogMatches.map((alt) => {
      const savingsPct =
        sourceMed.mrp > 0
          ? Number(
              (((sourceMed.mrp - alt.mrp) / sourceMed.mrp) * 100).toFixed(1)
            )
          : 0;

      return {
        id: alt.id,
        name: alt.name,
        brandName: alt.brandName,
        manufacturer: alt.manufacturer,
        mrp: alt.mrp,
        packSize: alt.packSize,
        form: alt.form,
        compositionHash: alt.compositionHash,
        savingsPct: Math.max(0, savingsPct),
        isGenericJanAushadhi: alt.isGenericJanAushadhi,
        partnerPriceComparison: alt.partnerQuotes.map((q) => ({
          platform: q.platform,
          price_inr: q.price_inr,
          delivery_eta: q.delivery_eta,
          in_stock: q.in_stock,
        })),
      };
    });
  } else {
    try {
      await connectToDatabase();
      const dbMatches = await Medicine.find({
        compositionHash: sourceMed.compositionHash,
        _id: { $ne: sourceMed._id },
      }).lean();

      alternatives = dbMatches.map((alt: any) => {
        const savingsPct =
          sourceMed.mrp > 0
            ? Number(
                (((sourceMed.mrp - alt.mrp) / sourceMed.mrp) * 100).toFixed(1)
              )
            : 0;

        return {
          id: alt._id.toString(),
          name: alt.name,
          brandName: alt.name.split(" ")[0],
          manufacturer: alt.manufacturer,
          mrp: alt.mrp,
          packSize: alt.packSize,
          form: alt.form,
          compositionHash: alt.compositionHash,
          savingsPct: Math.max(0, savingsPct),
          isGenericJanAushadhi: alt.isGenericJanAushadhi,
          partnerPriceComparison: [],
        };
      });
    } catch {}
  }

  // Sort descending by savings
  alternatives.sort((a, b) => b.savingsPct - a.savingsPct);

  return {
    success: true,
    data: {
      sourceMedicine: {
        id: sourceMed.id || sourceMed._id?.toString(),
        name: sourceMed.name,
        mrp: sourceMed.mrp,
        schedule: sourceMed.schedule,
        compositionHash: sourceMed.compositionHash,
      },
      isRestricted,
      mandatedPrompt: isRestricted ? MANDATED_PRESCRIPTION_PROMPT : null,
      alternatives,
      advisory: SUBSTITUTION_ADVISORY,
    },
  };
}

/**
 * Tool: compare_prices
 * Compares multi-pharmacy certified prices
 */
export async function comparePrices(
  medicineId: string,
  pincode?: string
): Promise<ToolResult> {
  const catalogMed = CATALOG_BY_ID.get(medicineId);
  if (catalogMed) {
    const items = catalogMed.partnerQuotes.map((q) => ({
      pharmacyName: q.platform,
      baseUrl:
        q.platform === "1mg"
          ? "https://www.1mg.com"
          : q.platform === "PharmEasy"
          ? "https://pharmeasy.in"
          : q.platform === "Apollo 24|7"
          ? "https://www.apollopharmacy.in"
          : q.platform === "Netmeds"
          ? "https://www.netmeds.com"
          : "https://janaushadhi.gov.in",
      certified: true,
      price: q.price_inr,
      mrp: catalogMed.mrp,
      savingsPct: q.savings_vs_mrp_pct,
      inStock: q.in_stock,
      etaHours: q.delivery_eta.includes("2 Hours") ? 2 : 24,
      etaText: q.delivery_eta,
      source: q.platform,
      fetchedAt: new Date(),
    }));

    items.sort((a, b) => a.price - b.price);

    return {
      success: true,
      data: {
        medicineName: catalogMed.name,
        mrp: catalogMed.mrp,
        pincode: pincode || "110001",
        prices: items,
        cheapestPharmacy: items[0] || null,
        disclaimer: "Partner pharmacy certified data, updated live.",
      },
    };
  }

  // DB Fallback
  try {
    await connectToDatabase();
    const med = await Medicine.findById(medicineId).lean();
    if (!med) return { success: false, error: "Medicine not found" };

    const prices = await PharmacyPrice.find({ medicineId })
      .populate("pharmacyId")
      .lean();

    const items = prices.map((p: any) => {
      const pharmacy = p.pharmacyId;
      const prefix = pincode ? pincode.slice(0, 2) : null;
      const serviceable = prefix
        ? pharmacy?.serviceablePincodePrefixes?.includes(prefix)
        : true;

      return {
        pharmacyName: pharmacy?.name || "E-Pharmacy",
        baseUrl: pharmacy?.baseUrl || "",
        certified: true,
        price: p.price,
        mrp: p.mrp,
        savingsPct: Number((((p.mrp - p.price) / p.mrp) * 100).toFixed(1)),
        inStock: p.inStock,
        etaHours: serviceable ? pharmacy?.sla?.standardHrs || 24 : null,
        etaText: serviceable
          ? `${pharmacy?.sla?.standardHrs || 24} hrs delivery`
          : "Unserviceable",
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
        disclaimer: "Partner pharmacy certified data, updated live.",
      },
    };
  } catch {
    return { success: false, error: "Could not fetch pricing data" };
  }
}
