"""Demo seed: distributors, agents and textile fire cases at different pipeline stages."""
import random
import uuid
from datetime import datetime, timezone, timedelta
from report_engine import build_report, misselling_flags

ORGS = [
    {"id": "org-bharat", "name": "Bharat Risk Brokers Pvt Ltd", "type": "Broking firm", "city": "Mumbai", "licence": "IRDAI/DB 712/2019", "region": "West"},
    {"id": "org-kavach", "name": "Kavach Insurance Distribution", "type": "Corporate agent", "city": "Coimbatore", "licence": "IRDAI/CA 0457/2021", "region": "South"},
    {"id": "org-sarthi", "name": "Sarthi Commercial Advisors", "type": "Broking firm", "city": "Ludhiana", "licence": "IRDAI/DB 1033/2022", "region": "North"},
]

AGENTS = [
    ("org-bharat", "Ritika Mehta", "admin", "Mumbai"), ("org-bharat", "Imran Shaikh", "agent", "Surat"), ("org-bharat", "Nikhil Patil", "agent", "Bhiwandi"),
    ("org-kavach", "Lakshmi Narayanan", "admin", "Coimbatore"), ("org-kavach", "Karthik Raja", "agent", "Tiruppur"), ("org-kavach", "Divya Subramanian", "agent", "Erode"),
    ("org-sarthi", "Harpreet Singh", "admin", "Ludhiana"), ("org-sarthi", "Aman Verma", "agent", "Panipat"), ("org-sarthi", "Neha Arora", "agent", "Ludhiana"),
]

SMES = [
    ("Shree Ganesh Weaving Mills", "Surat", "Gujarat", 64, "org-bharat", "recommendation_submitted"),
    ("Tiruppur Knit Exports", "Tiruppur", "Tamil Nadu", 140, "org-kavach", "inspection_scheduled"),
    ("Panipat Home Furnishings", "Panipat", "Haryana", 52, "org-sarthi", "assigned"),
    ("Vardhman Yarn Co-op", "Ludhiana", "Punjab", 210, "org-sarthi", "approved"),
    ("Erode Handloom Collective", "Erode", "Tamil Nadu", 35, "org-kavach", "new"),
    ("Bhiwandi Powerloom Works", "Bhiwandi", "Maharashtra", 88, "org-bharat", "justification_requested"),
    ("Ichalkaranji Cotton Textiles", "Ichalkaranji", "Maharashtra", 120, "org-bharat", "inspected"),
    ("Coimbatore Spinners Ltd", "Coimbatore", "Tamil Nadu", 260, "org-kavach", "recommendation_submitted"),
    ("Ahmedabad Denim House", "Ahmedabad", "Gujarat", 175, "org-bharat", "assigned"),
    ("Ludhiana Hosiery Hub", "Ludhiana", "Punjab", 45, "org-sarthi", "inspection_scheduled"),
    ("Karur Terry Towels", "Karur", "Tamil Nadu", 70, "org-kavach", "approved"),
    ("Bhilwara Suitings", "Bhilwara", "Rajasthan", 95, "org-sarthi", "new"),
]

STAGES = ["new", "assigned", "inspection_scheduled", "inspected", "recommendation_submitted", "justification_requested", "approved", "declined"]


def now():
    return datetime.now(timezone.utc)


def new_lead_id(n):
    return f"ZIN-FIRE-{26_000 + n:05d}"


def ev(actor, action, detail, at):
    return {"at": at.isoformat(), "actor": actor, "action": action, "detail": detail}


def build_case(n, name, city, state, headcount, org_id, status, agents, rnd):
    lead = new_lead_id(n)
    created = now() - timedelta(hours=rnd.randint(60, 300))
    sme = {"business_name": name, "category": "manufacturing", "activity": "Textiles and garments", "is_textile": True, "city": city, "state": state,
           "country": "India", "headcount": headcount, "contact_name": rnd.choice(["Rajesh", "Suresh", "Anita", "Vikram", "Meena"]) + " " + rnd.choice(["Agarwal", "Kumar", "Patel", "Iyer", "Gupta"]),
           "phone": f"+91 9{rnd.randint(100000000, 999999999)}", "has_insurance": rnd.random() > 0.25, "premises_owned": rnd.random() > 0.3}
    report = build_report(lead, sme)
    org_agents = [a for a in agents if a["org_id"] == org_id and a["role"] == "agent"]
    agent = rnd.choice(org_agents) if status != "new" else None
    activity = [ev("SME", "submitted", "Completed the discovery journey and uploaded evidence", created),
                ev("ComplyStack engine", "report_generated", f"Pre-inspection report ready · fire score {report['fire_score']}", created + timedelta(minutes=4)),
                ev("Zurich lead router", "routed", f"Lead routed to {next(o['name'] for o in ORGS if o['id'] == org_id)}", created + timedelta(minutes=5))]
    case = {"id": str(uuid.uuid4()), "lead_id": lead, "created_at": created.isoformat(), "updated_at": created.isoformat(), "source": "seed",
            "sme": sme, "report": report, "product_line": report["product_line"], "distributor_id": org_id, "agent_id": agent["id"] if agent else None,
            "status": status, "sla_due": (now() + timedelta(hours=rnd.randint(-14, 66))).isoformat(), "agent_recommendation": None, "review": None, "flags": [], "notes": [], "activity": activity}
    idx = STAGES.index(status)
    t = created + timedelta(hours=2)
    if agent:
        activity.append(ev("Distributor admin", "assigned", f"Assigned to {agent['name']}", t))
    if idx >= 2:
        t += timedelta(hours=8); activity.append(ev(agent["name"], "inspection_scheduled", f"Site visit booked for {(t + timedelta(days=2)).date()}", t))
    if idx >= 3:
        t += timedelta(hours=30); activity.append(ev(agent["name"], "inspected", "Site inspection completed; report reviewed on site", t))
    if idx >= 4:
        engine = report["engine_recommendations"]
        picks = [r["product_id"] for r in engine if r["priority"] != "Optional"]
        just = "Recommended after the site visit. The fire base cover matches the observed assets; stock floater is needed because stock changes by season."
        if status == "justification_requested":
            picks = [engine[0]["product_id"], "burglary"]; just = "Client wants low premium."
        if name.startswith("Coimbatore"):
            picks = [p for p in picks if p != "flop"] + ["eq"]
        t += timedelta(hours=6)
        case["agent_recommendation"] = {"products": picks, "justification": just, "agent": agent["name"], "submitted_at": t.isoformat()}
        case["flags"] = misselling_flags(engine, picks, just)
        activity.append(ev(agent["name"], "recommendation_submitted", f"{len(picks)} products recommended", t))
    if status == "justification_requested":
        t += timedelta(hours=3)
        case["review"] = {"decision": "request_justification", "comment": "Explain why Fire Loss of Profit was dropped for a 3-shift powerloom unit.", "by": "Zurich Underwriting", "at": t.isoformat()}
        activity.append(ev("Zurich Underwriting", "justification_requested", case["review"]["comment"], t))
    if status == "approved":
        t += timedelta(hours=5)
        case["review"] = {"decision": "approve", "comment": "Matches the evidence. Proceed to a formal quote.", "by": "Zurich Underwriting", "at": t.isoformat()}
        activity.append(ev("Zurich Underwriting", "approved", case["review"]["comment"], t))
    case["updated_at"] = t.isoformat()
    return case


async def seed(db, force=False):
    if not force and await db.orgs.count_documents({}) > 0:
        return
    for c in ("orgs", "agents", "cases"):
        await db[c].delete_many({})
    rnd = random.Random(42)
    await db.orgs.insert_many([{**o, "created_at": now().isoformat()} for o in ORGS])
    agents = []
    for org_id, name, role, city in AGENTS:
        first, last = name.lower().split()[0], name.lower().split()[-1]
        agents.append({"id": f"ag-{first}", "org_id": org_id, "name": name, "role": role, "city": city, "active": True,
                       "email": f"{first}.{last}@{org_id[4:]}.in", "phone": f"+91 98{rnd.randint(10000000, 99999999)}", "created_at": now().isoformat()})
    await db.agents.insert_many([dict(a) for a in agents])
    cases = [build_case(i + 1, *s, agents, rnd) for i, s in enumerate(SMES)]
    await db.cases.insert_many(cases)
    await db.counters.update_one({"_id": "lead"}, {"$set": {"n": len(cases)}}, upsert=True)
