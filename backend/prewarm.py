import asyncio, httpx
from engine import COORDS
async def main():
    async with httpx.AsyncClient(timeout=90) as c:
        for k,(la,lo) in COORDS.items():
            for p in ("surroundings","climate"):
                try:
                    r=await c.get(f"http://localhost:8001/api/geo/{p}",params={"lat":la,"lon":lo}); print(k,p,r.status_code, str(r.json().get("available", ""))[:5])
                except Exception as e: print(k,p,repr(e))
asyncio.run(main())
