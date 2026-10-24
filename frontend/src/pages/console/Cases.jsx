import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { api } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { inr, STATUS_META, slaInfo, ago } from "@/lib/consoleUi";
import { PageHead, StatusBadge, BandBadge } from "@/components/console/ui";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const Filter = ({ value, onChange, options, placeholder, testid }) => (
  <Select value={value || "all"} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
    <SelectTrigger data-testid={testid} className="h-9 w-[180px] bg-white text-xs"><SelectValue placeholder={placeholder} /></SelectTrigger>
    <SelectContent><SelectItem value="all">{placeholder}</SelectItem>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
  </Select>
);

export default function Cases() {
  const { scope, persona, orgName, agentName } = useConsole();
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [f, setF] = useState({ q: "", status: "", band: "", flagged: false });

  useEffect(() => {
    const t = setTimeout(() => api.get("/cases", { params: { ...scope, ...f, status: f.status || undefined, band: f.band || undefined, q: f.q || undefined } }).then((r) => setRows(r.data)), 200);
    return () => clearTimeout(t);
  }, [f, persona.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-5">
      <PageHead eyebrow="Fire · Textile manufacturing" title="Case queue" sub={persona.role === "agent" ? "Cases assigned to you. Read the pre-inspection report before each site visit." : "Every lead routed by Zurich, with its ComplyStack pre-inspection report attached."} />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative"><Icons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><Input data-testid="case-search" value={f.q} onChange={(e) => set("q")(e.target.value)} placeholder="Lead ID, SME or city" className="h-9 w-64 pl-8 text-xs" /></div>
        <Filter testid="case-filter-status" value={f.status} onChange={set("status")} placeholder="All statuses" options={Object.entries(STATUS_META).map(([k, v]) => [k, v.label])} />
        <Filter testid="case-filter-band" value={f.band} onChange={set("band")} placeholder="All risk bands" options={["Low", "Moderate", "Elevated", "High"].map((b) => [b, b])} />
        <label className="ml-1 flex items-center gap-2 text-xs text-slate-600"><Switch data-testid="case-filter-flagged" checked={f.flagged} onCheckedChange={set("flagged")} /> Flagged only</label>
        <span className="ml-auto font-mono text-xs text-slate-400" data-testid="case-count">{rows ? `${rows.length} cases` : "…"}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1100px] text-left text-xs" data-testid="case-table">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>{["Lead ID", "SME", "Sum insured", "Fire risk", "Status", "Distributor · Agent", "Received", "SLA", "Flags"].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows?.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">No cases match these filters.</td></tr>}
            {rows?.map((c) => { const s = slaInfo(c); return (
              <tr key={c.id} data-testid={`case-row-${c.lead_id}`} onClick={() => nav(`/console/cases/${c.id}`)} className="cursor-pointer transition-colors hover:bg-blue-50/40">
                <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{c.lead_id}{c.source === "sme_journey" && <span className="ml-1.5 rounded bg-blue-600 px-1 py-px text-[9px] font-bold text-white">LIVE</span>}</td>
                <td className="px-4 py-3"><p className="font-semibold text-slate-900">{c.sme.business_name}</p><p className="text-[11px] text-slate-500">{c.sme.city}, {c.sme.state} · {c.sme.headcount} staff</p></td>
                <td className="px-4 py-3 font-mono">{inr(c.report.total_sum_insured)}</td>
                <td className="px-4 py-3"><BandBadge band={c.report.fire_band}>{c.report.fire_score} · {c.report.fire_band}</BandBadge></td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3"><p className="text-slate-800">{orgName(c.distributor_id)}</p><p className="text-[11px] text-slate-500">{agentName(c.agent_id)}</p></td>
                <td className="px-4 py-3 text-slate-500">{ago(c.created_at)}</td>
                <td className={`px-4 py-3 ${s.cls}`}>{s.text}</td>
                <td className="px-4 py-3">{c.flags?.length ? <span className="inline-flex items-center gap-1 font-semibold text-rose-600"><Icons.ShieldAlert className="h-3.5 w-3.5" />{c.flags.length}</span> : <span className="text-slate-300">—</span>}</td>
              </tr>); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
