import mongoose from "mongoose";
import { connectToDatabase } from "../lib/db/client";
import { Medicine } from "../lib/db/models/Medicine";
import { RestrictedSalt } from "../lib/db/models/RestrictedSalt";
import { Pharmacy, PharmacyPrice } from "../lib/db/models/Pharmacy";
import { parseCompositionString, computeCompositionHash, computeSaltsKey } from "../lib/pricing/composition";
import { BUILTIN_RESTRICTED_SALTS } from "../lib/guard/saltCheck";

async function seed() {
  console.log("Connecting to MongoDB for seeding...");
  await connectToDatabase();

  console.log("1. Seeding Restricted Salts (Schedule H, H1, X, NDPS)...");
  for (const [salt, info] of Object.entries(BUILTIN_RESTRICTED_SALTS)) {
    await RestrictedSalt.findOneAndUpdate(
      { saltNormalized: salt },
      {
        salt,
        saltNormalized: salt,
        schedule: info.schedule,
        notes: info.notes,
        source: "CDSCO",
      },
      { upsert: true, new: true }
    );
  }
  console.log("✓ Seeded restricted salts.");

  console.log("2. Seeding Certified Pharmacies...");
  const pharmaciesData = [
    {
      name: "1mg",
      baseUrl: "https://www.1mg.com",
      certified: true,
      serviceablePincodePrefixes: ["11", "12", "40", "56", "78", "50", "60"],
      sla: { standardHrs: 24, expressHrs: 4, cutoffTime: "18:00" },
      hubs: [{ pincode: "110001", lat: 28.6139, lng: 77.209 }],
    },
    {
      name: "PharmEasy",
      baseUrl: "https://pharmeasy.in",
      certified: true,
      serviceablePincodePrefixes: ["11", "40", "56", "78", "41", "38"],
      sla: { standardHrs: 24, expressHrs: 6, cutoffTime: "17:00" },
      hubs: [{ pincode: "400001", lat: 18.9388, lng: 72.8354 }],
    },
    {
      name: "Apollo 24|7",
      baseUrl: "https://www.apollopharmacy.in",
      certified: true,
      serviceablePincodePrefixes: ["11", "12", "40", "56", "78", "60", "50"],
      sla: { standardHrs: 12, expressHrs: 2, cutoffTime: "20:00" },
      hubs: [{ pincode: "600001", lat: 13.0827, lng: 80.2707 }],
    },
    {
      name: "Netmeds",
      baseUrl: "https://www.netmeds.com",
      certified: true,
      serviceablePincodePrefixes: ["11", "40", "56", "78", "70", "50"],
      sla: { standardHrs: 36, expressHrs: 8, cutoffTime: "16:00" },
      hubs: [{ pincode: "600002", lat: 13.08, lng: 80.26 }],
    },
    {
      name: "Jan Aushadhi (PMBJP)",
      baseUrl: "https://janaushadhi.gov.in",
      certified: true,
      serviceablePincodePrefixes: ["11", "12", "40", "56", "78", "60", "50", "70", "41"],
      sla: { standardHrs: 48, expressHrs: 24, cutoffTime: "15:00" },
      hubs: [{ pincode: "110002", lat: 28.62, lng: 77.21 }],
    },
  ];

  const pharmacyDocs: Record<string, any> = {};
  for (const p of pharmaciesData) {
    const doc = await Pharmacy.findOneAndUpdate({ name: p.name }, p, {
      upsert: true,
      new: true,
    });
    pharmacyDocs[p.name] = doc;
  }
  console.log("✓ Seeded certified pharmacies.");

  console.log("3. Seeding Medicines catalog...");
  const rawMedicines = [
    // --- Schedule H Restricted Drugs (Must trigger fail-closed prompt) ---
    {
      name: "Augmentin 625 Duo Tablet",
      manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
      mrp: 204.5,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Amoxycillin (500mg) + Clavulanic Acid (125mg)",
      schedule: "H" as const,
      uses: "Treatment of bacterial infections including respiratory tract, ear, sinus, skin, and urinary tract infections.",
      sideEffects: "Nausea, vomiting, diarrhea, mild rash.",
      interactions: "Methotrexate, Probenecid, Allopurinol, Oral Contraceptives.",
      howToUse: "Take with food to reduce gastrointestinal upset. Swallow whole with water.",
      source: "1mg" as const,
      sourceId: "aug625",
      isGenericJanAushadhi: false,
    },
    {
      name: "Clavam 625 Tablet",
      manufacturer: "Alkem Laboratories Ltd",
      mrp: 185.0,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Amoxycillin (500mg) + Clavulanic Acid (125mg)",
      schedule: "H" as const,
      uses: "Antibiotic for bacterial infections of ears, sinuses, throat, chest, and urinary tract.",
      sideEffects: "Diarrhea, indigestion, skin rash.",
      interactions: "Anticoagulants, Probenecid.",
      howToUse: "Take immediately before or at the start of a meal.",
      source: "1mg" as const,
      sourceId: "clavam625",
      isGenericJanAushadhi: false,
    },
    {
      name: "Moxikind-CV 625 Tablet",
      manufacturer: "Mankind Pharma Ltd",
      mrp: 145.0,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Amoxycillin (500mg) + Clavulanic Acid (125mg)",
      schedule: "H" as const,
      uses: "Bacterial infection treatment.",
      sideEffects: "Nausea, loose stools.",
      interactions: "Allopurinol, Warfarin.",
      howToUse: "Take with a meal as prescribed.",
      source: "1mg" as const,
      sourceId: "moxikind625",
      isGenericJanAushadhi: false,
    },
    {
      name: "Alprax 0.5 Tablet",
      manufacturer: "Torrent Pharmaceuticals Ltd",
      mrp: 42.0,
      packSize: "15 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Alprazolam (0.5mg)",
      schedule: "H1" as const,
      uses: "Short-term relief of acute anxiety and panic disorders.",
      sideEffects: "Drowsiness, lightheadedness, impaired coordination, habit forming.",
      interactions: "Alcohol, Opioids, Sedatives, Antifungals.",
      howToUse: "Strictly as directed by psychiatrist. Do not stop abruptly.",
      source: "1mg" as const,
      sourceId: "alprax05",
      isGenericJanAushadhi: false,
    },
    {
      name: "Ciplox 500 Tablet",
      manufacturer: "Cipla Ltd",
      mrp: 48.0,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Ciprofloxacin (500mg)",
      schedule: "H" as const,
      uses: "Broad-spectrum fluoroquinolone antibiotic.",
      sideEffects: "Nausea, headache, dizziness, tendon pain.",
      interactions: "Antacids containing magnesium/aluminum, Iron supplements, Theophylline.",
      howToUse: "Drink plenty of fluids while taking this medication.",
      source: "1mg" as const,
      sourceId: "ciplox500",
      isGenericJanAushadhi: false,
    },
    {
      name: "Azithral 500 Tablet",
      manufacturer: "Alembic Pharmaceuticals Ltd",
      mrp: 120.0,
      packSize: "5 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Azithromycin (500mg)",
      schedule: "H" as const,
      uses: "Macrolide antibiotic for respiratory infections.",
      sideEffects: "Abdominal cramping, loose stools, nausea.",
      interactions: "Antacids, Digoxin, Colchicine.",
      howToUse: "Take once daily, 1 hour before or 2 hours after meals.",
      source: "1mg" as const,
      sourceId: "azithral500",
      isGenericJanAushadhi: false,
    },

    // --- Verified OTC Medications (Allowed for Price Compare & Alternative Recommendations) ---
    {
      name: "Dolo 650 Tablet",
      manufacturer: "Micro Labs Ltd",
      mrp: 33.6,
      packSize: "15 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Paracetamol (650mg)",
      schedule: "OTC" as const,
      uses: "Fever and mild to moderate pain relief (headache, body ache, toothache).",
      sideEffects: "Rare: skin rash or allergic reaction at normal doses.",
      interactions: "Excess alcohol consumption (increases hepatotoxicity risk), Warfarin.",
      howToUse: "Take with water. Do not exceed 4000mg total paracetamol in 24 hours.",
      source: "1mg" as const,
      sourceId: "dolo650",
      isGenericJanAushadhi: false,
    },
    {
      name: "Calpol 650 Tablet",
      manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
      mrp: 30.5,
      packSize: "15 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Paracetamol (650mg)",
      schedule: "OTC" as const,
      uses: "Relief of pain and fever reduction.",
      sideEffects: "Minimal side effects at prescribed dose.",
      interactions: "Alcohol, other paracetamol-containing products.",
      howToUse: "Swallow whole with a glass of water.",
      source: "1mg" as const,
      sourceId: "calpol650",
      isGenericJanAushadhi: false,
    },
    {
      name: "Pacimol 650 Tablet",
      manufacturer: "Ipca Laboratories Ltd",
      mrp: 22.0,
      packSize: "15 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Paracetamol (650mg)",
      schedule: "OTC" as const,
      uses: "Analgesic and antipyretic.",
      sideEffects: "Rare allergic reactions.",
      interactions: "Alcohol.",
      howToUse: "Take as directed.",
      source: "1mg" as const,
      sourceId: "pacimol650",
      isGenericJanAushadhi: false,
    },
    {
      name: "PMBJP Paracetamol 650 Tablet",
      manufacturer: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana",
      mrp: 10.0,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Paracetamol (650mg)",
      schedule: "OTC" as const,
      uses: "Government certified quality generic paracetamol for fever and pain.",
      sideEffects: "Well tolerated.",
      interactions: "Alcohol.",
      howToUse: "Take with water.",
      source: "jan_aushadhi" as const,
      sourceId: "pmbjp_para650",
      isGenericJanAushadhi: true,
    },
    {
      name: "Cetzine 10 Tablet",
      manufacturer: "Dr Reddy's Laboratories Ltd",
      mrp: 20.0,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Cetirizine (10mg)",
      schedule: "OTC" as const,
      uses: "Allergic rhinitis, hay fever, sneezing, runny nose, and hives (urticaria).",
      sideEffects: "Mild drowsiness, dry mouth, tiredness.",
      interactions: "Alcohol, central nervous system depressants.",
      howToUse: "Take once daily in the evening, with or without food.",
      source: "1mg" as const,
      sourceId: "cetzine10",
      isGenericJanAushadhi: false,
    },
    {
      name: "Alerid 10 Tablet",
      manufacturer: "Cipla Ltd",
      mrp: 19.5,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Cetirizine (10mg)",
      schedule: "OTC" as const,
      uses: "Antihistamine for allergy symptoms.",
      sideEffects: "Drowsiness, fatigue.",
      interactions: "Sedatives.",
      howToUse: "Take once daily.",
      source: "1mg" as const,
      sourceId: "alerid10",
      isGenericJanAushadhi: false,
    },
    {
      name: "PMBJP Cetirizine 10 Tablet",
      manufacturer: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana",
      mrp: 4.5,
      packSize: "10 tablets in 1 strip",
      form: "tablet" as const,
      compositionStr: "Cetirizine (10mg)",
      schedule: "OTC" as const,
      uses: "Generic antihistamine for allergy symptoms.",
      sideEffects: "Mild drowsiness.",
      interactions: "Sedatives.",
      howToUse: "Take once daily.",
      source: "jan_aushadhi" as const,
      sourceId: "pmbjp_cet10",
      isGenericJanAushadhi: true,
    },
    {
      name: "Electral Oral Rehydration Salts Powder",
      manufacturer: "FDC Ltd",
      mrp: 22.0,
      packSize: "21.8g Sachet",
      form: "other" as const,
      compositionStr: "Sodium Chloride (2.6g) + Potassium Chloride (1.5g) + Sodium Citrate (2.9g) + Dextrose (13.5g)",
      schedule: "OTC" as const,
      uses: "WHO recommended formula for dehydration caused by diarrhea, vomiting, or heat exhaustion.",
      sideEffects: "None when properly diluted.",
      interactions: "None known.",
      howToUse: "Dissolve entire sachet in exactly 1 litre of clean drinking water.",
      source: "1mg" as const,
      sourceId: "electral",
      isGenericJanAushadhi: false,
    },
  ];

  for (const m of rawMedicines) {
    const compItems = parseCompositionString(m.compositionStr);
    const compHash = computeCompositionHash(compItems);
    const saltsKey = computeSaltsKey(compItems);

    const medDoc = await Medicine.findOneAndUpdate(
      { source: m.source, sourceId: m.sourceId },
      {
        name: m.name,
        nameNormalized: m.name.toLowerCase().trim(),
        manufacturer: m.manufacturer,
        mrp: m.mrp,
        packSize: m.packSize,
        form: m.form,
        composition: compItems,
        compositionHash: compHash,
        saltsKey,
        schedule: m.schedule,
        uses: m.uses,
        sideEffects: m.sideEffects,
        interactions: m.interactions,
        howToUse: m.howToUse,
        source: m.source,
        sourceId: m.sourceId,
        isGenericJanAushadhi: m.isGenericJanAushadhi,
      },
      { upsert: true, new: true }
    );

    // Seed pharmacy prices for each pharmacy
    const discounts: Record<string, number> = {
      "1mg": 0.15, // 15% off
      "PharmEasy": 0.18, // 18% off
      "Apollo 24|7": 0.10, // 10% off
      "Netmeds": 0.20, // 20% off
      "Jan Aushadhi (PMBJP)": 0.0, // Jan aushadhi is already priced at rock bottom generic MRP
    };

    for (const [pName, discount] of Object.entries(discounts)) {
      const pDoc = pharmacyDocs[pName];
      if (!pDoc) continue;

      // Skip Jan Aushadhi pharmacy for non-Jan-Aushadhi brands
      if (pName === "Jan Aushadhi (PMBJP)" && !m.isGenericJanAushadhi) continue;

      const price = Number((m.mrp * (1 - discount)).toFixed(2));
      await PharmacyPrice.findOneAndUpdate(
        { medicineId: medDoc._id, pharmacyId: pDoc._id },
        {
          medicineId: medDoc._id,
          pharmacyId: pDoc._id,
          price,
          mrp: m.mrp,
          inStock: true,
          stockQty: 50,
          source: "seeded",
          fetchedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  }
  console.log("✓ Seeded medicines and multi-pharmacy prices.");

  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
