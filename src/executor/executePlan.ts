import type { Action, Plan, Selector } from "../types/actionDsl.js";
import { clickRef, findRefByText, openUrl, snapshotAi } from "./textClick.js";
import { runOpenclawBrowser } from "./openclawBrowser.js";

async function resolveSelectorToRef(sel: Selector, targetId?: string): Promise<string> {
  if (sel.type === "text") {
    const snap = await snapshotAi(targetId);
    return findRefByText(snap, sel.value, ["link", "button", "textbox"]);
  }
  throw new Error(`Selector type not supported in MVP executor: ${sel.type}`);
}

export async function executePlan(plan: Plan): Promise<{ ok: true; targetId?: string } | { ok: false; error: string }> {
  try {
    let targetId: string | undefined;

    for (const a of plan.actions) {
      switch (a.kind) {
        case "navigate": {
          targetId = (await openUrl(a.url)) || targetId;
          break;
        }
        case "click": {
          const ref = await resolveSelectorToRef(a.selector, targetId);
          await clickRef(ref, targetId);
          break;
        }
        case "press": {
          const args = ["press", a.key];
          if (targetId) args.push("--target-id", targetId);
          await runOpenclawBrowser(args);
          break;
        }
        default:
          throw new Error(`Action not supported in MVP executor: ${(a as Action).kind}`);
      }
    }

    return { ok: true, targetId };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}
