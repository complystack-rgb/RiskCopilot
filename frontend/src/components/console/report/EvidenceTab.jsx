import { useState, useEffect } from "react";
import * as Icons from "lucide-react";
import { Panel, BandBadge } from "@/components/console/ui";
import { BAND_HEX } from "@/lib/consoleUi";

export const EvidenceTab = ({ c, focus }) => {
  const [pid, setPid] = useState(focus || c.photos[0].id);
  const [active, setActive] = useState(0);
  useEffect(() => { if (focus) { setPid(focus); setActive(0); } }, [focus]);
  const photo = c.photos.find((p) => p.id === pid);
  const a = photo.annotations[active];
  return (
    <div className="space-y-6">
      <Panel title="Photo evidence" icon={Icons.Camera} action={<span className="text-[11px] text-slate-400">Submitted by the client</span>}>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-lg bg-slate-900 lg:col-span-2" data-testid="evidence-canvas">
            <img src={photo.image} alt={photo.title} className="aspect-[3/2] w-full object-cover" />
            {photo.annotations.map((x, i) => (
              <button key={i} data-testid={`annotation-${photo.id}-${i}`} onClick={() => setActive(i)} className="absolute rounded-sm border-2 transition-all"
                style={{ left: `${x.x}%`, top: `${x.y}%`, width: `${x.w}%`, height: `${x.h}%`, borderColor: BAND_HEX[x.severity], background: active === i ? `${BAND_HEX[x.severity]}26` : "transparent" }}>
                <span className="absolute -top-6 left-0 max-w-[260px] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: BAND_HEX[x.severity] }}>{x.label}</span>
              </button>))}
            <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white">{photo.source}</span>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">{photo.title}</p>
            <div className="rounded-lg border border-slate-200 p-3" data-testid="annotation-detail">
              <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-slate-900">{a.label}</p><BandBadge band={a.severity} /></div>
              {a.fields ? <dl className="mt-3 grid grid-cols-2 gap-2">{Object.entries(a.fields).map(([k, v]) => <div key={k} className="rounded bg-slate-50 px-2 py-1.5"><dt className="text-[10px] uppercase tracking-wider text-slate-400">{k}</dt><dd className="font-mono text-xs font-semibold text-slate-900">{v}</dd></div>)}</dl>
                : <p className="mt-2 text-xs text-slate-500">Highlighted area to confirm during the site visit.</p>}
            </div>
            <div className="grid grid-cols-3 gap-2">{c.photos.map((p) => (
              <button key={p.id} data-testid={`evidence-thumb-${p.id}`} onClick={() => { setPid(p.id); setActive(0); }} className={`overflow-hidden rounded-md border-2 ${p.id === pid ? "border-blue-600" : "border-transparent opacity-70 hover:opacity-100"}`}><img src={p.image} alt={p.title} className="aspect-square w-full object-cover" /></button>))}</div>
          </div>
        </div>
      </Panel>
      <Panel title={`Walkthrough video · ${c.video.duration}`} icon={Icons.Video} testid="video-timeline" action={<span className="text-[11px] text-slate-400">{c.video.frames_analysed} frames reviewed</span>}>
        <div className="relative mb-5 h-2 rounded bg-slate-100">{c.video.frames.map((f) => { const [mm, ss] = f.t.split(":").map(Number); return <span key={f.t} className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-white" style={{ left: `${((mm * 60 + ss) / 372) * 100}%`, background: BAND_HEX[f.severity] }} />; })}</div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{c.video.frames.map((f) => (
          <div key={f.t} className="overflow-hidden rounded-lg border border-slate-200" data-testid={`video-frame-${f.t}`}>
            <div className="relative"><img src={f.image} alt={f.note} className="aspect-video w-full object-cover" style={{ objectPosition: f.pos, transform: "scale(1.35)" }} /><span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 font-mono text-[10px] text-white"><Icons.Play className="mr-0.5 inline h-2.5 w-2.5" />{f.t}</span></div>
            <div className="p-2.5"><BandBadge band={f.severity} /><p className="mt-1 text-[11px] leading-snug text-slate-600">{f.note}</p></div>
          </div>))}</div>
      </Panel>
    </div>
  );
};
