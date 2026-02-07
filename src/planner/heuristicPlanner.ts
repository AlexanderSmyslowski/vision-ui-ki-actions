import { z } from "zod";
import type { Plan } from "../types/actionDsl.js";
import type { IntentResponse } from "../types/intents.js";

const InstructionSchema = z.object({ instruction_text: z.string().optional() });

export function planFromInput(params: {
  instruction_text?: string;
  imageMeta: { mimeType: string; sizeBytes: number; width?: number; height?: number };
}): IntentResponse {
  const { instruction_text } = InstructionSchema.parse({ instruction_text: params.instruction_text });
  const { imageMeta } = params;

  // Minimal “feels live” planner: detect if instruction contains an URL or a buying intent.
  const text = (instruction_text ?? "").trim();
  const urlMatch = text.match(/https?:\/\/\S+/i);
  const wantsBuy = /kauf|buy|bestell|order|checkout|add to cart/i.test(text);
  const wantsIssues = /\bissues\b|\bissue\b|tickets?/i.test(text);

  let proposed_intent: IntentResponse["proposed_intent"] = "world_to_web.ask_then_plan";
  const questions: IntentResponse["questions"] = [];

  if (urlMatch) proposed_intent = "ui_from_camera.open_and_ask";
  if (wantsBuy) proposed_intent = "buy_item";

  const analysis_short = [
    `Input: 1 image (${imageMeta.mimeType}, ~${Math.round(imageMeta.sizeBytes / 1024)} KB).`,
    text ? `Instruction: “${text}”.` : "No instruction text provided.",
  ].join(" ");

  const suggested_options = [
    { id: "opt-log", title: "Werte/Text aus dem Bild in ein Web-Formular übertragen", critical: false },
    { id: "opt-search", title: "Produkt/Begriff erkennen und im Browser suchen", critical: false },
    { id: "opt-buy", title: "Kauf vorbereiten (Suche → Warenkorb), vor Checkout stoppen", critical: true },
  ];

  // Draft plan is intentionally safe: never includes payment/submit; that would be critical.
  const draft_plan: IntentResponse["draft_plan"] = {
    summary: urlMatch
      ? wantsIssues
        ? `Open ${urlMatch[0]} and open Issues.`
        : `Open the page ${urlMatch[0]} and ask for the goal.`
      : wantsBuy
        ? "Search the described item and add to cart; stop before checkout."
        : "Analyze and propose next steps; ask what to do with the content.",
    confirmMode: "step",
    steps: urlMatch
      ? [
          { n: 1, text: `Open URL: ${urlMatch[0]}` },
          ...(wantsIssues ? [{ n: 2, text: "Click: Issues" }] : [{ n: 2, text: "Ask: What do you want to do on this page?" }]),
        ]
      : [
          { n: 1, text: "Extract key information (text/numbers) from the image (or ask for clarification)." },
          { n: 2, text: "Ask: What should I do with the content of this image?" },
          wantsBuy ? { n: 3, text: "Prepare a shopping plan (search → product → add to cart).", critical: false } : undefined,
        ].filter(Boolean) as any,
  };

  // Always ask unless instruction is fully explicit.
  if (!text) {
    questions.push({ id: "q1", text: "Was soll ich mit dem Inhalt dieses Bildes tun?", required: true });
    questions.push({ id: "q2", text: "In welchem Zielsystem (Website/Formular) soll ich arbeiten?", required: false });
  } else if (!urlMatch && !wantsBuy) {
    questions.push({ id: "q1", text: "Soll ich die Information aus dem Bild irgendwo eintragen/ablegen – wenn ja, wo?", required: true });
  }

  const slot_fills: IntentResponse["slot_fills"] = {
    imageMeta,
    url: urlMatch?.[0],
    wantsBuy,
  };

  const plan: Plan | undefined = urlMatch
    ? {
        intent: proposed_intent,
        summary: wantsIssues ? `Navigate to ${urlMatch[0]} and open Issues` : `Navigate to ${urlMatch[0]}`,
        actions: [
          { kind: "navigate", url: urlMatch[0], note: "Open target page" },
          ...(wantsIssues
            ? ([{ kind: "click", selector: { type: "text", value: "Issues" }, note: "Open Issues" }] as any)
            : []),
        ],
      }
    : undefined;

  return {
    analysis_short,
    proposed_intent,
    slot_fills,
    suggested_options,
    questions,
    draft_plan,
    // embed machine plan for later executor usage (non-spec field tolerated by TS via intersection in runtime)
    ...(plan ? ({ plan } as any) : {}),
  };
}
