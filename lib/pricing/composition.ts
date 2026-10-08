import { ICompositionItem } from "@/lib/db/models/Medicine";

/**
 * Parses raw composition string such as:
 * "Amoxycillin (500mg) + Clavulanic Acid (125mg)"
 * or "Paracetamol (650mg)"
 */
export function parseCompositionString(compStr: string): ICompositionItem[] {
  if (!compStr) return [];

  const parts = compStr.split(/\s*\+\s*/);
  const items: ICompositionItem[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Match format "SaltName (500mg)" or "SaltName 500 mg"
    const match = trimmed.match(/^(.+?)(?:\s*\(([\d.]+)\s*([a-zA-Z%]+)\)|\s+([\d.]+)\s*([a-zA-Z%]+))?$/);

    if (match) {
      const saltRaw = match[1].trim();
      const strengthStr = match[2] || match[4];
      const unit = match[3] || match[5] || null;

      let saltNorm = saltRaw
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Normalize common synonyms
      if (saltNorm === "amoxycillin") saltNorm = "amoxicillin";
      if (saltNorm === "acetaminophen") saltNorm = "paracetamol";

      items.push({
        salt: saltRaw,
        saltNormalized: saltNorm,
        strength: strengthStr ? parseFloat(strengthStr) : null,
        unit: unit ? unit.toLowerCase() : null,
      });
    } else {
      items.push({
        salt: trimmed,
        saltNormalized: trimmed.toLowerCase(),
        strength: null,
        unit: null,
      });
    }
  }

  return items;
}

/**
 * Computes deterministic compositionHash:
 * sorted(saltNormalized:strength:unit).join("|")
 */
export function computeCompositionHash(items: ICompositionItem[]): string {
  const tokens = items.map((item) => {
    const str = item.strength !== null ? `${item.strength}` : "na";
    const u = item.unit ? item.unit.toLowerCase() : "na";
    return `${item.saltNormalized}:${str}:${u}`;
  });

  tokens.sort();
  return tokens.join("|");
}

/**
 * Generates sorted saltsKey for cross-strength matching
 */
export function computeSaltsKey(items: ICompositionItem[]): string {
  const salts = items.map((i) => i.saltNormalized);
  salts.sort();
  return salts.join("|");
}
