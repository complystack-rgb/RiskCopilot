import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { inr, slaInfo, fmtDate } from "@/lib/consoleUi";
import { StatusBadge, BandBadge } from "@/components/console/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SummaryTab } from "@/components/console/report/SummaryTab";
import { EvidenceTab } from "@/components/console/report/EvidenceTab";
import { MachineryTab, PriorPolicyTab } from "@/components/console/report/AssetTabs";
import { RecommendationTab } from "@/components/console/report/RecommendationTab";
import { ActivityTab, ApiTab } from "@/components/console/report/ActivityTab";

const Meta = ({ label, children }) => <div><p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p><div className="mt-0.5 text-sm font-medium text-slate-900">{children}</div></div>;

const Actions = ({ c, onUpdate }) => {
  const { persona, meta } = useConsole();
  const run = async (path, body, msg) => { try { const { data } = await api.post(`/cases/${c.id}/${path}`, { ...body, actor: persona.name }); onUpdate(data); toast.success(msg); } catch (e) { toast.error(errMsg(e)); } };
  const agents = meta.agents.filter((a) => a.active && a.role === "agent" && (persona.role === "insurer" || a.org_id === persona.org_id));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {persona.role !== "agent" && (
        <Select value={c.agent_id || ""} onValueChange={(v) => run("assign", { agent_id: v }, "Case reassigned")}>
          <SelectTrigger data-testid="reassign-select" className="h-9 w-[200px] bg-white text-xs"><SelectValue placeholder="Assign agent" /></SelectTrigger>
          <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} · {a.city}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {persona.role !== "insurer" && c.status === "assigned" && <Button size="sm" data-testid="mark-scheduled-btn" onClick={() => run("status", { status: "inspection_scheduled", note: "Site visit booked with the SME" }, "Inspection scheduled")}><Icons.CalendarClock className="mr-1.5 h-4 w-4" /> Schedule inspection</Button>}
      {persona.role !== "insurer" && c.status === "inspection_scheduled" && <Button size="sm" data-testid="mark-inspected-btn" onClick={() => run("status", { status: "inspected", note: "Site inspection completed" }, "Marked as inspected")}><Icons.ClipboardCheck className="mr-1.5 h-4 w-4" /> Mark inspected</Button>}
      <Button size="sm" variant="outline" data-testid="print-report-btn" onClick={() => window.print()}><Icons.Printer className="mr-1.5 h-4 w-4" /> Print report</Button>
    </div>
  );
};

export default function CaseDetail() {
  const { id } = useParams();
  const { orgName, agentName } = useConsole();
  const [c, setC] = useState(null);
  const [tab, setTab] = useState("summary");
  const [focus, setFocus] = useState(null);
  useEffect(() => { api.get(`/cases/${id}`).then((r) => setC(r.data)).catch(() => setC(false)); }, [id]);
  if (c === false) return <p className="text-sm text-slate-500">Case not found. <Link to="/console/cases" className="text-blue-600">Back to queue</Link></p>;
  if (!c) return <p className="text-sm text-slate-500">Loading report…</p>;
  const s = slaInfo(c);
  const onEvidence = (img) => { setFocus(img); setTab("evidence"); };

  return (
    <div className="space-y-5">
      <Link to="/console/cases" data-testid="back-to-queue" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"><Icons.ArrowLeft className="h-3.5 w-3.5" /> Case queue</Link>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" data-testid="case-header">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-slate-500" data-testid="case-lead-id">{c.lead_id}</span><StatusBadge status={c.status} /><BandBadge band={c.report.fire_band}>Fire {c.report.fire_score} · {c.report.fire_band}</BandBadge>{c.flags?.length > 0 && <BandBadge band="High">{c.flags.length} flag(s)</BandBadge>}</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900" data-testid="case-sme-name">{c.sme.business_name}</h1>
            <p className="text-sm text-slate-500">{c.sme.activity} · {c.sme.city}, {c.sme.state} · {c.sme.headcount} staff{c.sme.contact_name && ` · ${c.sme.contact_name}`}{c.sme.phone && ` · ${c.sme.phone}`}</p>
          </div>
          <Actions c={c} onUpdate={setC} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <Meta label="Product line">Fire · Textile (India)</Meta>
          <Meta label="Sum insured observed"><span className="font-mono">{inr(c.report.total_sum_insured)}</span></Meta>
          <Meta label="Distributor">{orgName(c.distributor_id)}</Meta>
          <Meta label="Field agent">{agentName(c.agent_id)}</Meta>
          <Meta label="Received"><span className="font-mono text-xs">{fmtDate(c.created_at)}</span></Meta>
          <Meta label="SLA"><span className={s.cls}>{s.text}</span></Meta>
        </div>
      </section>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap justify-start bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {[["summary", "Report summary", Icons.FileBarChart], ["evidence", "Evidence", Icons.ScanSearch], ["machinery", "Machinery", Icons.Cog], ["policy", "Prior policy", Icons.FileText], ["recommendation", "Recommendation", Icons.ShieldCheck], ["activity", "Activity", Icons.History], ["api", "API payload", Icons.Braces]].map(([v, l, I]) => (
            <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="gap-1.5 px-3 py-1.5 text-xs data-[state=active]:bg-[#0A1F44] data-[state=active]:text-white"><I className="h-3.5 w-3.5" />{l}</TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-5">
          <TabsContent value="summary"><SummaryTab c={c} onEvidence={onEvidence} /></TabsContent>
          <TabsContent value="evidence"><EvidenceTab r={c.report} focus={focus} /></TabsContent>
          <TabsContent value="machinery"><MachineryTab r={c.report} /></TabsContent>
          <TabsContent value="policy"><PriorPolicyTab r={c.report} /></TabsContent>
          <TabsContent value="recommendation"><RecommendationTab c={c} onUpdate={setC} /></TabsContent>
          <TabsContent value="activity"><ActivityTab c={c} onUpdate={setC} /></TabsContent>
          <TabsContent value="api"><ApiTab c={c} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
