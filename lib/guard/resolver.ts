import { MEDICINE_CATALOG, CatalogMedicine } from "@/lib/data/catalog";
import { connectToDatabase } from "@/lib/db/client";
import { Medicine } from "@/lib/db/models/Medicine";

export interface ResolvedCandidate {
  medicineId?: string;
  name: string;
  brandName?: string;
  salts: string[];
  schedule: "H" | "H1" | "X" | "NDPS" | "OTC" | "UNKNOWN";
  score: number;
  via: "exact" | "fuzzy" | "phonetic" | "vector" | "rrf";
}

/**
 * Levenshtein distance implementation for fuzzy matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Normalized similarity score [0, 1] based on Levenshtein distance
 */
export function fuzzySimilarity(s1: string, s2: string): number {
  const n1 = s1.toLowerCase().trim();
  const n2 = s2.toLowerCase().trim();
  if (n1 === n2) return 1.0;
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(n1, n2);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Phonetic Soundex implementation for sound-alike drug name matching
 */
export function soundex(s: string): string {
  const a = s.toLowerCase().replace(/[^a-z]/g, "");
  if (!a) return "";
  const first = a[0].toUpperCase();

  const codes: Record<string, string> = {
    b: "1", f: "1", p: "1", v: "1",
    c: "2", g: "2", j: "2", k: "2", q: "2", s: "2", x: "2", z: "2",
    d: "3", t: "3",
    l: "4",
    m: "5", n: "5",
    r: "6",
  };

  let res = first;
  let prev = codes[a[0]] || "0";

  for (let i = 1; i < a.length && res.length < 4; i++) {
    const code = codes[a[i]] || "0";
    if (code !== "0" && code !== prev) {
      res += code;
    }
    prev = code;
  }

  return (res + "000").slice(0, 4);
}

/**
 * Normalize leetspeak and spaced-out letters (e.g. "a l p r a z o l a m", "0gmantin")
 * Preserves numerical dosages like 650, 500, 625, 0.5.
 */
export function cleanSpacedAndLeet(text: string): string {
  let cleaned = text.trim();

  // Compress single-letter spaces: "a l p r a z o l a m" -> "alprazolam", "t r a m a d o l" -> "tramadol"
  cleaned = cleaned.replace(/(\b[a-zA-Z]\b(\s+|$)){3,}/gi, (match) => match.replace(/\s+/g, "") + " ");

  // Handle letter touching numbers like "Alprax0.5" -> "Alprax 0.5"
  cleaned = cleaned.replace(/([a-zA-Z]+)(\d+(\.\d+)?)/g, "$1 $2");

  // Replace leetspeak numbers ONLY when touching letters (not inside pure numbers or dosages)
  // e.g. "0gmantin" -> "ogmantin", "alpr4z" -> "alpraz", but "650" stays "650"
  cleaned = cleaned
    .replace(/(?<=[a-zA-Z])0(?=[a-zA-Z])|^0(?=[a-zA-Z])/g, "o")
    .replace(/(?<=[a-zA-Z])1(?=[a-zA-Z])|^1(?=[a-zA-Z])/g, "l")
    .replace(/(?<=[a-zA-Z])3(?=[a-zA-Z])|^3(?=[a-zA-Z])/g, "e")
    .replace(/(?<=[a-zA-Z])4(?=[a-zA-Z])|^4(?=[a-zA-Z])/g, "a")
    .replace(/(?<=[a-zA-Z])5(?=[a-zA-Z])|^5(?=[a-zA-Z])/g, "s")
    .replace(/(?<=[a-zA-Z])7(?=[a-zA-Z])|^7(?=[a-zA-Z])/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");

  return cleaned.trim();
}

interface InternalMedRecord {
  _id: string;
  name: string;
  brandName: string;
  nameNormalized: string;
  salts: string[];
  schedule: "H" | "H1" | "X" | "NDPS" | "OTC" | "UNKNOWN";
}

let cachedCatalogMeds: InternalMedRecord[] | null = null;

async function getCatalogMeds(): Promise<InternalMedRecord[]> {
  if (!cachedCatalogMeds) {
    // 1. Initialize with pre-verified in-memory catalog
    const baseMeds: InternalMedRecord[] = MEDICINE_CATALOG.map((m) => ({
      _id: m.id,
      name: m.name,
      brandName: m.brandName,
      nameNormalized: m.nameNormalized,
      salts: m.salts,
      schedule: m.schedule,
    }));

    // 2. Supplement from MongoDB if reachable
    try {
      await connectToDatabase();
      const dbMeds = await Medicine.find({}).lean();
      if (dbMeds && dbMeds.length > 0) {
        for (const dm of dbMeds) {
          const idStr = (dm as any)._id.toString();
          if (!baseMeds.some((b) => b._id === idStr)) {
            baseMeds.push({
              _id: idStr,
              name: dm.name,
              brandName: dm.name.split(" ")[0],
              nameNormalized: dm.nameNormalized || dm.name.toLowerCase().trim(),
              salts: dm.composition?.map((c: any) => c.saltNormalized) || [],
              schedule: dm.schedule || "UNKNOWN",
            });
          }
        }
      }
    } catch {
      // Graceful fallback to rich built-in catalog
    }

    cachedCatalogMeds = baseMeds;
  }
  return cachedCatalogMeds;
}

/**
 * Hybrid Resolver: Combines Exact, Brand-Prefix, Fuzzy, and Phonetic matches
 */
export async function resolveMedicineCandidates(
  mention: string,
  topK = 5
): Promise<ResolvedCandidate[]> {
  const cleaned = cleanSpacedAndLeet(mention).toLowerCase().trim();
  if (!cleaned || cleaned.length < 3) return [];

  const mentionSound = soundex(cleaned);
  const candidates: ResolvedCandidate[] = [];
  const allMeds = await getCatalogMeds();

  for (const med of allMeds) {
    const medName = med.name.toLowerCase();
    const brandLower = med.brandName.toLowerCase();
    const normName = med.nameNormalized;

    // 1. Exact match on brand name or salts
    const saltMatch = med.salts.some((s) => {
      const sLower = s.toLowerCase();
      return (
        sLower === cleaned ||
        (cleaned.length >= 4 && sLower.includes(cleaned)) ||
        (sLower.length >= 4 && cleaned.includes(sLower))
      );
    });

    const brandExact =
      medName === cleaned ||
      normName === cleaned ||
      brandLower === cleaned;

    const brandPrefix =
      cleaned.length >= 4 &&
      (medName.startsWith(cleaned) ||
        normName.startsWith(cleaned) ||
        brandLower.startsWith(cleaned) ||
        cleaned.startsWith(brandLower));

    if (saltMatch || brandExact || brandPrefix) {
      candidates.push({
        medicineId: med._id,
        name: med.name,
        brandName: med.brandName,
        salts: med.salts,
        schedule: med.schedule,
        score: 1.0,
        via: "exact",
      });
      continue;
    }

    // 2. Fuzzy match
    const fScore = Math.max(
      fuzzySimilarity(cleaned, medName),
      fuzzySimilarity(cleaned, normName),
      fuzzySimilarity(cleaned, brandLower),
      ...med.salts.map((s) => fuzzySimilarity(cleaned, s))
    );

    // 3. Phonetic match
    const pScore =
      soundex(medName) === mentionSound ||
      soundex(normName) === mentionSound ||
      soundex(brandLower) === mentionSound
        ? 0.85
        : 0.0;

    const combinedScore = Math.max(fScore, pScore);

    if (combinedScore >= 0.6) {
      candidates.push({
        medicineId: med._id,
        name: med.name,
        brandName: med.brandName,
        salts: med.salts,
        schedule: med.schedule,
        score: combinedScore,
        via: fScore >= pScore ? "fuzzy" : "phonetic",
      });
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, topK);
}
