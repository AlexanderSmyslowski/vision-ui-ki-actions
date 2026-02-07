import type { Action, Plan, Selector } from "../types/actionDsl.js";
import { clickRef, findRefByText, openUrl, snapshotAi } from "./textClick.js";
import { runOpenclawBrowser } from "./openclawBrowser.js";

async function resolveSelectorToRef(sel: Selector, targetId?: string, roles?: string[]): Promise<string> {
  if (sel.type === "text") {
    const snap = await snapshotAi(targetId);
    return findRefByText(snap, sel.value, roles ?? ["link", "button", "textbox"]);
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
        case "wait": {
          const args = ["wait"];
          if (a.until === "network-idle") {
            args.push("--load", "networkidle");
          } else if (a.until === "selector") {
            if (!a.selector) throw new Error("wait.until=selector requires selector");
            if (a.selector.type !== "css") throw new Error("wait selector currently supports css only");
            args.push(a.selector.value);
          }
          if (a.timeoutMs) args.push("--timeout-ms", String(a.timeoutMs));
          if (targetId) args.push("--target-id", targetId);
          await runOpenclawBrowser(args);
          break;
        }
        case "click": {
          const ref = await resolveSelectorToRef(a.selector, targetId);
          await clickRef(ref, targetId);
          break;
        }
        case "type": {
          const ref = await resolveSelectorToRef(a.selector, targetId, ["textbox", "combobox", "searchbox"]);
          const args = ["type", ref, a.text];
          if (targetId) args.push("--target-id", targetId);
          // allow submit via plan action by adding a press Enter step explicitly (more auditable)
          await runOpenclawBrowser(args, { timeoutMs: 60000 });
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
