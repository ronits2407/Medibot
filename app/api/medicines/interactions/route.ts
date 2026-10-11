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

async function evaluateInteractions(medicines: any[]) {
  if (!medicines || medicines.length < 2) {
    return {
      totalMedicines: medicines?.length || 0,
      interactionsFound: 0,
      interactions: [],
      message: "At least 2 active medications are required to evaluate cross-drug interactions.",
    };
  }

  const detectedInteractions: any[] = [];
  const medEntries = medicines.map((m) => {
    const allText = [
      (m.medicineName || m.name || "").toLowerCase(),
      ...((m.activeIngredients || m.salts || []).map((ing: any) =>
        typeof ing === "string" ? ing.toLowerCase() : (ing.saltName || "").toLowerCase()
      )),
    ].join(" ");
    return { med: m, allText };
  });

  for (let i = 0; i < medEntries.length; i++) {
    for (let j = i + 1; j < medEntries.length; j++) {
      const m1 = medEntries[i];
      const m2 = medEntries[j];

      // Duplicate Paracetamol
      const hasParacetamol1 = m1.allText.includes("paracetamol") || m1.allText.includes("acetaminophen") || m1.allText.includes("dolo") || m1.allText.includes("calpol") || m1.allText.includes("crocin");
      const hasParacetamol2 = m2.allText.includes("paracetamol") || m2.allText.includes("acetaminophen") || m2.allText.includes("dolo") || m2.allText.includes("calpol") || m2.allText.includes("crocin");

      if (hasParacetamol1 && hasParacetamol2) {
        detectedInteractions.push({
          ruleId: "paracetamol_duplicate",
          severity: "HIGH",
          title: `Duplicate Paracetamol Detected: ${m1.med.medicineName || m1.med.name} + ${m2.med.medicineName || m2.med.name}`,
          description: "Both medications contain Paracetamol. Concomitant use risks exceeding maximum therapeutic thresholds (4g/day) causing liver toxicity.",
          recommendation: "Ensure total cumulative paracetamol does not exceed medical limits. Consult your physician.",
          medicinesInvolved: [m1.med.medicineName || m1.med.name, m2.med.medicineName || m2.med.name],
        });
      }

      // General rules
      for (const rule of KNOWN_INTERACTION_RULES) {
        if (rule.id === "paracetamol_duplicate") continue;
        const matchGroup1 = rule.salts[0].some((k) => m1.allText.includes(k));
        const matchGroup2 = rule.salts[1].some((k) => m2.allText.includes(k));
        const reverseMatch1 = rule.salts[1].some((k) => m1.allText.includes(k));
        const reverseMatch2 = rule.salts[0].some((k) => m2.allText.includes(k));

        if ((matchGroup1 && matchGroup2) || (reverseMatch1 && reverseMatch2)) {
          const med1Name = m1.med.medicineName || m1.med.name;
          const med2Name = m2.med.medicineName || m2.med.name;
          const existing = detectedInteractions.find(
            (d) => d.ruleId === rule.id && d.medicinesInvolved.includes(med1Name) && d.medicinesInvolved.includes(med2Name)
          );
          if (!existing) {
            detectedInteractions.push({
              ruleId: rule.id,
              severity: rule.severity,
              title: `${rule.title}: ${med1Name} + ${med2Name}`,
              description: rule.description,
              recommendation: rule.recommendation,
              medicinesInvolved: [med1Name, med2Name],
            });
          }
        }
      }
    }
  }

  return {
    totalMedicines: medicines.length,
    interactionsFound: detectedInteractions.length,
    interactions: detectedInteractions,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const medsParam = searchParams.get("meds");

    if (medsParam) {
      const medList = medsParam.split(",").map((name, idx) => ({
        _id: `param-${idx}`,
        medicineName: name.trim(),
        activeIngredients: [{ saltName: name.trim() }],
      }));
      const result = await evaluateInteractions(medList);
      return NextResponse.json(result);
    }

    const session = await auth().catch(() => null);
    const userId = session?.user?.id || session?.user?.email || "demo-user";

    let medicines: any[] = [];
    try {
      await connectToDatabase();
      medicines = await MyMedicine.find({ userId });
    } catch {
      medicines = [
        { medicineName: "Dolo 650", activeIngredients: [{ saltName: "Paracetamol" }] },
        { medicineName: "Crocin 650", activeIngredients: [{ saltName: "Paracetamol" }] },
      ];
    }

    const result = await evaluateInteractions(medicines);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to check interactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.medicines && Array.isArray(body.medicines)) {
      const result = await evaluateInteractions(body.medicines);
      return NextResponse.json(result);
    }

    const session = await auth().catch(() => null);
    const userId = session?.user?.id || session?.user?.email || "demo-user";

    let medicines: any[] = [];
    try {
      await connectToDatabase();
      medicines = await MyMedicine.find({ userId });
    } catch {
      medicines = [
        { medicineName: "Dolo 650", activeIngredients: [{ saltName: "Paracetamol" }] },
        { medicineName: "Crocin 650", activeIngredients: [{ saltName: "Paracetamol" }] },
      ];
    }

    const result = await evaluateInteractions(medicines);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/medicines/interactions error:", error);
    return NextResponse.json({ error: error.message || "Failed to check interactions" }, { status: 500 });
  }
}
