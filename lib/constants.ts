/**
 * MediBot Core Constants
 * Hard requirements from DESIGN.md - single source of truth.
 */

// Mandated prescription warning - MUST BE OUTPUT VERBATIM, character for character
export const MANDATED_PRESCRIPTION_PROMPT =
  "This medication requires a valid prescription. Please consult your doctor.";

// Mandatory disclaimer - injected by code into medical responses and disclaimer gate
export const MANDATORY_DISCLAIMER =
  "MediBot is an informational tool. It does not diagnose medical conditions or prescribe medications. " +
  "Users must always consult a qualified medical professional before taking any medication.";

// Substitution advisory required on all generic alternative recommendations
export const SUBSTITUTION_ADVISORY =
  "Active composition is verifiably identical. Please confirm any substitution with a doctor or pharmacist.";

// Disclaimer version tracking
export const DISCLAIMER_VERSION = "v1";

// Prescription Guard default thresholds (tunable via env/eval)
export const DEFAULT_GUARD_CONFIG = {
  TAU_HIGH: parseFloat(process.env.GUARD_TAU_HIGH || "0.82"),
  TAU_LOW: parseFloat(process.env.GUARD_TAU_LOW || "0.55"),
  MARGIN: parseFloat(process.env.GUARD_MARGIN || "0.06"),
};

// Supported drug schedules
export const SCHEDULE_LEVELS = {
  NDPS: { level: 4, name: "Narcotic Drugs and Psychotropic Substances", restricted: true },
  X: { level: 3, name: "Schedule X", restricted: true },
  H1: { level: 2, name: "Schedule H1", restricted: true },
  H: { level: 1, name: "Schedule H", restricted: true },
  OTC: { level: 0, name: "Over The Counter", restricted: false },
  UNKNOWN: { level: -1, name: "Unknown Schedule", restricted: false },
} as const;

export type DrugSchedule = keyof typeof SCHEDULE_LEVELS;
