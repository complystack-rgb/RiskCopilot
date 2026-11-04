import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { STATUS_META, BAND_HEX, CAT_HEX } from "@/lib/consoleUi";
import { Panel, StatusBadge } from "@/components/console/ui";

const Kpi = ({ label, value, sub, icon: I, tone, testid, accent }) => (
  <div data-testid={testid} className={`rounded-xl border p-4 shadow-sm ${accent ? "border-[#0A1F44] bg-[#0A1F44] text-white" : "border-slate-200 bg-white"}`}>
    <div className="flex items-center justify-between"><p className={`text-[11px] font-medium uppercase tracking-wider ${accent ? "text-blue-200" : "text-slate-500"}`}>{label}</p><I className={`h-4 w-4 ${accent ? "text-blue-300" : "text-slate-400"}`} /></div>
    <p className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${tone || ""}`}>{value}</p>
    {sub && <p className={`mt-0.5 text-xs ${accent ? "text-blue-100/80" : "text-slate-500"}`}>{sub}</p>}
  </div>
);

const INSIGHT_ICON = { risk: [Icons.AlertOctagon, "text-rose-600 bg-rose-50"], gap: [Icons.PieChart, "text-blue-700 bg-blue-50"], opportunity: [Icons.TrendingUp, "text-emerald-700 bg-emerald-50"] };

const Insights = ({ items, money }) => (
  <div className="grid gap-3 md:grid-cols-2" data-testid="portfolio-insights">
    {items.map((x, i) => { const [I, c] = INSIGHT_ICON[x.tone]; return (
      <div key={i} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c}`}><I className="h-4 w-4" /></span>
        <div className="min-w-0"><p className="text-sm font-semibold text-slate-900">{x.title}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{x.body}</p><p className="mt-2 font-mono text-xs font-semibold text-[#0A1F44]">{money(x.value)} exposed</p></div>
      </div>); })}
  </div>
);

const tip = (money) => ({ formatter: (v, n) => [typeof v === "number" && v > 1000 ? money(v) : v, n], contentStyle: { fontSize: 12, borderRadius: 8 } });

export default function Overview() {
  const { scope, persona, money, m, agentName } = useConsole();
  const [s, setS] = useState(null);
  useEffect(() => { setS(null); api.get("/console/stats", { params: scope }).then((r) => setS(r.data)); }, [scope.market, persona?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/60" />)}</div>;
  const k = s.kpis;
  const bands = ["Low", "Moderate", "Elevated", "High"].map((b) => ({ name: b, value: s.bands[b] || 0 }));
  const pipe = s.pipeline.filter((p) => p.status !== "lost");
  const maxPipe = Math.max(1, ...pipe.map((p) => p.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">{m.name} · {persona?.title}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Good to see you, {persona?.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Your book has <b className="text-slate-900">{money(k.open_gap)}</b> of open protection gaps across {k.active} active assessments. {s.attention.length} cases need you today.</p>
        </div>
        <div className="flex gap-2"><span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><Icons.Calendar className="mr-1.5 inline h-3.5 w-3.5" />Last 6 months</span>
          <Link to="/console/cases" data-testid="overview-open-cases" className="inline-flex items-center gap-1.5 rounded-md bg-[#0A1F44] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#13306a]">All cases <Icons.ArrowRight className="h-4 w-4" /></Link></div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi accent testid="kpi-gap" label="Protection gap identified" value={money(k.protection_gap)} sub={`${money(k.open_gap)} still open`} icon={Icons.ShieldAlert} />
        <Kpi testid="kpi-gap-closed" label="Gap closed" value={money(k.gap_closed)} sub="Through quoted & bound proposals" icon={Icons.ShieldCheck} tone="text-emerald-600" />
        <Kpi testid="kpi-pipeline" label="Pipeline premium" value={money(k.pipeline_premium)} sub="Indicative, open cases" icon={Icons.Layers} />
        <Kpi testid="kpi-bound" label="Premium bound" value={money(k.bound_premium)} sub={`${k.bound} policies`} icon={Icons.BadgeCheck} />
        <Kpi testid="kpi-win" label="Win rate" value={`${k.win_rate}%`} sub="Bound vs lost" icon={Icons.Trophy} />
        <Kpi testid="kpi-active" label="Active assessments" value={k.active} sub={`${k.total} in total`} icon={Icons.FolderOpen} />
        <Kpi testid="kpi-days" label="Avg days to proposal" value={k.avg_days_to_proposal} sub="From SME submission" icon={Icons.Timer} />
        <Kpi testid="kpi-sla" label="SLAs at risk" value={k.sla_at_risk} sub="Next 12 hours" icon={Icons.AlarmClock} tone={k.sla_at_risk ? "text-rose-600" : ""} />
        <Kpi testid="kpi-under" label="Underinsured clients" value={`${k.underinsured_pct}%`} sub="Cover below 80% of observed" icon={Icons.Scale} tone="text-orange-600" />
        <Kpi testid="kpi-unins" label="Uninsured clients" value={`${k.uninsured_pct}%`} sub="No policy in force" icon={Icons.ShieldOff} tone="text-rose-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Needs attention" icon={Icons.BellRing} className="xl:col-span-1" testid="needs-attention">
          <ul className="-my-2 divide-y divide-slate-100">
            {s.attention.length === 0 && <li className="py-4 text-sm text-slate-500">You are all caught up.</li>}
            {s.attention.map((a) => (
              <li key={a.id}><Link to={`/console/cases/${a.id}`} data-testid={`attention-${a.lead_id}`} className="flex items-start gap-3 py-2.5 hover:bg-slate-50">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.status === "info_requested" || a.reason.includes("SLA") ? "bg-rose-500" : a.status === "quoted" ? "bg-emerald-500" : "bg-blue-500"}`} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{a.name}</span><span className="block text-xs text-slate-500">{a.reason} · {agentName(a.agent_id)}</span></span>
                <span className="shrink-0 text-right"><span className="block font-mono text-xs font-semibold text-slate-900">{money(a.gap)}</span><span className="font-mono text-[10px] text-slate-400">{a.lead_id}</span></span>
              </Link></li>))}
          </ul>
        </Panel>
        <Panel title="Assessments and bound business" icon={Icons.LineChart} className="xl:col-span-2" testid="trend-chart">
          <div className="h-64"><ResponsiveContainer><AreaChart data={s.monthly} margin={{ left: -20, right: 8 }}>
            <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="#EEF2F7" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip {...tip(money)} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="assessments" name="Assessments" stroke="#2563EB" strokeWidth={2} fill="url(#ga)" /><Area type="monotone" dataKey="bound" name="Bound" stroke="#059669" strokeWidth={2} fill="transparent" />
          </AreaChart></ResponsiveContainer></div>
        </Panel>
      </div>

      <Panel title="Where to act next" icon={Icons.Target}><Insights items={s.insights} money={money} /></Panel>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Protection gap by cover category" icon={Icons.BarChart3} className="xl:col-span-2" testid="gap-by-category">
          <div className="h-72"><ResponsiveContainer><BarChart data={s.gap_by_category} layout="vertical" margin={{ left: 40, right: 16 }}>
            <CartesianGrid stroke="#EEF2F7" horizontal={false} /><XAxis type="number" tickFormatter={money} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} axisLine={false} tickLine={false} />
            <Tooltip {...tip(money)} /><Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="identified" name="Identified" radius={[0, 4, 4, 0]}>{s.gap_by_category.map((g) => <Cell key={g.category} fill={CAT_HEX[g.category]} fillOpacity={0.35} />)}</Bar>
            <Bar dataKey="closed" name="Closed" radius={[0, 4, 4, 0]}>{s.gap_by_category.map((g) => <Cell key={g.category} fill={CAT_HEX[g.category]} />)}</Bar>
          </BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Risk mix · open cases" icon={Icons.Gauge} testid="risk-mix">
          <div className="h-48"><ResponsiveContainer><PieChart><Pie data={bands} dataKey="value" innerRadius={50} outerRadius={78} paddingAngle={2}>{bands.map((b) => <Cell key={b.name} fill={BAND_HEX[b.name]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <div className="grid grid-cols-2 gap-2 text-xs">{bands.map((b) => <div key={b.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAND_HEX[b.name] }} /><span className="text-slate-600">{b.name}</span><span className="ml-auto font-mono font-semibold">{b.value}</span></div>)}</div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Pipeline by stage" icon={Icons.GitBranch} testid="pipeline-stages">
          <div className="space-y-2.5">{pipe.map((p) => (
            <Link key={p.status} to={`/console/cases?status=${p.status}`} className="grid grid-cols-[120px_1fr_70px] items-center gap-3 text-xs hover:opacity-80">
              <span className="truncate text-slate-600">{STATUS_META[p.status].label}</span>
              <div className="h-5 rounded bg-slate-100"><div className="flex h-full items-center justify-end rounded bg-[#2563EB] pr-1.5 font-mono text-[10px] font-semibold text-white" style={{ width: `${Math.max(8, (p.count / maxPipe) * 100)}%` }}>{p.count}</div></div>
              <span className="text-right font-mono text-slate-700">{money(p.value)}</span>
            </Link>))}</div>
        </Panel>
        <Panel title="Industry mix and gap" icon={Icons.Factory} testid="industry-mix">
          <ul className="space-y-2.5">{s.industries.map((i) => (
            <li key={i.industry} className="text-xs"><div className="flex justify-between"><span className="truncate text-slate-700">{i.industry} <span className="text-slate-400">· {i.cases}</span></span><span className="font-mono font-semibold">{money(i.gap)}</span></div>
              <div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-[#0A1F44]" style={{ width: `${(i.gap / s.industries[0].gap) * 100}%` }} /></div></li>))}</ul>
        </Panel>
        <Panel title="Team leaderboard" icon={Icons.Medal} testid="team-leaderboard">
          <table className="w-full text-xs"><thead className="text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="pb-2 text-left">Agent</th><th className="pb-2 text-right">Open</th><th className="pb-2 text-right">Bound</th><th className="pb-2 text-right">Premium</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{s.team.map((t, i) => <tr key={t.id}><td className="py-2.5 font-medium text-slate-800"><span className="mr-2 font-mono text-slate-400">{i + 1}</span>{t.name}</td><td className="py-2.5 text-right font-mono">{t.open}</td><td className="py-2.5 text-right font-mono">{t.bound}</td><td className="py-2.5 text-right font-mono font-semibold">{money(t.premium)}</td></tr>)}</tbody></table>
        </Panel>
      </div>
    </div>
  );
}
