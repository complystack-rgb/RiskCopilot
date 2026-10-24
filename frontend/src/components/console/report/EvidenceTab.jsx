import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Panel, BandBadge } from "@/components/console/ui";
import { BAND_HEX } from "@/lib/consoleUi";

const Canvas = ({ photo, active, setActive }) => (
  <div className="relative overflow-hidden rounded-md bg-slate-900" data-testid="evidence-canvas">
    <img src={photo.image} alt={photo.title} className="aspect-[16/10] w-full object-cover opacity-90" />
    {photo.annotations.map((a, i) => (
      <button key={i} data-testid={`annotation-${photo.id}-${i}`} onClick={() => setActive(i)} className="absolute rounded-sm border-2 transition-all"
        style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%`, borderColor: BAND_HEX[a.severity] || "#2563EB", background: active === i ? `${BAND_HEX[a.severity] || "#2563EB"}33` : "transparent", boxShadow: active === i ? "0 0 0 3px rgba(255,255,255,.6)" : "none" }}>
        <span className="absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: BAND_HEX[a.severity] || "#2563EB" }}>{i + 1}. {a.label}</span>
      </button>
    ))}
    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white">{photo.source}</span>
  </div>
);

const Extracted = ({ a }) => (
  <div className="rounded-md border border-slate-200 p-3" data-testid="annotation-detail">
    <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{a.label}</p><BandBadge band={a.severity} /></div>
    {a.fields ? (
      <dl className="mt-3 grid grid-cols-2 gap-2">{Object.entries(a.fields).map(([k, v]) => <div key={k} className="rounded bg-slate-50 px-2 py-1.5"><dt className="text-[10px] uppercase tracking-wider text-slate-400">{k}</dt><dd className="font-mono text-xs font-semibold text-slate-900">{v}</dd></div>)}</dl>
    ) : <p className="mt-2 text-xs text-slate-500">Region at {a.x}%, {a.y}% of the frame. Check this on site.</p>}
  </div>
);

export const EvidenceTab = ({ r, focus }) => {
  const [pid, setPid] = useState(r.photos[0].id);
  const [active, setActive] = useState(0);
  useEffect(() => { if (focus) { const p = r.photos.find((x) => x.image === focus); if (p) { setPid(p.id); setActive(0); } } }, [focus, r.photos]);
  const photo = r.photos.find((p) => p.id === pid);
  return (
    <div className="space-y-6">
      <Panel title="Annotated evidence" icon={Icons.ScanSearch} action={<span className="text-[11px] text-slate-400">{r.photos.length} images · {r.photos.reduce((s, p) => s + p.annotations.length, 0)} annotations</span>}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2"><Canvas photo={photo} active={active} setActive={setActive} /></div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">{photo.title}</p>
            {photo.annotations[active] && <Extracted a={photo.annotations[active]} />}
            <ul className="space-y-1">{photo.annotations.map((a, i) => <li key={i}><button onClick={() => setActive(i)} className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${active === i ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600 hover:bg-slate-50"}`}>{i + 1}. {a.label}</button></li>)}</ul>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {r.photos.map((p) => (
            <button key={p.id} data-testid={`evidence-thumb-${p.id}`} onClick={() => { setPid(p.id); setActive(0); }} className={`overflow-hidden rounded-md border-2 transition-all ${p.id === pid ? "border-blue-600" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <img src={p.image} alt={p.title} className="aspect-video w-full object-cover" />
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={`Video walkthrough · ${r.video.duration} · ${r.video.frames_analysed} frames analysed`} icon={Icons.Video} testid="video-timeline">
        <div className="relative mb-4 h-2 rounded bg-slate-100">
          {r.video_frames.map((f) => { const [m, s] = f.t.split(":").map(Number); const [dm, ds] = r.video.duration.split(":").map(Number); return <span key={f.t} className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: `${((m * 60 + s) / (dm * 60 + ds)) * 100}%`, background: BAND_HEX[f.severity] || "#64748B" }} />; })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {r.video_frames.map((f) => (
            <div key={f.t} className="overflow-hidden rounded-md border border-slate-200" data-testid={`video-frame-${f.t}`}>
              <div className="relative"><img src={f.image} alt={f.note} className="aspect-video w-full object-cover" /><span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 font-mono text-[10px] text-white">{f.t}</span></div>
              <div className="p-2"><BandBadge band={f.severity} /><p className="mt-1 text-[11px] leading-snug text-slate-600">{f.note}</p></div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Areas covered: {r.video.areas_covered.join(" · ")}</p>
      </Panel>
    </div>
  );
};
