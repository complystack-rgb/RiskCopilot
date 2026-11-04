import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { STATUS_META, slaInfo, ago } from "@/lib/consoleUi";
import { PageHead, StatusBadge, BandBadge } from "@/components/console/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Filter = ({ value, onChange, options, placeholder, testid }) => (
  <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
    <SelectTrigger data-testid={testid} className="h-9 w-[190px] bg-white text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent><SelectItem value="all">{placeholder}</SelectItem>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
  </Select>
);

export default function Cases() {
  const { scope, persona, meta, money, agentName, m } = useConsole();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [rows, setRows] = useState(null);
  const [f, setF] = useState({ q: "", status: params.get("status") || "", band: "", category: "" });
  useEffect(() => {
    const t = setTimeout(() => api.get("/cases", { params: { ...scope, q: f.q || undefined, status: f.status || undefined, band: f.band || undefined, category: f.category || undefined } })
      .then((r) => setRows(r.data)).catch((e) => { setRows([]); toast.error(errMsg(e)); }), 200);
    return () => clearTimeout(t);
  }, [f, scope.market, persona?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      <PageHead eyebrow={`${m.name} · ${m.currency}`} title="Cases" sub="Every SME assessment routed to you, with its protection report, evidence and proposal in one place." />
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative"><Icons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><Input data-testid="case-search" value={f.q} onChange={(e) => set("q")(e.target.value)} placeholder="Client, lead ID, city, industry" className="h-9 w-64 pl-8 text-xs" /></div>
        <Filter testid="case-filter-status" value={f.status} onChange={set("status")} placeholder="All stages" options={Object.entries(STATUS_META).map(([k, v]) => [k, v.label])} />
        <Filter testid="case-filter-band" value={f.band} onChange={set("band")} placeholder="All risk levels" options={["Low", "Moderate", "Elevated", "High"].map((b) => [b, b])} />
        <Filter testid="case-filter-category" value={f.category} onChange={set("category")} placeholder="Any gap category" options={Object.entries(meta.categories)} />
        <span className="ml-auto font-mono text-xs text-slate-400" data-testid="case-count">{rows ? `${rows.length} cases` : "…"}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1150px] text-left text-xs" data-testid="case-table">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>{["Client", "Industry", "Risk", "Protection gap", "Gaps", "Stage", "Agent", "Updated", "SLA"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows?.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">No cases match these filters.</td></tr>}
            {rows?.map((c) => { const s = slaInfo(c); return (
              <tr key={c.id} data-testid={`case-row-${c.lead_id}`} onClick={() => nav(`/console/cases/${c.id}`)} className="cursor-pointer transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-3"><p className="font-semibold text-slate-900">{c.sme.business_name}{c.source === "sme_journey" && <span className="ml-1.5 rounded bg-blue-600 px-1 py-px text-[9px] font-bold text-white">NEW</span>}</p><p className="font-mono text-[10px] text-slate-400">{c.lead_id} · {c.sme.city}</p></td>
                <td className="px-4 py-3 text-slate-600">{c.sme.industry}</td>
                <td className="px-4 py-3"><BandBadge band={c.assessment.risk_band}>{c.assessment.risk_score} · {c.assessment.risk_band}</BandBadge></td>
                <td className="px-4 py-3 font-mono font-semibold text-slate-900">{money(c.assessment.protection_gap)}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{c.assessment.gaps.slice(0, 3).map((g) => <span key={g.category} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{meta.categories[g.category]}</span>)}{c.assessment.gaps.length > 3 && <span className="text-[10px] text-slate-400">+{c.assessment.gaps.length - 3}</span>}</div></td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-slate-700">{agentName(c.agent_id)}</td>
                <td className="px-4 py-3 text-slate-500">{ago(c.updated_at)}</td>
                <td className={`px-4 py-3 ${s.cls}`}>{s.text}</td>
              </tr>); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
