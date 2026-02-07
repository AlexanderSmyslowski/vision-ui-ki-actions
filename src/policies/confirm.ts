import type { Action, Plan } from "../types/actionDsl.js";

export type ConfirmDecision =
  | { ok: true; requires: "OK" }
  | { ok: true; requires: "OK_SUBMIT" }
  | { ok: false; reason: string };

export function isCriticalAction(a: Action): boolean {
  return Boolean((a as any).critical);
}

export function isCriticalPlan(plan: Plan): boolean {
  return Boolean(plan.critical) || plan.actions.some(isCriticalAction);
}

export function requiredConfirmationForPlan(plan: Plan): "OK" | "OK_SUBMIT" {
  return isCriticalPlan(plan) ? "OK_SUBMIT" : "OK";
}

export function validateUserConfirmation(input: string, required: "OK" | "OK_SUBMIT"): ConfirmDecision {
  const normalized = input.trim().toUpperCase();
  if (required === "OK_SUBMIT") {
    if (normalized === "OK SUBMIT" || normalized === "OK_SUBMIT") return { ok: true, requires: "OK_SUBMIT" };
    return { ok: false, reason: "Critical action requires explicit OK SUBMIT" };
  }
  if (normalized === "OK" || normalized.startsWith("OK ")) return { ok: true, requires: "OK" };
  return { ok: false, reason: "Confirmation required" };
}
