import { parseLastJsonObject, runOpenclawBrowser } from "./openclawBrowser.js";

export async function openUrl(url: string): Promise<string> {
  // start ensures browser is running
  await runOpenclawBrowser(["start"], { timeoutMs: 60000 });
  const r = await runOpenclawBrowser(["open", url], { timeoutMs: 60000 });
  // open returns JSON-ish but also text; parse id if present
  const idMatch = r.stdout.match(/id:\s*([A-F0-9]+)/i);
  return idMatch?.[1] ?? "";
}

export async function snapshotAi(targetId?: string): Promise<any> {
  const args = ["snapshot", "--format", "ai", "--limit", "800"];
  if (targetId) args.push("--target-id", targetId);
  const r = await runOpenclawBrowser(args, { timeoutMs: 60000 });
  try {
    return parseLastJsonObject(r.stdout);
  } catch (e: any) {
    const head = r.stdout.slice(0, 250);
    const tail = r.stdout.slice(-250);
    throw new Error(`Failed to parse snapshot JSON: ${String(e?.message ?? e)}\nSTDOUT_HEAD:${head}\nSTDOUT_TAIL:${tail}`);
  }
}

export function findRefByText(snapshot: any, text: string, roles = ["link", "button"]): string {
  const needle = text.trim().toLowerCase();
  const refs: Record<string, { role?: string; name?: string }> = snapshot?.refs ?? {};
  const hits: Array<{ ref: string; role?: string; name?: string }> = [];

  for (const [ref, meta] of Object.entries(refs)) {
    const name = (meta?.name ?? "").toString();
    const role = (meta?.role ?? "").toString();
    if (!name) continue;
    if (!roles.includes(role)) continue;
    if (name.toLowerCase().includes(needle)) hits.push({ ref, role, name });
  }

  if (hits.length === 0) throw new Error(`No element found matching text: ${text}`);
  // Prefer exact match
  const exact = hits.find((h) => (h.name ?? "").trim().toLowerCase() === needle);
  return (exact ?? hits[0]).ref;
}

export async function clickRef(ref: string, targetId?: string): Promise<void> {
  const args = ["click", ref];
  if (targetId) args.push("--target-id", targetId);
  await runOpenclawBrowser(args, { timeoutMs: 60000 });
}
