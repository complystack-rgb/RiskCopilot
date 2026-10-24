import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { api } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { PageHead, Panel, Kpi, StatusBadge } from "@/components/console/ui";

const TYPE = { overlooked: ["Cover overlooked", "text-rose-700 bg-rose-50 border-rose-200"], unsupported: ["Not supported by evidence", "text-orange-700 bg-orange-50 border-orange-200"], weak_justification: ["Weak justification", "text-amber-700 bg-amber-50 border-amber-200"] };

export default function Oversight() {
  const { orgName, agentName } = useConsole();
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/cases", { params: { flagged: true } }).then((r) => setCases(r.data)); api.get("/console/stats").then((r) => setStats(r.data)); }, []);
  const all = cases.flatMap((c) => c.flags.map((f) => ({ ...f, c })));
  const count = (t) => all.filter((f) => f.type === t).length;

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Insurer · Distribution governance" title="Recommendation oversight" sub="Each agent recommendation is checked against the evidence-based engine output, so you can see and question the basis for every sale." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi testid="oversight-total" label="Open flags" value={all.length} icon={Icons.ShieldAlert} tone={all.length ? "text-rose-600" : undefined} />
        <Kpi testid="oversight-overlooked" label="Cover overlooked" value={count("overlooked")} sub="Essential cover left out" icon={Icons.EyeOff} />
        <Kpi testid="oversight-unsupported" label="Not supported" value={count("unsupported")} sub="No evidence for the product" icon={Icons.Unlink} />
        <Kpi testid="oversight-weak" label="Weak justification" value={count("weak_justification")} sub="Under 12 words" icon={Icons.MessageSquareOff} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Flag queue" icon={Icons.ListChecks} className="lg:col-span-2" testid="flag-queue">
          {all.length === 0 ? <p className="text-sm text-slate-500">No open flags.</p> : (
            <ul className="-my-2 divide-y divide-slate-100">
              {all.map((f, i) => (
                <li key={i} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <span className={`w-fit shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${TYPE[f.type][1]}`}>{TYPE[f.type][0]}</span>
                  <div className="min-w-0 flex-1"><p className="text-sm text-slate-800">{f.text}</p><p className="text-[11px] text-slate-500"><span className="font-mono">{f.c.lead_id}</span> · {f.c.sme.business_name} · {agentName(f.c.agent_id)} ({orgName(f.c.distributor_id)})</p></div>
                  <StatusBadge status={f.c.status} />
                  <Link to={`/console/cases/${f.c.id}?tab=recommendation`} data-testid={`flag-open-${f.c.lead_id}-${i}`} className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Review</Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="How flags are raised" icon={Icons.Info}>
          <ul className="space-y-3 text-xs leading-relaxed text-slate-600">
            <li><b className="text-slate-900">Cover overlooked</b>: the engine rated a cover Essential from the photos, video or machinery, but the agent left it out.</li>
            <li><b className="text-slate-900">Not supported by evidence</b>: the agent proposed a product the evidence does not support, which may mean over-selling.</li>
            <li><b className="text-slate-900">Weak justification</b>: the reasoning is too short to review.</li>
            <li className="text-slate-400">Flags are prompts for review. They are not findings of mis-selling.</li>
          </ul>
          {stats && <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">{stats.league.map((l) => (
            <div key={l.org_id} className="text-xs"><div className="flex justify-between"><span className="text-slate-700">{l.name}</span><span className="font-mono">{l.alignment ?? "—"}%</span></div><div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-[#0A1F44]" style={{ width: `${l.alignment || 0}%` }} /></div></div>
          ))}</div>}
        </Panel>
      </div>
    </div>
  );
}
