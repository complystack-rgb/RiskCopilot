import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { Panel, BandBadge, ScoreRing } from "@/components/console/ui";
import { Checkbox } from "@/components/ui/checkbox";

export const SummaryTab = ({ c, onUpdate, onEvidence }) => {
  const { money, meta, persona } = useConsole();
  const a = c.assessment;
  const toggle = async (i) => {
    const n = c.checklist_done.includes(i) ? c.checklist_done.filter((x) => x !== i) : [...c.checklist_done, i];
    try { const { data } = await api.post(`/cases/${c.id}/checklist`, { done: n, actor: persona.name }); onUpdate(data); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Protection gaps" icon={Icons.ShieldAlert} testid="gaps-panel" action={<span className="font-mono text-sm font-bold text-rose-600">{money(a.protection_gap)}</span>}>
          <ul className="divide-y divide-slate-100">{a.gaps.map((g) => (
            <li key={g.category} className="flex items-center gap-3 py-3" data-testid={`gap-${g.category}`}>
              <BandBadge band={g.severity} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{g.title}</p><p className="text-xs text-slate-500">{meta.categories[g.category]} · {g.covered ? "partly covered today" : "not covered today"}</p></div>
              <span className="font-mono text-sm font-semibold">{money(g.uncovered_value)}</span></li>))}</ul>
        </Panel>
        <Panel title="Findings from the evidence" icon={Icons.ScanSearch} testid="findings-panel">
          <ul className="divide-y divide-slate-100">{c.indicators.map((i) => (
            <li key={i.id} className="flex items-start gap-3 py-3"><BandBadge band={i.severity} />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-900">{i.finding}</p><p className="mt-0.5 text-xs text-slate-500">Verify on site: {i.verify}</p></div>
              <button data-testid={`finding-evidence-${i.id}`} onClick={() => onEvidence(i.photo)} className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-blue-700 hover:bg-blue-50">View photo</button></li>))}</ul>
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Risk score" icon={Icons.Gauge}><div className="flex items-center gap-5"><ScoreRing score={a.risk_score} band={a.risk_band} label="Risk" />
          <div className="space-y-1 text-xs"><BandBadge band={a.risk_band}>{a.risk_band} risk</BandBadge><p className="text-slate-500">Coverage today: <b className="text-slate-900">{Math.round(a.coverage_ratio * 100)}%</b> of insurable value</p><p className="text-slate-500">Insurable value: <b className="text-slate-900">{money(a.total_insurable)}</b></p></div></div></Panel>
        <Panel title="Site visit checklist" icon={Icons.ClipboardCheck} testid="site-checklist">
          <ul className="space-y-2">{c.checklist.map((t, i) => <li key={i} className="flex items-start gap-2.5 text-sm"><Checkbox data-testid={`checklist-${i}`} checked={c.checklist_done.includes(i)} onCheckedChange={() => toggle(i)} className="mt-0.5" /><span className={c.checklist_done.includes(i) ? "text-slate-400 line-through" : "text-slate-700"}>{t}</span></li>)}</ul>
          <p className="mt-3 font-mono text-[11px] text-slate-400">{c.checklist_done.length}/{c.checklist.length} verified</p>
        </Panel>
        <Panel title="Client contact" icon={Icons.Contact}><dl className="space-y-1.5 text-xs">{[["Contact", c.sme.contact_name], ["Phone", c.sme.phone], ["Email", c.sme.email], ["Employees", c.sme.employees], ["Annual revenue", money(c.sme.revenue)]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="truncate font-medium text-slate-900">{v}</dd></div>)}</dl></Panel>
      </div>
    </div>
  );
};

export const AssetsTab = ({ c }) => {
  const { money } = useConsole();
  const v = c.assessment.values;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[["Building", v.building], ["Plant & machinery", v.machinery], ["Stock", v.stock], ["Annual revenue", v.revenue]].map(([k, x]) => (
        <div key={k} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400">{k}</p><p className="mt-1 font-mono text-xl font-bold">{money(x)}</p></div>))}</div>
      <Panel title="Machinery register · read from ID plates" icon={Icons.Cog} testid="machinery-register">
        <div className="-mx-5 -my-5 overflow-x-auto"><table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Machine", "Manufacturer · Model", "Serial", "Year", "Units", "Unit value", "Replacement value", "Read confidence"].map((h) => <th key={h} className="px-5 py-2.5">{h}</th>)}</tr></thead>
          <tbody>{c.machinery.map((mm) => <tr key={mm.id} className="border-t border-slate-100"><td className="px-5 py-3 font-semibold">{mm.type}</td><td className="px-5 py-3">{mm.manufacturer} · {mm.model}</td><td className="px-5 py-3 font-mono">{mm.serial}</td><td className="px-5 py-3 font-mono">{mm.year}</td><td className="px-5 py-3 font-mono">{mm.units}</td><td className="px-5 py-3 font-mono">{money(mm.unit_value)}</td><td className="px-5 py-3 font-mono font-semibold">{money(mm.replacement_value)}</td><td className="px-5 py-3 font-mono text-emerald-600">{Math.round(mm.confidence * 100)}%</td></tr>)}</tbody>
        </table></div>
      </Panel>
    </div>
  );
};

export const CoverageTab = ({ c }) => {
  const { money, meta } = useConsole();
  const a = c.assessment, p = c.prior_policy;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Current cover" icon={Icons.FileText} testid="current-cover">
        {p ? <dl className="space-y-2.5 text-xs">{[["Insurer", p.insurer], ["Covers", p.categories.map((x) => meta.categories[x]).join(", ")], ["Property sum insured", money(p.sum_insured)], ["Premium", money(p.premium)], ["Renewal", p.expiry], ["Source", p.source]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-medium text-slate-900">{v}</dd></div>))}</dl>
          : <p className="text-sm text-slate-600" data-testid="no-cover">No policy in force. Every recommended cover is new business.</p>}
      </Panel>
      <Panel title="Exposure vs cover by category" icon={Icons.Scale} className="lg:col-span-2" testid="exposure-vs-cover">
        <div className="space-y-4">{Object.entries(a.exposure).map(([cat, exp]) => { const gap = a.gaps.find((g) => g.category === cat); const covered = exp - (gap?.uncovered_value || 0); return (
          <div key={cat} className="text-xs"><div className="mb-1 flex justify-between"><span className="font-medium text-slate-700">{meta.categories[cat]}</span><span className="font-mono">{money(covered)} <span className="text-slate-400">of</span> {money(exp)}</span></div>
            <div className="flex h-3 overflow-hidden rounded bg-rose-100"><div className="h-full bg-emerald-500" style={{ width: `${(covered / exp) * 100}%` }} /></div>
            {gap && <p className="mt-1 text-rose-600">Gap {money(gap.uncovered_value)}</p>}</div>); })}</div>
      </Panel>
    </div>
  );
};
