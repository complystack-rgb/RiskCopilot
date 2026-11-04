# Iteration 5 regression: ABC Insure white-label platform (console stats, cases, workflow, partner API, geo, team)
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
KEY = {"X-API-Key": "cs_demo_zurich_7f3a91c2"}
STATE = {}


@pytest.fixture(scope="module")
def s():
    x = requests.Session()
    x.headers.update({"Content-Type": "application/json"})
    return x


# --- Console stats per market
@pytest.mark.parametrize("m", ["IN", "MY", "ID"])
def test_stats_market(s, m):
    r = s.get(f"{API}/console/stats", params={"market": m}, timeout=30)
    assert r.status_code == 200
    d = r.json()
    for k in ("active", "open_gap", "gap_closed", "pipeline_premium", "bound_premium", "win_rate", "avg_days_to_proposal", "sla_at_risk", "underinsured_pct", "uninsured_pct"):
        assert k in d["kpis"]
    assert d["kpis"]["total"] > 0
    assert len(d["monthly"]) == 6 and len(d["pipeline"]) == 9
    assert d["team"] and d["insights"]


def test_stats_bad_market(s):
    r = s.get(f"{API}/console/stats", params={"market": "XX"}, timeout=30)
    STATE["bad_market_status"] = r.status_code
    assert r.status_code in (200, 400, 404, 422), r.text[:200]


def test_meta_no_zurich(s):
    r = s.get(f"{API}/console/meta", timeout=30)
    assert r.status_code == 200
    assert set(r.json()["markets"].keys()) >= {"IN", "MY", "ID"}
    assert "zurich" not in r.text.lower(), "Zurich text leaks via /console/meta"


# --- Cases list & filters
@pytest.mark.parametrize("m,lead", [("IN", "ZIN-26001"), ("MY", "ZMY-26001"), ("ID", "ZID-26001")])
def test_cases_market(s, m, lead):
    r = s.get(f"{API}/cases", params={"market": m}, timeout=30)
    assert r.status_code == 200
    rows = r.json()
    assert all(c["market"] == m for c in rows)
    assert lead in [c["lead_id"] for c in rows]
    assert "_id" not in rows[0]


def test_cases_filters(s):
    r = s.get(f"{API}/cases", params={"market": "IN", "status": "new"}, timeout=30)
    assert r.status_code == 200 and all(c["status"] == "new" for c in r.json())
    r = s.get(f"{API}/cases", params={"market": "IN", "q": "("}, timeout=30)
    assert r.status_code == 200
    r = s.get(f"{API}/cases", params={"market": "IN", "band": "High"}, timeout=30)
    assert r.status_code == 200 and all(c["assessment"]["risk_band"] == "High" for c in r.json())


# --- SME submit creates case
def test_create_case_validation(s):
    r = s.post(f"{API}/cases", json={"journey": {"businessName": "TEST_x"}, "email": "bad", "phone": "9876543210"}, timeout=30)
    assert r.status_code == 422
    r = s.post(f"{API}/cases", json={"journey": {"businessName": "TEST_x"}}, timeout=30)
    assert r.status_code == 422


def test_create_case(s):
    body = {"journey": {"businessName": "TEST_Iter5 Weaving", "category": "manufacturing", "activity": "Textile weaving", "city": "Surat", "state": "Gujarat",
                        "lat": 21.17, "lon": 72.83, "address": "TEST address Surat", "hasInsurance": "No"},
            "email": "test_iter5@example.com", "phone": "9876543210"}
    r = s.post(f"{API}/cases", json=body, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["lead_id"].startswith("ZIN-")
    STATE["lead"], STATE["cid"] = d["lead_id"], d["case_id"]
    g = s.get(f"{API}/cases/{d['case_id']}", timeout=30).json()
    assert g["sme"]["business_name"] == "TEST_Iter5 Weaving" and g["status"] == "new" and g["market"] == "IN"
    assert g["sme"]["email"] == "test_iter5@example.com"


# --- Workflow transitions on our own TEST case
def test_workflow(s):
    cid = STATE.get("cid") or pytest.skip("no case")
    a = {"actor": "TEST_agent"}
    assert s.post(f"{API}/cases/{cid}/status", json={**a, "status": "visited"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/proposal", json={**a, "products": ["property"], "justification": "x"}).status_code == 400
    assert s.post(f"{API}/v1/leads/{STATE['lead']}/decision", json={"decision": "approve"}, headers=KEY).status_code == 409
    for st in ("contacted", "visit_scheduled", "visited"):
        r = s.post(f"{API}/cases/{cid}/status", json={**a, "status": st})
        assert r.status_code == 200 and r.json()["status"] == st
    r = s.post(f"{API}/cases/{cid}/proposal", json={**a, "products": ["bogus"], "justification": "x"})
    assert r.status_code == 400
    c = s.get(f"{API}/cases/{cid}").json()
    prods = [x["product_id"] for x in c["assessment"]["recommendations"]][:2]
    r = s.post(f"{API}/cases/{cid}/proposal", json={**a, "products": prods, "justification": "TEST justification"})
    assert r.status_code == 200 and r.json()["status"] == "proposal_submitted"
    assert r.json()["proposal"]["products"] == prods


def test_notes_checklist(s):
    cid = STATE.get("cid") or pytest.skip("no case")
    r = s.post(f"{API}/cases/{cid}/notes", json={"actor": "TEST_agent", "text": "TEST_note"})
    assert r.status_code == 200 and r.json()["activity"][-1]["text" if "text" in r.json()["activity"][-1] else "detail"] is not None
    r = s.post(f"{API}/cases/{cid}/checklist", json={"actor": "TEST_agent", "done": [0, 99]})
    assert r.status_code == 200 and r.json()["checklist_done"] == [0]


# --- Partner API
def test_partner_api_auth(s):
    assert s.get(f"{API}/v1/leads/ZIN-26001").status_code == 401
    assert s.get(f"{API}/v1/leads/ZIN-26001", headers={"X-API-Key": "wrong"}).status_code == 401
    r = s.get(f"{API}/v1/leads/ZIN-26001", headers=KEY)
    assert r.status_code == 200 and r.json()["lead_id"] == "ZIN-26001" and r.json()["currency"] == "INR"
    assert s.get(f"{API}/v1/leads/ZIN-99999", headers=KEY).status_code == 404
    r = s.get(f"{API}/v1/leads", params={"market": "MY"}, headers=KEY)
    assert r.status_code == 200 and all(l["market"] == "MY" for l in r.json()["leads"])


def test_partner_decision(s):
    lead = STATE.get("lead") or pytest.skip("no case")
    assert s.post(f"{API}/v1/leads/{lead}/decision", json={"decision": "approve"}).status_code == 401
    assert s.post(f"{API}/v1/leads/{lead}/decision", json={"decision": "maybe"}, headers=KEY).status_code == 400
    assert s.post(f"{API}/v1/leads/{lead}/decision", json={"decision": "request_info", "comment": " "}, headers=KEY).status_code == 400
    r = s.post(f"{API}/v1/leads/{lead}/decision", json={"decision": "request_info", "comment": "TEST need photos"}, headers=KEY)
    assert r.status_code == 200 and r.json()["status"] == "info_requested"
    # resubmit then approve via sandbox
    c = s.get(f"{API}/cases/{STATE['cid']}").json()
    r = s.post(f"{API}/cases/{STATE['cid']}/proposal", json={"actor": "TEST_agent", "products": c["proposal"]["products"], "justification": "TEST resubmit"})
    assert r.status_code == 200
    r = s.post(f"{API}/developer/leads/{lead.lower()}/decision", json={"decision": "approve"})
    assert r.status_code == 200 and r.json()["status"] == "quoted" and r.json()["insurer_decision"]["decision"] == "approve"
    assert s.post(f"{API}/v1/leads/{lead}/decision", json={"decision": "approve"}, headers=KEY).status_code == 409


def test_seed_proposal_leads_status(s):
    for lead in ("ZIN-26002", "ZMY-26001", "ZID-26003"):
        r = s.get(f"{API}/developer/leads/{lead}")
        assert r.status_code == 200
        STATE[lead] = r.json()["status"]
    assert all(STATE[l] == "proposal_submitted" for l in ("ZIN-26002", "ZMY-26001", "ZID-26003")), STATE


# --- Geo (live open data)
def test_geo(s):
    r = s.get(f"{API}/geo/search", params={"q": "Surat"}, timeout=40)
    assert r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
    assert s.get(f"{API}/geo/search", params={"q": "ab"}).json() == []
    r = s.get(f"{API}/geo/climate", params={"lat": 21.17, "lon": 72.83}, timeout=60)
    assert r.status_code == 200
    r = s.get(f"{API}/geo/surroundings", params={"lat": 21.17, "lon": 72.83}, timeout=90)
    assert r.status_code in (200, 502)


# --- Team
def test_team(s):
    r = s.post(f"{API}/orgs/org-bharat/agents", json={"name": "TEST_Agent Iter5", "email": "test_iter5_agent@example.com", "city": "Surat"})
    if r.status_code == 400:
        pytest.skip("agent exists from previous run")
    assert r.status_code == 200
    aid = r.json()["id"]
    assert s.post(f"{API}/orgs/org-bharat/agents", json={"name": "TEST_Agent Iter5", "email": "TEST_ITER5_AGENT@example.com", "city": "Surat"}).status_code == 400
    r = s.patch(f"{API}/agents/{aid}", json={"active": False})
    assert r.status_code == 200 and r.json()["active"] is False
    assert s.patch(f"{API}/agents/ag-nope", json={"active": False}).status_code == 404
    assert s.post(f"{API}/orgs/org-nope/agents", json={"name": "TEST_x", "email": "t@x.com", "city": "Surat"}).status_code == 404
