from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from collections import defaultdict
from pathlib import Path
import os
import asyncio
import re
import uuid
import random
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from markets import MARKETS, CATEGORIES, HEROES  # noqa: E402
from engine import build_case, advisory, ev, now  # noqa: E402
from seed import seed  # noqa: E402
import geo  # noqa: E402

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
app = FastAPI(title="ComplyStack API")
api = APIRouter(prefix="/api")
NO_ID = {"_id": 0}
CLOSED = {"bound", "lost"}
FLOW = {"new": {"contacted", "lost"}, "contacted": {"visit_scheduled", "lost"}, "visit_scheduled": {"visited", "contacted", "lost"}, "visited": {"lost"},
        "proposal_submitted": {"lost"}, "info_requested": {"lost"}, "quoted": {"bound", "lost"}}
PROPOSABLE = {"visited", "info_requested", "proposal_submitted"}
REGION = {"Tamil Nadu": "org-kavach", "Karnataka": "org-kavach", "Kerala": "org-kavach", "Madhya Pradesh": "org-kavach", "Andhra Pradesh": "org-kavach", "Telangana": "org-kavach"}


import hmac as _hmac
import hashlib as _hashlib
import secrets as _secrets
import time as _time

AUTH_ALLOWED_EMAILS = {"jay@complystack.io"}
_AUTH_SECRET = os.environ.get("AUTH_SECRET") or _secrets.token_hex(32)
SESSION_SECONDS = 12 * 3600


def _auth_sign(payload):
    return _hmac.new(_AUTH_SECRET.encode(), payload.encode(), _hashlib.sha256).hexdigest()


def _auth_make_token(email):
    payload = f"{email}|{int(_time.time()) + SESSION_SECONDS}"
    return f"{payload}.{_auth_sign(payload)}"


def _auth_check_token(token):
    if not token or "." not in token:
        return None
    payload, sig = token.rsplit(".", 1)
    if not _hmac.compare_digest(sig, _auth_sign(payload)):
        return None
    email, _, exp = payload.partition("|")
    if not exp.isdigit() or int(exp) < _time.time():
        return None
    return email


def require_session(authorization: Optional[str] = Header(None)):
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else None
    email = _auth_check_token(token)
    if not email:
        raise HTTPException(401, "Sign in required")
    return email


class LoginIn(BaseModel):
    email: str


def iso():
    return datetime.now(timezone.utc).isoformat()


class SmeSubmit(BaseModel):
    journey: dict
    assessment: Optional[dict] = None
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str = Field(min_length=8)


class Actor(BaseModel):
    actor: str


class AssignIn(Actor):
    agent_id: str


class StatusIn(Actor):
    status: str
    note: Optional[str] = None


class NoteIn(Actor):
    text: str = Field(min_length=1, max_length=2000)


class CheckIn(Actor):
    done: List[int]


class ProposalIn(Actor):
    products: List[str]
    justification: str


class DecisionIn(BaseModel):
    decision: str
    comment: str = ""


class AgentIn(BaseModel):
    name: str = Field(min_length=2)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    city: str = Field(min_length=2)
    role: str = "agent"


class AgentPatch(BaseModel):
    active: bool


async def get_case(cid):
    c = await db.cases.find_one({"$or": [{"id": cid}, {"lead_id": cid}]}, NO_ID)
    if not c:
        raise HTTPException(404, "Case not found")
    return c


async def push(cid, update, event):
    update.setdefault("$set", {})["updated_at"] = iso()
    update["$push"] = {"activity": event}
    await db.cases.update_one({"id": cid}, update)
    return await get_case(cid)


async def warm_geo(points):
    for lat, lon in points:
        for kind, fn in (("surroundings", geo.surroundings), ("climate", geo.climate)):
            try:
                await cached(kind, lat, lon, fn)
            except Exception:
                pass


@app.on_event("startup")
async def startup():
    await seed(db)
    await db.cases.create_index("lead_id", unique=True)
    pts = [(c["sme"]["lat"], c["sme"]["lon"]) async for c in db.cases.find({}, {"sme.lat": 1, "sme.lon": 1})]
    asyncio.create_task(warm_geo(pts))


@api.get("/")
async def root():
    return {"service": "ComplyStack", "status": "ok"}


@api.post("/auth/login")
async def auth_login(body: LoginIn):
    email = body.email.strip().lower()
    if email not in AUTH_ALLOWED_EMAILS:
        raise HTTPException(403, "This email is not authorised for console access")
    return {"token": _auth_make_token(email), "email": email, "expires_in": SESSION_SECONDS}


@api.get("/auth/me")
async def auth_me(user: str = Depends(require_session)):
    return {"email": user}


@api.get("/console/meta", dependencies=[Depends(require_session)])
async def meta():
    return {"markets": MARKETS, "categories": CATEGORIES, "orgs": await db.orgs.find({}, NO_ID).to_list(100), "agents": await db.agents.find({}, NO_ID).to_list(500)}


def scope(market, org_id=None, agent_id=None):
    q = {"market": market}
    if org_id:
        q["distributor_id"] = org_id
    if agent_id:
        q["agent_id"] = agent_id
    return q


@api.get("/console/stats", dependencies=[Depends(require_session)])
async def stats(market: str, org_id: Optional[str] = None, agent_id: Optional[str] = None):
    cs = await db.cases.find(scope(market, org_id, agent_id), {"_id": 0, "photos": 0, "video": 0, "activity": 0}).to_list(3000)
    t = datetime.now(timezone.utc)
    opn = [c for c in cs if c["status"] not in CLOSED]
    bound = [c for c in cs if c["status"] == "bound"]
    lost = [c for c in cs if c["status"] == "lost"]
    won = [c for c in cs if c["status"] in ("quoted", "bound")]
    prem = lambda c: c["proposal"]["premium"] if c.get("proposal") else sum(r["premium"] for r in c["assessment"]["recommendations"] if r["priority"] != "Optional")  # noqa: E731
    closed_gap = lambda c: sum(g["uncovered_value"] for g in c["assessment"]["gaps"] if g["category"] in c["proposal"]["products"]) if c.get("proposal") else 0  # noqa: E731
    days = [(datetime.fromisoformat(c["proposal"]["submitted_at"]) - datetime.fromisoformat(c["created_at"])).total_seconds() / 86400 for c in cs if c.get("proposal")]
    at_risk = [c for c in opn if c["status"] in ("new", "contacted", "visit_scheduled", "visited") and datetime.fromisoformat(c["sla_due"]) < t + timedelta(hours=12)]
    months = []
    for i in range(5, -1, -1):
        y, mo = t.year, t.month - i
        while mo <= 0:
            mo += 12; y -= 1
        key = f"{y}-{mo:02d}"
        mc = [c for c in cs if c["created_at"][:7] == key]
        mb = [c for c in mc if c["status"] == "bound"]
        months.append({"month": datetime(y, mo, 1).strftime("%b"), "assessments": len(mc), "bound": len(mb), "bound_premium": sum(prem(c) for c in mb),
                       "gap": sum(c["assessment"]["protection_gap"] for c in mc)})
    gapcat = {k: {"category": k, "label": v, "identified": 0, "closed": 0, "cases": 0} for k, v in CATEGORIES.items()}
    for c in cs:
        for g in c["assessment"]["gaps"]:
            gc = gapcat[g["category"]]; gc["identified"] += g["uncovered_value"]; gc["cases"] += 1
            if c["status"] in ("quoted", "bound") and c.get("proposal") and g["category"] in c["proposal"]["products"]:
                gc["closed"] += g["uncovered_value"]
    bands = defaultdict(int)
    for c in opn:
        bands[c["assessment"]["risk_band"]] += 1
    pipe = [{"status": s, "count": sum(c["status"] == s for c in cs), "value": sum(prem(c) for c in cs if c["status"] == s)} for s in FLOW.keys() | CLOSED]
    inds = defaultdict(lambda: {"cases": 0, "gap": 0})
    for c in cs:
        inds[c["sme"]["industry"]]["cases"] += 1; inds[c["sme"]["industry"]]["gap"] += c["assessment"]["protection_gap"]
    no_bi = [c for c in cs if any(g["category"] == "bi" and not g["covered"] for g in c["assessment"]["gaps"])]
    under = [c for c in cs if c.get("prior_policy") and c["assessment"]["coverage_ratio"] < 0.8]
    unins = [c for c in cs if not c.get("prior_policy")]
    top_gap = max(gapcat.values(), key=lambda x: x["identified"])
    machinery_gap = [c for c in cs if any(g["category"] == "machinery" for g in c["assessment"]["gaps"])]
    insights = [
        {"tone": "risk", "title": f"{len(no_bi)} of {len(cs)} clients have no business interruption cover", "body": "A single fire would stop their income while fixed costs keep running. Lead with income protection on these accounts.", "category": "bi", "value": sum(g["uncovered_value"] for c in no_bi for g in c["assessment"]["gaps"] if g["category"] == "bi")},
        {"tone": "gap", "title": f"{top_gap['label']} is the largest protection gap in your book", "body": f"{top_gap['cases']} clients are exposed in this category. Only {round(100 * top_gap['closed'] / top_gap['identified']) if top_gap['identified'] else 0}% of it has been closed through proposals so far.", "category": top_gap["category"], "value": top_gap["identified"]},
        {"tone": "opportunity", "title": f"{len(under)} insured clients cover less than 80% of what we observed", "body": "If the average clause applies, their claims would be cut in proportion. Each is an easy uplift conversation at renewal.", "category": "property", "value": sum(c["assessment"]["protection_gap"] for c in under)},
        {"tone": "opportunity", "title": f"{len(machinery_gap)} clients run ageing machinery without breakdown cover", "body": "Plate readings show key machines are often more than ten years old. Machinery breakdown cover is rarely sold, so it is an easy add-on.", "category": "machinery", "value": sum(g["uncovered_value"] for c in machinery_gap for g in c["assessment"]["gaps"] if g["category"] == "machinery")},
    ]
    attention = []
    for c in opn:
        if c["status"] == "info_requested":
            attention.append((0, c, "Insurer asked for more information"))
        elif c in at_risk:
            attention.append((1, c, "SLA breaches within 12 hours" if datetime.fromisoformat(c["sla_due"]) > t else "SLA breached"))
        elif c["status"] == "new":
            attention.append((2, c, "New lead not yet contacted"))
        elif c["status"] == "quoted":
            attention.append((3, c, "Quote ready, waiting for the client to bind"))
    attention.sort(key=lambda x: x[0])
    agents = await db.agents.find({"market": market, "role": "agent"}, NO_ID).to_list(100)
    team = [{"id": a["id"], "name": a["name"], "open": sum(c["agent_id"] == a["id"] and c["status"] not in CLOSED for c in cs),
             "bound": sum(c["agent_id"] == a["id"] and c["status"] == "bound" for c in cs), "premium": sum(prem(c) for c in bound if c["agent_id"] == a["id"])} for a in agents]
    return {
        "kpis": {"active": len(opn), "open_gap": sum(c["assessment"]["protection_gap"] for c in opn), "protection_gap": sum(c["assessment"]["protection_gap"] for c in cs), "gap_closed": sum(closed_gap(c) for c in won),
                 "pipeline_premium": sum(prem(c) for c in opn), "bound_premium": sum(prem(c) for c in bound), "win_rate": round(100 * len(bound) / (len(bound) + len(lost))) if bound or lost else 0,
                 "avg_days_to_proposal": round(sum(days) / len(days), 1) if days else 0, "sla_at_risk": len(at_risk), "total": len(cs),
                 "underinsured_pct": round(100 * len(under) / len(cs)) if cs else 0, "uninsured_pct": round(100 * len(unins) / len(cs)) if cs else 0, "bound": len(bound)},
        "monthly": months, "gap_by_category": [g for g in gapcat.values() if g["identified"]], "bands": bands,
        "pipeline": sorted(pipe, key=lambda p: ["new", "contacted", "visit_scheduled", "visited", "proposal_submitted", "info_requested", "quoted", "bound", "lost"].index(p["status"])),
        "industries": sorted([{"industry": k, **v} for k, v in inds.items()], key=lambda x: -x["gap"])[:7], "insights": insights,
        "attention": [{"id": c["id"], "lead_id": c["lead_id"], "name": c["sme"]["business_name"], "reason": r, "status": c["status"], "gap": c["assessment"]["protection_gap"], "agent_id": c["agent_id"]} for _, c, r in attention[:7]],
        "team": sorted(team, key=lambda x: -x["premium"]),
    }


LIST_PROJ = {"_id": 0, "id": 1, "lead_id": 1, "market": 1, "created_at": 1, "updated_at": 1, "sme": 1, "status": 1, "sla_due": 1, "distributor_id": 1, "agent_id": 1, "flags": 1, "source": 1,
             "assessment.risk_score": 1, "assessment.risk_band": 1, "assessment.protection_gap": 1, "assessment.total_insurable": 1, "assessment.gaps": 1, "proposal": 1, "decision": 1, "image_key": 1}


@api.get("/cases", dependencies=[Depends(require_session)])
async def list_cases(market: str, org_id: Optional[str] = None, agent_id: Optional[str] = None, status: Optional[str] = None, band: Optional[str] = None,
                     category: Optional[str] = None, q: Optional[str] = None):
    query = scope(market, org_id, agent_id)
    if status:
        query["status"] = status
    if band:
        query["assessment.risk_band"] = band
    if category:
        query["assessment.gaps.category"] = category
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query["$or"] = [{"lead_id": rx}, {"sme.business_name": rx}, {"sme.city": rx}, {"sme.industry": rx}]
    return await db.cases.find(query, LIST_PROJ).sort("updated_at", -1).to_list(1000)


@api.get("/cases/{cid}")
async def case_detail(cid: str):
    return await get_case(cid)


@api.post("/cases")
async def create_case(body: SmeSubmit):
    j = body.journey
    if not j.get("businessName"):
        raise HTTPException(400, "Business name is required")
    market = j.get("market") if j.get("market") in MARKETS else "IN"
    act = (j.get("activity") or j.get("category") or "").lower()
    key = "in1" if "textile" in act or "weav" in act else "in5" if "garment" in act or "apparel" in act else "in2" if "food" in act or "hospitality" in act else \
          "in4" if "pharma" in act or "health" in act else "in6" if "logistic" in act or "transport" in act or "wholesale" in act else "in3"
    if market == "IN":
        hero = list(next(h for h in HEROES if h[0] == key))
        hero[2] = REGION.get(j.get("state"), "org-bharat")
    else:
        pool = [h for h in HEROES if h[1] == market]
        hero = list(next((h for h in pool if any(w in h[6].lower() for w in act.split() if len(w) > 3)), pool[0]))
    hero[3], hero[4], hero[5] = j["businessName"], j.get("city") or j.get("state") or hero[4], j.get("state") or hero[5]
    hero[6] = j.get("activity") or {"manufacturing": "Manufacturing", "retail": "Retail", "wholesale": "Wholesale and distribution", "it": "IT services", "hospitality": "Hospitality and food services",
                                    "healthcare": "Healthcare", "transport": "Transport and logistics"}.get(j.get("category"), (j.get("category") or hero[6]).title())
    hc = re.findall(r"\d+", j.get("headcount") or "")
    if hc:
        hero[7] = max(1, round(sum(map(int, hc)) / len(hc))) if len(hc) <= 2 else hero[7]
    elif j.get("headcount") == "Just me":
        hero[7] = 1
    if j.get("headcount") == "More than 100":
        hero[7] = 140
    hero[13] = "new"
    if j.get("hasInsurance") != "Yes":
        hero[12] = None
    ctr = await db.counters.find_one_and_update({"_id": f"lead-{market}"}, {"$inc": {"n": 1}}, upsert=True, return_document=True)
    agents = await db.agents.find({"active": True, "market": market}, NO_ID).to_list(500)
    c = build_case(tuple(hero), ctr["n"], random.Random(), agents, created=datetime.now(timezone.utc))
    c["source"] = "sme_journey"
    c["sme"].update({"email": body.email, "phone": body.phone, "contact_name": j.get("contactName") or "Not provided",
                     "registration": [{"label": str(r.get("label", ""))[:80], "value": str(r.get("value", ""))[:60]} for r in (j.get("registration") or [])[:5] if isinstance(r, dict)]})
    if j.get("lat") and j.get("lon"):
        c["sme"].update({"lat": j["lat"], "lon": j["lon"], "address": j.get("address") or c["sme"]["address"]})
    c["sme_answers"] = {k: j.get(k) for k in ("category", "activity", "headcount", "revenueBand", "priorities", "premisesOwnership", "hasInsurance")}
    c["sme_assessment"] = body.assessment
    c["sla_due"] = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
    await db.cases.insert_one(dict(c))
    agent = next(a for a in agents if a["id"] == c["agent_id"])
    org = await db.orgs.find_one({"id": c["distributor_id"]}, NO_ID)
    asyncio.create_task(warm_geo([(c["sme"]["lat"], c["sme"]["lon"])]))
    return {"lead_id": c["lead_id"], "case_id": c["id"], "distributor": org["name"], "agent": agent["name"], "sla_due": c["sla_due"]}


@api.post("/cases/{cid}/assign", dependencies=[Depends(require_session)])
async def assign(cid: str, body: AssignIn):
    c = await get_case(cid)
    if c["status"] in CLOSED:
        raise HTTPException(400, "Closed cases cannot be reassigned")
    a = await db.agents.find_one({"id": body.agent_id, "active": True}, NO_ID)
    if not a:
        raise HTTPException(404, "Active agent not found")
    return await push(c["id"], {"$set": {"agent_id": a["id"], "distributor_id": a["org_id"]}}, ev(body.actor, "assigned", f"Reassigned to {a['name']}", datetime.now(timezone.utc)))


LABELS = {"contacted": "Client contacted", "visit_scheduled": "Site visit scheduled", "visited": "Site visit completed", "bound": "Policy bound", "lost": "Marked as lost"}


@api.post("/cases/{cid}/status", dependencies=[Depends(require_session)])
async def set_status(cid: str, body: StatusIn):
    c = await get_case(cid)
    if body.status not in FLOW.get(c["status"], set()):
        raise HTTPException(400, f"Cannot move from {c['status']} to {body.status}")
    return await push(c["id"], {"$set": {"status": body.status}}, ev(body.actor, body.status, body.note or LABELS[body.status], datetime.now(timezone.utc)))


@api.post("/cases/{cid}/notes", dependencies=[Depends(require_session)])
async def add_note(cid: str, body: NoteIn):
    c = await get_case(cid)
    return await push(c["id"], {}, ev(body.actor, "note", body.text, datetime.now(timezone.utc)))


@api.post("/cases/{cid}/checklist", dependencies=[Depends(require_session)])
async def checklist(cid: str, body: CheckIn):
    c = await get_case(cid)
    done = sorted({i for i in body.done if 0 <= i < len(c["checklist"])})
    return await push(c["id"], {"$set": {"checklist_done": done}}, ev(body.actor, "checklist", f"Site checklist {len(done)}/{len(c['checklist'])} verified", datetime.now(timezone.utc)))


@api.post("/cases/{cid}/proposal", dependencies=[Depends(require_session)])
async def proposal(cid: str, body: ProposalIn):
    c = await get_case(cid)
    if c["status"] not in PROPOSABLE:
        raise HTTPException(400, "Complete the site visit before submitting a proposal")
    if not body.products or any(p not in CATEGORIES for p in body.products):
        raise HTTPException(400, "Select at least one valid cover")
    recs = c["assessment"]["recommendations"]
    flags = advisory(recs, body.products, body.justification)
    p = {"products": body.products, "justification": body.justification, "by": body.actor, "submitted_at": iso(), "premium": sum(r["premium"] for r in recs if r["product_id"] in body.products)}
    return await push(c["id"], {"$set": {"proposal": p, "flags": flags, "status": "proposal_submitted", "decision": None}},
                      ev(body.actor, "proposal_submitted", f"Proposal with {len(body.products)} covers sent to {MARKETS[c['market']]['insurer'].split()[0]} insurer", datetime.now(timezone.utc)))


def package(c, orgs, agents):
    a = c["assessment"]
    return {"lead_id": c["lead_id"], "market": c["market"], "currency": MARKETS[c["market"]]["currency"], "status": c["status"], "created_at": c["created_at"], "updated_at": c["updated_at"],
            "attribution": {"distributor_id": c["distributor_id"], "distributor_name": orgs.get(c["distributor_id"], {}).get("name"), "agent_id": c["agent_id"], "agent_name": agents.get(c["agent_id"], {}).get("name")},
            "sme": {k: c["sme"].get(k) for k in ("business_name", "industry", "city", "region", "country", "employees", "revenue", "lat", "lon")},
            "risk": {"score": a["risk_score"], "band": a["risk_band"], "findings": [{k: i[k] for k in ("id", "finding", "severity", "category")} for i in c["indicators"]]},
            "exposure": a["exposure"], "asset_values": a["values"], "protection_gaps": a["gaps"], "coverage_ratio": a["coverage_ratio"],
            "machinery": c["machinery"], "prior_policy": c["prior_policy"],
            "evidence": {"photos": [{"id": p["id"], "title": p["title"], "source": p["source"], "url": p["image"]} for p in c["photos"]], "video_flags": [f for f in c["video"]["frames"] if f["severity"] in ("High", "Elevated")]},
            "recommendations": [{k: r[k] for k in ("product_id", "name", "priority", "premium_range", "sum_insured", "reason")} for r in a["recommendations"]],
            "broker_proposal": c.get("proposal"), "advisory_checks": c.get("flags", []), "insurer_decision": c.get("decision")}


async def maps():
    return {o["id"]: o for o in await db.orgs.find({}, NO_ID).to_list(100)}, {a["id"]: a for a in await db.agents.find({}, NO_ID).to_list(500)}


async def apply_decision(lead_id, body: DecisionIn, via):
    status = {"approve": "quoted", "request_info": "info_requested", "decline": "lost"}.get(body.decision)
    if not status:
        raise HTTPException(400, "decision must be approve, request_info or decline")
    c = await db.cases.find_one({"lead_id": lead_id}, NO_ID)
    if not c:
        raise HTTPException(404, "Lead not found")
    if c["status"] != "proposal_submitted":
        raise HTTPException(409, f"Lead is in status '{c['status']}'. A decision needs a submitted proposal.")
    if body.decision == "request_info" and not body.comment.strip():
        raise HTTPException(400, "comment is required when requesting information")
    d = {"decision": body.decision, "comment": body.comment, "by": "ABC Insure Admin Hub", "at": iso(), "via": via}
    c = await push(c["id"], {"$set": {"decision": d, "status": status}}, ev("ABC Insure Admin Hub", status, (body.comment or status.replace("_", " ").capitalize()) + f" (via {via})", datetime.now(timezone.utc)))
    return package(c, *await maps())


def check_key(k):
    if k != os.environ["CS_PARTNER_API_KEY"]:
        raise HTTPException(401, "Invalid or missing X-API-Key")


@api.get("/v1/leads/{lead_id}")
async def v1_lead(lead_id: str, x_api_key: Optional[str] = Header(None)):
    check_key(x_api_key)
    c = await db.cases.find_one({"lead_id": lead_id}, NO_ID)
    if not c:
        raise HTTPException(404, "Lead not found")
    return package(c, *await maps())


@api.get("/v1/leads")
async def v1_leads(market: Optional[str] = None, distributor_id: Optional[str] = None, agent_id: Optional[str] = None, x_api_key: Optional[str] = Header(None)):
    check_key(x_api_key)
    q = {k: v for k, v in {"market": market, "distributor_id": distributor_id, "agent_id": agent_id}.items() if v}
    cs = await db.cases.find(q, NO_ID).to_list(1000)
    m = await maps()
    return {"count": len(cs), "leads": [package(c, *m) for c in cs]}


@api.post("/v1/leads/{lead_id}/decision")
async def v1_decision(lead_id: str, body: DecisionIn, x_api_key: Optional[str] = Header(None)):
    check_key(x_api_key)
    return await apply_decision(lead_id, body, "API")


@api.get("/developer/leads/{lead_id}", dependencies=[Depends(require_session)])
async def dev_lead(lead_id: str):
    c = await db.cases.find_one({"lead_id": lead_id.strip().upper()}, NO_ID)
    if not c:
        raise HTTPException(404, "Lead not found")
    return package(c, *await maps())


@api.post("/developer/leads/{lead_id}/decision", dependencies=[Depends(require_session)])
async def dev_decision(lead_id: str, body: DecisionIn):
    return await apply_decision(lead_id.strip().upper(), body, "API sandbox")


@api.post("/orgs/{org_id}/agents", dependencies=[Depends(require_session)])
async def add_agent(org_id: str, body: AgentIn):
    org = await db.orgs.find_one({"id": org_id}, NO_ID)
    if not org:
        raise HTTPException(404, "Organisation not found")
    if await db.agents.find_one({"email": body.email.lower()}):
        raise HTTPException(400, "A user with this email already exists")
    a = {"id": f"ag-{uuid.uuid4().hex[:8]}", "org_id": org_id, "market": org["market"], "name": body.name, "email": body.email.lower(), "city": body.city,
         "role": body.role if body.role in ("agent", "admin") else "agent", "active": True, "created_at": iso()}
    await db.agents.insert_one(dict(a))
    return a


@api.patch("/agents/{agent_id}", dependencies=[Depends(require_session)])
async def patch_agent(agent_id: str, body: AgentPatch):
    if not (await db.agents.update_one({"id": agent_id}, {"$set": {"active": body.active}})).matched_count:
        raise HTTPException(404, "Agent not found")
    return await db.agents.find_one({"id": agent_id}, NO_ID)


@api.get("/agents/workload", dependencies=[Depends(require_session)])
async def workload(org_id: str):
    agents = await db.agents.find({"org_id": org_id}, NO_ID).to_list(500)
    for a in agents:
        a["open_cases"] = await db.cases.count_documents({"agent_id": a["id"], "status": {"$nin": list(CLOSED)}})
        a["bound"] = await db.cases.count_documents({"agent_id": a["id"], "status": "bound"})
    return agents


async def cached(kind, lat, lon, fn):
    key = f"{kind}:{round(lat, 3)}:{round(lon, 3)}"
    hit = await db.geo_cache.find_one({"_id": key})
    if hit:
        return hit["data"]
    try:
        data = await fn(lat, lon)
    except Exception as e:
        raise HTTPException(502, f"Open data service unavailable: {e.__class__.__name__}")
    if kind != "surroundings" or (data.get("available") and data.get("counts")):
        await db.geo_cache.update_one({"_id": key}, {"$set": {"data": data}}, upsert=True)
    return data


@api.get("/geo/surroundings")
async def geo_surroundings(lat: float, lon: float):
    return await cached("surroundings", lat, lon, geo.surroundings)


@api.get("/geo/climate")
async def geo_climate(lat: float, lon: float):
    return await cached("climate", lat, lon, geo.climate)


@api.get("/geo/search")
async def geo_search(q: str):
    if len(q.strip()) < 3:
        return []
    try:
        return await geo.search(q)
    except Exception:
        raise HTTPException(502, "Address search unavailable")


@api.get("/geo/reverse")
async def geo_reverse(lat: float, lon: float):
    try:
        return await geo.reverse(lat, lon)
    except Exception:
        raise HTTPException(502, "Reverse geocoding unavailable")


app.include_router(api)
_cors_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', 'https://app.riskcopilot.complystack.io').split(',') if o.strip()]
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=_cors_origins, allow_methods=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
