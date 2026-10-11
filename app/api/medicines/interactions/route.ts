import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/client";
import { MyMedicine } from "@/lib/db/models/MyMedicine";

interface InteractionRule {
  id: string;
  salts: string[][]; // list of salt name patterns that conflict
  severity: "HIGH" | "MODERATE" | "LOW";
  title: string;
  description: string;
  recommendation: string;
}

const KNOWN_INTERACTION_RULES: InteractionRule[] = [
  {
    id: "paracetamol_duplicate",
    salts: [["paracetamol", "acetaminophen"], ["paracetamol", "acetaminophen"]],
    severity: "HIGH",
    title: "Duplicate Paracetamol / Acetaminophen Toxicity Hazard",
    description: "Multiple active medicines contain Paracetamol. Exceeding 4,000 mg in 24 hours can cause severe, irreversible liver damage (hepatotoxicity).",
    recommendation: "Do not take concurrently. Consolidate into a single prescribed Paracetamol formulation.",
  },
  {
    id: "nsaid_duplicate",
    salts: [["ibuprofen", "diclofenac", "naproxen", "aceclofenac"], ["ibuprofen", "diclofenac", "naproxen", "aceclofenac"]],
    severity: "HIGH",
    title: "Dual NSAID Ulcer & GI Bleeding Risk",
    description: "Concurrent usage of two non-steroidal anti-inflammatory drugs substantially multiplies gastrointestinal ulceration and bleeding risks.",
    recommendation: "Avoid taking multiple NSAIDs simultaneously. Consult your physician for alternative analgesia.",
  },
  {
    id: "acei_arb_hyperkalemia",
    salts: [["ramipril", "enalapril", "lisinopril"], ["telmisartan", "losartan", "valsartan", "olmesartan"]],
    severity: "HIGH",
    title: "Dual Renin-Angiotensin System Blockade",
    description: "Combining an ACE-inhibitor with an ARB (Angiotensin Receptor Blocker) increases the risk of severe hyperkalemia, hypotension, and renal impairment.",
    recommendation: "Dual blockade is generally contraindicated. Review blood pressure regimen with your cardiologist.",
  },
  {
    id: "antibiotic_antacid",
    salts: [["ciprofloxacin", "ofloxacin", "levofloxacin", "doxycycline", "azithromycin"], ["antacid", "aluminum hydroxide", "magnesium hydroxide", "calcium carbonate", "sucralfate"]],
    severity: "MODERATE",
    title: "Chelation Impairment of Antibiotic Absorption",
    description: "Multivalent cations in antacids bind to antibiotics in the stomach, dramatically reducing bloodstream absorption and efficacy.",
    recommendation: "Separate administration by at least 2 to 3 hours.",
  },
  {
    id: "nsaid_antihypertensive",
    salts: [["ibuprofen", "diclofenac", "aceclofenac"], ["telmisartan", "amlodipine", "losartan", "ramipril"]],
    severity: "MODERATE",
    title: "NSAID Attenuation of Antihypertensive Efficacy",
    description: "Frequent NSAID usage causes renal sodium retention and prostaglandins inhibition, counteracting blood pressure control medications.",
    recommendation: "Monitor blood pressure frequently if taking NSAIDs for acute pain.",
  },
  {
    id: "sedative_antihistamine",
    salts: [["alprazolam", "clonazepam", "diazepam", "zolpidem"], ["cetirizine", "chlorpheniramine", "hydroxyzine", "diphenhydramine"]],
    severity: "MODERATE",
    title: "Additive Central Nervous System Sedation",
    description: "Co-administration of benzodiazepines/hypnotics with sedating antihistamines causes pronounced drowsiness, psychomotor impairment, and respiratory depression risk.",
    recommendation: "Avoid operating heavy machinery or driving. Clarify dosage timing with your physician.",
  },
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id || session?.user?.email || "demo-user";

    await connectToDatabase();
    const medicines = await MyMedicine.find({ userId });

    if (!medicines || medicines.length < 2) {
      return NextResponse.json({
        interactions: [],
        message: "At least 2 active medications are required to evaluate cross-drug interactions.",
      });
    }

    const detectedInteractions: any[] = [];

    // Extract all normalized names and ingredients
    const medEntries = medicines.map((m) => {
      const allText = [
        m.medicineName.toLowerCase(),
        ...(m.activeIngredients || []).map((ing) => ing.saltName.toLowerCase()),
      ].join(" ");
      return { med: m, allText };
    });

    // Check Duplicate Active Ingredient Rule
    for (let i = 0; i < medEntries.length; i++) {
      for (let j = i + 1; j < medEntries.length; j++) {
        const m1 = medEntries[i];
        const m2 = medEntries[j];

        // 1. Check duplicate Paracetamol
        const hasParacetamol1 = m1.allText.includes("paracetamol") || m1.allText.includes("acetaminophen") || m1.allText.includes("dolo") || m1.allText.includes("calpol") || m1.allText.includes("crocin") || m1.allText.includes("combiflam");
        const hasParacetamol2 = m2.allText.includes("paracetamol") || m2.allText.includes("acetaminophen") || m2.allText.includes("dolo") || m2.allText.includes("calpol") || m2.allText.includes("crocin") || m2.allText.includes("combiflam");

        if (hasParacetamol1 && hasParacetamol2) {
          detectedInteractions.push({
            ruleId: "paracetamol_duplicate",
            severity: "HIGH",
            title: `Duplicate Paracetamol Detected: ${m1.med.medicineName} + ${m2.med.medicineName}`,
            description: "Both medications contain Paracetamol. Concomitant use risks exceeding maximum therapeutic thresholds (4g/day) causing liver toxicity.",
            recommendation: "Ensure total cumulative paracetamol does not exceed medical limits. Consult your physician.",
            medicinesInvolved: [m1.med.medicineName, m2.med.medicineName],
          });
        }

        // 2. Check general rules
        for (const rule of KNOWN_INTERACTION_RULES) {
          if (rule.id === "paracetamol_duplicate") continue;

          const matchGroup1 = rule.salts[0].some((k) => m1.allText.includes(k));
          const matchGroup2 = rule.salts[1].some((k) => m2.allText.includes(k));

          const reverseMatch1 = rule.salts[1].some((k) => m1.allText.includes(k));
          const reverseMatch2 = rule.salts[0].some((k) => m2.allText.includes(k));

          if ((matchGroup1 && matchGroup2) || (reverseMatch1 && reverseMatch2)) {
            // Avoid duplicate pushing of same rule for same pair
            const existing = detectedInteractions.find(
              (d) => d.ruleId === rule.id && d.medicinesInvolved.includes(m1.med.medicineName) && d.medicinesInvolved.includes(m2.med.medicineName)
            );
            if (!existing) {
              detectedInteractions.push({
                ruleId: rule.id,
                severity: rule.severity,
                title: `${rule.title}: ${m1.med.medicineName} + ${m2.med.medicineName}`,
                description: rule.description,
                recommendation: rule.recommendation,
                medicinesInvolved: [m1.med.medicineName, m2.med.medicineName],
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      totalMedicines: medicines.length,
      interactionsFound: detectedInteractions.length,
      interactions: detectedInteractions,
    });
  } catch (error: any) {
    console.error("POST /api/medicines/interactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to check interactions" }, { status: 500 });
  }
}
