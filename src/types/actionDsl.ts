export type Selector =
  | { type: "aria"; value: string }
  | { type: "css"; value: string }
  | { type: "text"; value: string };

export type Action =
  | { kind: "navigate"; url: string; note?: string; critical?: boolean }
  | { kind: "click"; selector: Selector; note?: string; critical?: boolean }
  | { kind: "type"; selector: Selector; text: string; note?: string; critical?: boolean }
  | { kind: "press"; key: string; note?: string; critical?: boolean }
  | {
      kind: "wait";
      until: "network-idle" | "selector";
      selector?: Selector;
      timeoutMs?: number;
      note?: string;
      critical?: boolean;
    }
  | { kind: "extract"; what: "text"; selector: Selector; note?: string; critical?: boolean };

export type Plan = {
  intent: string;
  summary: string;
  actions: Action[];
  critical?: boolean;
};
