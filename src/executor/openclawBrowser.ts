import { execFile } from "node:child_process";

export type ExecResult = { stdout: string; stderr: string; code: number };

export function runOpenclawBrowser(args: string[], opts?: { timeoutMs?: number }): Promise<ExecResult> {
  const timeoutMs = opts?.timeoutMs ?? 60000;
  return new Promise((resolve, reject) => {
    const child = execFile(
      "openclaw",
      ["browser", "--browser-profile", "openclaw", "--json", ...args],
      { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        const code = (err as any)?.code ?? 0;
        if (err && (err as any).killed) {
          reject(new Error(`openclaw browser timed out after ${timeoutMs}ms`));
          return;
        }
        // Some commands print non-JSON status lines; we return raw.
        resolve({ stdout: String(stdout), stderr: String(stderr), code: Number(code) || 0 });
      }
    );
    // ensure process is started
    child.on("error", reject);
  });
}

export function parseLastJsonObject(stdout: string): any {
  // Extract the last *balanced* JSON object from a mixed stdout stream.
  // We do a simple brace-balance scan (good enough for OpenClaw CLI output).
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastJson: string | null = null;

  for (let i = 0; i < stdout.length; i++) {
    const ch = stdout[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}") {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        lastJson = stdout.slice(start, i + 1);
        start = -1;
      }
    }
  }

  if (!lastJson) throw new Error("No JSON object found in output");
  return JSON.parse(lastJson);
}
