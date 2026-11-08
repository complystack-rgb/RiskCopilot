"""Iteration 5 regression: state machine, lead counter, cyber SSRF guard, open-flag KPIs, checklist, reset."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
J = {"businessName": "TEST_Iter5 Mills", "category": "manufacturing", "activity": "Textiles and garments",
     "city": "Surat", "state": "Gujarat", "headcount": "21-50", "hasInsurance": "Yes"}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def case(s):
    r = s.post(f"{API}/cases", json={"journey": J})
    assert r.status_code == 200, r.text
    return r.json()


# lead counter
def test_lead_sequential(s, case):
    assert case["lead_id"] == "ZIN-FIRE-26013"
    r2 = s.post(f"{API}/cases", json={"journey": J}).json()
    assert r2["lead_id"] == "ZIN-FIRE-26014"


# search
def test_q_special_chars(s):
    for q in ["(", "[", "*", "\\", ".*"]:
        r = s.get(f"{API}/cases", params={"q": q})
        assert r.status_code == 200, q


# state machine
def test_state_machine(s):
    c = s.post(f"{API}/cases", json={"journey": J}).json()
    cid = c["case_id"]
    assert c["lead_id"] == "ZIN-FIRE-26013"
    # recommendation before inspection
    eng = s.get(f"{API}/cases/{cid}").json()["report"]["engine_recommendations"]
    ess = [r["product_id"] for r in eng if r["priority"] == "Essential"]
    just = "Evidence shows heavy cotton dust, old wiring and stock storage so fire and stock cover are needed here."
    r = s.post(f"{API}/cases/{cid}/recommendation", json={"products": ess, "justification": just, "actor": "T"})
    assert r.status_code == 400
    # skip transitions
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "inspected", "actor": "T"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "approved", "actor": "T"}).status_code == 400
    # review before rec
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "approve", "comment": ""}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "inspection_scheduled", "actor": "T"}).status_code == 200
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "inspected", "actor": "T"}).status_code == 200
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "assigned", "actor": "T"}).status_code == 400
    r = s.post(f"{API}/cases/{cid}/recommendation", json={"products": ess, "justification": just, "actor": "T"})
    assert r.status_code == 200 and r.json()["status"] == "recommendation_submitted"
    # request_justification needs comment
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "request_justification", "comment": "  "}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "request_justification", "comment": "why"}).status_code == 200
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "approve", "comment": ""}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/recommendation", json={"products": ess, "justification": just, "actor": "T"}).status_code == 200
    r = s.post(f"{API}/cases/{cid}/review", json={"decision": "approve", "comment": ""})
    assert r.status_code == 200 and r.json()["status"] == "approved"
    # closed guards
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "inspected", "actor": "T"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/status", json={"status": "declined", "actor": "T"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/assign", json={"agent_id": "ag-imran", "actor": "T"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/recommendation", json={"products": ess, "justification": just, "actor": "T"}).status_code == 400
    assert s.post(f"{API}/cases/{cid}/review", json={"decision": "decline", "comment": "x"}).status_code == 400


def test_assign_rejects_inactive(s):
    a = s.post(f"{API}/orgs/org-bharat/agents", json={"name": "TEST_Inactive", "email": "test_inactive5@x.com", "city": "Surat"}).json()
    s.patch(f"{API}/agents/{a['id']}", json={"active": False})
    open_case = next(c for c in s.get(f"{API}/cases").json() if c["status"] in ("assigned", "inspection_scheduled"))
    r = s.post(f"{API}/cases/{open_case['id']}/assign", json={"agent_id": a["id"], "actor": "T"})
    assert r.status_code == 404


# open flags
def test_open_flags_exclude_closed(s):
    allc = s.get(f"{API}/cases").json()
    expected = sum(len(c.get("flags") or []) for c in allc if c["status"] not in ("approved", "declined"))
    st = s.get(f"{API}/console/stats").json()
    assert st["open_flags"] == expected
    fl = s.get(f"{API}/cases", params={"flagged": "true"}).json()
    assert all(c["flags"] and c["status"] not in ("approved", "declined") for c in fl)


# checklist
def test_checklist(s):
    c = s.get(f"{API}/cases").json()[0]
    total = len(s.get(f"{API}/cases/{c['id']}").json()["report"]["inspection_checklist"])
    r = s.post(f"{API}/cases/{c['id']}/checklist", json={"done": [0, 1, 1, 999, -1], "actor": "TEST"})
    assert r.status_code == 200
    d = s.get(f"{API}/cases/{c['id']}").json()
    assert d["checklist_done"] == [0, 1]
    assert d["activity"][-1]["type" if "type" in d["activity"][-1] else list(d["activity"][-1].keys())[1]] is not None
    assert any(f"2/{total}" in str(e) for e in d["activity"])


# cyber guard
@pytest.mark.parametrize("url", ["https://", "localhost", "127.0.0.1.nip.io", "10.0.0.1.nip.io", "http://169.254.169.254"])
def test_cyber_rejects(s, url):
    r = s.post(f"{API}/cyber/scan", json={"url": url, "country": "MY"}, timeout=60)
    assert r.status_code == 422, f"{url}: {r.status_code} {r.text}"
    print(url, r.json())


def test_cyber_private_msg(s):
    r = s.post(f"{API}/cyber/scan", json={"url": "127.0.0.1.nip.io", "country": "MY"}, timeout=60)
    assert "Only public websites" in r.json()["detail"]


def test_cyber_valid(s):
    r = s.post(f"{API}/cyber/scan", json={"url": "www.petronas.com", "country": "MY"}, timeout=60)
    assert r.status_code == 200, r.text
    assert r.json()["grade"] in "ABCDE"
