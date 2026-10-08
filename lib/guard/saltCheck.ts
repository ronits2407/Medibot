import { RestrictedSalt } from "@/lib/db/models/RestrictedSalt";
import { connectToDatabase } from "@/lib/db/client";

// Normalize salt name for lookup (lowercase, normalize common spelling differences)
export function normalizeSaltName(salt: string): string {
  let normalized = salt
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");

  // Normalization mappings for Indian drug formulations
  const synonymMap: Record<string, string> = {
    amoxycillin: "amoxicillin",
    clavulanate: "clavulanic acid",
    potassiumclavulanate: "clavulanic acid",
    paracetamol: "paracetamol",
    acetaminophen: "paracetamol",
    aspirin: "acetylsalicylic acid",
  };

  for (const [variant, canonical] of Object.entries(synonymMap)) {
    if (normalized.includes(variant)) {
      normalized = normalized.replace(new RegExp(`\\b${variant}\\b`, "g"), canonical);
    }
  }

  return normalized.trim();
}

/**
 * High-priority in-memory seed list of Schedule H, H1, X, and NDPS restricted salts
 * Ensures instant, zero-latency deterministic interception even before DB query.
 */
export const BUILTIN_RESTRICTED_SALTS: Record<
  string,
  { schedule: "H" | "H1" | "X" | "NDPS"; notes: string }
> = {
  // Common Schedule H Antibiotics & Controlled Drugs
  amoxicillin: { schedule: "H", notes: "Penicillin antibiotic" },
  ampicillin: { schedule: "H", notes: "Antibiotic" },
  azithromycin: { schedule: "H", notes: "Macrolide antibiotic" },
  ciprofloxacin: { schedule: "H", notes: "Fluoroquinolone antibiotic" },
  ofloxacin: { schedule: "H", notes: "Fluoroquinolone antibiotic" },
  norfloxacin: { schedule: "H", notes: "Fluoroquinolone antibiotic" },
  cefixime: { schedule: "H", notes: "Cephalosporin antibiotic" },
  cefpodoxime: { schedule: "H", notes: "Cephalosporin antibiotic" },
  cephalexin: { schedule: "H", notes: "Cephalosporin antibiotic" },
  metronidazole: { schedule: "H", notes: "Antimicrobial" },
  doxycycline: { schedule: "H", notes: "Tetracycline antibiotic" },
  clarithromycin: { schedule: "H", notes: "Macrolide antibiotic" },
  erythromycin: { schedule: "H", notes: "Macrolide antibiotic" },

  // Schedule H1 (Stricter antibiotic & psychoactive monitoring)
  alprazolam: { schedule: "H1", notes: "Benzodiazepine, high abuse potential" },
  clonazepam: { schedule: "H1", notes: "Benzodiazepine" },
  diazepam: { schedule: "H1", notes: "Benzodiazepine" },
  lorazepam: { schedule: "H1", notes: "Benzodiazepine" },
  chlordiazepoxide: { schedule: "H1", notes: "Benzodiazepine" },
  nitrazepam: { schedule: "H1", notes: "Benzodiazepine" },
  zolpidem: { schedule: "H1", notes: "Hypnotic sedative" },
  zopiclone: { schedule: "H1", notes: "Hypnotic sedative" },
  tramadol: { schedule: "H1", notes: "Opioid analgesic" },
  codeine: { schedule: "H1", notes: "Opioid antitussive" },
  levofloxacin: { schedule: "H1", notes: "Fluoroquinolone antibiotic" },
  moxifloxacin: { schedule: "H1", notes: "Fluoroquinolone antibiotic" },
  linezolid: { schedule: "H1", notes: "Oxazolidinone antibiotic" },
  meropenem: { schedule: "H1", notes: "Carbapenem antibiotic" },
  doripenem: { schedule: "H1", notes: "Carbapenem antibiotic" },
  ertapenem: { schedule: "H1", notes: "Carbapenem antibiotic" },
  colistin: { schedule: "H1", notes: "Polypeptide antibiotic" },
  faropenem: { schedule: "H1", notes: "Penem antibiotic" },

  // Schedule X (Highly restricted psychoactive)
  methylphenidate: { schedule: "X", notes: "CNS stimulant" },
  amphetamine: { schedule: "X", notes: "CNS stimulant" },
  ketamine: { schedule: "X", notes: "Dissociative anesthetic" },
  secobarbital: { schedule: "X", notes: "Barbiturate" },
  pentobarbital: { schedule: "X", notes: "Barbiturate" },

  // NDPS (Narcotic Drugs & Psychotropic Substances)
  morphine: { schedule: "NDPS", notes: "Narcotic opioid" },
  fentanyl: { schedule: "NDPS", notes: "Potent narcotic opioid" },
  buprenorphine: { schedule: "NDPS", notes: "Opioid partial agonist" },
  methadone: { schedule: "NDPS", notes: "Synthetic opioid" },
  oxycodone: { schedule: "NDPS", notes: "Opioid agonist" },
};

/**
 * Known OTC Salts Allowlist (DESIGN.md §5.4)
 * Used to drive false-positive tests and decisively confirm OTC status.
 */
export const OTC_SALTS_ALLOWLIST = new Set([
  "paracetamol",
  "acetaminophen",
  "cetirizine",
  "fexofenadine",
  "ors",
  "oral rehydration salts",
  "sodium chloride",
  "potassium chloride",
  "sodium citrate",
  "dextrose",
  "antacid",
  "magaldrate",
  "simethicone",
  "aluminum hydroxide",
  "magnesium hydroxide",
  "sucralfate",
  "calcium carbonate",
]);

export function isKnownOtcSalt(salt: string): boolean {
  const norm = normalizeSaltName(salt);
  for (const otc of Array.from(OTC_SALTS_ALLOWLIST)) {
    if (norm === otc || norm.includes(otc) || otc.includes(norm)) {
      return true;
    }
  }
  return false;
}

export interface SaltCheckResult {
  restricted: boolean;
  schedule?: "H" | "H1" | "X" | "NDPS";
  matchedSalt?: string;
  source: "builtin" | "database" | "none";
}

/**
 * Deterministic Salt Checker
 * Final authority on whether any salt in the composition is prescription-restricted.
 */
export async function checkSaltRestriction(salts: string[]): Promise<SaltCheckResult> {
  if (!salts || salts.length === 0) {
    return { restricted: false, source: "none" };
  }

  // 1. Check in-memory fast authority
  for (const rawSalt of salts) {
    const norm = normalizeSaltName(rawSalt);
    for (const [knownSalt, details] of Object.entries(BUILTIN_RESTRICTED_SALTS)) {
      if (norm.includes(knownSalt) || knownSalt.includes(norm)) {
        return {
          restricted: true,
          schedule: details.schedule,
          matchedSalt: knownSalt,
          source: "builtin",
        };
      }
    }
  }

  // 2. Check Database collection `salts_restricted`
  try {
    await connectToDatabase();
    for (const rawSalt of salts) {
      const norm = normalizeSaltName(rawSalt);
      const dbMatch = await RestrictedSalt.findOne({
        $or: [
          { saltNormalized: norm },
          { saltNormalized: { $regex: new RegExp(`^${norm}`, "i") } },
          { synonyms: norm },
        ],
      });

      if (dbMatch) {
        return {
          restricted: true,
          schedule: dbMatch.schedule,
          matchedSalt: dbMatch.salt,
          source: "database",
        };
      }
    }
  } catch (error) {
    console.warn("DB salt lookup skipped or failed, using deterministic in-memory result:", error);
  }

  return { restricted: false, source: "none" };
}
