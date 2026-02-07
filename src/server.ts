import express from "express";
import multer from "multer";
import { z } from "zod";
import { planFromInput } from "./planner/heuristicPlanner.js";

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

    <form id="f">
      <div class="row">
        <input type="file" name="image" accept="image/*" required />
        <button type="submit">Plan</button>
      </div>
      <p><label>Instruction (optional):</label></p>
      <textarea name="instruction_text" placeholder="e.g. 'Buy this' or 'Open https://… and show issues'"></textarea>
    </form>

    <h2>Result</h2>
    <pre id="out">—</pre>

    <script>
      const form = document.getElementById('f');
      const out = document.getElementById('out');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        out.textContent = 'Working…';
        const fd = new FormData(form);
        const r = await fetch('/api/plan', { method: 'POST', body: fd });
        const j = await r.json();
        out.textContent = JSON.stringify(j, null, 2);
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

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`vision-ui-ki-actions listening on http://localhost:${port}`);
});
