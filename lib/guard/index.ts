import { DEFAULT_GUARD_CONFIG } from "@/lib/constants";
import { IEntityMemory } from "@/lib/db/models/Chat";
import {
  checkSaltRestriction,
  normalizeSaltName,
  BUILTIN_RESTRICTED_SALTS,
  isKnownOtcSalt,
} from "./saltCheck";
import { runRegexNet } from "./regexNet";
import { classifySafetyWithLLM } from "./classifier";
import { extractMentions } from "./extractor";
import { resolveMedicineCandidates, ResolvedCandidate, cleanSpacedAndLeet } from "./resolver";

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
  triggeredBy?: "saltTable" | "classifier" | "regex" | "lookalikeMargin" | "unknownDrug";
  clarifyOptions?: Array<{ medicineId?: string; name: string }>;
  mandatedPromptRequired: boolean;
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
    return result;
  }

  // --- Layer 2: Fast Salt Check directly on raw tokens (catching direct salt queries) ---
  const normalizedRaw = normalizeSaltName(textToScan);
  for (const [saltKey, info] of Object.entries(BUILTIN_RESTRICTED_SALTS)) {
    if (normalizedRaw.includes(saltKey)) {
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
      return result;
    }
  }

  // --- Layer 3: Candidate Extraction ---
  const mentions = await extractMentions(textToScan, sessionMemory);

  // If no mentions found, run LLM Classifier Net for indirect phrasing ("sleeping pills", etc.)
  if (mentions.length === 0) {
    const classification = await classifySafetyWithLLM(textToScan);
    if (classification.verdict === "RESTRICTED") {
      result.layers.classifier = "RESTRICTED";
      result.verdict = "RESTRICTED";
      result.triggeredBy = "classifier";
      result.mandatedPromptRequired = true;
      return result;
    }
    return result; // NO_DRUG
  }

  // --- Layer 4: Hybrid Resolution & Salt Checking ---
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
      return result;
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
      return result;
    }

    // Otherwise ask for clarification if user definitely typed an unknown medicine
    result.verdict = "NEEDS_CLARIFICATION";
    return result;
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

  // --- Layer 5: Salt Table Check on Resolved Candidates (Final Authority) ---
  const top1SaltCheck = await checkSaltRestriction(top1.salts);
  const top1IsRestricted = top1SaltCheck.restricted || (top1.schedule && top1.schedule !== "OTC");

  // Rule 4a: top1 restricted and score >= TAU_HIGH -> RESTRICTED
  if (top1IsRestricted && top1.score >= DEFAULT_GUARD_CONFIG.TAU_HIGH) {
    result.layers.saltTable = "RESTRICTED";
    result.verdict = "RESTRICTED";
    result.triggeredBy = "saltTable";
    result.mandatedPromptRequired = true;
    return result;
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
      return result;
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
      return result;
    }
  }

  // Rule 4d: Low confidence -> check OTC allowlist before clarification
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
    return result;
  }

  // Rule 4e: If top1 is verified OTC and no restricted salts found -> OTC
  if (top1.schedule === "OTC" || isKnownOtcSalt(top1.name) || top1.salts.some((s) => isKnownOtcSalt(s))) {
    result.verdict = "OTC";
    return result;
  }

  // --- Layer 6: Extra LLM Safety Net (For ambiguous/unclassified candidates) ---
  const classification = await classifySafetyWithLLM(textToScan);
  if (classification.verdict === "RESTRICTED") {
    result.layers.classifier = "RESTRICTED";
    result.verdict = "RESTRICTED";
    result.triggeredBy = "classifier";
    result.mandatedPromptRequired = true;
    return result;
  }

  // Verified OTC
  result.verdict = "OTC";
  return result;
}
