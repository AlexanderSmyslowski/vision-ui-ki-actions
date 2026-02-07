# Policies (v0)

## 1) Confirmation Policy (Confirm-Gate)
Default: **step-by-step**
- User replies with: `OK 1`, `OK 1-3`, `STOP`

Critical actions require explicit phrase:
- `OK SUBMIT` for actions that finalize transactions or cause irreversible changes:
  - Kaufen/Bestellen/Payment
  - Submit/Save wenn es Daten endgültig speichert
  - Löschen/Cancel/Refund

If uncertainty exists (ambiguous element, multiple matches):
- Ask a clarifying question; do not execute.

## 2) Retention Policy
- Default: discard raw images/frames after analysis.
- Debug mode: retain for a short window (implementation-defined) **only when user requests**.

## 3) Safety / Scope
- Browser is first-class action target.
- No desktop automation in MVP.
- No credential exfiltration: if login needed, ask user to do it or use password manager.

## 4) Auditability
Every run produces a structured log:
- input hashes (not the content)
- chosen intent + slots
- proposed plan
- user confirmations
- executed actions + outcomes
