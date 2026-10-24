import { useState } from "react";
import * as Icons from "lucide-react";
import { Panel, BandBadge, ScoreRing } from "@/components/console/ui";
import { inr } from "@/lib/consoleUi";
import { Checkbox } from "@/components/ui/checkbox";

const Indicators = ({ items, onEvidence }) => (
  <ul className="divide-y divide-slate-100" data-testid="fire-indicators">
    {items.map((i) => (
      <li key={i.id} className="flex items-start gap-3 py-3">
        <span className="mt-0.5"><BandBadge band={i.severity} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{i.finding}</p>
          <p className="mt-0.5 text-xs text-slate-500"><span className="font-semibold text-slate-600">Verify on site:</span> {i.verify}</p>
        </div>
        <button data-testid={`indicator-evidence-${i.id}`} onClick={() => onEvidence(i.evidence)} className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-blue-700 transition-colors hover:bg-blue-50">Evidence</button>
      </li>
    ))}
  </ul>
);

const Sums = ({ r }) => (
  <dl className="grid grid-cols-2 gap-3 text-xs">
    {[["Building", r.sums_insured.building], ["Plant & machinery", r.sums_insured.plant], ["Stock", r.sums_insured.stock], ["Total at risk", r.total_sum_insured]].map(([k, v], i) => (
      <div key={k} className={`rounded-md border p-3 ${i === 3 ? "border-[#0A1F44] bg-[#0A1F44] text-white" : "border-slate-200"}`}>
        <dt className={`text-[10px] uppercase tracking-wider ${i === 3 ? "text-blue-200" : "text-slate-400"}`}>{k}</dt>
        <dd className="mt-1 font-mono text-base font-bold">{v ? inr(v) : "Not owned"}</dd>
      </div>
    ))}
  </dl>
);

const Checklist = ({ items, caseId }) => {
  const key = `cs_check_${caseId}`;
  const [done, setDone] = useState(() => JSON.parse(localStorage.getItem(key) || "[]"));
  const toggle = (i) => { const n = done.includes(i) ? done.filter((x) => x !== i) : [...done, i]; setDone(n); localStorage.setItem(key, JSON.stringify(n)); };
  return (
    <ul className="space-y-2" data-testid="inspection-checklist">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm"><Checkbox data-testid={`checklist-item-${i}`} checked={done.includes(i)} onCheckedChange={() => toggle(i)} className="mt-0.5" /><span className={done.includes(i) ? "text-slate-400 line-through" : "text-slate-700"}>{t}</span></li>
      ))}
      <li className="pt-1 font-mono text-[11px] text-slate-400">{done.length}/{items.length} verified</li>
    </ul>
  );
};

export const SummaryTab = ({ c, onEvidence }) => {
  const r = c.report;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Fire risk indicators found in the evidence" icon={Icons.Flame} testid="indicators-panel"><Indicators items={r.indicators} onEvidence={onEvidence} /></Panel>
        <Panel title="Assets at risk" icon={Icons.Building2}><Sums r={r} /></Panel>
        {c.sme_assessment?.areas && (
          <Panel title="What the SME told us (discovery journey)" icon={Icons.MessageSquareText} testid="sme-assessment">
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {c.sme_assessment.areas.map((a) => (<div key={a.id}><div className="flex justify-between text-xs"><span className="text-slate-600">{a.label}</span><span className="font-semibold">{a.level}</span></div><div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-blue-600" style={{ width: `${a.score}%` }} /></div></div>))}
            </div>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600">{(c.sme_assessment.narrative || []).slice(0, 4).map((l, i) => <li key={i} className="flex gap-1.5"><Icons.ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />{l}</li>)}</ul>
          </Panel>
        )}
      </div>
      <div className="space-y-6">
        <Panel title="Risk score" icon={Icons.Gauge}>
          <div className="flex items-center gap-5"><ScoreRing score={r.fire_score} band={r.fire_band} /><div><BandBadge band={r.fire_band}>{r.fire_band} fire risk</BandBadge><p className="mt-2 text-xs leading-relaxed text-slate-500">Weighted from {r.indicators.length} indicators, {r.machinery.length} machine types and the location. {r.location.eq_zone && "Seismic zone. "}{r.location.flood_zone && "Flood-prone state."}</p></div></div>
        </Panel>
        <Panel title="Inspection prep checklist" icon={Icons.ClipboardCheck}><Checklist items={r.inspection_checklist} caseId={c.id} /></Panel>
        <Panel title="Ask the SME for" icon={Icons.FileQuestion}><ul className="space-y-1.5 text-sm text-slate-700" data-testid="data-requests">{r.data_requests.map((d) => <li key={d} className="flex gap-2"><Icons.Dot className="h-5 w-5 shrink-0 text-amber-500" />{d}</li>)}</ul></Panel>
        <p className="text-[11px] leading-relaxed text-slate-400">{r.disclaimer}</p>
      </div>
    </div>
  );
};
