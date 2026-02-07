import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";

export async function captureScreenshotPng(): Promise<Buffer> {
  const tmp = path.join(os.tmpdir(), `vision-ui-actions-${Date.now()}.png`);

  await new Promise<void>((resolve, reject) => {
    execFile("/usr/sbin/screencapture", ["-x", "-t", "png", tmp], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const buf = fs.readFileSync(tmp);
  try {
    fs.unlinkSync(tmp);
  } catch {
    // ignore
  }
  return buf;
}
