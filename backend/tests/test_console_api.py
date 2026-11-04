"""Partner Console API regression tests (cases, workflow, partner API, team, cyber)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
KEY = "cs_demo_zurich_7f3a91c2"


@pytest.fixture(scope="module")
def s():
    r = requests.post(f"{API}/console/reset-demo")
    assert r.status_code == 200
    ss = requests.Session()
    yield ss


JOURNEY = {"businessName": "TEST_Textiles Pvt", "category": "manufacturing", "activity": "Textiles and garments",
           "city": "Coimbatore", "state": "Tamil Nadu", "headcount": "21-50", "hasInsurance": "Yes"}


# ---- meta / stats ----
def test_meta(s):
    d = s.get(f"{API}/console/meta").json()
    assert len(d["orgs"]) == 3 and len(d["agents"]) == 9
    assert any(p["state"] == "Live" for p in d["product_lines"])


def test_stats_scoped(s):
    a = s.get(f"{API}/console/stats").json()
    b = s.get(f"{API}/console/stats", params={"org_id": "org-bharat"}).json()
    c = s.get(f"{API}/console/stats", params={"agent_id": "ag-imran"}).json()
    assert a["total"] == 12
    assert 0 < b["total"] < a["total"]
    assert c["total"] <= b["total"]
    assert all(l["org_id"] == "org-bharat" for l in b["league"])


# ---- cases list / filters ----
def test_cases_filters(s):
    allc = s.get(f"{API}/cases").json()
    assert len(allc) == 12 and "_id" not in allc[0]
    st = allc[0]["status"]
    assert all(c["status"] == st for c in s.get(f"{API}/cases", params={"status": st}).json())
    band = allc[0]["report"]["fire_band"]
    assert all(c["report"]["fire_band"] == band for c in s.get(f"{API}/cases", params={"band": band}).json())
    fl = s.get(f"{API}/cases", params={"flagged": "true"}).json()
    assert all(c["flags"] for c in fl)
    q = s.get(f"{API}/cases", params={"q": "26001"}).json()
    assert len(q) == 1 and q[0]["lead_id"] == "ZIN-FIRE-26001"
    assert all(c["agent_id"] == "ag-imran" for c in s.get(f"{API}/cases", params={"agent_id": "ag-imran"}).json())


def test_cases_q_regex_special_chars(s):
    r = s.get(f"{API}/cases", params={"q": "("})
    assert r.status_code == 200, f"regex special char gives {r.status_code}"


def test_case_detail_by_lead_and_404(s):
    d = s.get(f"{API}/cases/ZIN-FIRE-26001")
    assert d.status_code == 200 and d.json()["lead_id"] == "ZIN-FIRE-26001"
    assert s.get(f"{API}/cases/nope").status_code == 404


# ---- SME submit + workflow ----
@pytest.fixture(scope="module")
def created(s):
    r = s.post(f"{API}/cases", json={"journey": JOURNEY, "contact_name": "TEST_Ravi", "contact_phone": "9876543210"})
    assert r.status_code == 200, r.text
    return r.json()


def test_create_case_autoassign(s, created):
    assert created["lead_id"].startswith("ZIN-FIRE-")
    c = s.get(f"{API}/cases/{created['lead_id']}").json()
    assert c["distributor_id"] == "org-kavach"
    assert c["status"] == "assigned" and c["agent_id"] in ("ag-karthik", "ag-divya")
    assert c["source"] == "sme_journey"


def test_create_case_requires_name(s):
    assert s.post(f"{API}/cases", json={"journey": {}}).status_code == 400


def test_review_without_rec_400(s, created):
    r = s.post(f"{API}/cases/{created['case_id']}/review", json={"decision": "approve", "comment": "x"})
    assert r.status_code == 400


def test_status_and_invalid(s, created):
    cid = created["case_id"]
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "bogus", "actor": "x"}).status_code == 400
    for st in ("inspection_scheduled", "inspected"):
        r = s.post(f"{API}/cases/{cid}/status", json={"status": st, "actor": "TEST_agent"})
        assert r.status_code == 200 and r.json()["status"] == st


def test_notes(s, created):
    r = s.post(f"{API}/cases/{created['case_id']}/notes", json={"text": "TEST_note hello", "actor": "TEST"})
    assert r.status_code == 200
    assert any(n["text"] == "TEST_note hello" for n in r.json()["notes"])


def test_recommendation_flags(s, created):
    cid = created["case_id"]
    c = s.get(f"{API}/cases/{cid}").json()
    engine = {r["product_id"] for r in c["report"]["engine_recommendations"]}
    unsupported = [p for p in s.get(f"{API}/console/meta").json()["catalog"] if p not in engine]
    prods = unsupported[:1] or list(engine)[:1]
    r = s.post(f"{API}/cases/{cid}/recommendation", json={"products": prods, "justification": "short", "actor": "TEST"})
    assert r.status_code == 200
    d = r.json()
    types = {f["type"] for f in d["flags"]}
    assert d["status"] == "recommendation_submitted"
    assert "weak_justification" in types and "overlooked" in types
    if unsupported:
        assert "unsupported" in types
    assert s.post(f"{API}/cases/{cid}/recommendation", json={"products": ["zzz"], "justification": "x", "actor": "T"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/recommendation", json={"products": [], "justification": "x", "actor": "T"}).status_code == 400


def test_recommendation_clean(s, created):
    cid = created["case_id"]
    c = s.get(f"{API}/cases/{cid}").json()
    ess = [r["product_id"] for r in c["report"]["engine_recommendations"] if r["priority"] == "Essential"]
    just = "Evidence shows heavy cotton dust, old wiring and stock storage so fire and stock cover are needed here."
    d = s.post(f"{API}/cases/{cid}/recommendation", json={"products": ess, "justification": just, "actor": "TEST"}).json()
    assert d["flags"] == []


def test_review_and_assign(s, created):
    cid = created["case_id"]
    r = s.post(f"{API}/cases/{cid}/review", json={"decision": "request_justification", "comment": "TEST more"})
    assert r.status_code == 200 and r.json()["status"] == "justification_requested"
    # reassign while open works
    r = s.post(f"{API}/cases/{cid}/assign", json={"agent_id": "ag-imran", "actor": "TEST"})
    assert r.status_code == 200 and r.json()["agent_id"] == "ag-imran" and r.json()["distributor_id"] == "org-bharat"
    assert s.post(f"{API}/cases/{cid}/assign", json={"agent_id": "none", "actor": "T"}).status_code == 404
    # approve not allowed from justification_requested -> agent must resubmit
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "approve", "comment": "x"}).status_code == 400
    c = s.get(f"{API}/cases/{cid}").json()
    s.post(f"{API}/cases/{cid}/recommendation", json={"products": c["agent_recommendation"]["products"], "justification": c["agent_recommendation"]["justification"], "actor": "TEST"})
    r = s.post(f"{API}/cases/{cid}/review", json={"decision": "approve", "comment": "TEST ok"})
    assert r.json()["status"] == "approved" and r.json()["review"]["decision"] == "approve"
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "zz", "comment": ""}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/assign", json={"agent_id": "ag-imran", "actor": "TEST"}).status_code == 400


def test_package(s, created):
    p = s.get(f"{API}/cases/{created['case_id']}/package").json()
    for k in ("lead_id", "attribution", "risk", "assets", "evidence", "recommendations"):
        assert k in p


# ---- partner API ----
def test_partner_api(s, created):
    assert s.get(f"{API}/v1/leads/{created['lead_id']}").status_code == 401
    assert s.get(f"{API}/v1/leads").status_code == 401
    assert s.get(f"{API}/v1/leads", headers={"X-API-Key": "bad"}).status_code == 401
    r = s.get(f"{API}/v1/leads/{created['lead_id']}", headers={"X-API-Key": KEY})
    assert r.status_code == 200 and r.json()["lead_id"] == created["lead_id"]
    r = s.get(f"{API}/v1/leads", params={"distributor_id": "org-kavach"}, headers={"X-API-Key": KEY}).json()
    assert r["count"] == len(r["leads"]) and all(l["attribution"]["distributor_id"] == "org-kavach" for l in r["leads"])
    assert s.get(f"{API}/v1/leads/ZIN-FIRE-0", headers={"X-API-Key": KEY}).status_code == 404


# ---- team ----
def test_team(s):
    r = s.post(f"{API}/orgs/org-bharat/agents", json={"name": "TEST_Agent", "email": "test_agent@x.com", "city": "Surat"})
    assert r.status_code == 200
    a = r.json()
    assert a["active"] is True and a["org_id"] == "org-bharat"
    assert s.post(f"{API}/orgs/org-bharat/agents", json={"name": "TT", "email": "TEST_AGENT@x.com", "city": "SS"}).status_code == 400
    assert s.post(f"{API}/orgs/org-zz/agents", json={"name": "TT", "email": "q@x.com", "city": "SS"}).status_code == 404
    p = s.patch(f"{API}/agents/{a['id']}", json={"active": False}).json()
    assert p["active"] is False
    wl = s.get(f"{API}/agents/workload", params={"org_id": "org-bharat"}).json()
    assert any(x["id"] == a["id"] and x["active"] is False for x in wl)
    assert all("open_cases" in x for x in wl)
    assert s.patch(f"{API}/agents/nope", json={"active": True}).status_code == 404


# ---- cyber ----
def test_cyber(s):
    assert s.post(f"{API}/cyber/scan", json={"url": "www.petronas.com", "country": "SG"}).status_code == 400
    r = s.post(f"{API}/cyber/scan", json={"url": "www.petronas.com", "country": "MY"}, timeout=60)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["grade"] in "ABCDE" and len(d["findings"]) >= 8 and d["domain"] == "petronas.com"
    lst = s.get(f"{API}/cyber/scans").json()
    assert any(x["id"] == d["id"] for x in lst)
    assert s.get(f"{API}/cyber/scans/{d['id']}").json()["id"] == d["id"]
    assert s.get(f"{API}/cyber/scans/nope").status_code == 404


def test_cyber_bad_url(s):
    r = s.post(f"{API}/cyber/scan", json={"url": "https://", "country": "MY"}, timeout=60)
    assert r.status_code in (400, 422), f"got {r.status_code}"
    r = s.post(f"{API}/cyber/scan", json={"url": "nonexistent-domain-zzqq.invalid", "country": "ID"}, timeout=60)
    assert r.status_code == 422
