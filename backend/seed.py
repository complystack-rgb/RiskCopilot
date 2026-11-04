"""Seeds brokers, 18 hero cases and historical cases per market."""
import random
from datetime import timedelta
from markets import ORGS, AGENTS, HEROES
from engine import build_case, now

HIST_NAMES = {
    "IN": ["Rajkot Castings", "Ludhiana Hosiery Hub", "Nashik Agro Packers", "Vapi Chem Intermediates", "Erode Handloom Collective", "Karur Terry Towels", "Hosur Precision Tools", "Panipat Home Textiles",
           "Bhilwara Suitings", "Aurangabad Auto Parts", "Hyderabad Pharma Labs", "Ahmedabad Denim House", "Coimbatore Spinners", "Morbi Ceramics", "Jaipur Handicraft Exports", "Kanpur Leather Works"],
    "MY": ["Ipoh Rubber Products", "Kulim Precision Metal", "Senai Food Industries", "Klang Furniture Works", "Seremban Plastics", "Kuching Timber Mouldings", "Butterworth Logistics Hub", "Kota Bharu Batik House",
           "Nilai Pharma Packaging", "Rawang Steel Fabricators", "Kuantan Palm Products", "Alor Setar Rice Mill", "Batu Pahat Garments", "Puchong Electronics", "Sungai Petani Gloves", "Shah Alam Printing"],
    "ID": ["PT Cikarang Logam Presisi", "PT Semarang Tekstil Jaya", "PT Tangerang Plastik Mandiri", "PT Solo Batik Sentosa", "PT Makassar Kakao Utama", "PT Karawang Komponen Otomotif", "PT Sidoarjo Makanan Sehat",
           "PT Pekalongan Garmen", "PT Cirebon Rotan Ekspor", "PT Batam Elektronik Mitra", "PT Malang Kopi Nusantara", "PT Gresik Kemasan", "PT Bogor Furnitur Kayu", "PT Lampung Agro Pangan", "PT Pasuruan Logistik", "PT Yogya Kerajinan"],
}
HIST_STATUS = ["bound"] * 7 + ["lost"] * 3 + ["quoted"] * 2 + ["proposal_submitted", "visited", "contacted", "new"]


async def seed(db, force=False):
    if not force and await db.cases.count_documents({"market": {"$exists": True}}) > 0:
        return
    for c in ("orgs", "agents", "cases", "counters"):
        await db[c].delete_many({})
    rnd = random.Random(7)
    await db.orgs.insert_many([dict(o) for o in ORGS])
    agents = []
    for org_id, name, role, city in AGENTS:
        first = name.split()[0].lower()
        agents.append({"id": f"ag-{first}", "org_id": org_id, "market": next(o["market"] for o in ORGS if o["id"] == org_id), "name": name, "role": role, "city": city, "active": True,
                       "email": f"{first}@{org_id[4:]}.com", "created_at": now().isoformat()})
    await db.agents.insert_many([dict(a) for a in agents])
    cases, counters = [], {}
    for h in HEROES:
        counters[h[1]] = counters.get(h[1], 0) + 1
        cases.append(build_case(h, counters[h[1]], rnd, agents))
    for m, names in HIST_NAMES.items():
        heroes = [h for h in HEROES if h[1] == m]
        for i, name in enumerate(names):
            h = heroes[i % len(heroes)]
            counters[m] += 1
            created = now() - timedelta(days=rnd.randint(9, 178), hours=rnd.randint(0, 23))
            cases.append(build_case(h, counters[m], rnd, agents, status=HIST_STATUS[i % len(HIST_STATUS)], created=created, historical=True, name=name))
    await db.cases.insert_many(cases)
    for m, n in counters.items():
        await db.counters.update_one({"_id": f"lead-{m}"}, {"$set": {"n": n}}, upsert=True)
