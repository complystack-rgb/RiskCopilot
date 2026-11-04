import { Navigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { PageHead, Panel } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AddAgent = ({ orgId, onDone }) => {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", city: "", role: "agent" });
  const save = async () => {
    try { await api.post(`/orgs/${orgId}/agents`, f); toast.success(`${f.name} added`); setOpen(false); setF({ name: "", email: "", city: "", role: "agent" }); onDone(); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" data-testid="add-agent-btn" className="bg-[#0A1F44] hover:bg-[#13306a]"><Icons.UserPlus className="mr-1.5 h-4 w-4" /> Add user</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add a user</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input data-testid="agent-name-input" placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input data-testid="agent-email-input" placeholder="Work email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input data-testid="agent-city-input" placeholder="Base city" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}><SelectTrigger data-testid="agent-role-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="agent">Field agent</SelectItem><SelectItem value="admin">Distributor admin</SelectItem></SelectContent></Select>
          <Button data-testid="agent-save-btn" disabled={!f.name || !f.email.includes("@") || !f.city} onClick={save} className="w-full">Create user</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function Team() {
  const { persona, meta, loadMeta } = useConsole();
  const orgId = persona.org_id;
  const [rows, setRows] = useState([]);
  const load = useCallback(() => api.get("/agents/workload", { params: { org_id: orgId } }).then((r) => setRows(r.data)), [orgId]);
  useEffect(() => { load(); }, [load]);
  const org = meta.orgs.find((o) => o.id === orgId);
  const toggle = async (a) => { await api.patch(`/agents/${a.id}`, { active: !a.active }); toast.success(`${a.name} ${a.active ? "deactivated" : "reactivated"}`); load(); loadMeta(); };
  if (persona.role !== "admin") return <Navigate to="/console" replace />;

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Distribution partner" title="Team & workload" sub="Onboard agents, see their caseload and switch off access when someone leaves."
        right={<div className="flex gap-2"><AddAgent orgId={orgId} onDone={() => { load(); loadMeta(); }} /></div>} />
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Organisation", org.name], ["Type", org.type], ["Licence", org.licence], ["Head office", org.city]].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400">{k}</p><p className="mt-1 text-sm font-semibold text-slate-900">{v}</p></div>
        ))}
      </div>
      <Panel title={`${rows.length} users`} icon={Icons.Users} testid="team-table">
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["User", "Role", "City", "Open cases", "Bound", "Load", "Access"].map((h) => <th key={h} className="px-5 py-2.5">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((a) => (
                <tr key={a.id} data-testid={`team-row-${a.id}`} className={a.active ? "" : "opacity-50"}>
                  <td className="px-5 py-3"><p className="font-semibold text-slate-900">{a.name}</p><p className="text-[11px] text-slate-500">{a.email}</p></td>
                  <td className="px-5 py-3">{a.role === "admin" ? <span className="rounded bg-[#0A1F44] px-1.5 py-0.5 text-[10px] font-semibold text-white">ADMIN</span> : "Field agent"}</td>
                  <td className="px-5 py-3">{a.city}</td>
                  <td className="px-5 py-3 font-mono font-semibold">{a.open_cases}</td>
                  <td className="px-5 py-3 font-mono">{a.bound}</td>
                  <td className="px-5 py-3"><div className="h-1.5 w-24 rounded bg-slate-100"><div className={`h-full rounded ${a.open_cases > 3 ? "bg-rose-500" : a.open_cases > 1 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, a.open_cases * 25)}%` }} /></div></td>
                  <td className="px-5 py-3"><Switch data-testid={`team-active-${a.id}`} checked={a.active} onCheckedChange={() => toggle(a)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
