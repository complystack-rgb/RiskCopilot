import { useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { Panel } from "@/components/console/ui";
import { fmtDate } from "@/lib/consoleUi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const ICON = { submitted: Icons.Send, report_generated: Icons.FileBarChart, assigned: Icons.UserPlus, contacted: Icons.PhoneCall, visit_scheduled: Icons.CalendarClock, visited: Icons.ClipboardCheck,
  proposal_submitted: Icons.FileCheck2, info_requested: Icons.MessageSquareWarning, quoted: Icons.BadgeCheck, bound: Icons.Handshake, lost: Icons.XCircle, note: Icons.StickyNote, checklist: Icons.ListChecks };

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
            <li key={i} className="relative"><span className="absolute -left-[33px] flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white"><I className="h-3 w-3 text-blue-600" /></span>
              <p className="text-sm text-slate-800"><b>{a.actor}</b> · {a.detail}</p><p className="font-mono text-[11px] text-slate-400">{fmtDate(a.at)}</p></li>); })}
        </ol>
      </Panel>
      <Panel title="Add a note" icon={Icons.StickyNote}>
        <Textarea data-testid="note-input" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="Visible to your team" />
        <Button data-testid="note-submit-btn" disabled={!text.trim()} onClick={add} className="mt-3 w-full">Add note</Button>
      </Panel>
    </div>
  );
};
