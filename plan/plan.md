# ComplyStack: SME Protection Journey and Broker Intelligence Platform

A white-label insurance platform. SMEs complete a short guided journey and see their protection needs; brokers get a polished console with portfolio analytics, a location and climate view, and a full report on each case.
In this demo it is branded for a placeholder insurer, "ABC Insure". The insurer's systems get each case's data through a developer portal (APIs).

## Who it's for
- **SME owners** who want cover but don't know what they need.
- **Brokers and distributor teams** (admins and field agents) who prepare for site visits and propose cover.
- **Insurer IT and underwriting teams**, who only use the APIs. There are no underwriter screens.

## Core features and experience

**Branding (applies everywhere)**
- Every Zurich name and logo is removed. A generated "ABC Insure" logo and name replace them.
- The new ComplyStack logo you attached is used as the "Powered by ComplyStack" mark.
- "Zurich Underwriting" becomes "ABC Insure Admin Hub".

**SME landing page**
- A simple, professional insurer homepage with no photos: ABC Insure header, hero text, a "Get a quote online" button, cover categories shown as icon cards, trust points and a footer.

**SME journey (rewritten as one forward flow)**
- Each step moves forward only. At the end the SME sees results, not the filled form.
- All copy is rewritten in a professional tone:
  - no "Why this matters" boxes
  - no AI wording or image explanations
  - no "Start over", "Edit business info", "Review insurance" or "What to do next"
  - no "Live business summary" sidebar
  - proper capitalisation (for example "IT services")
  - no dashes used as punctuation
- **Business address step:**
  - address search with suggestions
  - a draggable map pin that sets the exact latitude and longitude
- **Loading screen:** "Analysing your business and finding the best insurance cover for your needs and growth plans", with plain progress lines that don't mention any engine or insurer brand.
- **Final step ("Your Protection Report"), in this order:**
  1. A header with Download summary and Submit for review.
  2. Recommended ABC Insure cover, shown as cards, two per row.
  3. Exposure profile.
  4. Clear insight panels that show what the business may not know, for example uninsured value, how similar businesses are covered and common claim causes in its sector.
  5. Social proof (ratings, testimonials, number of similar businesses protected), labelled as sample content.
- "Underwriting analysis", "Your business at a glance" and "What may need a closer look" are removed.
- **Submit for review** opens a short form for email and phone. It creates the case for the broker and shows a confirmation with a reference number.

**Partner console (broker-facing)**
- **Header:** ABC Insure logo, Powered by ComplyStack, a geography switcher (India in INR, Malaysia in MYR, Indonesia in IDR) and a user switcher limited to brokers in the selected market. There is no Reset demo button.
- **Sidebar:** Overview, Cases, Team, Developer portal. The product lines list, Cyber check and the demo disclaimer are removed.
- **Overview dashboard (analytics first, all in local currency):**
  - Headline numbers: active assessments, protection gap identified, gap closed through proposals, pipeline premium, premium bound, win rate, average days to proposal, SLAs at risk, and the share of clients who are underinsured or uninsured.
  - Six-month trend of assessments and bound business.
  - Protection gap by cover category, identified compared with closed.
  - Risk mix, pipeline stages with their value, and industry mix.
  - "Needs attention" list: insurer asked for more information, SLA about to breach, new leads not yet contacted, quotes waiting to be bound.
  - Written portfolio insights, for example "7 of 11 manufacturing clients have no business interruption cover".
  - Team leaderboard.
- **Cases:** a pipeline table with filters for status, risk, cover category and search. Stages:
  - New
  - Contacted
  - Visit scheduled
  - Visited
  - Proposal submitted
  - Information requested
  - Quoted
  - Bound
  - Lost
- **Case report tabs:**
  - **Summary:** risk score, protection gaps with values, findings and a site-visit checklist.
  - **Location intelligence:**
    - street and satellite maps with the exact pin and coordinates
    - a bird's-eye surroundings brief built from real open map data within about 2 km: nearest fire station and hospital with distances, rivers and water bodies, highways and rail, neighbouring industrial sites and fuel stations
    - elevation
  - **Climate impact:** real history for the coordinates (rainfall by month, heat days, wind extremes, wettest season). It is turned into plain impacts on the business, such as flood season, stock damp risk and heat load on machinery, and linked to the relevant cover.
  - **Evidence:**
    - unique photos per case with highlighted areas
    - details read from machine plates
    - video walkthrough stills with timestamps
  - **Assets:** a machinery register and asset values.
  - **Coverage:** current cover compared with what was observed, and the gap by category.
  - **Proposal:** suggested products with indicative premium ranges, and the broker's own selection with a written reason. Before submitting, the broker sees advisory checks (essential cover left out, a product with no supporting evidence, a reason too short to review).
  - **Activity:** audit trail and notes.
  - The API payload tab is removed from cases.
- **Team:** agents, their caseloads, add a user, and switch access on or off.
- **Developer portal** (new, below Team):
  - **API documentation:** endpoints, authentication and sample requests and responses for fetching a lead by its ID, listing leads by distributor or agent, and sending the insurer's decision (approve, request information, decline).
  - **Lead lookup:** search a lead ID and see its full JSON.
  - A "send test decision" action that shows how an insurer decision appears on the broker's case.

## User flow
1. The SME lands on the ABC Insure page and clicks "Get a quote online".
2. They answer the journey steps in order, including the address with a map pin.
3. A loading screen appears, followed by the Protection Report.
4. They click Submit for review and enter email and phone. A reference number is shown.
5. The case appears in the broker console for the right market and agent.
6. The broker reads the report, location and climate views, then logs contact, the visit and the proposal.
7. The insurer's decision arrives through the API and the case updates to Quoted or Information requested. The broker then marks it Bound or Lost.

## UI/UX feel
- A credible, polished fintech look aimed at everyday broker use: dense but calm data, a strong hierarchy, navy and white with sharp accent colours, clear charts and consistent currency formatting by market.
- The SME side looks like a trustworthy insurer website: clean, reassuring and free of jargon.
- The design suits recording a smooth demo video from start to finish.

## Implementation phases
- **Phase 1 (MVP, built now):** everything above, with 18 detailed demo cases (6 per market, each with its own photos and video stills) plus historical cases so the trends look real. The location and climate views use live data for each case's coordinates.
- **Phase 2:** real login per broker organisation and access rules, real photo, video and PDF uploads with automatic reading, and email or SMS alerts to agents.
- **Phase 3:** live connection to insurer systems, more markets and cover lines set up without code changes, and a cyber website check module.

## Assumptions
- "ABC Insure" is used as the insurer name, with a newly generated logo. The ComplyStack logo is the image you attached.
- The third market is Indonesia (IDR). The Malaysia and Indonesia product names are illustrative local equivalents.
- Evidence findings, machine plate readings, premiums, testimonials and portfolio history are illustrative demo data. Map surroundings and climate history are real.
- The map uses free open map data and satellite imagery, with no Google account.
- The Cyber check page is removed from the console as requested, though the earlier work is kept for later use.
- The SME journey keeps its current questions, reworded and reordered as one forward flow, with the address map added.
- The SME results page stays in INR and India context. The SME journey is India only for this demo.
- There is no login yet. A user switcher stands in for broker accounts.
