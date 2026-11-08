# ComplyStack: SME Protection Journey and Broker Intelligence Platform

## Problem statement (summary)
A white-label insurance platform (demo brand "ABC Insure", Powered by ComplyStack). SMEs complete a short guided journey and get a Protection Report. Brokers and distributors get an analytics-first console with full case reports. Insurer IT and underwriting use the APIs only, so there are no underwriter screens.

## Architecture
- Backend FastAPI + MongoDB: `server.py` (routes), `markets.py` (IN/MY/ID config, catalogs, 18 hero cases, image URLs), `engine.py` (exposure, gaps, recommendations, evidence, timelines, advisory checks), `seed.py` (orgs, agents, 18 hero and 48 historical cases), `geo.py` (live Nominatim search, Overpass surroundings, Open-Meteo climate and elevation, cached in `geo_cache`), `cyber_scan.py` (kept for phase 3, no route), `prewarm.py` (warms the geo cache).
- Frontend React: `/` Landing, `/quote` forward-only journey (7 steps including StepAddress with Leaflet map pin) followed by the Protection Report, `/console` (Overview, Cases, CaseDetail with 8 tabs, Team admin-only, DeveloperPortal).
- Partner API: `GET /api/v1/leads/{lead_id}`, `GET /api/v1/leads?market=&distributor_id=&agent_id=`, `POST /api/v1/leads/{lead_id}/decision` with header `X-API-Key` (env `CS_PARTNER_API_KEY`). Sandbox: `/api/developer/leads/...`.

## Implemented (2026-11)
- ABC Insure branding everywhere. There are no Zurich names in the UI.
- Geography switcher with INR, MYR and IDR formatting. The user switcher is scoped by market.
- Overview: 10 KPIs, needs attention, 6-month trend, insights, gap by category, risk mix, pipeline, industry mix, leaderboard.
- Case report: Summary, live Location intelligence (street and satellite), live Climate impact, Evidence (54 AI-generated photos with plate fields and video stills), Assets, Coverage, Proposal (with live advisory checks), Activity.
- Broker workflow: new → contacted → visit_scheduled → visited → proposal_submitted → (insurer decision via API) quoted, info_requested or lost → bound or lost.
- SME journey runs forward only, with address search and map pin, a loading screen, the Protection Report, and submit for review (email and phone) that creates the case.
- Mobile bottom nav in the console.
- Tested in iteration 5: backend 18/18, frontend flows passing. Fixes were applied for the sandbox toast, the Team guard, mobile layout and product copy.

## Market-specific SME journey (2026-11, iteration 6)
- URLs: `/in`, `/my`, `/id` (landing with IN/MY/ID switch) and `/{market}/quote`. `/` → `/in`, `/quote` → `/in/quote`. A market tag shows in the journey header.
- Step 1 2x2 grid, all required, no format checks. IN: Business Name, PAN (Corporate), GSTIN (Corporate), Udyam Registration Number. MY: SSM Registration Number, TIN, SST Registration Number. ID: NIB, NPWP (Corporate), PKP Confirmation Number.
- Config lives in `frontend/src/data/markets.js`: local revenue and payroll bands, address labels, map centre, and currency formatting for the report.
- The backend stores `sme.registration`, routes the case to that market's org and agents, and uses per-market lead prefixes. Opening a case in the console switches the console to that case's market.
- Copy cleanup across Steps 1 to 6: Title Case labels, no dashes, no filler text.

## Roles (2026-11)
- Field agent: own cases. Broker admin: own org cases and Team. Insurer underwriter (one per market, org ins-in/ins-my/ins-id): all cases in market, Team for any broker org, and the only role with the Developer Portal. Gating is UI only (no real login yet).

## Map intelligence reliability (2026-11)
- The public Overpass mirrors are often unreachable or slow from the server, so most cases showed "Map data unavailable".
- Now Overpass is tried for 10 seconds per mirror, then the app falls back to Nominatim searches (fire station, hospital, fuel, river, canal, rail, industrial, highway), sent one per second.
- Results are cached in `geo_cache`. Every case is pre-fetched in the background on startup, after a demo reset and after each new SME submission. The tabs also have a Try Again button.

## Illustrative vs live
- ILLUSTRATIVE: evidence findings, plate readings, premiums, testimonials, portfolio history, peer stats.
- LIVE: address search, map surroundings (Overpass via the maps.mail.ru mirror), climate history, elevation.

## Backlog
- P1: real login per broker org with access rules; real photo, video and PDF uploads with automatic reading; email or SMS alerts to agents.
- P1: SME journey for Malaysia and Indonesia (currently India only).
- P2: webhooks to insurer systems, cover lines configured without code changes, cyber website check module, case and agent delete endpoints, market validation on stats.
