# Intents (v0)

Diese Intents bilden das Kern-API zwischen **Interpretation (Vision+ASR)** und **Action Engine (OpenClaw)**.

## Gemeinsame Felder
Jeder Intent-Request kann enthalten:
- `image[]`: 0..n Bilder/Frames
- `instruction_text`: optional (ASR/Text vom iPhone-Mikro)
- `context`: optional (z. B. `preferred_store`, `locale`, `currency`, `user_constraints`)

Jeder Intent-Response liefert:
- **Kurz-Analyse** (2–4 Zeilen)
- **Proposed intent** + `slot_fills`
- **Action-Plan (draft)**
- **Questions** (nur fehlende Slots)
- **Confirm mode** (step-by-step / plan)

---

## 1) `world_to_web.ask_then_plan`
**Zweck:** Realwelt-Bild analysieren, sinnvolle Handlungsoptionen vorschlagen und *immer* fragen, was damit getan werden soll (außer klare Anweisung via ASR).

**Slots (Beispiele):**
- `extracted_text` (OCR)
- `entities` (z. B. Seriennummern, Preise)
- `suggested_actions[]` (z. B. „loggen“, „Ticket“, „suche“, „kaufen“)
- `target_system` (optional; z. B. Notion, CRM, Shop)

**Default Questions:**
- „Was soll ich mit dem Inhalt dieses Bildes tun?“
- „In welches Zielsystem/Formular soll ich das übertragen?“

---

## 2) `ui_from_camera.open_and_ask`
**Zweck:** Wenn eine Webseite erkannt wird, Zielseite/Tab am Mac öffnen/attachen und fragen, welches Ziel auf der Seite verfolgt wird.

**Slots:**
- `detected_site` (domain/app)
- `url_guess` (wenn möglich)
- `user_goal` (vom User; erst erfragen)

**Default Questions:**
- „Was soll ich auf dieser Seite tun (z. B. Issue öffnen, Text kopieren, Formular ausfüllen)?"

---

## 3) `buy_item` (Tweet/Demo-North-Star)
**Zweck:** Aus dem gesehenen Objekt + Voice-Instruction einen Kauf im Browser vorbereiten.

**Slots (Minimum):**
- `product_query` (Name/Typ/Attribute)
- `store_preference` (z. B. Amazon, dm, Idealo) *oder* `open_search` = true
- `quantity` (default 1)
- `max_price` (optional)
- `shipping_constraints` (optional)

**Critical actions:**
- `place_order` / `buy_now` / `submit_payment` ⇒ erfordert **OK SUBMIT**

---

## 4) `search_product`
**Zweck:** Produkt/Artikel aus Bild/OCR ableiten und im Browser suchen.

**Slots:**
- `query`
- `store_preference` (optional)

---

## 5) `fill_form_from_ocr`
**Zweck:** OCR/Text aus Realwelt in ein Webformular übertragen.

**Slots:**
- `fields` (key/value)
- `target_form_url` (oder `target_tab`)
- `field_mapping` (optional; wenn nicht vorhanden: Rückfrage)

**Critical actions:**
- `submit` ⇒ **OK SUBMIT**
