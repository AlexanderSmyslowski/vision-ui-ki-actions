# Action DSL (Draft v0)

Ziel: Eine kleine, serialisierbare Aktionssprache, die ein Planner erzeugen kann und die dann durch den OpenClaw-Executor **nur nach Bestätigung** ausgeführt wird.

## Grundprinzip
- Planner erzeugt `Plan` = Liste von `Action`.
- Executor validiert gegen Policies (critical actions → OK SUBMIT) und führt im **Browser** aus.

## Types

### Plan
```json
{
  "intent": "buy_item",
  "summary": "Search and add the item to cart, then stop before checkout",
  "actions": [ { "kind": "navigate", "url": "https://…" } ],
  "critical": false
}
```

### Actions
#### navigate
```json
{ "kind": "navigate", "url": "https://example.com" }
```

#### click
```json
{ "kind": "click", "selector": { "type": "aria", "value": "button[name='Add to cart']" }, "note": "Add item to cart" }
```

#### type
```json
{ "kind": "type", "selector": { "type": "aria", "value": "input[name='Search']" }, "text": "ray-ban case" }
```

#### press
```json
{ "kind": "press", "key": "Enter" }
```

#### wait
```json
{ "kind": "wait", "until": "network-idle", "timeoutMs": 10000 }
```

#### extract (non-destructive)
```json
{ "kind": "extract", "what": "text", "selector": { "type": "css", "value": "h1" } }
```

### Selector
```json
{ "type": "aria"|"css"|"text", "value": "…" }
```

## Criticality
Eine Action oder ein Plan wird als `critical=true` markiert, wenn er einen irreversible/finanziellen Schritt beinhaltet:
- Kaufen/Payment/Order/Checkout
- Submit/Save von echten Daten
- Delete

Executor-Regel: `critical=true` ⇒ erfordert "OK SUBMIT".

## Notes
- In der Praxis verwenden wir bevorzugt **ARIA**-Refs (stabil) und fallen auf CSS/Text zurück.
- Für „UI-from-camera“ wird der reale Tab am Mac geöffnet/attached; das Foto dient nur zur Interpretation.
