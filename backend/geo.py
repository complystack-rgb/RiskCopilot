"""Live location and climate intelligence from open data (Photon, OSM Overpass, Open-Meteo)."""
import asyncio
import math
import time
from collections import defaultdict
import httpx

UA = {"User-Agent": "ComplyStack/1.0 (broker risk prototype)"}
PHOTON = "https://photon.komoot.io/api/"
PHOTON_REVERSE = "https://photon.komoot.io/reverse"
OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
TTL = 7 * 24 * 3600
_memo = {}


def _memo_get(key):
    hit = _memo.get(key)
    if hit and hit[0] > time.time():
        return hit[1]


def _memo_put(key, value):
    if len(_memo) > 2000:
        _memo.clear()
    _memo[key] = (time.time() + TTL, value)


def dist_km(a, b, c, d):
    r = 6371
    p1, p2 = math.radians(a), math.radians(c)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(d - b) / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(h)), 2)


def _parts(p):
    city = p.get("city") or p.get("town") or p.get("county") or p.get("district") or ""
    state = p.get("state", "")
    postcode = p.get("postcode", "")
    label_bits = [p.get("name"), p.get("street"), p.get("district"), city, state, postcode, p.get("country")]
    seen, label = set(), []
    for b in label_bits:
        if b and b not in seen:
            seen.add(b)
            label.append(b)
    return city, state, postcode, ", ".join(label)


async def search(q):
    key = ("search", q.strip().lower())
    hit = _memo_get(key)
    if hit is not None:
        return hit
    async with httpx.AsyncClient(timeout=10, headers=UA) as c:
        r = await c.get(PHOTON, params={"q": q, "limit": 6, "lang": "en"})
        r.raise_for_status()
        out = []
        for f in r.json().get("features", []):
            p = f.get("properties", {})
            lon, lat = f["geometry"]["coordinates"]
            city, state, postcode, label = _parts(p)
            out.append({"label": label, "lat": float(lat), "lon": float(lon), "city": city, "state": state, "postcode": postcode})
    _memo_put(key, out)
    return out


async def reverse(lat, lon):
    key = ("reverse", round(lat, 4), round(lon, 4))
    hit = _memo_get(key)
    if hit is not None:
        return hit
    async with httpx.AsyncClient(timeout=10, headers=UA) as c:
        r = await c.get(PHOTON_REVERSE, params={"lat": lat, "lon": lon, "limit": 1, "lang": "en"})
        r.raise_for_status()
        feats = r.json().get("features", [])
    if not feats:
        raise ValueError("no reverse geocoding result")
    city, state, postcode, label = _parts(feats[0].get("properties", {}))
    out = {"label": label, "city": city, "state": state, "postcode": postcode}
    _memo_put(key, out)
    return out


def _q(lat, lon):
    a = f"{lat},{lon}"
    return f"""[out:json][timeout:30];(
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


async def _overpass(c, lat, lon):
    for url in OVERPASS:
        try:
            r = await c.post(url, data={"data": _q(lat, lon)}, timeout=30)
            if r.status_code == 200:
                return r.json()
        except Exception:
            continue
    return None


PHOTON_POI = [("hospital", "amenity:hospital", 8, "hospital"), ("fire station", "amenity:fire_station", 15, "fire_station"), ("fuel", "amenity:fuel", 5, "fuel")]


async def _photon_pois(c, lat, lon):
    """Fallback when Overpass is down: nearby POIs from Photon, filtered by distance."""
    elements, ok = [], False
    for q, tag, km, kind in PHOTON_POI:
        try:
            r = await c.get(PHOTON, params={"q": q, "osm_tag": tag, "lat": lat, "lon": lon, "limit": 15, "lang": "en"})
            if r.status_code != 200:
                continue
            ok = True
            for f in r.json().get("features", []):
                plon, plat = f["geometry"]["coordinates"]
                if dist_km(lat, lon, plat, plon) <= km:
                    elements.append({"lat": plat, "lon": plon, "_kind": kind, "tags": {"name": f.get("properties", {}).get("name")}})
        except Exception:
            continue
    return {"elements": elements} if ok else None


async def surroundings(lat, lon):
    async with httpx.AsyncClient(timeout=50, headers=UA) as c:
        data = await _overpass(c, lat, lon)
        source = "OpenStreetMap open data · Open-Meteo elevation"
        if data is None:
            data = await _photon_pois(c, lat, lon)
            source = "OpenStreetMap nearby places (Photon) · Open-Meteo elevation"
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
    return {"elevation_m": elevation, "features": out, "counts": counts, "source": source, "available": data is not None}


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
