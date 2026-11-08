# Iteration 6: market-aware SME case creation with registration IDs
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
CREATED = []


def _journey(market, regs):
    return {"market": market, "businessName": f"TEST_{market} Co", "category": "manufacturing", "activity": "", "city": "", "state": "",
            "headcount": "11 to 25", "revenueBand": "", "priorities": [], "hasInsurance": "No", "registration": regs, "lat": None, "lon": None}


@pytest.mark.parametrize("market,prefix,regs", [
    ("MY", "ZMY", [{"label": "SSM Registration Number", "value": "TEST_SSM1"}, {"label": "Tax Identification Number (TIN)", "value": "TEST_TIN1"}, {"label": "SST Registration Number", "value": "TEST_SST1"}]),
    ("ID", "ZID", [{"label": "NIB (Business Identification Number)", "value": "TEST_NIB"}, {"label": "NPWP (Corporate)", "value": "x"}, {"label": "PKP Confirmation Number", "value": "y"}]),
    ("IN", "ZIN", [{"label": "PAN (Corporate)", "value": "anything"}, {"label": "GSTIN (Corporate)", "value": "g"}, {"label": "Udyam Registration Number", "value": "u"}]),
])
def test_create_case_market_and_registration(market, prefix, regs):
    r = requests.post(f"{BASE_URL}/api/cases", json={"journey": _journey(market, regs), "assessment": {}, "email": "test@example.com", "phone": "0123456789"})
    assert r.status_code == 200, r.text
    d = r.json()
    CREATED.append(d["lead_id"])
    assert d["lead_id"].startswith(prefix)
    if market == "MY":
        assert d["distributor"] == "Lumen Insurance Brokers Sdn Bhd"
    g = requests.get(f"{BASE_URL}/api/cases/{d['case_id']}")
    assert g.status_code == 200
    c = g.json()
    assert c["market"] == market
    assert c["source"] == "sme_journey"
    assert c["sme"]["registration"] == regs
    assert c["sme"]["business_name"] == f"TEST_{market} Co"


def test_invalid_market_falls_back_to_in():
    r = requests.post(f"{BASE_URL}/api/cases", json={"journey": _journey("XX", []), "assessment": {}, "email": "test@example.com", "phone": "0123456789"})
    assert r.status_code == 200
    CREATED.append(r.json()["lead_id"])
    assert r.json()["lead_id"].startswith("ZIN")


def test_print_created():
    print("CREATED", CREATED)
