import { parseCompositionString, computeCompositionHash, computeSaltsKey } from "../pricing/composition";

export interface PharmacyQuote {
  platform: "1mg" | "PharmEasy" | "Apollo 24|7" | "Netmeds" | "Jan Aushadhi (PMBJP)";
  price_inr: number;
  delivery_eta: string;
  in_stock: boolean;
  savings_vs_mrp_pct: number;
}

export interface CatalogMedicine {
  id: string;
  name: string;
  nameNormalized: string;
  brandName: string;
  manufacturer: string;
  mrp: number;
  packSize: string;
  form: "tablet" | "capsule" | "syrup" | "injection" | "ointment" | "sachet";
  compositionStr: string;
  therapeuticClass: string;
  schedule: "H" | "H1" | "X" | "NDPS" | "OTC";
  uses: string;
  sideEffects: string;
  interactions: string;
  howToUse: string;
  isGenericJanAushadhi: boolean;
  partnerQuotes: PharmacyQuote[];
  composition: ReturnType<typeof parseCompositionString>;
  compositionHash: string;
  saltsKey: string;
  salts: string[];
}

const RAW_MEDICINES = [
  // --- Schedule H / H1 / X / NDPS (Restricted) ---
  {
    id: "med-aug625",
    name: "Augmentin 625 Duo Tablet",
    brandName: "Augmentin 625 Duo",
    manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
    mrp: 223.50,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    therapeuticClass: "Antibacterial / Penicillin Combination",
    schedule: "H" as const,
    uses: "Bacterial infections of lungs, ears, sinuses, urinary tract, skin, and soft tissue.",
    sideEffects: "Nausea, vomiting, diarrhea, skin rash.",
    interactions: "Methotrexate, Probenecid, Allopurinol, Oral Contraceptives.",
    howToUse: "Take with food to minimize gastrointestinal discomfort. Swallow whole.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 136.08, delivery_eta: "Tomorrow by 2 PM", in_stock: true, savings_vs_mrp_pct: 39.1 },
      { platform: "PharmEasy" as const, price_inr: 139.50, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 37.6 },
      { platform: "Apollo 24|7" as const, price_inr: 142.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 36.5 },
      { platform: "Netmeds" as const, price_inr: 141.20, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 36.8 },
    ],
  },
  {
    id: "med-moxikind625",
    name: "Moxikind-CV 625 Tablet",
    brandName: "Moxikind-CV 625",
    manufacturer: "Mankind Pharma Ltd",
    mrp: 151.20,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    therapeuticClass: "Antibacterial / Penicillin Combination",
    schedule: "H" as const,
    uses: "Broad-spectrum antibacterial treatment with identical active ingredients to Augmentin 625.",
    sideEffects: "Loose stools, mild nausea.",
    interactions: "Allopurinol, Warfarin.",
    howToUse: "Take with or immediately after a meal.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 136.08, delivery_eta: "Tomorrow by 2 PM", in_stock: true, savings_vs_mrp_pct: 10.0 },
      { platform: "PharmEasy" as const, price_inr: 139.50, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 7.7 },
      { platform: "Apollo 24|7" as const, price_inr: 142.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 6.1 },
    ],
  },
  {
    id: "med-clavam625",
    name: "Clavam 625 Tablet",
    brandName: "Clavam 625",
    manufacturer: "Alkem Laboratories Ltd",
    mrp: 168.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    therapeuticClass: "Antibacterial / Penicillin Combination",
    schedule: "H" as const,
    uses: "Bacterial infections of respiratory tract, ear, sinus, and dental abscesses.",
    sideEffects: "Diarrhea, indigestion.",
    interactions: "Anticoagulants, Probenecid.",
    howToUse: "Take at start of meals.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 149.00, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 11.3 },
      { platform: "PharmEasy" as const, price_inr: 152.00, delivery_eta: "In 2 days", in_stock: true, savings_vs_mrp_pct: 9.5 },
      { platform: "Netmeds" as const, price_inr: 150.50, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 10.4 },
    ],
  },
  {
    id: "med-alprax05",
    name: "Alprax 0.5 Tablet",
    brandName: "Alprax 0.5",
    manufacturer: "Torrent Pharmaceuticals Ltd",
    mrp: 42.00,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Alprazolam (0.5mg)",
    therapeuticClass: "Anxiolytic / Benzodiazepine",
    schedule: "H1" as const,
    uses: "Short-term management of severe anxiety and panic disorders.",
    sideEffects: "Drowsiness, ataxia, habit forming with prolonged use.",
    interactions: "Alcohol, Opioids, Sedatives, Antifungals.",
    howToUse: "Strictly as prescribed by a psychiatrist.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 37.80, delivery_eta: "Requires Rx verification", in_stock: true, savings_vs_mrp_pct: 10.0 },
      { platform: "Apollo 24|7" as const, price_inr: 39.00, delivery_eta: "Requires Rx upload", in_stock: true, savings_vs_mrp_pct: 7.1 },
    ],
  },
  {
    id: "med-restyl05",
    name: "Restyl 0.5 Tablet",
    brandName: "Restyl 0.5",
    manufacturer: "Cipla Ltd",
    mrp: 35.00,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Alprazolam (0.5mg)",
    therapeuticClass: "Anxiolytic / Benzodiazepine",
    schedule: "H1" as const,
    uses: "Anxiety and panic disorders.",
    sideEffects: "Sedation, lightheadedness.",
    interactions: "Alcohol, CNS depressants.",
    howToUse: "Under strict medical supervision.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "PharmEasy" as const, price_inr: 31.50, delivery_eta: "Requires Rx upload", in_stock: true, savings_vs_mrp_pct: 10.0 },
    ],
  },
  {
    id: "med-ciplox500",
    name: "Ciplox 500 Tablet",
    brandName: "Ciplox 500",
    manufacturer: "Cipla Ltd",
    mrp: 48.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Ciprofloxacin (500mg)",
    therapeuticClass: "Fluoroquinolone Antibacterial",
    schedule: "H" as const,
    uses: "Typhoid fever, urinary tract, and gastrointestinal infections.",
    sideEffects: "Nausea, dizziness, tendon tenderness.",
    interactions: "Antacids, Theophylline, Iron salts.",
    howToUse: "Drink plenty of water throughout treatment.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 40.80, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "Apollo 24|7" as const, price_inr: 42.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 12.5 },
    ],
  },
  {
    id: "med-cifran500",
    name: "Cifran 500 Tablet",
    brandName: "Cifran 500",
    manufacturer: "Sun Pharmaceutical Industries Ltd",
    mrp: 45.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Ciprofloxacin (500mg)",
    therapeuticClass: "Fluoroquinolone Antibacterial",
    schedule: "H" as const,
    uses: "Bacterial infections.",
    sideEffects: "Nausea, headache.",
    interactions: "Magnesium/aluminum antacids.",
    howToUse: "Swallow whole with fluids.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 39.00, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 13.3 },
    ],
  },
  {
    id: "med-azithral500",
    name: "Azithral 500 Tablet",
    brandName: "Azithral 500",
    manufacturer: "Alembic Pharmaceuticals Ltd",
    mrp: 120.00,
    packSize: "5 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Azithromycin (500mg)",
    therapeuticClass: "Macrolide Antibacterial",
    schedule: "H" as const,
    uses: "Chest, throat, sinus, and sexually transmitted bacterial infections.",
    sideEffects: "Diarrhea, vomiting, headache.",
    interactions: "Antacids, Digoxin, Colchicine.",
    howToUse: "Take once daily, 1 hour before or 2 hours after a meal.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 102.00, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 104.50, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 12.9 },
      { platform: "Apollo 24|7" as const, price_inr: 106.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 11.7 },
    ],
  },
  {
    id: "med-aziwok500",
    name: "Aziwok 500 Tablet",
    brandName: "Aziwok 500",
    manufacturer: "Wockhardt Ltd",
    mrp: 88.00,
    packSize: "5 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Azithromycin (500mg)",
    therapeuticClass: "Macrolide Antibacterial",
    schedule: "H" as const,
    uses: "Macrolide antibiotic with identical active composition to Azithral 500.",
    sideEffects: "Mild stomach discomfort.",
    interactions: "Antacids.",
    howToUse: "Take as directed by doctor.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 74.80, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
    ],
  },
  {
    id: "med-zifi200",
    name: "Zifi 200 Tablet",
    brandName: "Zifi 200",
    manufacturer: "FDC Ltd",
    mrp: 110.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Cefixime (200mg)",
    therapeuticClass: "Cephalosporin Antibacterial",
    schedule: "H" as const,
    uses: "Bacterial infections of the ear, urinary tract, and chest.",
    sideEffects: "Diarrhea, indigestion.",
    interactions: "Carbamazepine, Anticoagulants.",
    howToUse: "Take with or without food.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 93.50, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
    ],
  },
  {
    id: "med-taximo200",
    name: "Taxim-O 200 Tablet",
    brandName: "Taxim-O 200",
    manufacturer: "Alkem Laboratories Ltd",
    mrp: 115.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Cefixime (200mg)",
    therapeuticClass: "Cephalosporin Antibacterial",
    schedule: "H" as const,
    uses: "Cephalosporin antibiotic equivalent to Zifi 200.",
    sideEffects: "Diarrhea, abdominal cramps.",
    interactions: "Warfarin.",
    howToUse: "Swallow whole.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "PharmEasy" as const, price_inr: 97.75, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 15.0 },
    ],
  },
  {
    id: "med-tramazac50",
    name: "Tramazac 50 Capsule",
    brandName: "Tramazac 50",
    manufacturer: "Zydus Cadila",
    mrp: 35.00,
    packSize: "10 capsules in 1 strip",
    form: "capsule" as const,
    compositionStr: "Tramadol (50mg)",
    therapeuticClass: "Opioid Analgesic",
    schedule: "H1" as const,
    uses: "Moderate to severe acute pain.",
    sideEffects: "Dizziness, nausea, constipation, addiction potential.",
    interactions: "Alcohol, SSRIs, MAOIs, Sedatives.",
    howToUse: "Strictly as prescribed by a licensed physician.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 31.50, delivery_eta: "Requires Rx verification", in_stock: true, savings_vs_mrp_pct: 10.0 },
    ],
  },
  {
    id: "med-calmpose5",
    name: "Calmpose 5 Tablet",
    brandName: "Calmpose 5",
    manufacturer: "Sun Pharmaceutical Industries Ltd",
    mrp: 18.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Diazepam (5mg)",
    therapeuticClass: "Benzodiazepine Anxiolytic / Muscle Relaxant",
    schedule: "H1" as const,
    uses: "Severe anxiety, muscle spasms, alcohol withdrawal.",
    sideEffects: "Drowsiness, ataxia, dependence.",
    interactions: "Alcohol, Opioids.",
    howToUse: "Take strictly as prescribed.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "Apollo 24|7" as const, price_inr: 16.20, delivery_eta: "Requires Rx upload", in_stock: true, savings_vs_mrp_pct: 10.0 },
    ],
  },
  {
    id: "med-clonafit05",
    name: "Clonafit 0.5 Tablet",
    brandName: "Clonafit 0.5",
    manufacturer: "Mankind Pharma Ltd",
    mrp: 32.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Clonazepam (0.5mg)",
    therapeuticClass: "Anticonvulsant / Anxiolytic",
    schedule: "H1" as const,
    uses: "Epilepsy, panic disorder, involuntary muscle spasms.",
    sideEffects: "Drowsiness, impaired coordination.",
    interactions: "Alcohol, Antidepressants.",
    howToUse: "Take strictly as prescribed.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 28.80, delivery_eta: "Requires Rx verification", in_stock: true, savings_vs_mrp_pct: 10.0 },
    ],
  },
  {
    id: "med-dox100",
    name: "Dox-1 100 Capsule",
    brandName: "Dox-1 100",
    manufacturer: "Dr Reddy's Laboratories Ltd",
    mrp: 25.00,
    packSize: "10 capsules in 1 strip",
    form: "capsule" as const,
    compositionStr: "Doxycycline (100mg)",
    therapeuticClass: "Tetracycline Antibacterial",
    schedule: "H" as const,
    uses: "Severe acne, respiratory infections, chlamydia, malaria prophylaxis.",
    sideEffects: "Photosensitivity, nausea.",
    interactions: "Antacids, Iron, Dairy.",
    howToUse: "Take with a full glass of water sitting upright.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "PharmEasy" as const, price_inr: 21.25, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
    ],
  },
  {
    id: "med-metrogyl400",
    name: "Metrogyl 400 Tablet",
    brandName: "Metrogyl 400",
    manufacturer: "J.B. Chemicals & Pharmaceuticals Ltd",
    mrp: 24.00,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Metronidazole (400mg)",
    therapeuticClass: "Nitroimidazole Antimicrobial",
    schedule: "H" as const,
    uses: "Amoebiasis, bacterial vaginosis, dental and anaerobic infections.",
    sideEffects: "Metallic taste, headache, dark urine.",
    interactions: "Alcohol (disulfiram-like reaction), Warfarin.",
    howToUse: "Take with meals. Avoid alcohol completely.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 20.40, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
    ],
  },
  {
    id: "med-zolpfresh10",
    name: "ZolpFresh 10 Tablet",
    brandName: "ZolpFresh 10",
    manufacturer: "Torrent Pharmaceuticals Ltd",
    mrp: 78.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Zolpidem (10mg)",
    therapeuticClass: "Non-Benzodiazepine Hypnotic",
    schedule: "H1" as const,
    uses: "Short-term treatment of insomnia.",
    sideEffects: "Dizziness, sleepwalking, amnesia, dependence.",
    interactions: "Alcohol, CNS depressants.",
    howToUse: "Take immediately before bedtime.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 70.20, delivery_eta: "Requires Rx verification", in_stock: true, savings_vs_mrp_pct: 10.0 },
    ],
  },
  {
    id: "med-levomac500",
    name: "Levomac 500 Tablet",
    brandName: "Levomac 500",
    manufacturer: "Macleods Pharmaceuticals Ltd",
    mrp: 85.00,
    packSize: "5 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Levofloxacin (500mg)",
    therapeuticClass: "Fluoroquinolone Antibacterial",
    schedule: "H1" as const,
    uses: "Pneumonia, acute sinusitis, kidney and prostate infections.",
    sideEffects: "Nausea, insomnia, tendonitis risk.",
    interactions: "Antacids, Corticosteroids.",
    howToUse: "Drink plenty of water.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "Apollo 24|7" as const, price_inr: 74.00, delivery_eta: "Requires Rx upload", in_stock: true, savings_vs_mrp_pct: 12.9 },
    ],
  },
  {
    id: "med-ritalin10",
    name: "Ritalin 10 Tablet",
    brandName: "Ritalin 10",
    manufacturer: "Novartis India Ltd",
    mrp: 180.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Methylphenidate (10mg)",
    therapeuticClass: "CNS Stimulant",
    schedule: "X" as const,
    uses: "Attention Deficit Hyperactivity Disorder (ADHD), Narcolepsy.",
    sideEffects: "Insomnia, decreased appetite, palpitations.",
    interactions: "MAO inhibitors, Antihypertensives.",
    howToUse: "Strictly Schedule X double-locked pharmacy dispensing.",
    isGenericJanAushadhi: false,
    partnerQuotes: [],
  },
  {
    id: "med-morphitroy10",
    name: "Morphitroy 10 Tablet",
    brandName: "Morphitroy 10",
    manufacturer: "Troikaa Pharmaceuticals Ltd",
    mrp: 150.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Morphine (10mg)",
    therapeuticClass: "Narcotic Opioid Analgesic",
    schedule: "NDPS" as const,
    uses: "Palliative care and severe intractable pain management.",
    sideEffects: "Severe respiratory depression, constipation, physical dependence.",
    interactions: "Sedatives, Alcohol.",
    howToUse: "Strict NDPS registered hospital pharmacy dispensing only.",
    isGenericJanAushadhi: false,
    partnerQuotes: [],
  },

  // --- Verified OTC Medications ---
  {
    id: "med-dolo650",
    name: "Dolo 650 Tablet",
    brandName: "Dolo 650",
    manufacturer: "Micro Labs Ltd",
    mrp: 33.60,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Paracetamol (650mg)",
    therapeuticClass: "Analgesic & Antipyretic",
    schedule: "OTC" as const,
    uses: "Fever reduction and mild to moderate pain relief (headache, body ache, toothache).",
    sideEffects: "Rare: skin rash or allergic reaction at normal doses.",
    interactions: "Heavy alcohol use (hepatotoxicity risk), Warfarin.",
    howToUse: "Take with water. Do not exceed 4000mg total paracetamol in 24 hours.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 28.56, delivery_eta: "Tomorrow by 2 PM", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 29.23, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 13.0 },
      { platform: "Apollo 24|7" as const, price_inr: 29.90, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 11.0 },
      { platform: "Netmeds" as const, price_inr: 29.50, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 12.2 },
      { platform: "Jan Aushadhi (PMBJP)" as const, price_inr: 10.00, delivery_eta: "Store Pickup / 24-48 hrs", in_stock: true, savings_vs_mrp_pct: 70.2 },
    ],
  },
  {
    id: "med-calpol650",
    name: "Calpol 650 Tablet",
    brandName: "Calpol 650",
    manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
    mrp: 30.50,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Paracetamol (650mg)",
    therapeuticClass: "Analgesic & Antipyretic",
    schedule: "OTC" as const,
    uses: "Relief of pain and fever reduction.",
    sideEffects: "Well tolerated at recommended doses.",
    interactions: "Alcohol, other paracetamol products.",
    howToUse: "Swallow whole with a glass of water.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 25.92, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 26.50, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 13.1 },
      { platform: "Apollo 24|7" as const, price_inr: 27.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 11.5 },
    ],
  },
  {
    id: "med-crocin650",
    name: "Crocin 650 Advance Tablet",
    brandName: "Crocin 650",
    manufacturer: "GlaxoSmithKline Asia Pvt Ltd",
    mrp: 32.00,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Paracetamol (650mg)",
    therapeuticClass: "Analgesic & Antipyretic",
    schedule: "OTC" as const,
    uses: "Rapid-release formulation for fever and acute body aches.",
    sideEffects: "Rare mild nausea.",
    interactions: "Alcohol.",
    howToUse: "Take every 4-6 hours as needed; max 4 tabs daily.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 27.20, delivery_eta: "Tomorrow by 2 PM", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "Apollo 24|7" as const, price_inr: 28.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 12.5 },
      { platform: "Netmeds" as const, price_inr: 27.50, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 14.1 },
    ],
  },
  {
    id: "med-pacimol650",
    name: "Pacimol 650 Tablet",
    brandName: "Pacimol 650",
    manufacturer: "Ipca Laboratories Ltd",
    mrp: 22.00,
    packSize: "15 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Paracetamol (650mg)",
    therapeuticClass: "Analgesic & Antipyretic",
    schedule: "OTC" as const,
    uses: "Cost-effective paracetamol formulation for fever and mild pains.",
    sideEffects: "Rare allergic reactions.",
    interactions: "Alcohol.",
    howToUse: "Take with water.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 18.70, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 19.14, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 13.0 },
    ],
  },
  {
    id: "med-pmbjp-para650",
    name: "PMBJP Paracetamol 650 Tablet",
    brandName: "PMBJP Paracetamol 650",
    manufacturer: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana",
    mrp: 10.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Paracetamol (650mg)",
    therapeuticClass: "Analgesic & Antipyretic",
    schedule: "OTC" as const,
    uses: "Government-certified high quality generic paracetamol with 70% savings vs branded alternatives.",
    sideEffects: "Well tolerated.",
    interactions: "Alcohol.",
    howToUse: "Take with water as directed.",
    isGenericJanAushadhi: true,
    partnerQuotes: [
      { platform: "Jan Aushadhi (PMBJP)" as const, price_inr: 10.00, delivery_eta: "Available at 10,000+ PMBJP Kendras", in_stock: true, savings_vs_mrp_pct: 0 },
    ],
  },
  {
    id: "med-cetzine10",
    name: "Cetzine 10 Tablet",
    brandName: "Cetzine 10",
    manufacturer: "Dr Reddy's Laboratories Ltd",
    mrp: 21.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Cetirizine (10mg)",
    therapeuticClass: "Second Generation Antihistamine",
    schedule: "OTC" as const,
    uses: "Allergic rhinitis, sneezing, runny nose, itchy watery eyes, and hives.",
    sideEffects: "Mild drowsiness, dry mouth, headache.",
    interactions: "Alcohol, Sedatives.",
    howToUse: "Take once daily in the evening.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 17.85, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "Apollo 24|7" as const, price_inr: 18.50, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 11.9 },
    ],
  },
  {
    id: "med-alerid10",
    name: "Alerid 10 Tablet",
    brandName: "Alerid 10",
    manufacturer: "Cipla Ltd",
    mrp: 19.50,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Cetirizine (10mg)",
    therapeuticClass: "Second Generation Antihistamine",
    schedule: "OTC" as const,
    uses: "Allergy symptoms, pollen allergy, skin urticaria.",
    sideEffects: "Mild sedation.",
    interactions: "Alcohol.",
    howToUse: "Take once daily.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 16.58, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 17.00, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 12.8 },
    ],
  },
  {
    id: "med-pmbjp-cetzine10",
    name: "PMBJP Cetirizine 10 Tablet",
    brandName: "PMBJP Cetirizine 10",
    manufacturer: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana",
    mrp: 6.50,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Cetirizine (10mg)",
    therapeuticClass: "Second Generation Antihistamine",
    schedule: "OTC" as const,
    uses: "Affordable government generic equivalent to Cetzine 10 and Alerid 10.",
    sideEffects: "Mild drowsiness.",
    interactions: "Alcohol.",
    howToUse: "Take once daily with water.",
    isGenericJanAushadhi: true,
    partnerQuotes: [
      { platform: "Jan Aushadhi (PMBJP)" as const, price_inr: 6.50, delivery_eta: "Store Pickup / PMBJP Kendras", in_stock: true, savings_vs_mrp_pct: 0 },
    ],
  },
  {
    id: "med-allegra120",
    name: "Allegra 120mg Tablet",
    brandName: "Allegra 120mg",
    manufacturer: "Sanofi India Ltd",
    mrp: 225.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Fexofenadine (120mg)",
    therapeuticClass: "Non-Sedating Antihistamine",
    schedule: "OTC" as const,
    uses: "Seasonal allergic rhinitis and chronic idiopathic urticaria with zero sedation.",
    sideEffects: "Headache, nausea.",
    interactions: "Fruit juices (grapefruit, apple, orange reduce absorption), Antacids with Al/Mg.",
    howToUse: "Take with water on an empty stomach. Avoid fruit juice 2 hours before/after.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 191.25, delivery_eta: "Tomorrow by 2 PM", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 195.00, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 13.3 },
      { platform: "Apollo 24|7" as const, price_inr: 198.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 12.0 },
      { platform: "Netmeds" as const, price_inr: 193.50, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 14.0 },
    ],
  },
  {
    id: "med-fexova120",
    name: "Fexova 120 Tablet",
    brandName: "Fexova 120",
    manufacturer: "Ipca Laboratories Ltd",
    mrp: 135.00,
    packSize: "10 tablets in 1 strip",
    form: "tablet" as const,
    compositionStr: "Fexofenadine (120mg)",
    therapeuticClass: "Non-Sedating Antihistamine",
    schedule: "OTC" as const,
    uses: "Cost-effective non-sedating antihistamine 100% equivalent to Allegra 120mg.",
    sideEffects: "Headache.",
    interactions: "Fruit juices, Antacids.",
    howToUse: "Take with water.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 114.75, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 118.00, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 12.6 },
    ],
  },
  {
    id: "med-electral",
    name: "Electral Powder 21.8g",
    brandName: "Electral",
    manufacturer: "FDC Ltd",
    mrp: 22.50,
    packSize: "21.8g sachet",
    form: "sachet" as const,
    compositionStr: "Oral Rehydration Salts (WHO Formula)",
    therapeuticClass: "Electrolyte Replenisher",
    schedule: "OTC" as const,
    uses: "Restoration of body water and electrolytes lost in diarrhea, vomiting, heat stroke.",
    sideEffects: "Safe when dissolved in correct volume.",
    interactions: "None significant.",
    howToUse: "Dissolve entire contents of 21.8g sachet in exactly 1 Liter of clean drinking water.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 19.50, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 13.3 },
      { platform: "Apollo 24|7" as const, price_inr: 20.00, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 11.1 },
    ],
  },
  {
    id: "med-digene",
    name: "Digene Gel Mint Flavour 200ml",
    brandName: "Digene",
    manufacturer: "Abbott Healthcare Pvt Ltd",
    mrp: 145.00,
    packSize: "200ml bottle",
    form: "syrup" as const,
    compositionStr: "Magnesium Hydroxide + Aluminium Hydroxide + Simethicone",
    therapeuticClass: "Antacid & Antiflatulent",
    schedule: "OTC" as const,
    uses: "Acid reflux, heartburn, acidity, stomach gas discomfort.",
    sideEffects: "Occasional chalky taste, constipation or mild diarrhea.",
    interactions: "Tetracycline antibiotics (space out by 2 hours).",
    howToUse: "Take 1-2 teaspoonfuls after meals and at bedtime.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 123.25, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 15.0 },
      { platform: "PharmEasy" as const, price_inr: 126.00, delivery_eta: "24-48 hrs", in_stock: true, savings_vs_mrp_pct: 13.1 },
    ],
  },
  {
    id: "med-strepsils",
    name: "Strepsils Orange Lozenges",
    brandName: "Strepsils",
    manufacturer: "Reckitt Benckiser",
    mrp: 35.00,
    packSize: "8 lozenges in 1 strip",
    form: "tablet" as const,
    compositionStr: "2,4-Dichlorobenzyl alcohol + Amylmetacresol",
    therapeuticClass: "Throat Antiseptic & Analgesic",
    schedule: "OTC" as const,
    uses: "Sore throat pain relief and local oral antiseptic action.",
    sideEffects: "Very well tolerated.",
    interactions: "None reported.",
    howToUse: "Dissolve slowly in the mouth every 2-3 hours.",
    isGenericJanAushadhi: false,
    partnerQuotes: [
      { platform: "1mg" as const, price_inr: 30.00, delivery_eta: "Tomorrow", in_stock: true, savings_vs_mrp_pct: 14.3 },
      { platform: "Apollo 24|7" as const, price_inr: 31.50, delivery_eta: "2 Hours (Express)", in_stock: true, savings_vs_mrp_pct: 10.0 },
    ],
  },
];

export const MEDICINE_CATALOG: CatalogMedicine[] = RAW_MEDICINES.map((item) => {
  const parsedComposition = parseCompositionString(item.compositionStr);
  const compHash = computeCompositionHash(parsedComposition);
  const saltsKey = computeSaltsKey(parsedComposition);
  const salts = parsedComposition.map((c) => c.saltNormalized);

  return {
    ...item,
    nameNormalized: item.name.toLowerCase().trim(),
    composition: parsedComposition,
    compositionHash: compHash,
    saltsKey,
    salts,
  };
});

/**
 * Fast in-memory lookup index by ID
 */
export const CATALOG_BY_ID = new Map<string, CatalogMedicine>();
for (const med of MEDICINE_CATALOG) {
  CATALOG_BY_ID.set(med.id, med);
}

/**
 * Fast in-memory lookup index by compositionHash
 */
export const CATALOG_BY_COMPOSITION_HASH = new Map<string, CatalogMedicine[]>();
for (const med of MEDICINE_CATALOG) {
  const list = CATALOG_BY_COMPOSITION_HASH.get(med.compositionHash) || [];
  list.push(med);
  CATALOG_BY_COMPOSITION_HASH.set(med.compositionHash, list);
}

/**
 * Return verified substitutes for a given target drug with identical active composition
 */
export function getVerifiedCatalogSubstitutes(targetMed: CatalogMedicine): Array<{
  brand_name: string;
  manufacturer: string;
  active_composition: string;
  composition_identically_verified: boolean;
  mrp_inr: number;
  savings_percentage: number;
  user_advisory: string;
  partner_price_comparison: Array<{
    platform: string;
    price_inr: number;
    delivery_eta: string;
    in_stock: boolean;
  }>;
}> {
  const matching = (CATALOG_BY_COMPOSITION_HASH.get(targetMed.compositionHash) || []).filter(
    (m) => m.id !== targetMed.id
  );

  return matching
    .map((item) => {
      const savings = targetMed.mrp > 0
        ? Number((((targetMed.mrp - item.mrp) / targetMed.mrp) * 100).toFixed(1))
        : 0;

      return {
        brand_name: item.brandName,
        manufacturer: item.manufacturer,
        active_composition: item.compositionStr,
        composition_identically_verified: true,
        mrp_inr: item.mrp,
        savings_percentage: Math.max(0, savings),
        user_advisory: "Active composition is verifiably identical. Please confirm any substitution with a doctor or pharmacist.",
        partner_price_comparison: item.partnerQuotes.map((q) => ({
          platform: q.platform,
          price_inr: q.price_inr,
          delivery_eta: q.delivery_eta,
          in_stock: q.in_stock,
        })),
      };
    })
    .sort((a, b) => b.savings_percentage - a.savings_percentage);
}
