from fastapi import FastAPI, APIRouter, HTTPException, Header, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pathlib import Path
import os
import re
import uuid
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from report_engine import build_report, misselling_flags, FIRE_CATALOG  # noqa: E402
from seed import seed, ev, new_lead_id, ORGS  # noqa: E402
import cyber_scan  # noqa: E402

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
app = FastAPI(title="ComplyStack API")
api = APIRouter(prefix="/api")
NO_ID = {"_id": 0}
OPEN = ["new", "assigned", "inspection_scheduled", "inspected", "recommendation_submitted", "justification_requested"]
CLOSED = {"approved", "declined"}
RECOMMENDABLE = {"inspected", "recommendation_submitted", "justification_requested"}
TRANSITIONS = {"new": {"declined"}, "assigned": {"inspection_scheduled", "declined"}, "inspection_scheduled": {"inspected", "assigned", "declined"},
               "inspected": {"declined"}, "recommendation_submitted": {"declined"}, "justification_requested": {"declined"}}
REGION = {"Gujarat": "org-bharat", "Maharashtra": "org-bharat", "Goa": "org-bharat", "Tamil Nadu": "org-kavach", "Karnataka": "org-kavach", "Kerala": "org-kavach",
          "Andhra Pradesh": "org-kavach", "Telangana": "org-kavach", "Punjab": "org-sarthi", "Haryana": "org-sarthi", "Delhi": "org-sarthi", "Rajasthan": "org-sarthi", "Uttar Pradesh": "org-sarthi"}


def now():
    return datetime.now(timezone.utc).isoformat()


class SmeSubmit(BaseModel):
    journey: dict
    assessment: Optional[dict] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None


class AssignIn(BaseModel):
    agent_id: str
    actor: str


class StatusIn(BaseModel):
    status: str
    actor: str
    note: Optional[str] = None


class NoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    actor: str


class RecommendIn(BaseModel):
    products: List[str]
    justification: str
    actor: str


class ReviewIn(BaseModel):
    decision: str
    comment: str
    actor: str = "Zurich Underwriting"


class AgentIn(BaseModel):
    name: str = Field(min_length=2)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    city: str = Field(min_length=2)
    role: str = "agent"


class AgentPatch(BaseModel):
    active: bool


class CyberIn(BaseModel):
    url: str
    country: str
    business_name: Optional[str] = None


async def get_case(case_id):
    c = await db.cases.find_one({"$or": [{"id": case_id}, {"lead_id": case_id}]}, NO_ID)
    if not c:
        raise HTTPException(404, "Case not found")
    return c


async def push(case_id, update, event):
    update.setdefault("$set", {})["updated_at"] = now()
    update["$push"] = {"activity": event}
    await db.cases.update_one({"id": case_id}, update)
    return await get_case(case_id)


@app.on_event("startup")
async def startup():
    await seed(db)
    await db.cases.create_index("lead_id", unique=True)


@api.get("/")
async def root():
    return {"service": "ComplyStack", "status": "ok"}


@api.get("/console/meta")
async def meta():
    orgs = await db.orgs.find({}, NO_ID).to_list(100)
    agents = await db.agents.find({}, NO_ID).to_list(500)
    return {"orgs": orgs, "agents": agents, "catalog": FIRE_CATALOG,
            "product_lines": [
                {"id": "fire_textile_in", "name": "Fire – textile manufacturing", "market": "India", "state": "Live"},
                {"id": "cyber_sea", "name": "Cyber – website review", "market": "Malaysia · Indonesia", "state": "Pilot"},
                {"id": "marine_cargo", "name": "Marine cargo", "market": "India", "state": "Coming soon"},
                {"id": "supply_chain", "name": "Supply-chain disruption", "market": "India", "state": "In development"},
                {"id": "liability", "name": "Public & product liability", "market": "India", "state": "Coming soon"},
            ]}


def scope_query(org_id=None, agent_id=None):
    q = {}
    if org_id:
        q["distributor_id"] = org_id
    if agent_id:
        q["agent_id"] = agent_id
    return q


@api.get("/console/stats")
async def stats(org_id: Optional[str] = None, agent_id: Optional[str] = None):
    cases = await db.cases.find(scope_query(org_id, agent_id), {"_id": 0, "activity": 0, "report.photos": 0, "report.video_frames": 0}).to_list(2000)
    t = datetime.now(timezone.utc)
    by_status, by_band = {}, {}
    breaches, si, prem, flags = 0, 0, 0, 0
    for c in cases:
        by_status[c["status"]] = by_status.get(c["status"], 0) + 1
        b = c["report"]["fire_band"]
        by_band[b] = by_band.get(b, 0) + 1
        si += c["report"]["total_sum_insured"]
        prem += sum(r["premium"] for r in c["report"]["engine_recommendations"] if r["priority"] != "Optional")
        flags += len(c.get("flags") or []) if c["status"] in OPEN else 0
        if c["status"] in OPEN and datetime.fromisoformat(c["sla_due"]) < t:
            breaches += 1
    orgs = await db.orgs.find({}, NO_ID).to_list(100)
    league = []
    for o in orgs:
        oc = [c for c in cases if c["distributor_id"] == o["id"]]
        recs = [c for c in oc if c.get("agent_recommendation")]
        align = []
        for c in recs:
            need = {r["product_id"] for r in c["report"]["engine_recommendations"] if r["priority"] != "Optional"}
            got = set(c["agent_recommendation"]["products"])
            align.append(len(need & got) / len(need) if need else 1)
        league.append({"org_id": o["id"], "name": o["name"], "cases": len(oc), "open": sum(c["status"] in OPEN for c in oc),
                       "approved": sum(c["status"] == "approved" for c in oc), "flags": sum(len(c.get("flags") or []) for c in oc if c["status"] in OPEN),
                       "alignment": round(100 * sum(align) / len(align)) if align else None})
    return {"total": len(cases), "by_status": by_status, "by_band": by_band, "sla_breaches": breaches, "total_sum_insured": si,
            "indicative_premium": prem, "open_flags": flags, "league": [l for l in league if l["cases"] or not org_id],
            "avg_fire_score": round(sum(c["report"]["fire_score"] for c in cases) / len(cases)) if cases else 0}


@api.get("/cases")
async def list_cases(org_id: Optional[str] = None, agent_id: Optional[str] = None, status: Optional[str] = None, band: Optional[str] = None, q: Optional[str] = None, flagged: bool = False):
    query = scope_query(org_id, agent_id)
    if status:
        query["status"] = status
    if band:
        query["report.fire_band"] = band
    if flagged:
        query["flags.0"] = {"$exists": True}
        query.setdefault("status", {"$in": OPEN})
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"lead_id": rx}, {"sme.business_name": rx}, {"sme.city": rx}]
    proj = {"_id": 0, "id": 1, "lead_id": 1, "created_at": 1, "updated_at": 1, "sme": 1, "status": 1, "sla_due": 1, "distributor_id": 1, "agent_id": 1, "flags": 1, "source": 1,
            "report.fire_score": 1, "report.fire_band": 1, "report.total_sum_insured": 1, "report.product_line": 1, "agent_recommendation": 1, "review": 1}
    return await db.cases.find(query, proj).sort("created_at", -1).to_list(1000)


@api.get("/cases/{case_id}")
async def case_detail(case_id: str):
    return await get_case(case_id)


async def auto_assign(state):
    org_id = REGION.get(state)
    if not org_id:
        counts = {o["id"]: await db.cases.count_documents({"distributor_id": o["id"], "status": {"$in": OPEN}}) for o in ORGS}
        org_id = min(counts, key=counts.get)
    agents = await db.agents.find({"org_id": org_id, "role": "agent", "active": True}, NO_ID).to_list(100)
    if not agents:
        return org_id, None
    load = {a["id"]: await db.cases.count_documents({"agent_id": a["id"], "status": {"$in": OPEN}}) for a in agents}
    return org_id, min(agents, key=lambda a: load[a["id"]])


@api.post("/cases")
async def create_case(body: SmeSubmit):
    j = body.journey
    if not j.get("businessName"):
        raise HTTPException(400, "Business name is required")
    ctr = await db.counters.find_one_and_update({"_id": "lead"}, {"$inc": {"n": 1}}, upsert=True, return_document=True)
    lead = new_lead_id(ctr["n"])
    sme = {"business_name": j["businessName"], "category": j.get("category"), "activity": j.get("activity") or "", "city": j.get("city", ""), "state": j.get("state", ""),
           "country": "India", "headcount": j.get("headcount"), "revenue_band": j.get("revenueBand"), "contact_name": body.contact_name, "phone": body.contact_phone,
           "has_insurance": j.get("hasInsurance") == "Yes", "premises_owned": j.get("premisesOwnership") == "Owned by the business",
           "is_textile": "textile" in (j.get("activity") or "").lower(),
           "uploads": {k: [{"name": f.get("name"), "size": f.get("size")} for f in j.get(k, []) if isinstance(f, dict)]
                       for k in ("premisesMedia", "machineryPhotos", "evidencePolicyDocs", "policyFiles")}}
    report = build_report(lead, sme)
    org_id, agent = await auto_assign(sme["state"])
    org = next(o for o in ORGS if o["id"] == org_id)
    t = datetime.now(timezone.utc)
    case = {"id": str(uuid.uuid4()), "lead_id": lead, "created_at": t.isoformat(), "updated_at": t.isoformat(), "source": "sme_journey", "sme": sme,
            "journey": j, "sme_assessment": body.assessment, "report": report, "product_line": report["product_line"], "distributor_id": org_id,
            "agent_id": agent["id"] if agent else None, "status": "assigned" if agent else "new", "sla_due": (t + timedelta(hours=72)).isoformat(),
            "agent_recommendation": None, "review": None, "flags": [], "notes": [],
            "activity": [ev("SME", "submitted", "Completed the discovery journey and asked for a broker review", t),
                         ev("ComplyStack engine", "report_generated", f"Pre-inspection report ready · fire score {report['fire_score']}", t),
                         ev("Zurich lead router", "routed", f"Lead routed to {org['name']}", t)]
            + ([ev("Auto-assignment", "assigned", f"Assigned to {agent['name']} (lowest open caseload)", t)] if agent else [])}
    await db.cases.insert_one(dict(case))
    return {"lead_id": lead, "case_id": case["id"], "distributor": org["name"], "agent": agent["name"] if agent else None, "sla_due": case["sla_due"]}


@api.post("/cases/{case_id}/assign")
async def assign(case_id: str, body: AssignIn):
    c = await get_case(case_id)
    if c["status"] in CLOSED:
        raise HTTPException(400, "Closed cases cannot be reassigned")
    a = await db.agents.find_one({"id": body.agent_id, "active": True}, NO_ID)
    if not a:
        raise HTTPException(404, "Active agent not found")
    status = "assigned" if c["status"] == "new" else c["status"]
    return await push(c["id"], {"$set": {"agent_id": a["id"], "distributor_id": a["org_id"], "status": status}}, ev(body.actor, "assigned", f"Assigned to {a['name']}", datetime.now(timezone.utc)))


@api.post("/cases/{case_id}/status")
async def set_status(case_id: str, body: StatusIn):
    c = await get_case(case_id)
    if body.status not in TRANSITIONS.get(c["status"], set()):
        raise HTTPException(400, f"Cannot move a case from {c['status']} to {body.status}")
    return await push(c["id"], {"$set": {"status": body.status}}, ev(body.actor, body.status, body.note or body.status.replace("_", " ").capitalize(), datetime.now(timezone.utc)))


@api.post("/cases/{case_id}/notes")
async def add_note(case_id: str, body: NoteIn):
    c = await get_case(case_id)
    note = {"id": str(uuid.uuid4()), "text": body.text, "actor": body.actor, "at": now()}
    await db.cases.update_one({"id": c["id"]}, {"$push": {"notes": note}})
    return await push(c["id"], {}, ev(body.actor, "note", body.text[:140], datetime.now(timezone.utc)))


class CheckIn(BaseModel):
    done: List[int]
    actor: str


@api.post("/cases/{case_id}/checklist")
async def checklist(case_id: str, body: CheckIn):
    c = await get_case(case_id)
    total = len(c["report"]["inspection_checklist"])
    done = sorted({i for i in body.done if 0 <= i < total})
    return await push(c["id"], {"$set": {"checklist_done": done}}, ev(body.actor, "checklist", f"Inspection checklist {len(done)}/{total} verified", datetime.now(timezone.utc)))


@api.post("/cases/{case_id}/recommendation")
async def recommend(case_id: str, body: RecommendIn):
    if not body.products:
        raise HTTPException(400, "Select at least one product")
    bad = [p for p in body.products if p not in FIRE_CATALOG]
    if bad:
        raise HTTPException(400, f"Unknown product: {bad[0]}")
    c = await get_case(case_id)
    if c["status"] not in RECOMMENDABLE:
        raise HTTPException(400, "A recommendation can only be submitted after the site inspection")
    flags = misselling_flags(c["report"]["engine_recommendations"], body.products, body.justification)
    rec = {"products": body.products, "justification": body.justification, "agent": body.actor, "submitted_at": now()}
    return await push(c["id"], {"$set": {"agent_recommendation": rec, "flags": flags, "status": "recommendation_submitted", "review": None}},
                      ev(body.actor, "recommendation_submitted", f"{len(body.products)} products recommended · {len(flags)} flag(s) raised", datetime.now(timezone.utc)))


@api.post("/cases/{case_id}/review")
async def review(case_id: str, body: ReviewIn):
    status = {"approve": "approved", "request_justification": "justification_requested", "decline": "declined"}.get(body.decision)
    if not status:
        raise HTTPException(400, "Invalid decision")
    c = await get_case(case_id)
    if not c.get("agent_recommendation") or c["status"] != "recommendation_submitted":
        raise HTTPException(400, "There is no pending agent recommendation to review")
    if body.decision == "request_justification" and not body.comment.strip():
        raise HTTPException(400, "Add a comment explaining what needs justifying")
    rv = {"decision": body.decision, "comment": body.comment, "by": body.actor, "at": now()}
    return await push(c["id"], {"$set": {"review": rv, "status": status}}, ev(body.actor, status, body.comment or status, datetime.now(timezone.utc)))


def lead_package(c, orgs, agents):
    r = c["report"]
    org = orgs.get(c["distributor_id"], {})
    ag = agents.get(c.get("agent_id"), {})
    return {
        "lead_id": c["lead_id"], "status": c["status"], "created_at": c["created_at"], "updated_at": c["updated_at"],
        "attribution": {"distributor_id": c["distributor_id"], "distributor_name": org.get("name"), "agent_id": c.get("agent_id"), "agent_name": ag.get("name")},
        "sme": {k: c["sme"].get(k) for k in ("business_name", "activity", "city", "state", "country", "headcount")},
        "risk": {"product_line": r["product_line"], "fire_score": r["fire_score"], "fire_band": r["fire_band"],
                 "indicators": [{k: i[k] for k in ("id", "finding", "severity", "evidence")} for i in r["indicators"]]},
        "assets": {"sums_insured_inr": r["sums_insured"], "total_sum_insured_inr": r["total_sum_insured"],
                   "machinery": [{k: m[k] for k in ("type", "manufacturer", "model", "serial", "year", "units", "replacement_value", "ocr_confidence")} for m in r["machinery"]]},
        "prior_policy": r["prior_policy"],
        "evidence": {"photos": [{"id": p["id"], "title": p["title"], "source": p["source"], "annotations": len(p["annotations"])} for p in r["photos"]],
                     "video": r["video"], "flagged_frames": [f for f in r["video_frames"] if f["severity"] in ("High", "Elevated")]},
        "recommendations": {"engine": [{k: x[k] for k in ("product_id", "name", "priority", "premium_range", "reason")} for x in r["engine_recommendations"]],
                            "agent": c.get("agent_recommendation"), "flags": c.get("flags", []), "insurer_review": c.get("review")},
        "data_requests": r["data_requests"], "disclaimer": r["disclaimer"],
    }


async def lookup_maps():
    orgs = {o["id"]: o for o in await db.orgs.find({}, NO_ID).to_list(100)}
    agents = {a["id"]: a for a in await db.agents.find({}, NO_ID).to_list(500)}
    return orgs, agents


@api.get("/cases/{case_id}/package")
async def case_package(case_id: str):
    c = await get_case(case_id)
    return lead_package(c, *await lookup_maps())


def check_key(key):
    if key != os.environ["CS_PARTNER_API_KEY"]:
        raise HTTPException(401, "Invalid or missing X-API-Key")


@api.get("/v1/leads/{lead_id}")
async def v1_lead(lead_id: str, x_api_key: Optional[str] = Header(None)):
    check_key(x_api_key)
    c = await db.cases.find_one({"lead_id": lead_id}, NO_ID)
    if not c:
        raise HTTPException(404, "Lead not found")
    return lead_package(c, *await lookup_maps())


@api.get("/v1/leads")
async def v1_leads(distributor_id: Optional[str] = None, agent_id: Optional[str] = None, x_api_key: Optional[str] = Header(None)):
    check_key(x_api_key)
    cs = await db.cases.find(scope_query(distributor_id, agent_id), NO_ID).to_list(1000)
    maps = await lookup_maps()
    return {"count": len(cs), "leads": [lead_package(c, *maps) for c in cs]}


@api.post("/orgs/{org_id}/agents")
async def add_agent(org_id: str, body: AgentIn):
    if not await db.orgs.find_one({"id": org_id}):
        raise HTTPException(404, "Organisation not found")
    if await db.agents.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "An agent with this email already exists")
    a = {"id": f"ag-{uuid.uuid4().hex[:8]}", "org_id": org_id, "name": body.name, "email": body.email.lower(), "city": body.city,
         "role": body.role if body.role in ("agent", "admin") else "agent", "active": True, "phone": "", "created_at": now()}
    await db.agents.insert_one(dict(a))
    return a


@api.patch("/agents/{agent_id}")
async def patch_agent(agent_id: str, body: AgentPatch):
    res = await db.agents.update_one({"id": agent_id}, {"$set": {"active": body.active}})
    if not res.matched_count:
        raise HTTPException(404, "Agent not found")
    return await db.agents.find_one({"id": agent_id}, NO_ID)


@api.get("/agents/workload")
async def workload(org_id: Optional[str] = None):
    agents = await db.agents.find({"org_id": org_id} if org_id else {}, NO_ID).to_list(500)
    for a in agents:
        a["open_cases"] = await db.cases.count_documents({"agent_id": a["id"], "status": {"$in": OPEN}})
        a["completed"] = await db.cases.count_documents({"agent_id": a["id"], "status": {"$in": ["approved", "declined"]}})
    return agents


COVER_NOTES = {
    "MY": "Matters under Malaysia's PDPA 2010 (amended 2024) breach notification and BNM RMiT expectations for vendors.",
    "ID": "Matters under Indonesia's PDP Law No. 27/2022 (in force Oct 2024) and its 3-day breach notification duty.",
}


@api.post("/cyber/scan")
async def cyber(body: CyberIn):
    if body.country not in COVER_NOTES:
        raise HTTPException(400, "Country must be MY or ID")
    try:
        result = await cyber_scan.scan(body.url.strip())
    except ValueError as e:
        raise HTTPException(422, str(e))
    fails = [f for f in result["findings"] if f["status"] != "pass"]
    result.update({"id": str(uuid.uuid4()), "country": body.country, "business_name": body.business_name or result["domain"], "regulatory_note": COVER_NOTES[body.country],
                   "cover_considerations": [x for x in [
                       "Data breach response and notification costs" if any(f["id"].startswith("hdr_") for f in fails) else None,
                       "Social engineering / business email compromise" if any(f["id"] in ("spf", "dmarc") for f in fails) else None,
                       "Business interruption from website or system outage",
                       "Regulatory defence and penalties (where insurable)"] if x]})
    await db.cyber_scans.insert_one(dict(result))
    return result


@api.get("/cyber/scans")
async def cyber_list():
    return await db.cyber_scans.find({}, {"_id": 0, "id": 1, "domain": 1, "score": 1, "grade": 1, "country": 1, "scanned_at": 1, "business_name": 1}).sort("scanned_at", -1).to_list(50)


@api.get("/cyber/scans/{scan_id}")
async def cyber_get(scan_id: str):
    s = await db.cyber_scans.find_one({"id": scan_id}, NO_ID)
    if not s:
        raise HTTPException(404, "Scan not found")
    return s


@api.post("/console/reset-demo")
async def reset_demo():
    await seed(db, force=True)
    await db.cyber_scans.delete_many({})
    return {"ok": True}


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
