# Update-Workflow (für Chef)

## Schnellstart (empfohlen)
1) Doppelklick auf:
- `scripts/mac/update_and_start.command`

Das macht automatisch:
- `git pull --ff-only`
- (falls nötig) `npm install`
- startet die App `mac/Vision UI Actions.app`

## Wenn es fehlschlägt
### A) "git pull" bricht ab wegen lokaler Änderungen
- Terminal zeigt dann geänderte Dateien an.
- Dann bitte kurz Bescheid sagen (wir entscheiden: commit, stash oder verwerfen).

### B) App startet, aber Browser öffnet nicht
- Manuell öffnen: `http://localhost:8787`

## Minimal-Kommandos (falls manuell)
```bash
cd ~/Projects/vision-ui-ki-actions
git pull --ff-only
open "mac/Vision UI Actions.app"
```
