import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { Panel } from "@/components/console/ui";
import { fmtDate } from "@/lib/consoleUi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ICON = { submitted: Icons.Send, report_generated: Icons.Cpu, routed: Icons.Route, assigned: Icons.UserPlus, inspection_scheduled: Icons.CalendarClock, inspected: Icons.ClipboardCheck,
  recommendation_submitted: Icons.FileCheck2, justification_requested: Icons.MessageSquareWarning, approved: Icons.BadgeCheck, declined: Icons.XCircle, note: Icons.StickyNote };

export const ActivityTab = ({ c, onUpdate }) => {
  const { persona } = useConsole();
  const [text, setText] = useState("");
  const add = async () => {
    try { const { data } = await api.post(`/cases/${c.id}/notes`, { text, actor: persona.name }); onUpdate(data); setText(""); toast.success("Note added"); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title="Audit trail" icon={Icons.History} className="lg:col-span-2" testid="audit-trail">
        <ol className="relative space-y-4 border-l border-slate-200 pl-6">
          {[...c.activity].reverse().map((a, i) => { const I = ICON[a.action] || Icons.Circle; return (
            <li key={i} className="relative">
              <span className="absolute -left-[33px] flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white"><I className="h-3 w-3 text-blue-600" /></span>
              <p className="text-sm text-slate-800"><b>{a.actor}</b> · {a.detail}</p>
              <p className="font-mono text-[11px] text-slate-400">{fmtDate(a.at)}</p>
            </li>); })}
        </ol>
      </Panel>
      <Panel title="Add internal note" icon={Icons.StickyNote}>
        <Textarea data-testid="note-input" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Visible to the insurer and the distributor" />
        <Button data-testid="note-submit-btn" disabled={!text.trim()} onClick={add} className="mt-3 w-full">Add note</Button>
      </Panel>
    </div>
  );
};

export const ApiTab = ({ c }) => {
  const [pkg, setPkg] = useState(null);
  useEffect(() => { api.get(`/cases/${c.id}/package`).then((r) => setPkg(r.data)); }, [c.id, c.updated_at]);
  const url = `${process.env.REACT_APP_BACKEND_URL}/api/v1/leads/${c.lead_id}`;
  const curl = `curl -H "X-API-Key: <partner key>" \\\n  ${url}`;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <Panel title="Insurer retrieval API" icon={Icons.Code2}>
          <p className="text-xs text-slate-600">Zurich systems pull this pre-underwriting package by lead ID. You can also list all leads for a distributor or agent with <code className="rounded bg-slate-100 px-1 font-mono">?distributor_id=</code>.</p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-[#0A1F44] p-3 font-mono text-[11px] text-blue-100" data-testid="api-curl">{curl}</pre>
          <Button variant="outline" size="sm" className="mt-3" data-testid="api-copy-btn" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(pkg, null, 2)); toast.success("JSON copied"); }}><Icons.Copy className="mr-1.5 h-3.5 w-3.5" /> Copy JSON</Button>
        </Panel>
        <Panel title="Endpoints" icon={Icons.Plug}>
          <ul className="space-y-2 font-mono text-[11px]">{["GET /api/v1/leads/{lead_id}", "GET /api/v1/leads?distributor_id=", "GET /api/v1/leads?agent_id="].map((e) => <li key={e} className="rounded bg-slate-50 px-2 py-1.5"><span className="font-bold text-emerald-600">GET</span>{e.slice(3)}</li>)}</ul>
        </Panel>
      </div>
      <Panel title={`Response · ${c.lead_id}`} icon={Icons.Braces} className="lg:col-span-2">
        <pre className="max-h-[620px] overflow-auto rounded-md bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-300" data-testid="api-json">{pkg ? JSON.stringify(pkg, null, 2) : "Loading…"}</pre>
      </Panel>
    </div>
  );
};
