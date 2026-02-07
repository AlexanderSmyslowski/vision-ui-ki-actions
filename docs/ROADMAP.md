# Roadmap

## Iteration 0 (Spec + skeleton)
- Repo structure
- Intent schemas + policies

## Iteration 1 (Photo → Plan)
- Input: single image + optional instruction_text
- Output: analysis + intent proposal + questions + draft plan
- No execution

## Iteration 2 (Photo → Confirm → Execute in Browser)
- Requires attached tab (OpenClaw Browser Relay)
- Execute step-by-step with OK/OK SUBMIT

## Iteration 3 (Video/Live)
- Frame sampling (e.g. 1 fps or event-based)
- Sliding window state (what changed?)
- Same intent/plan/confirm/execute loop

## Iteration 4 (Wearable)
- Replace capture source with Ray-Ban Meta / other wearable
- Keep interpretation + action engine stable
