export type ConfirmMode = "step" | "plan";

export type IntentName =
  | "world_to_web.ask_then_plan"
  | "ui_from_camera.open_and_ask"
  | "buy_item"
  | "search_product"
  | "fill_form_from_ocr";

export type IntentRequest = {
  intent?: IntentName; // optional: model may propose
  instruction_text?: string;
  images?: Array<{ mimeType: string; dataBase64: string }>; // keep transport generic
  context?: Record<string, unknown>;
};

export type Question = {
  id: string;
  text: string;
  required?: boolean;
  choices?: string[];
};

export type ProposedAction = {
  id: string;
  title: string;
  critical?: boolean;
};

export type IntentResponse = {
  analysis_short: string;
  proposed_intent: IntentName;
  slot_fills: Record<string, unknown>;
  suggested_options?: ProposedAction[];
  questions?: Question[];
  draft_plan?: {
    summary: string;
    confirmMode: ConfirmMode;
    steps: Array<{ n: number; text: string; critical?: boolean }>;
  };
};
