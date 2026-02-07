import fs from "node:fs";
import path from "node:path";
import { planFromInput } from "./planner/heuristicPlanner.js";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

const imagePath = getArg("image");
const instruction_text = getArg("text");

if (!imagePath) {
  console.error("Usage: npm run cli -- --image <path> [--text <instruction>]");
  process.exit(1);
}

const buf = fs.readFileSync(imagePath);
const ext = path.extname(imagePath).toLowerCase();
const mimeType = ext === ".png" ? "image/png" : "image/jpeg";

const resp = planFromInput({
  instruction_text,
  imageMeta: { mimeType, sizeBytes: buf.byteLength },
});

console.log(JSON.stringify(resp, null, 2));
