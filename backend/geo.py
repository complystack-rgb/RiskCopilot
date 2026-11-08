"""Live location and climate intelligence from open data (OSM Overpass, Nominatim, Open-Meteo)."""
import asyncio
import math
from collections import defaultdict
import httpx

UA = {"User-Agent": "ComplyStack/1.0 (broker risk prototype)"}
OVERPASS = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def dist_km(a, b, c, d):
    r = 6371
    p1, p2 = math.radians(a), math.radians(c)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(d - b) / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(h)), 2)


async def search(q):
    async with httpx.AsyncClient(timeout=10, headers=UA) as c:
        r = await c.get("https://nominatim.openstreetmap.org/search", params={"q": q, "format": "json", "limit": 6, "addressdetails": 1})
        return [{"label": x["display_name"], "lat": float(x["lat"]), "lon": float(x["lon"]),
                 "city": x.get("address", {}).get("city") or x.get("address", {}).get("town") or x.get("address", {}).get("county", ""),
                 "state": x.get("address", {}).get("state", ""), "postcode": x.get("address", {}).get("postcode", "")} for x in r.json()]


async def reverse(lat, lon):
    async with httpx.AsyncClient(timeout=10, headers=UA) as c:
        r = await c.get("https://nominatim.openstreetmap.org/reverse", params={"lat": lat, "lon": lon, "format": "json"})
        j = r.json()
        a = j.get("address", {})
        return {"label": j.get("display_name", ""), "city": a.get("city") or a.get("town") or a.get("county", ""), "state": a.get("state", ""), "postcode": a.get("postcode", "")}


def _q(lat, lon):
    a = f"{lat},{lon}"
    return f"""[out:json][timeout:25];(
nwr(around:8000,{a})["amenity"="fire_station"];nwr(around:8000,{a})["amenity"="hospital"];
way(around:2500,{a})["waterway"~"river|canal|stream"];way(around:2500,{a})["natural"="water"];
way(around:2000,{a})["highway"~"motorway|trunk|primary"];way(around:2000,{a})["railway"="rail"];
way(around:1500,{a})["landuse"="industrial"];nwr(around:2000,{a})["amenity"="fuel"];);out center tags 300;"""


def _kind(t):
    if t.get("amenity") == "fire_station": return "fire_station"
    if t.get("amenity") == "hospital": return "hospital"
    if t.get("amenity") == "fuel": return "fuel"
    if "waterway" in t or t.get("natural") == "water": return "water"
    if "highway" in t: return "road"
    if t.get("railway") == "rail": return "rail"
    if t.get("landuse") == "industrial": return "industrial"


NOMI = [("fire_station", "fire station", 0.09), ("hospital", "hospital", 0.07), ("fuel", "fuel", 0.02), ("water", "river", 0.025),
        ("water", "canal", 0.025), ("rail", "railway station", 0.02), ("industrial", "industrial estate", 0.015), ("road", "highway", 0.02)]
_nomi_lock = asyncio.Lock()


async def _nominatim(c, lat, lon):
    elements, ok = [], False
    async with _nomi_lock:
        for kind, q, d in NOMI:
            try:
                r = await c.get("https://nominatim.openstreetmap.org/search", params={"q": q, "viewbox": f"{lon - d},{lat + d},{lon + d},{lat - d}", "bounded": 1, "format": "jsonv2", "limit": 10})
                if r.status_code == 200:
                    ok = True
                    elements += [{"lat": float(x["lat"]), "lon": float(x["lon"]), "tags": {"name": x.get("name")}, "_kind": kind} for x in r.json()]
            except Exception:
                pass
            await asyncio.sleep(1.1)
    return {"elements": elements} if ok else None


async def _overpass(c, lat, lon):
    for url in OVERPASS[:2]:
        try:
            r = await c.post(url, data={"data": _q(lat, lon)}, timeout=10)
            if r.status_code == 200:
                return r.json()
        except Exception:
            continue


async def surroundings(lat, lon):
    async with httpx.AsyncClient(timeout=12, headers=UA) as c:
        data = await _overpass(c, lat, lon) or await _nominatim(c, lat, lon)
        try:
            el = await c.get("https://api.open-meteo.com/v1/elevation", params={"latitude": lat, "longitude": lon})
            elevation = el.json().get("elevation", [None])[0] if el.status_code == 200 else None
        except Exception:
            elevation = None
    groups = defaultdict(list)
    for e in (data or {}).get("elements", []):
        t = e.get("tags", {}); k = e.get("_kind") or _kind(t)
        p = (e.get("lat"), e.get("lon")) if "lat" in e else (e.get("center", {}).get("lat"), e.get("center", {}).get("lon"))
        if not k or p[0] is None:
            continue
        groups[k].append({"name": t.get("name") or t.get("ref") or {"water": "Unnamed water body", "road": "Major road", "rail": "Rail line", "industrial": "Industrial site", "fuel": "Fuel station"}.get(k, k.replace("_", " ").title()),
                          "distance_km": dist_km(lat, lon, *p), "lat": p[0], "lon": p[1], "detail": t.get("waterway") or t.get("highway") or t.get("natural") or ""})
    out = {k: sorted(v, key=lambda x: x["distance_km"])[:6] for k, v in groups.items()}
    counts = {k: len(v) for k, v in groups.items()}
    return {"elevation_m": elevation, "features": out, "counts": counts, "source": "OpenStreetMap open data · Open-Meteo elevation", "available": data is not None}


async def climate(lat, lon):
    async with httpx.AsyncClient(timeout=40, headers=UA) as c:
        r = await c.get("https://archive-api.open-meteo.com/v1/archive", params={"latitude": lat, "longitude": lon, "start_date": "2021-01-01", "end_date": "2025-12-31",
                        "daily": "precipitation_sum,temperature_2m_max,wind_speed_10m_max", "timezone": "auto"})
    j = r.json()
    d = j["daily"]
    rain, tmax, wind = defaultdict(float), defaultdict(list), []
    heat, heavy = 0, 0
    for i, day in enumerate(d["time"]):
        mi = int(day[5:7]) - 1
        p = d["precipitation_sum"][i] or 0; t = d["temperature_2m_max"][i]; w = d["wind_speed_10m_max"][i]
        rain[mi] += p / 5
        if t is not None:
            tmax[mi].append(t); heat += t >= 35
        if w is not None:
            wind.append(w)
        heavy += p >= 50
    monthly = [{"month": MONTHS[i], "rain_mm": round(rain[i]), "tmax_c": round(sum(tmax[i]) / len(tmax[i]), 1) if tmax[i] else None} for i in range(12)]
    wet = sorted(monthly, key=lambda x: -x["rain_mm"])[:3]
    annual = sum(x["rain_mm"] for x in monthly)
    return {"monthly": monthly, "annual_rain_mm": annual, "heat_days_per_year": round(heat / 5), "heavy_rain_days_per_year": round(heavy / 5, 1),
            "max_wind_kmh": round(max(wind)) if wind else None, "wettest_months": [w["month"] for w in wet], "hottest_month": max(monthly, key=lambda x: x["tmax_c"] or 0)["month"],
            "elevation_m": j.get("elevation"), "period": "2021 to 2025 daily history", "source": "Open-Meteo historical weather (ERA5)"}
