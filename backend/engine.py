"""Builds market-aware demo cases: exposure, gaps, recommendations and evidence."""
import random
import uuid
from datetime import datetime, timezone, timedelta
from markets import MARKETS, IMAGES, CATEGORIES

COORDS = {"in1": (21.0870, 72.8820), "in2": (22.7680, 75.8480), "in3": (18.6290, 73.8480), "in4": (30.9578, 76.7914), "in5": (11.1300, 77.3200), "in6": (19.2813, 73.0483),
          "my1": (5.2970, 100.2690), "my2": (3.0560, 101.5420), "my3": (1.4700, 103.9000), "my4": (2.9590, 101.3260), "my5": (2.2050, 102.2470), "my6": (3.1000, 101.6800),
          "id1": (-6.9400, 107.5700), "id2": (-6.6300, 110.7000), "id3": (3.5950, 98.6720), "id4": (-7.3300, 112.7700), "id5": (-6.3000, 107.0600), "id6": (-8.6500, 115.2100)}
DIGITAL = ("electronics", "e-commerce", "logistics", "pharma", "warehousing")
NO_SHIP = ("warehousing", "logistics")
GENERIC = [("Hydrant point seen, no pressure gauge reading in frame", "Moderate", "Ask for the last hydrant pressure test certificate"),
           ("No 'No smoking' signage seen in the storage area", "Moderate", "Confirm signage and how smoking rules are enforced"),
           ("Main electrical panel has no rubber mat in front", "Low", "Check the panel rating against the connected load")]
STAGES = ["new", "contacted", "visit_scheduled", "visited", "proposal_submitted", "info_requested", "quoted", "bound", "lost"]
RATES = {"property": 0.0016, "bi": 0.0011, "machinery": 0.0032, "marine": 0.0014, "cyber": 0.006}
BAND_LOAD = {"Low": 0.85, "Moderate": 1.0, "Elevated": 1.2, "High": 1.45}


def now():
    return datetime.now(timezone.utc)


def band_for(s):
    return "High" if s >= 75 else "Elevated" if s >= 58 else "Moderate" if s >= 38 else "Low"


def ev(actor, action, detail, at):
    return {"at": at.isoformat(), "actor": actor, "action": action, "detail": detail}


def assess(rnd, m, industry, employees, revenue_usd, machine, prior, hazards):
    fx = MARKETS[m]["fx"]
    typ, make, model, unit_value, units = machine
    plant = unit_value * units
    building = revenue_usd * rnd.uniform(0.35, 0.6)
    stock = revenue_usd * rnd.uniform(0.08, 0.18)
    ind = industry.lower()
    exposure = {"property": building + plant + stock, "bi": revenue_usd * 0.35, "machinery": plant,
                "marine": 0 if any(k in ind for k in NO_SHIP) else revenue_usd * 0.4, "liability": 250_000 + employees * 1500,
                "cyber": revenue_usd * 0.05 if any(k in ind for k in DIGITAL) else 0}
    needs = [c for c in CATEGORIES if exposure[c] > 0 and not (c == "machinery" and plant < 60_000)]
    covered = {}
    if prior:
        for c in prior[1]:
            covered[c] = exposure[c] * (prior[2] if c == "property" else 1)
    score = min(95, rnd.randint(8, 50) + sum(w for _, w in hazards) + rnd.randint(0, 10))
    band = band_for(score)
    gaps = []
    for c in needs:
        un = exposure[c] - covered.get(c, 0)
        if un <= exposure[c] * 0.05:
            continue
        sev = "High" if c in ("property", "bi") or un > revenue_usd * 0.3 else "Elevated" if c in ("machinery", "liability") else "Moderate"
        title = f"{CATEGORIES[c]} is underinsured" if c in covered else f"No {CATEGORIES[c].lower()} cover"
        gaps.append({"category": c, "title": title, "severity": sev, "uncovered_value": round(un * fx), "covered": c in covered})
    recs = []
    for c in needs:
        if c == "liability":
            prem = (900 + employees * 18) * BAND_LOAD[band]
        else:
            prem = exposure[c] * RATES[c] * BAND_LOAD[band]
        prio = "Essential" if c in ("property", "bi") or (c == "liability" and employees > 50) else "Recommended" if c in ("machinery", "marine", "liability") else "Optional"
        if c in covered and c != "property":
            prio = "Optional"
        recs.append({"product_id": c, "name": MARKETS[m]["catalog"][c], "category": c, "priority": prio, "premium": round(prem * fx),
                     "premium_range": [round(prem * fx * 0.85), round(prem * fx * 1.2)], "sum_insured": round(exposure[c] * fx),
                     "reason": reason(c, industry, exposure, plant, covered, prior, fx, m)})
    total = sum(exposure[c] for c in needs)
    cov_ratio = round(sum(covered.values()) / total, 2) if total else 0
    values = {"building": round(building * fx), "machinery": round(plant * fx), "stock": round(stock * fx), "revenue": round(revenue_usd * fx)}
    return {"risk_score": score, "risk_band": band, "exposure": {c: round(exposure[c] * fx) for c in needs}, "values": values, "total_insurable": round(total * fx),
            "gaps": gaps, "protection_gap": sum(g["uncovered_value"] for g in gaps), "coverage_ratio": cov_ratio, "recommendations": recs}


def reason(c, industry, exposure, plant, covered, prior, fx, m):
    if c == "property":
        return f"Building, plant and stock seen in the evidence add up to more than the declared sum insured" if "property" in covered else "Fixed assets are fully exposed to fire and allied perils"
    return {"bi": f"A fire would stop {industry.lower()} output for weeks, and fixed costs keep running",
            "machinery": "Several key machines are more than ten years old and have no breakdown cover",
            "marine": "Goods move by road and sea to buyers, and transit losses fall on the business",
            "liability": "Visitors, contractors and products create third-party injury and damage exposure",
            "cyber": "Online orders and customer data make a breach or outage costly"}[c]


def build_case(hero, n, rnd, agents, status=None, created=None, historical=False, name=None):
    key, m, org_id, hname, city, region, industry, emp, rev, machine, haz_a, haz_c, prior, hstatus = hero
    status = status or hstatus
    rev = rev * (rnd.uniform(0.6, 1.4) if historical else 1)
    emp = int(emp * (rnd.uniform(0.6, 1.4) if historical else 1))
    lat, lon = COORDS[key]
    if historical:
        lat += rnd.uniform(-0.03, 0.03); lon += rnd.uniform(-0.03, 0.03)
    if historical and rnd.random() < 0.35:
        prior = None
    elif prior and rnd.random() < 0.4:
        prior = (prior[0], list(prior[1]) + ["bi"], prior[2])
    hazards = [(haz_a, 10), (haz_c, 8)] + [(g[0], 3) for g in rnd.sample(GENERIC, 2)]
    a = assess(rnd, m, industry, emp, rev, machine, prior, hazards)
    img = IMAGES[key]
    typ, make, model, unit_value, units = machine
    fx = MARKETS[m]["fx"]
    serial = f"{make[:2].upper()}{rnd.randint(10, 99)}-{rnd.randint(100000, 999999)}"
    year = rnd.randint(2008, 2021)
    gen = rnd.sample(GENERIC, 2)
    indicators = [{"id": "F1", "finding": haz_a, "severity": "High", "category": "property", "photo": "P1", "verify": "Check housekeeping logs and cleaning frequency on site"},
                  {"id": "F2", "finding": haz_c, "severity": "Elevated", "category": "property", "photo": "P3", "verify": "Measure stack heights and check exit routes are clear"},
                  {"id": "F3", "finding": f"{typ} is {2026 - year} years old with no breakdown cover on record", "severity": "Moderate", "category": "machinery", "photo": "P2", "verify": "Check the maintenance contract and the last service date"}]
    indicators += [{"id": f"F{4 + i}", "finding": g[0], "severity": g[1], "category": "property", "photo": "P1", "verify": g[2]} for i, g in enumerate(gen)]
    photos = [{"id": "P1", "title": "Production floor", "image": img[0], "source": "Walkthrough video · 00:48", "annotations": [{"x": 10, "y": 48, "w": 38, "h": 34, "label": haz_a, "severity": "High"}]},
              {"id": "P2", "title": f"{typ} ID plate", "image": img[1], "source": "Machinery photo", "annotations": [{"x": 28, "y": 18, "w": 44, "h": 50, "label": "ID plate read", "severity": "Info",
               "fields": {"Manufacturer": make, "Model": model, "Serial": serial, "Year": str(year), "Units on site": str(units)}}]},
              {"id": "P3", "title": "Storage and services", "image": img[2], "source": "Walkthrough video · 03:20", "annotations": [{"x": 12, "y": 14, "w": 52, "h": 64, "label": haz_c, "severity": "Elevated"}]}]
    frames = [{"t": "00:48", "image": img[0], "pos": "30% 50%", "note": haz_a, "severity": "High"},
              {"t": "01:55", "image": img[0], "pos": "80% 40%", "note": f"{units} × {typ} counted on the floor", "severity": "Info"},
              {"t": "02:40", "image": img[1], "pos": "50% 40%", "note": f"{make} {model} plate captured", "severity": "Info"},
              {"t": "03:20", "image": img[2], "pos": "40% 50%", "note": haz_c, "severity": "Elevated"},
              {"t": "05:05", "image": img[2], "pos": "85% 60%", "note": gen[0][0], "severity": gen[0][1]}]
    machinery = [{"id": "M1", "type": typ, "manufacturer": make, "model": model, "serial": serial, "year": year, "units": units, "unit_value": round(unit_value * fx), "replacement_value": round(unit_value * units * fx), "confidence": round(rnd.uniform(0.86, 0.98), 2)}]
    created = created or now() - timedelta(hours=rnd.randint(20, 160))
    prefix = MARKETS[m]["prefix"]
    org_agents = [x for x in agents if x["org_id"] == org_id and x["role"] == "agent"]
    agent = rnd.choice(org_agents)
    sme = {"business_name": name or hname, "industry": industry, "city": city, "region": region, "country": MARKETS[m]["name"], "employees": emp, "revenue": round(rev * fx),
           "contact_name": rnd.choice(["Rajesh Agarwal", "Anita Iyer", "Tan Wei Ming", "Siti Aminah", "Hendra Wijaya", "Putri Ayu", "Vikram Shah", "Lim Mei Ling"]),
           "phone": rnd.choice(["+91 98", "+60 12", "+62 812"])[:6] + f"{rnd.randint(1000000, 9999999)}", "email": "owner@" + (name or hname).lower().replace(" ", "").replace(".", "")[:18] + ".com",
           "lat": round(lat, 5), "lon": round(lon, 5), "address": f"Industrial area, {city}, {region}"}
    prior_out = None
    if prior:
        prior_out = {"insurer": prior[0], "categories": prior[1], "sum_insured": round(a["exposure"]["property"] * prior[2]), "premium": round(a["exposure"]["property"] * prior[2] * 0.0012),
                     "expiry": (now() + timedelta(days=rnd.randint(20, 200))).date().isoformat(), "source": rnd.choice(["Policy schedule PDF", "SME description"])}
    case = {"id": str(uuid.uuid4()), "lead_id": f"{prefix}-{26000 + n:05d}", "market": m, "created_at": created.isoformat(), "updated_at": created.isoformat(),
            "source": "historical" if historical else "demo", "image_key": key, "sme": sme, "assessment": a, "indicators": indicators, "photos": photos,
            "video": {"duration": "06:12", "frames_analysed": 372, "frames": frames}, "machinery": machinery, "prior_policy": prior_out,
            "checklist": [i["verify"] for i in indicators], "checklist_done": [], "distributor_id": org_id, "agent_id": agent["id"], "status": status,
            "sla_due": (now() + timedelta(hours=rnd.randint(-10, 70))).isoformat(), "proposal": None, "decision": None, "flags": [], "notes": [], "activity": []}
    timeline(case, agent, created, rnd)
    return case


def timeline(c, agent, t, rnd):
    act = c["activity"]
    act.append(ev("SME", "submitted", "Completed the protection journey and submitted for review", t))
    act.append(ev("ComplyStack", "report_generated", f"Assessment ready · risk score {c['assessment']['risk_score']}", t + timedelta(minutes=3)))
    act.append(ev("Lead routing", "assigned", f"Assigned to {agent['name']}", t + timedelta(minutes=4)))
    idx = STAGES.index(c["status"]) if c["status"] != "lost" else 6
    steps = [("contacted", "Called the owner and shared the protection report"), ("visit_scheduled", "Site visit booked"), ("visited", "Site visit completed, findings confirmed")]
    for i, (s, d) in enumerate(steps, start=1):
        if idx >= i:
            t += timedelta(hours=rnd.randint(4, 30)); act.append(ev(agent["name"], s, d, t))
    if idx >= 4:
        recs = c["assessment"]["recommendations"]
        picks = [r["product_id"] for r in recs if r["priority"] != "Optional"]
        just = "Proposed after the site visit. Values match what we saw on the floor and the owner agreed income protection is the priority."
        if c["status"] == "info_requested":
            picks = picks[:1]; just = "Client wants the lowest premium."
        t += timedelta(hours=rnd.randint(3, 20))
        c["proposal"] = {"products": picks, "justification": just, "by": agent["name"], "submitted_at": t.isoformat(), "premium": sum(r["premium"] for r in recs if r["product_id"] in picks)}
        c["flags"] = advisory(recs, picks, just)
        act.append(ev(agent["name"], "proposal_submitted", f"Proposal with {len(picks)} covers sent to the insurer", t))
    if c["status"] in ("info_requested", "quoted", "bound", "lost"):
        t += timedelta(hours=rnd.randint(4, 24))
        d = {"info_requested": ("request_info", "Please explain why business interruption cover was left out for a multi-shift unit."),
             "lost": ("approve", "Proposal accepted. Formal quote issued.")}.get(c["status"], ("approve", "Proposal accepted. Formal quote issued."))
        c["decision"] = {"decision": d[0], "comment": d[1], "by": "ABC Insure Admin Hub", "at": t.isoformat(), "via": "API"}
        act.append(ev("ABC Insure Admin Hub", "quoted" if d[0] == "approve" else "info_requested", d[1] + " (via API)", t))
    if c["status"] in ("bound", "lost"):
        t += timedelta(hours=rnd.randint(12, 90))
        act.append(ev(agent["name"], c["status"], "Policy bound and premium collected" if c["status"] == "bound" else "Client chose another insurer on price", t))
    c["updated_at"] = t.isoformat()


def advisory(recs, picks, just):
    ids = {r["product_id"] for r in recs}
    flags = [{"type": "overlooked", "severity": "High", "product_id": r["product_id"], "text": f"{r['name']} is rated Essential from the evidence, but it is not in the proposal"}
             for r in recs if r["priority"] == "Essential" and r["product_id"] not in picks]
    flags += [{"type": "unsupported", "severity": "Elevated", "product_id": p, "text": f"{CATEGORIES.get(p, p)} has no supporting evidence for this business"} for p in picks if p not in ids]
    if len((just or "").split()) < 12:
        flags.append({"type": "weak_justification", "severity": "Moderate", "product_id": None, "text": "The reason is under 12 words, which is too short for the insurer to review"})
    return flags
