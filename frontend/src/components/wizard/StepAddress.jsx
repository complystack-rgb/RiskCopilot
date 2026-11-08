import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, FieldLabel } from "./shared";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { getMarket } from "@/data/markets";

const PIN = L.divIcon({ className: "", html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#0A1F44;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.35)"></div>', iconSize: [28, 28], iconAnchor: [14, 28] });

const Fly = ({ pos }) => { const map = useMap(); useEffect(() => { map.flyTo(pos, 16, { duration: 0.8 }); }, [pos[0], pos[1]]); return null; }; // eslint-disable-line react-hooks/exhaustive-deps
const ClickToPlace = ({ onPick }) => { useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) }); return null; };

export default function StepAddress() {
  const { data, update } = useJourney();
  const [q, setQ] = useState(data.address || "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const m = getMarket(data.market);
  const pos = [data.lat ?? m.center[0], data.lon ?? m.center[1]];

  useEffect(() => {
    if (!open || q.trim().length < 4) { setResults([]); return; }
    const t = setTimeout(() => api.get("/geo/search", { params: { q: `${q}, ${m.name}` } }).then((r) => setResults(r.data)).catch(() => setResults([])), 450);
    return () => clearTimeout(t);
  }, [q, open]);

  const choose = (r) => { update({ address: r.label, lat: r.lat, lon: r.lon, city: r.city || data.city, state: r.state || data.state, pin: r.postcode || data.pin }); setQ(r.label); setOpen(false); };
  const drop = async (lat, lon) => {
    update({ lat: +lat.toFixed(6), lon: +lon.toFixed(6) });
    try { const { data: r } = await api.get("/geo/reverse", { params: { lat, lon } }); update({ address: r.label, city: r.city || data.city, state: r.state || data.state, pin: r.postcode || data.pin }); setQ(r.label); } catch { /* keep coordinates */ }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Business Location" lead="Search for your address, then drag the pin onto your exact building." />
      <div className="relative">
        <FieldLabel required>Business Address</FieldLabel>
        <div className="relative"><Icons.Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input data-testid="address-search" value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} placeholder="Street, Area or Industrial Estate" className="h-11 pl-9" /></div>
        {open && results.length > 0 && (
          <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg" data-testid="address-suggestions">
            {results.map((r, i) => <li key={i}><button data-testid={`address-suggestion-${i}`} onClick={() => choose(r)} className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-blue-50"><Icons.MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><span className="line-clamp-2 text-slate-700">{r.label}</span></button></li>)}
          </ul>)}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200" data-testid="address-map">
        <MapContainer center={pos} zoom={data.lat ? 16 : m.zoom} style={{ height: 360 }} scrollWheelZoom={false}>
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Imagery © Esri" />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
          {data.lat && <><Marker position={pos} icon={PIN} draggable eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); drop(p.lat, p.lng); } }} /><Fly pos={pos} /></>}
          <ClickToPlace onPick={drop} />
        </MapContainer>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["City", "city"], [m.regionLabel, "state"], [m.postcodeLabel, "pin"]].map(([l, k]) => <div key={k}><FieldLabel>{l}</FieldLabel><Input data-testid={`address-${k}`} value={data[k]} onChange={(e) => update({ [k]: e.target.value })} /></div>)}
        <div><FieldLabel>Coordinates</FieldLabel><p className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-600" data-testid="address-coords">{data.lat ? `${data.lat.toFixed(5)}, ${data.lon.toFixed(5)}` : "Place the pin"}</p></div>
      </div>
    </div>
  );
}
