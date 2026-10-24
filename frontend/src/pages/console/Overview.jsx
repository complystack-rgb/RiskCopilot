import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { api } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { inr, PIPELINE, STATUS_META, BAND_HEX, slaInfo } from "@/lib/consoleUi";
import { Kpi, Panel, PageHead, StatusBadge, BandBadge } from "@/components/console/ui";

const Funnel = ({ byStatus }) => {
  const max = Math.max(1, ...Object.values(byStatus));
  return (
    <div className="space-y-2" data-testid="pipeline-funnel">
      {PIPELINE.map((s) => (
        <div key={s} className="grid grid-cols-[150px_1fr_32px] items-center gap-3 text-xs">
          <span className="truncate text-slate-600">{STATUS_META[s].label}</span>
          <div className="h-5 overflow-hidden rounded bg-slate-100"><div className="h-full rounded bg-[#2563EB] transition-all duration-700" style={{ width: `${((byStatus[s] || 0) / max) * 100}%`, opacity: 0.45 + 0.55 * ((byStatus[s] || 0) / max) }} /></div>
          <span className="text-right font-mono font-semibold text-slate-900">{byStatus[s] || 0}</span>
        </div>
      ))}
    </div>
  );
};

const League = ({ rows }) => (
  <table className="w-full text-left text-xs" data-testid="distributor-league">
    <thead className="text-[10px] uppercase tracking-wider text-slate-400 [&_th]:px-2"><tr><th className="pb-2 !pl-0">Distributor</th><th className="pb-2 text-right">Cases</th><th className="pb-2 text-right">Open</th><th className="pb-2 text-right">Won</th><th className="pb-2 text-right">Flags</th><th className="pb-2">Alignment</th></tr></thead>
    <tbody className="divide-y divide-slate-100 [&_td]:px-2">
      {rows.map((r) => (
        <tr key={r.org_id}>
          <td className="py-2.5 !pl-0 font-medium text-slate-800">{r.name}</td>
          <td className="py-2.5 text-right font-mono">{r.cases}</td><td className="py-2.5 text-right font-mono">{r.open}</td><td className="py-2.5 text-right font-mono">{r.approved}</td>
          <td className={`py-2.5 text-right font-mono ${r.flags ? "font-bold text-rose-600" : ""}`}>{r.flags}</td>
          <td className="py-2.5">{r.alignment == null ? <span className="text-slate-400">None yet</span> : (
            <div className="flex items-center gap-2"><div className="h-1.5 w-14 rounded bg-slate-100"><div className={`h-full rounded ${r.alignment >= 80 ? "bg-emerald-500" : r.alignment >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${r.alignment}%` }} /></div><span className="font-mono">{r.alignment}%</span></div>)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default function Overview() {
  const { scope, persona, orgName, agentName } = useConsole();
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  useEffect(() => {
    api.get("/console/stats", { params: scope }).then((r) => setStats(r.data));
    api.get("/cases", { params: scope }).then((r) => setCases(r.data));
  }, [persona.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats) return <p className="text-sm text-slate-500">Loading…</p>;
  const bands = ["Low", "Moderate", "Elevated", "High"].map((b) => ({ band: b, n: stats.by_band[b] || 0 }));
  const urgent = cases.filter((c) => !["approved", "declined"].includes(c.status)).sort((a, b) => new Date(a.sla_due) - new Date(b.sla_due)).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHead eyebrow={persona.title} title={persona.role === "agent" ? `Good day, ${persona.name.split(" ")[0]}` : "Pipeline overview"}
        sub="Fire insurance · Textile manufacturing · India" right={<Link to="/console/cases" data-testid="overview-open-queue" className="inline-flex items-center gap-1.5 rounded-md bg-[#0A1F44] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#13306a]">Open case queue <Icons.ArrowRight className="h-4 w-4" /></Link>} />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi testid="kpi-total" label="Cases" value={stats.total} sub={`${stats.total - (stats.by_status.approved || 0) - (stats.by_status.declined || 0)} open`} icon={Icons.Inbox} />
        <Kpi testid="kpi-si" label="Sum insured" value={inr(stats.total_sum_insured)} sub="Assets seen in evidence" icon={Icons.Building2} />
        <Kpi testid="kpi-premium" label="Indicative GWP" value={inr(stats.indicative_premium)} sub="Essential + recommended" icon={Icons.IndianRupee} />
        <Kpi testid="kpi-score" label="Avg fire score" value={stats.avg_fire_score} sub="0–100, higher = riskier" icon={Icons.Flame} tone="text-orange-600" />
        <Kpi testid="kpi-sla" label="SLA breaches" value={stats.sla_breaches} sub="72h to recommendation" icon={Icons.Timer} tone={stats.sla_breaches ? "text-rose-600" : undefined} />
        <Kpi testid="kpi-flags" label="Mis-selling flags" value={stats.open_flags} sub="Raised by the engine" icon={Icons.ShieldAlert} tone={stats.open_flags ? "text-rose-600" : undefined} />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Pipeline" icon={Icons.GitBranch} className="lg:col-span-3"><Funnel byStatus={stats.by_status} /></Panel>
        <Panel title="Fire risk distribution" icon={Icons.Flame} className="lg:col-span-2">
          <div className="h-56" data-testid="risk-distribution">
            <ResponsiveContainer><BarChart data={bands} margin={{ left: -24 }}><XAxis dataKey="band" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#F1F5F9" }} />
              <Bar dataKey="n" name="Cases" radius={[4, 4, 0, 0]}>{bands.map((b) => <Cell key={b.band} fill={BAND_HEX[b.band]} />)}</Bar></BarChart></ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Priority queue · closest to SLA" icon={Icons.AlarmClock} className="lg:col-span-3" testid="priority-queue">
          <ul className="-my-2 divide-y divide-slate-100">
            {urgent.length === 0 && <li className="py-3 text-sm text-slate-500">Nothing open. Nice work.</li>}
            {urgent.map((c) => { const s = slaInfo(c); return (
              <li key={c.id}><Link to={`/console/cases/${c.id}`} data-testid={`priority-case-${c.lead_id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:bg-slate-50">
                <span className="w-28 font-mono text-xs text-slate-500">{c.lead_id}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-900">{c.sme.business_name}</span><span className="text-[11px] text-slate-500">{c.sme.city} · {agentName(c.agent_id)}</span></span>
                <BandBadge band={c.report.fire_band}>{c.report.fire_score}</BandBadge><StatusBadge status={c.status} /><span className={`w-24 text-right text-xs ${s.cls}`}>{s.text}</span>
              </Link></li>); })}
          </ul>
        </Panel>
        <Panel title={persona.role === "insurer" ? "Distributor league" : `${orgName(persona.org_id)}`} icon={Icons.Trophy} className="lg:col-span-2"><League rows={stats.league} /></Panel>
      </div>
    </div>
  );
}
