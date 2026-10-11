import { DEFAULT_GUARD_CONFIG } from "@/lib/constants";
import { IEntityMemory } from "@/lib/db/models/Chat";
import {
  checkSaltRestriction,
  normalizeSaltName,
  BUILTIN_RESTRICTED_SALTS,
  isKnownOtcSalt,
} from "./saltCheck";
import { runRegexNet } from "./regexNet";
import { classifySafetyWithLLM, confirmRestrictionWithLLM } from "./classifier";
import { extractMentions } from "./extractor";
import { resolveMedicineCandidates, ResolvedCandidate, cleanSpacedAndLeet } from "./resolver";
import { MEDICINE_CATALOG } from "@/lib/data/catalog";

export interface GuardEntityDetail {
  mention: string;
  medicineId?: string;
  name?: string;
  salts: string[];
  schedule?: string;
  score: number;
  via: string;
}

export interface GuardResult {
  verdict: "RESTRICTED" | "OTC" | "NEEDS_CLARIFICATION" | "NO_DRUG";
  entities: GuardEntityDetail[];
  layers: {
    semantic: string;
    saltTable: string;
    classifier: string;
    regex: string;
  };
  triggeredBy?: "saltTable" | "classifier" | "regex" | "lookalikeMargin" | "unknownDrug" | "brandCatalog";
  clarifyOptions?: Array<{ medicineId?: string; name: string }>;
  mandatedPromptRequired: boolean;
}

/**
 * Two-stage Hybrid Finalizer:
 * Enforces Rule 0: Deterministic safety is final authority.
 * Never allow LLM to override a deterministic RESTRICTED verdict.
 */
async function finalizeVerdict(
  result: GuardResult,
  textToScan: string,
  extraDetails?: { matchedSalt?: string; schedule?: string; candidateName?: string }
): Promise<GuardResult> {
  // If deterministic checks said NO_DRUG or OTC, return immediately
  if (result.verdict === "NO_DRUG" || result.verdict === "OTC") {
    return result;
  }

  // Deterministic RESTRICTED verdicts cannot be overridden by LLM
  if (
    result.verdict === "RESTRICTED" &&
    (result.triggeredBy === "saltTable" ||
      result.triggeredBy === "regex" ||
      result.triggeredBy === "brandCatalog" ||
      result.triggeredBy === "lookalikeMargin")
  ) {
    result.mandatedPromptRequired = true;
    return result;
  }

  // For ambiguous/classifier triggers, confirm with LLM
  const confirmation = await confirmRestrictionWithLLM(textToScan, {
    triggeredBy: result.triggeredBy,
    schedule: extraDetails?.schedule || result.entities[0]?.schedule,
    matchedSalt: extraDetails?.matchedSalt || result.entities[0]?.salts?.[0],
    candidateName: extraDetails?.candidateName || result.entities[0]?.name,
    entities: result.entities,
  });

  if (confirmation.proceed) {
    result.verdict = "NO_DRUG";
    result.mandatedPromptRequired = false;
    result.layers.classifier = "OVERRIDDEN_PROCEED";
    return result;
  }

  if (result.verdict === "NEEDS_CLARIFICATION") {
    return result;
  }

  result.verdict = "RESTRICTED";
  result.mandatedPromptRequired = true;
  return result;
}

/**
 * Multi-layer fail-closed Prescription Guard
 * Single source of truth for Schedule H, H1, X, NDPS prescription safety.
 */
export async function guard(
  rawText: string,
  translatedText?: string,
  sessionMemory?: IEntityMemory
): Promise<GuardResult> {
  const rawCombined = translatedText ? `${rawText} ${translatedText}` : rawText;
  const textToScan = cleanSpacedAndLeet(rawCombined);

  const result: GuardResult = {
    verdict: "NO_DRUG",
    entities: [],
    layers: {
      semantic: "OK",
      saltTable: "OK",
      classifier: "OK",
      regex: "OK",
    },
    mandatedPromptRequired: false,
  };

  // --- Layer 1: Backup Regex Net ---
  const regexCheck = runRegexNet(textToScan);
  if (regexCheck.restricted) {
    result.layers.regex = "RESTRICTED";
    result.verdict = "RESTRICTED";
    result.triggeredBy = "regex";
    result.mandatedPromptRequired = true;
    return await finalizeVerdict(result, textToScan, { matchedSalt: regexCheck.matchedPattern });
  }

  // --- Layer 2: Fast Salt Check directly on raw tokens ---
  const normalizedRaw = normalizeSaltName(textToScan);
  if (normalizedRaw.length >= 3) {
    for (const [saltKey, info] of Object.entries(BUILTIN_RESTRICTED_SALTS)) {
      if (new RegExp(`\\b${saltKey}\\b`, "i").test(normalizedRaw)) {
        result.layers.saltTable = "RESTRICTED";
        result.verdict = "RESTRICTED";
        result.triggeredBy = "saltTable";
        result.mandatedPromptRequired = true;
        result.entities.push({
          mention: saltKey,
          name: saltKey.toUpperCase(),
          salts: [saltKey],
          schedule: info.schedule,
          score: 1.0,
          via: "direct_salt_match",
        });
        return await finalizeVerdict(result, textToScan, { matchedSalt: saltKey, schedule: info.schedule });
      }
    }
  }

  // --- Layer 3: Direct Catalog Brand Matching ---
  const lowerScan = textToScan.toLowerCase();
  for (const med of MEDICINE_CATALOG) {
    const brandLower = med.brandName.toLowerCase();
    const isBrandMentioned =
      lowerScan.includes(brandLower) ||
      (brandLower.length >= 5 && new RegExp(`\\b${brandLower.split(/[\s-]/)[0]}\\b`, "i").test(lowerScan));

    if (isBrandMentioned) {
      if (med.schedule !== "OTC") {
        result.layers.saltTable = "RESTRICTED";
        result.verdict = "RESTRICTED";
        result.triggeredBy = "brandCatalog";
        result.mandatedPromptRequired = true;
        result.entities.push({
          mention: med.brandName,
          medicineId: med.id,
          name: med.name,
          salts: med.salts,
          schedule: med.schedule,
          score: 1.0,
          via: "catalog_brand",
        });
        return await finalizeVerdict(result, textToScan, { candidateName: med.name, schedule: med.schedule });
      }
    }
  }

  // --- Layer 4: Candidate Extraction ---
  const mentions = await extractMentions(textToScan, sessionMemory);

  // If no mentions found, run LLM Classifier Net for indirect phrasing ("sleeping pills", etc.)
  if (mentions.length === 0) {
    const classification = await classifySafetyWithLLM(textToScan);
    if (classification.verdict === "RESTRICTED") {
      result.layers.classifier = "RESTRICTED";
      result.verdict = "RESTRICTED";
      result.triggeredBy = "classifier";
      result.mandatedPromptRequired = true;
      return await finalizeVerdict(result, textToScan);
    }
    return result; // NO_DRUG
  }

  // --- Layer 5: Hybrid Resolution & Salt Checking ---
  const resolvedCandidates: ResolvedCandidate[] = [];

  for (const m of mentions) {
    // Direct check if mention is itself a restricted salt
    const saltResult = await checkSaltRestriction([m.mention]);
    if (saltResult.restricted) {
      result.layers.saltTable = "RESTRICTED";
      result.verdict = "RESTRICTED";
      result.triggeredBy = "saltTable";
      result.mandatedPromptRequired = true;
      result.entities.push({
        mention: m.mention,
        name: m.mention,
        salts: [saltResult.matchedSalt || m.mention],
        schedule: saltResult.schedule,
        score: 1.0,
        via: "salt_authority",
      });
      return await finalizeVerdict(result, textToScan, { matchedSalt: saltResult.matchedSalt, schedule: saltResult.schedule });
    }

    const cands = await resolveMedicineCandidates(m.mention, 5);
    resolvedCandidates.push(...cands);
  }

  if (resolvedCandidates.length === 0) {
    // Check if the query or mention is a known OTC salt (Paracetamol, Cetirizine, ORS, etc.)
    const isOtc = mentions.some((m) => isKnownOtcSalt(m.mention)) || isKnownOtcSalt(textToScan);
    if (isOtc) {
      result.verdict = "OTC";
      return result;
    }

    // We extracted a drug mention, but could not resolve to catalog
    // Check classifier net to fail-closed if suspicious
    const classification = await classifySafetyWithLLM(textToScan);
    if (classification.verdict === "RESTRICTED") {
      result.layers.classifier = "RESTRICTED";
      result.verdict = "RESTRICTED";
      result.triggeredBy = "classifier";
      result.mandatedPromptRequired = true;
      return await finalizeVerdict(result, textToScan);
    }

    // Otherwise ask for clarification if user typed an unknown medicine
    result.verdict = "NEEDS_CLARIFICATION";
    return await finalizeVerdict(result, textToScan);
  }

  // Sort candidate hits
  resolvedCandidates.sort((a, b) => b.score - a.score);
  const top1 = resolvedCandidates[0];
  const top2 = resolvedCandidates[1];

  for (const cand of resolvedCandidates.slice(0, 3)) {
    result.entities.push({
      mention: cand.name,
      medicineId: cand.medicineId,
      name: cand.name,
      salts: cand.salts,
      schedule: cand.schedule,
      score: cand.score,
      via: cand.via,
    });
  }

  // --- Layer 6: Salt Table Check on Resolved Candidates (Final Authority) ---
  const top1SaltCheck = await checkSaltRestriction(top1.salts);
  const top1IsRestricted = top1SaltCheck.restricted || (top1.schedule && top1.schedule !== "OTC");

  // Rule 4a: top1 restricted and score >= TAU_HIGH -> RESTRICTED
  if (top1IsRestricted && top1.score >= DEFAULT_GUARD_CONFIG.TAU_HIGH) {
    result.layers.saltTable = "RESTRICTED";
    result.verdict = "RESTRICTED";
    result.triggeredBy = "saltTable";
    result.mandatedPromptRequired = true;
    return await finalizeVerdict(result, textToScan, { candidateName: top1.name, schedule: top1.schedule });
  }

  // Rule 4b: top1 and top2 within GUARD_MARGIN and either restricted -> RESTRICTED (Look-alike safety rule)
  if (top2 && Math.abs(top1.score - top2.score) <= DEFAULT_GUARD_CONFIG.MARGIN) {
    const top2SaltCheck = await checkSaltRestriction(top2.salts);
    const top2IsRestricted = top2SaltCheck.restricted || (top2.schedule && top2.schedule !== "OTC");
    if (top1IsRestricted || top2IsRestricted) {
      result.layers.saltTable = "RESTRICTED";
      result.verdict = "RESTRICTED";
      result.triggeredBy = "lookalikeMargin";
      result.mandatedPromptRequired = true;
      return await finalizeVerdict(result, textToScan, { candidateName: top1IsRestricted ? top1.name : top2.name });
    }
  }

  // Rule 4c: Any candidate in top-3 restricted with score >= TAU_LOW
  for (const cand of resolvedCandidates.slice(0, 3)) {
    const sCheck = await checkSaltRestriction(cand.salts);
    if ((sCheck.restricted || cand.schedule !== "OTC") && cand.score >= DEFAULT_GUARD_CONFIG.TAU_LOW) {
      result.layers.saltTable = "RESTRICTED";
      result.verdict = "RESTRICTED";
      result.triggeredBy = "saltTable";
      result.mandatedPromptRequired = true;
      return await finalizeVerdict(result, textToScan, { candidateName: cand.name, schedule: cand.schedule });
    }
  }

  // Rule 4d: If top1 is verified OTC and no restricted salts found -> OTC
  if (top1.schedule === "OTC" || isKnownOtcSalt(top1.name) || top1.salts.some((s) => isKnownOtcSalt(s))) {
    result.verdict = "OTC";
    return result;
  }

  // Rule 4e: Low confidence -> check OTC allowlist before clarification
  if (top1.score < DEFAULT_GUARD_CONFIG.TAU_LOW) {
    if (isKnownOtcSalt(top1.name) || top1.salts.some((s) => isKnownOtcSalt(s))) {
      result.verdict = "OTC";
      return result;
    }
    result.verdict = "NEEDS_CLARIFICATION";
    result.clarifyOptions = resolvedCandidates.slice(0, 3).map((c) => ({
      medicineId: c.medicineId,
      name: c.name,
    }));
    return await finalizeVerdict(result, textToScan, { candidateName: top1.name });
  }

  // --- Layer 7: Extra LLM Safety Net ---
  const classification = await classifySafetyWithLLM(textToScan);
  if (classification.verdict === "RESTRICTED") {
    result.layers.classifier = "RESTRICTED";
    result.verdict = "RESTRICTED";
    result.triggeredBy = "classifier";
    result.mandatedPromptRequired = true;
    return await finalizeVerdict(result, textToScan);
  }

  // Verified OTC
  result.verdict = "OTC";
  return result;
}
