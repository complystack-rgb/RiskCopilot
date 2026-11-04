import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip as LTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { api } from "@/lib/api";
import { Panel, BandBadge } from "@/components/console/ui";

const TILES = {
  street: ["https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", "© OpenStreetMap"],
  satellite: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", "Imagery © Esri"],
};
const FEAT = { fire_station: ["Nearest fire station", Icons.Siren, "#DC2626"], hospital: ["Nearest hospital", Icons.Hospital, "#059669"], water: ["Rivers and water bodies", Icons.Waves, "#2563EB"],
  road: ["Highways and main roads", Icons.Route, "#64748B"], rail: ["Rail lines", Icons.TrainTrack, "#7C3AED"], industrial: ["Neighbouring industrial sites", Icons.Factory, "#EA580C"], fuel: ["Fuel stations", Icons.Fuel, "#D97706"] };

const useGeo = (path, lat, lon) => {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { setD(null); setErr(false); api.get(path, { params: { lat, lon } }).then((r) => setD(r.data)).catch(() => setErr(true)); }, [path, lat, lon]);
  return [d, err];
};

export const LocationTab = ({ c }) => {
  const { lat, lon } = c.sme;
  const [layer, setLayer] = useState("satellite");
  const [d, err] = useGeo("/geo/surroundings", lat, lon);
  const f = d?.features || {};
  const brief = [];
  if (f.fire_station?.[0]) brief.push(`Fire station ${f.fire_station[0].distance_km} km away (${f.fire_station[0].name}), so expect a ${f.fire_station[0].distance_km > 5 ? "slow" : "reasonable"} response time.`);
  if (f.water?.[0]) brief.push(`${f.water[0].name} lies ${f.water[0].distance_km} km from the site. Check flood history and plinth height.`);
  if (f.industrial?.length) brief.push(`${d.counts.industrial} industrial sites within 1.5 km, so fire could spread from neighbours.`);
  if (f.fuel?.length) brief.push(`${d.counts.fuel} fuel station(s) within 2 km.`);
  if (f.road?.[0]) brief.push(`Main road access ${f.road[0].distance_km} km away (${f.road[0].name}).`);
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel title="Site map" icon={Icons.Map} className="lg:col-span-3" testid="site-map" action={
        <div className="flex rounded-md border border-slate-200 p-0.5">{["street", "satellite"].map((l) => <button key={l} data-testid={`map-${l}`} onClick={() => setLayer(l)} className={`rounded px-2.5 py-1 text-[11px] font-semibold capitalize ${layer === l ? "bg-[#0A1F44] text-white" : "text-slate-600"}`}>{l}</button>)}</div>}>
        <div className="-m-5 overflow-hidden rounded-b-lg">
          <MapContainer center={[lat, lon]} zoom={15} style={{ height: 460 }} scrollWheelZoom={false}>
            <TileLayer key={layer} url={TILES[layer][0]} attribution={TILES[layer][1]} />
            <Circle center={[lat, lon]} radius={2000} pathOptions={{ color: "#2563EB", weight: 1, fillOpacity: 0.04 }} />
            {Object.entries(f).flatMap(([k, list]) => list.slice(0, 3).map((x, i) => <CircleMarker key={k + i} center={[x.lat, x.lon]} radius={6} pathOptions={{ color: "#fff", weight: 2, fillColor: FEAT[k][2], fillOpacity: 1 }}><LTooltip>{FEAT[k][0]}: {x.name} · {x.distance_km} km</LTooltip></CircleMarker>))}
            <CircleMarker center={[lat, lon]} radius={10} pathOptions={{ color: "#fff", weight: 3, fillColor: "#DC2626", fillOpacity: 1 }}><LTooltip permanent direction="top">{c.sme.business_name}</LTooltip></CircleMarker>
          </MapContainer>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 font-mono text-[11px] text-slate-500"><span>Lat {lat}</span><span>Lon {lon}</span><span>Elevation {d?.elevation_m ?? "…"} m</span><span>{c.sme.address}</span></div>
      </Panel>
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Surroundings brief" icon={Icons.Binoculars} testid="surroundings-brief">
          {!d && !err && <p className="flex items-center gap-2 text-sm text-slate-500"><Icons.Loader2 className="h-4 w-4 animate-spin" />Reading open map data within 2 km…</p>}
          {(err || (d && !d.available)) && <p className="text-sm text-slate-500">Map data is temporarily unavailable. Try again shortly.</p>}
          {d?.available && <ul className="space-y-2 text-sm text-slate-700">{brief.map((b) => <li key={b} className="flex gap-2"><Icons.ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{b}</li>)}</ul>}
        </Panel>
        {d?.available && <Panel title="What's nearby" icon={Icons.MapPinned}><ul className="space-y-3">{Object.entries(FEAT).filter(([k]) => f[k]?.length).map(([k, [label, I, col]]) => (
          <li key={k} className="flex items-start gap-3 text-xs" data-testid={`nearby-${k}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${col}1a`, color: col }}><I className="h-3.5 w-3.5" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold text-slate-900">{label} <span className="font-normal text-slate-400">· {d.counts[k]}</span></p><p className="truncate text-slate-500">{f[k][0].name}</p></div><span className="font-mono font-semibold">{f[k][0].distance_km} km</span></li>))}</ul>
          <p className="mt-4 text-[10px] text-slate-400">{d.source}</p></Panel>}
      </div>
    </div>
  );
};

export const ClimateTab = ({ c }) => {
  const [d, err] = useGeo("/geo/climate", c.sme.lat, c.sme.lon);
  if (err) return <Panel><p className="text-sm text-slate-500">Climate history is temporarily unavailable.</p></Panel>;
  if (!d) return <Panel><p className="flex items-center gap-2 text-sm text-slate-500"><Icons.Loader2 className="h-4 w-4 animate-spin" />Loading five years of daily weather for this site…</p></Panel>;
  const wetMax = Math.max(...d.monthly.map((x) => x.rain_mm));
  const impacts = [
    { band: wetMax > 300 ? "High" : wetMax > 150 ? "Elevated" : "Moderate", title: `Flood season: ${d.wettest_months.join(", ")}`, body: `Peak month brings about ${wetMax} mm of rain and ${d.heavy_rain_days_per_year} very heavy rain days (≥50 mm) a year. Raise stock off the floor and check drainage before ${d.wettest_months[0]}.`, cover: "Property & fire with flood add-on" },
    { band: d.annual_rain_mm > 1800 ? "Elevated" : "Moderate", title: "Damp and humidity on stock", body: `${d.annual_rain_mm} mm of rain a year. Fabric, paper, food and electronics stored in this climate need ventilation and pallets.`, cover: "Stock cover with declaration" },
    { band: d.heat_days_per_year > 60 ? "High" : d.heat_days_per_year > 15 ? "Elevated" : "Low", title: `${d.heat_days_per_year} days a year above 35°C`, body: `The hottest month is ${d.hottest_month}. Heat loads motors, compressors and electrical panels, which raises breakdown and fire risk.`, cover: "Machinery breakdown" },
    { band: d.max_wind_kmh > 60 ? "Elevated" : "Low", title: `Wind gusts up to ${d.max_wind_kmh} km/h`, body: "Roof sheets, signage and open-sided sheds are exposed in storms.", cover: "Storm and tempest perils" },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel title="Rainfall and temperature by month" icon={Icons.CloudRain} className="lg:col-span-3" testid="climate-chart" action={<span className="text-[11px] text-slate-400">{d.period}</span>}>
        <div className="h-72"><ResponsiveContainer><ComposedChart data={d.monthly} margin={{ left: -16, right: -8 }}>
          <CartesianGrid stroke="#EEF2F7" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="r" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit=" mm" /><YAxis yAxisId="t" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="°" domain={["dataMin - 3", "dataMax + 2"]} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} /><Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="r" dataKey="rain_mm" name="Rainfall (mm)" fill="#2563EB" radius={[4, 4, 0, 0]} /><Line yAxisId="t" dataKey="tmax_c" name="Avg max temp (°C)" stroke="#EA580C" strokeWidth={2} dot={false} />
        </ComposedChart></ResponsiveContainer></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Annual rainfall", `${d.annual_rain_mm} mm`], ["Heavy rain days", `${d.heavy_rain_days_per_year}/yr`], ["Heat days ≥35°C", `${d.heat_days_per_year}/yr`], ["Max wind gust", `${d.max_wind_kmh} km/h`]].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-400">{k}</p><p className="mt-1 font-mono text-lg font-bold">{v}</p></div>))}</div>
        <p className="mt-3 text-[10px] text-slate-400">{d.source}</p>
      </Panel>
      <Panel title="What this means for the business" icon={Icons.Thermometer} className="lg:col-span-2" testid="climate-impacts">
        <ul className="space-y-4">{impacts.map((x) => <li key={x.title}><div className="flex items-center gap-2"><BandBadge band={x.band} /><p className="text-sm font-semibold text-slate-900">{x.title}</p></div><p className="mt-1 text-xs leading-relaxed text-slate-600">{x.body}</p><p className="mt-1 text-[11px] font-medium text-blue-700">Relevant cover: {x.cover}</p></li>)}</ul>
      </Panel>
    </div>
  );
};
