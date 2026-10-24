"""Sample pre-inspection report generator (illustrative findings, deterministic per lead)."""
import random

IMG = {
    "looms": "https://images.unsplash.com/photo-1660980041852-230420b8f99f?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
    "stenter": "https://images.unsplash.com/photo-1655122878062-a9e885391a1b?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
    "spinning": "https://images.pexels.com/photos/8246480/pexels-photo-8246480.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "panel": "https://images.unsplash.com/photo-1563456019560-2b37aa7ad890?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
    "wiring": "https://images.pexels.com/photos/7541342/pexels-photo-7541342.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "storage": "https://images.pexels.com/photos/236748/pexels-photo-236748.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "rolls": "https://images.pexels.com/photos/38357014/pexels-photo-38357014.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "breaker": "https://images.unsplash.com/photo-1566417110090-6b15a06ec800?crop=entropy&cs=srgb&fm=jpg&q=80&w=1200",
}

MACHINES = [
    ("Rapier loom", "Picanol", "OptiMax-i", 1_800_000, "Friction and lint build-up are a known ignition source"),
    ("Air-jet loom", "Toyota", "JAT810", 2_400_000, "High-speed operation; fibre fly accumulates around drives"),
    ("Ring spinning frame", "Lakshmi Machine Works", "LR9 AXL", 3_200_000, "Cotton fly and overheated spindle bearings"),
    ("Carding machine", "Trützschler", "TC 19i", 5_500_000, "Leading cause of fire in spinning; needs spark detection"),
    ("Stenter", "Monforts", "Montex 6500", 9_000_000, "Thermal-oil heated; lint on chain rails ignites readily"),
    ("Jet dyeing machine", "Thies", "iMaster H2O", 4_200_000, "Pressure vessel; low direct fire load"),
    ("Thermic fluid heater", "Thermax", "TF-60", 2_600_000, "Open-flame heat source; must be in a separated room"),
    ("Air compressor", "Atlas Copco", "GA 37", 900_000, "Oil-flooded unit; overheating risk if filters clogged"),
    ("Sizing machine", "Karl Mayer", "ISOSIZE", 6_800_000, "Steam-heated drying cylinders"),
    ("Embroidery machine", "Tajima", "TMAR-K", 1_300_000, "Electrical overload on multi-head units"),
]

INDICATORS = [
    ("lint", "Fibre lint accumulation on machine frames and cable trays", "High", 9, "looms", "Ask for the daily cleaning log and lint-removal frequency"),
    ("wiring", "Exposed junction box and unsleeved cabling near production line", "High", 10, "wiring", "Check thermography report on LT panels (last 12 months)"),
    ("storage", "Finished fabric stacked ~4 m high with no clear aisle to the exit", "Elevated", 7, "storage", "Measure stack height and check the 1 m clearance below sprinklers"),
    ("extinguisher", "Fire extinguisher refill tag appears expired (photo date vs tag)", "Elevated", 6, "panel", "Check the AMC register for all extinguishers"),
    ("heater", "Thermic fluid heater shares a wall with the yarn store", "High", 9, "stenter", "Confirm a fire-rated separation wall and an auto cut-off"),
    ("smoking", "No 'No smoking' signage seen in the raw-material godown", "Moderate", 3, "rolls", "Confirm signage and how smoking rules are enforced"),
    ("hydrant", "Hydrant point visible; no pressure gauge reading in frame", "Moderate", 4, "spinning", "Ask for the last hydrant pressure test certificate"),
    ("panel", "Main LT panel: no rubber mat, and its ID plate is legible", "Moderate", 4, "breaker", "Check the panel rating against the connected load"),
]

INSURERS = ["New India Assurance", "United India Insurance", "ICICI Lombard", "HDFC ERGO", "Bajaj Allianz"]
EQ_ZONE = {"Gujarat", "Maharashtra", "Punjab", "Haryana", "Delhi", "Uttarakhand", "Himachal Pradesh", "Assam"}
FLOOD_ZONE = {"Tamil Nadu", "Gujarat", "Assam", "Kerala", "West Bengal", "Bihar", "Maharashtra", "Odisha"}

FIRE_CATALOG = {
    "bsus": {"name": "Bharat Sookshma Udyam Suraksha", "short": "Fire – BSUS", "kind": "base", "desc": "Fire and allied perils for total assets at risk up to ₹5 Cr"},
    "blus": {"name": "Bharat Laghu Udyam Suraksha", "short": "Fire – BLUS", "kind": "base", "desc": "Fire and allied perils for assets of ₹5–50 Cr"},
    "sfsp": {"name": "Standard Fire & Special Perils", "short": "Fire – SFSP", "kind": "base", "desc": "For assets above ₹50 Cr"},
    "flop": {"name": "Fire Loss of Profit", "short": "Business interruption", "kind": "addon", "desc": "Gross profit and standing charges after an insured fire"},
    "mbd": {"name": "Machinery Breakdown", "short": "Machinery breakdown", "kind": "addon", "desc": "Sudden mechanical or electrical breakdown of plant"},
    "burglary": {"name": "Burglary & Housebreaking", "short": "Burglary", "kind": "addon", "desc": "Theft of stock and contents after forcible entry"},
    "stock_floater": {"name": "Stock Declaration / Floater", "short": "Stock floater", "kind": "addon", "desc": "Covers stock values that change month to month"},
    "eq": {"name": "Earthquake (Fire & Shock) add-on", "short": "Earthquake", "kind": "addon", "desc": "For locations in seismic zones III–V"},
    "stfi": {"name": "Storm, Tempest, Flood & Inundation", "short": "STFI", "kind": "addon", "desc": "For flood-prone or coastal districts"},
}

RATES = {"Low": 0.0009, "Moderate": 0.0013, "Elevated": 0.0018, "High": 0.0024}
ADDON_RATES = {"flop": 0.18, "mbd": 0.0025, "burglary": 0.0006, "stock_floater": 0.05, "eq": 0.0002, "stfi": 0.00015}


def band_for(score):
    return "High" if score >= 75 else "Elevated" if score >= 55 else "Moderate" if score >= 35 else "Low"


def _serial(rnd, make):
    return f"{make[:2].upper()}{rnd.randint(10, 99)}-{rnd.randint(100000, 999999)}"


def build_report(lead_id, sme):
    rnd = random.Random(lead_id)
    textile = "textile" in (sme.get("activity") or "").lower() or sme.get("is_textile")
    pool = MACHINES if textile else MACHINES[5:]
    chosen = rnd.sample(pool, k=min(len(pool), rnd.randint(4, 6)))
    machinery = []
    for i, (typ, make, model, value, risk) in enumerate(chosen):
        units = rnd.randint(1, 3) if value > 4_000_000 else rnd.randint(2, 24)
        year = rnd.randint(2006, 2022)
        machinery.append({
            "id": f"M{i + 1}", "type": typ, "manufacturer": make, "model": model,
            "serial": _serial(rnd, make), "year": year, "age": 2026 - year, "units": units,
            "unit_value": value, "replacement_value": value * units, "fire_relevance": risk,
            "ocr_confidence": round(rnd.uniform(0.82, 0.99), 2), "source": "Machine ID plate photo",
            "verified": False,
        })
    plant_value = sum(m["replacement_value"] for m in machinery)

    inds = rnd.sample(INDICATORS, k=rnd.randint(4, 6))
    indicators = [{"id": k, "finding": f, "severity": s, "weight": w, "evidence": img, "verify": v} for k, f, s, w, img, v in inds]

    photos = [
        {"id": "P1", "title": "Weaving shed – line 2", "image": IMG["looms"], "source": "Premises walkthrough · frame 00:42",
         "annotations": [{"x": 8, "y": 52, "w": 34, "h": 30, "label": "Lint build-up on loom frames", "severity": "High"},
                         {"x": 55, "y": 8, "w": 30, "h": 18, "label": "Unguarded overhead lighting", "severity": "Moderate"}]},
        {"id": "P2", "title": "Stenter ID plate", "image": IMG["stenter"], "source": "Machinery photo upload",
         "annotations": [{"x": 40, "y": 30, "w": 26, "h": 26, "label": "ID plate detected", "severity": "Info",
                          "fields": {"Manufacturer": "Monforts", "Model": "Montex 6500", "Serial": _serial(rnd, "Monforts"), "Year": str(rnd.randint(2010, 2020)), "Heating": "Thermal oil"}}]},
        {"id": "P3", "title": "Finished goods godown", "image": IMG["storage"], "source": "Premises walkthrough · frame 03:15",
         "annotations": [{"x": 5, "y": 10, "w": 50, "h": 70, "label": "Stack height ~4 m, no aisle", "severity": "Elevated"}]},
        {"id": "P4", "title": "Junction box near carding", "image": IMG["wiring"], "source": "Premises walkthrough · frame 05:02",
         "annotations": [{"x": 20, "y": 25, "w": 40, "h": 45, "label": "Exposed terminals, no cover", "severity": "High"}]},
        {"id": "P5", "title": "Main LT panel", "image": IMG["panel"], "source": "Machinery photo upload",
         "annotations": [{"x": 10, "y": 10, "w": 32, "h": 22, "label": "Hazard sign present", "severity": "Info"},
                         {"x": 35, "y": 40, "w": 40, "h": 40, "label": "Panel rating plate (630 A)", "severity": "Info",
                          "fields": {"Make": "L&T", "Rating": "630 A", "Type": "LT PCC"}}]},
    ]
    frames = [
        {"t": "00:42", "image": IMG["looms"], "note": "Weaving shed: lint on frames, 48 looms counted", "severity": "High"},
        {"t": "01:30", "image": IMG["spinning"], "note": "Spinning hall: hydrant point seen, no gauge visible", "severity": "Moderate"},
        {"t": "03:15", "image": IMG["storage"], "note": "Godown: high stacks, exit route partly blocked", "severity": "Elevated"},
        {"t": "04:10", "image": IMG["rolls"], "note": "Raw-material area: no smoking signage seen", "severity": "Moderate"},
        {"t": "05:02", "image": IMG["wiring"], "note": "Exposed junction box near carding line", "severity": "High"},
        {"t": "06:20", "image": IMG["breaker"], "note": "Main panel room: clean, but no rubber mat", "severity": "Low"},
    ]

    building = sme.get("building_value") or rnd.choice([1.5, 2.5, 4, 6, 9]) * 1e7
    stock = sme.get("stock_value") or rnd.choice([0.6, 1.2, 2, 3.5]) * 1e7
    sums = {"building": int(building) if sme.get("premises_owned", True) else 0, "plant": int(plant_value), "stock": int(stock)}
    total_si = sum(sums.values())

    score = min(96, 30 + sum(i["weight"] for i in indicators) + (8 if rnd.random() > 0.5 else 0))
    band = band_for(score)

    prior = None
    if sme.get("has_insurance", rnd.random() > 0.3):
        prior_si = int(total_si * rnd.uniform(0.55, 0.85))
        prior = {
            "insurer": rnd.choice(INSURERS), "product": "Bharat Laghu Udyam Suraksha" if prior_si > 5e7 else "Bharat Sookshma Udyam Suraksha",
            "policy_no": f"{rnd.randint(1000, 9999)}/{rnd.randint(100000, 999999)}/26", "expiry": f"2026-{rnd.randint(7, 12):02d}-{rnd.randint(1, 28):02d}",
            "sum_insured": prior_si, "premium": int(prior_si * 0.0011), "addons": rnd.sample(["Burglary", "STFI", "Earthquake"], k=rnd.randint(0, 2)),
            "source": "Uploaded PDF · 14 pages" if rnd.random() > 0.4 else "SME's description",
            "extraction_confidence": round(rnd.uniform(0.78, 0.96), 2),
            "observations": [
                f"Declared sum insured is about {int(100 * prior_si / total_si)}% of the assets seen in the evidence, so the business may be underinsured (average clause risk)",
                "No Fire Loss of Profit cover, so income is unprotected after a fire",
                "Stock is declared at a fixed value, but the textile stock seen changes from season to season",
            ],
        }
    location = {"state": sme.get("state", ""), "eq_zone": sme.get("state") in EQ_ZONE, "flood_zone": sme.get("state") in FLOOD_ZONE}
    report = {
        "product_line": "fire_textile_in" if textile else "fire_general_in",
        "fire_score": score, "fire_band": band, "indicators": indicators, "photos": photos, "video_frames": frames,
        "video": {"duration": "07:48", "frames_analysed": 468, "areas_covered": ["Weaving", "Spinning", "Godown", "Panel room", "Boiler"]},
        "machinery": machinery, "sums_insured": sums, "total_sum_insured": total_si, "prior_policy": prior, "location": location,
        "inspection_checklist": [i["verify"] for i in indicators] + ["Check the machine ID plates against the register (M1–M%d)" % len(machinery), "Confirm the building's construction class and roof type"],
        "data_requests": [x for x in ["Last fire NOC from the local fire department", "Electrical audit / thermography report", None if prior else "Previous policy schedule (if any)", "Monthly stock statements for the last 6 months"] if x],
        "disclaimer": "Illustrative findings produced by the ComplyStack demo engine. They are not an insurer-issued assessment and must be checked on site.",
    }
    report["engine_recommendations"] = recommend(report, sme)
    return report


def recommend(report, sme):
    si, band = report["total_sum_insured"], report["fire_band"]
    base = "bsus" if si <= 5e7 else "blus" if si <= 5e8 else "sfsp"
    base_prem = si * RATES[band]
    recs = [{"product_id": base, "priority": "Essential", "premium": int(base_prem),
             "reason": f"Total assets at risk of {si / 1e7:.1f} Cr put this business in the {FIRE_CATALOG[base]['short']} bracket",
             "evidence": ["Machinery register", "Sums insured"]}]
    plant = report["sums_insured"]["plant"]
    recs.append({"product_id": "flop", "priority": "Essential" if band in ("High", "Elevated") else "Recommended", "premium": int(base_prem * ADDON_RATES["flop"] * 4),
                 "reason": f"{len(report['machinery'])} production machine types, so a fire would stop output for weeks", "evidence": ["Video 00:42", "Machinery register"]})
    if plant > 2e7:
        recs.append({"product_id": "mbd", "priority": "Recommended", "premium": int(plant * ADDON_RATES["mbd"]),
                     "reason": f"Plant worth {plant / 1e7:.1f} Cr includes machines older than 10 years", "evidence": ["Machine ID plates"]})
    recs.append({"product_id": "stock_floater", "priority": "Recommended", "premium": int(report["sums_insured"]["stock"] * RATES[band] * 0.4),
                 "reason": "Textile stock changes with the season; a fixed declaration risks underinsurance", "evidence": ["Video 03:15", "Prior policy"]})
    recs.append({"product_id": "burglary", "priority": "Optional", "premium": int(report["sums_insured"]["stock"] * ADDON_RATES["burglary"]),
                 "reason": "High-value finished goods in the godown", "evidence": ["Photo P3"]})
    if report["location"]["eq_zone"]:
        recs.append({"product_id": "eq", "priority": "Recommended", "premium": int(si * ADDON_RATES["eq"]), "reason": f"{report['location']['state']} has districts in seismic zones III–V", "evidence": ["Location"]})
    if report["location"]["flood_zone"]:
        recs.append({"product_id": "stfi", "priority": "Recommended", "premium": int(si * ADDON_RATES["stfi"]), "reason": f"{report['location']['state']} is flood-prone in the monsoon", "evidence": ["Location"]})
    for r in recs:
        r["name"] = FIRE_CATALOG[r["product_id"]]["name"]
        r["premium_range"] = [int(r["premium"] * 0.85), int(r["premium"] * 1.2)]
    return recs


def misselling_flags(engine_recs, agent_products, justification):
    engine_ids = {r["product_id"] for r in engine_recs}
    essential = {r["product_id"] for r in engine_recs if r["priority"] == "Essential"}
    flags = []
    for pid in essential - set(agent_products):
        flags.append({"type": "overlooked", "severity": "High", "product_id": pid, "text": f"{FIRE_CATALOG[pid]['name']} is rated Essential from the evidence, but the agent left it out"})
    for pid in set(agent_products) - engine_ids:
        flags.append({"type": "unsupported", "severity": "Elevated", "product_id": pid, "text": f"{FIRE_CATALOG[pid]['name']} is not supported by the evidence collected"})
    if len((justification or "").split()) < 12:
        flags.append({"type": "weak_justification", "severity": "Moderate", "product_id": None, "text": "The justification is under 12 words, so the insurer cannot review the basis for the recommendation"})
    return flags
