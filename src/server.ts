import express from "express";
import multer from "multer";
import { z } from "zod";
import { planFromInput } from "./planner/heuristicPlanner.js";
import { captureScreenshotPng } from "./capture/screenshot.js";
import { clickRef, findRefByText, openUrl, snapshotAi } from "./executor/textClick.js";
import { executePlan } from "./executor/executePlan.js";
import { requiredConfirmationForPlan, validateUserConfirmation } from "./policies/confirm.js";
import type { Plan } from "./types/actionDsl.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Vision UI → Actions</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; max-width: 900px; }
      textarea { width: 100%; height: 80px; }
      pre { background: #f5f5f5; padding: 12px; overflow: auto; }
      .row { display: flex; gap: 12px; align-items: center; }
    </style>
  </head>
  <body>
    <h1>Vision UI → Actions (MVP)</h1>
    <p>Upload a photo/frame + optional instruction text. You’ll get: short analysis → proposal → questions → draft plan.</p>

    <div class="row" style="margin-bottom: 12px;">
      <button id="btnDemoIssues" type="button">Demo: Open GitHub Repo → Issues</button>
      <button id="btnDemoAmazon" type="button">Demo: Amazon.de Search “iPhone 15 case”</button>
    </div>

    <form id="f">
      <div class="row">
        <input id="file" type="file" name="image" accept="image/*" required />
        <button type="submit">Plan (Upload)</button>
        <button id="btnShot" type="button">Plan (Screenshot)</button>
        <button id="btnCam" type="button">Plan (Webcam Frame)</button>
      </div>
      <p><label>Instruction (optional):</label></p>
      <textarea name="instruction_text" placeholder="e.g. 'Buy this' or 'Open https://… and show issues'"></textarea>
    </form>

    <h2>Result</h2>
    <pre id="out">—</pre>

    <div class="row" style="margin-top: 12px;">
      <input id="confirm" placeholder="Type OK or OK SUBMIT" style="flex: 1; padding: 6px;" />
      <button id="btnExecute" type="button">Execute last plan</button>
    </div>

    <script>
      const form = document.getElementById('f');
      const out = document.getElementById('out');
      let lastResponse = null;

      async function showResult(r) {
        const j = await r.json();
        lastResponse = j;
        out.textContent = JSON.stringify(j, null, 2);
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        out.textContent = 'Working…';
        const fd = new FormData(form);
        const r = await fetch('/api/plan', { method: 'POST', body: fd });
        await showResult(r);
      });

      document.getElementById('btnShot').addEventListener('click', async () => {
        out.textContent = 'Capturing screenshot…';
        const instruction_text = form.querySelector('textarea[name=instruction_text]').value;
        const r = await fetch('/api/plan/screenshot', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ instruction_text })
        });
        await showResult(r);
      });

      document.getElementById('btnCam').addEventListener('click', async () => {
        out.textContent = 'Capturing webcam frame…';
        const instruction_text = form.querySelector('textarea[name=instruction_text]').value;

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);

        track.stop();

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        const fd = new FormData();
        fd.append('image', blob, 'webcam.png');
        fd.append('instruction_text', instruction_text);

        const r = await fetch('/api/plan', { method: 'POST', body: fd });
        await showResult(r);
      });

      document.getElementById('btnDemoIssues').addEventListener('click', async () => {
        out.textContent = 'Running demo (open repo → click Issues)…';
        const r = await fetch('/api/demo/github-issues', { method: 'POST' });
        await showResult(r);
      });

      document.getElementById('btnDemoAmazon').addEventListener('click', async () => {
        out.textContent = 'Running demo (Amazon search)…';
        const r = await fetch('/api/demo/amazon-search', { method: 'POST' });
        await showResult(r);
      });

      document.getElementById('btnExecute').addEventListener('click', async () => {
        out.textContent = 'Executing…';
        const confirmation = document.getElementById('confirm').value;
        const r = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ response: lastResponse, confirmation })
        });
        await showResult(r);
      });
    </script>
  </body>
</html>`);
});

const PlanReqSchema = z.object({ instruction_text: z.string().optional() });

app.post("/api/plan", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "image is required" });
  const { instruction_text } = PlanReqSchema.parse(req.body);

  const imageMeta = {
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
  };

  const response = planFromInput({ instruction_text, imageMeta });
  res.json(response);
});

app.post("/api/plan/screenshot", async (req, res) => {
  const { instruction_text } = PlanReqSchema.parse(req.body ?? {});
  try {
    const buf = await captureScreenshotPng();
    const response = planFromInput({
      instruction_text,
      imageMeta: { mimeType: "image/png", sizeBytes: buf.byteLength },
    });
    res.json({ ...response, capture: "screenshot" });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

app.post("/api/demo/github-issues", async (_req, res) => {
  // Demonstrates: agentic action (open URL → snapshot → click by text)
  // Non-critical demo: no login, no submit.
  const url = "https://github.com/AlexanderSmyslowski/vision-ui-ki-actions";
  try {
    const targetId = await openUrl(url);
    const snap = await snapshotAi(targetId || undefined);
    const ref = findRefByText(snap, "Issues", ["link", "button"]);
    await clickRef(ref, targetId || undefined);
    res.json({ ok: true, demo: "github-issues", url, clicked: { text: "Issues", ref }, targetId });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

app.post("/api/demo/amazon-search", async (_req, res) => {
  // Non-critical demo: open Amazon.de and search; no purchase.
  const url = "https://www.amazon.de";
  const query = "iPhone 15 case";

  try {
    const targetId = await openUrl(url);

    // Best-effort cookie consent (DE/EN variants). Ignore failures.
    try {
      const snap = await snapshotAi(targetId || undefined);
      const ref =
        (() => {
          try {
            return findRefByText(snap, "Alle akzeptieren", ["button", "link"]);
          } catch {
            return findRefByText(snap, "Accept", ["button", "link"]);
          }
        })();
      await clickRef(ref, targetId || undefined);
    } catch {
      // ignore
    }

    const { runOpenclawBrowser } = await import("./executor/openclawBrowser.js");

    // Focus search box (prefer CSS selector; more stable than text)
    // Amazon search input id is usually: #twotabsearchtextbox
    await runOpenclawBrowser([
      "wait",
      "#twotabsearchtextbox",
      ...(targetId ? (["--target-id", targetId] as string[]) : []),
      "--timeout-ms",
      "20000",
    ]);

    // Click search box by ref from snapshot (text-based fallback)
    let searchRef: string | null = null;
    try {
      const snap2 = await snapshotAi(targetId || undefined);
      searchRef = findRefByText(snap2, "Amazon.de durchsuchen", ["textbox", "combobox", "searchbox", "button"]);
    } catch {
      // ignore
    }

    if (searchRef) {
      await clickRef(searchRef, targetId || undefined);
      const args = ["type", searchRef, query];
      if (targetId) args.push("--target-id", targetId);
      await runOpenclawBrowser(args, { timeoutMs: 60000 });
    } else {
      // Direct CSS evaluate fallback: focus + type via browser evaluate
      const evalFn = `({}) => {
        const el = document.querySelector('#twotabsearchtextbox');
        if (!el) return { ok:false, error:'no search box' };
        el.focus();
        el.value = ${JSON.stringify(query)};
        el.dispatchEvent(new Event('input', { bubbles:true }));
        return { ok:true };
      }`;
      const args = ["evaluate", "--fn", evalFn];
      if (targetId) args.push("--target-id", targetId);
      await runOpenclawBrowser(args, { timeoutMs: 60000 });
    }

    // Press Enter
    const args2 = ["press", "Enter"];
    if (targetId) args2.push("--target-id", targetId);
    await runOpenclawBrowser(args2, { timeoutMs: 60000 });

    // Wait for results URL change (best-effort)
    const waitArgs = ["wait", "--load", "networkidle", "--timeout-ms", "20000"];
    if (targetId) waitArgs.push("--target-id", targetId);
    await runOpenclawBrowser(waitArgs, { timeoutMs: 60000 });

    res.json({ ok: true, demo: "amazon-search", url, query, targetId });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: String(e?.message ?? e) });
  }
});

app.post("/api/execute", async (req, res) => {
  // Execute the machine plan embedded in the last response, guarded by confirm policy.
  const bodySchema = z.object({ response: z.any(), confirmation: z.string().default("") });
  const { response, confirmation } = bodySchema.parse(req.body ?? {});

  const plan: Plan | undefined = response?.plan;
  if (!plan) return res.status(400).json({ ok: false, error: "No plan present in response. Create a plan first." });

  const required = requiredConfirmationForPlan(plan);
  const decision = validateUserConfirmation(confirmation, required);
  if (!decision.ok) return res.status(400).json({ ok: false, error: decision.reason, required });

  const execRes = await executePlan(plan);
  if (!execRes.ok) return res.status(500).json(execRes);

  res.json({ ok: true, executed: plan.summary, targetId: execRes.targetId });
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`vision-ui-ki-actions listening on http://localhost:${port}`);
});
