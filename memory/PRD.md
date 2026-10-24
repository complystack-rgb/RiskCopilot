# ComplyStack — SME Insurance Discovery Journey (PRD)

## Original problem statement
Build a polished, interactive 7-step SME onboarding journey that helps business owners
discover what they may need to protect, identify potential insurance gaps, and find practical
next steps. The defining principle: help SMEs discover what they may be overlooking — not just
collect information. India-specific fields and INR bands.

## Architecture
- **Frontend-only** (current scope, per user choice): Vite + React 19 + Tailwind v4 + shadcn/ui.
- State: React Context (`JourneyContext`) persisted to `localStorage`. No backend/DB yet.
- File uploads + "AI analysis": **simulated client-side, clearly labelled as demo** (no LLM).
- Backend is the untouched template (`/api/` hello world only).

## User personas
- SME business owner, non-insurance-expert, wants clarity without pressure or jargon.

## Core requirements (static)
- One question group per screen, visible progress stepper, live business summary sidebar.
- Conditional logic, "Why this matters" explainers, "Not sure"/"later" options everywhere.
- Preserve answers on back-navigation; never ask the same question twice; no email gate.
- No points/badges/risk scores. Honest statuses only: Known, Needs verification,
  Potential limitation, Potential gap. Never label a missing answer a confirmed gap.
- Premium light SaaS look: white/light-grey, dark text, blue primary, amber attention.

## Implemented (2026-06, iteration 1) — all verified by testing agent (100% frontend)
- Step 1 Identity: name, 15 category cards, configurable subcategory dropdown, start year +
  Not sure, India/state/city/PIN, address + "do later". Business identity card reward.
- Step 2 Size: headcount, payroll band, revenue band (two lowest bands removed per req),
  optional exact INR. Live snapshot reward.
- Step 3 Priorities: 9 multi-select cards, per-priority conditional follow-ups, "I'm not sure"
  branch with 2 guidance questions. Preliminary priorities summary reward.
- Step 4 Premises: ownership, location type, add-more-locations, category-specific follow-up,
  optional operational details with Yes/No/Not sure for safety. Premises summary reward.
- Step 5 Insurance: has-insurance, 13 cover types multi-select, Option A upload (simulated
  preliminary read) + Option B manual entry, claims history, ownership structure/owner count.
  Existing protection summary (provided / documents / needs verification).
- Step 6 Evidence: optional premises media, machinery photos + asset details, policy docs.
- Step 7 Summary: business at a glance, status-badged considerations from actual answers,
  prioritised next action, edit buttons, JSON download, print/PDF.
- Shared: progress stepper + step tabs, live summary sidebar, Why-this-matters accordions.

## Backlog / remaining (prioritised)
- P1: Connect MongoDB backend to persist journeys server-side (user said "connect DB later").
- P1: Real policy PDF analysis via an LLM integration (replace simulated read).
- P2: Emergent Object Storage for real file uploads; PDF export of the summary (vs JSON/print).
- P2: Auth so each owner has saved journeys; shareable summary link.

## Next tasks
- Await user review of the journey, then wire DB persistence and/or real analysis.
