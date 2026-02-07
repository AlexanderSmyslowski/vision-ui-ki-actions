# Vision UI → Agentic Actions (OpenClaw)

Produktziel: **Vision + Voice** (iPhone/Webcam) → **Intent + Plan** → **Bestätigung** → **OpenClaw Browser Actions**.

Dieses Repo ist als auslieferbare Software/App gedacht (MVP zuerst), inspiriert vom Sean Liu Demo („buy whatever I'm looking at“).

## MVP-Prinzipien
- **Analyse zuerst, dann handeln** (immer mit kurzer Bildanalyse)
- **Confirm-Gate**: Keine Action ohne explizite Bestätigung
- **Retention**: Rohbilder/Frames nach Analyse löschen (Debug opt-in)
- **Browser als erster Action-Träger** (stabil via DOM/ARIA)

## Module
- `src/intents/` – Intent-Definitionen (Schema + Slots + Kritikalität)
- `src/policies/` – Bestätigung, Risiko, Retention
- `docs/` – Spezifikation, Roadmap

## Quickstart (später)
- TBD
