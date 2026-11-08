import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { slaInfo, fmtDate } from "@/lib/consoleUi";
import { StatusBadge, BandBadge } from "@/components/console/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SummaryTab, AssetsTab, CoverageTab } from "@/components/console/report/SummaryTab";
import { EvidenceTab } from "@/components/console/report/EvidenceTab";
import { LocationTab, ClimateTab } from "@/components/console/report/GeoTabs";
import { ProposalTab } from "@/components/console/report/RecommendationTab";
import { ActivityTab } from "@/components/console/report/ActivityTab";

const NEXT = { new: [["contacted", "Log contact", Icons.PhoneCall]], contacted: [["visit_scheduled", "Schedule site visit", Icons.CalendarClock]], visit_scheduled: [["visited", "Mark visit complete", Icons.ClipboardCheck]],
  quoted: [["bound", "Mark as bound", Icons.Handshake]] };
const TABS = [["summary", "Summary", Icons.FileBarChart], ["location", "Location intelligence", Icons.MapPinned], ["climate", "Climate impact", Icons.CloudSunRain], ["evidence", "Evidence", Icons.Camera],
  ["assets", "Assets", Icons.Cog], ["coverage", "Coverage", Icons.Scale], ["proposal", "Proposal", Icons.ShieldCheck], ["activity", "Activity", Icons.History]];

const Meta = ({ label, children }) => <div><p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p><div className="mt-0.5 text-sm font-medium text-slate-900">{children}</div></div>;

const Actions = ({ c, onUpdate }) => {
  const { persona, meta, isAdmin } = useConsole();
  const run = async (path, body, msg) => { try { const { data } = await api.post(`/cases/${c.id}/${path}`, { ...body, actor: persona.name }); onUpdate(data); toast.success(msg); } catch (e) { toast.error(errMsg(e)); } };
  const agents = meta.agents.filter((a) => a.active && a.role === "agent" && a.org_id === c.distributor_id);
  const open = !["bound", "lost"].includes(c.status);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && open && (
        <Select value={c.agent_id} onValueChange={(v) => run("assign", { agent_id: v }, "Case reassigned")}>
          <SelectTrigger data-testid="reassign-select" className="h-9 w-[190px] bg-white text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
        </Select>)}
      {(NEXT[c.status] || []).map(([s, l, I]) => <Button key={s} size="sm" data-testid={`action-${s}`} onClick={() => run("status", { status: s }, l)} className="bg-[#0A1F44] hover:bg-[#13306a]"><I className="mr-1.5 h-4 w-4" />{l}</Button>)}
      {open && <Button size="sm" variant="outline" data-testid="action-lost" onClick={() => run("status", { status: "lost" }, "Marked as lost")}>Mark lost</Button>}
    </div>
  );
};

export default function CaseDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { orgName, agentName, money, meta, market, setMarket } = useConsole();
  const [c, setC] = useState(null);
  useEffect(() => { if (c && meta && c.market !== market) setMarket(c.market); }, [c, meta]); // eslint-disable-line react-hooks/exhaustive-deps
  const [tab, setTab] = useState(params.get("tab") || "summary");
  const [focus, setFocus] = useState(null);
  useEffect(() => { api.get(`/cases/${id}`).then((r) => setC(r.data)).catch(() => setC(false)); }, [id]);
  if (c === false) return <p className="text-sm text-slate-500">Case not found. <Link to="/console/cases" className="text-blue-600">Back to cases</Link></p>;
  if (!c) return <p className="text-sm text-slate-500">Loading case…</p>;
  const s = slaInfo(c);
  return (
    <div className="space-y-5">
      <Link to="/console/cases" data-testid="back-to-cases" className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"><Icons.ArrowLeft className="h-3.5 w-3.5" /> Cases</Link>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" data-testid="case-header">
        <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <img src={c.photos[0].image} alt="" className="hidden h-20 w-28 rounded-lg object-cover sm:block" />
            <div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-slate-500" data-testid="case-lead-id">{c.lead_id}</span><StatusBadge status={c.status} /><BandBadge band={c.assessment.risk_band}>Risk {c.assessment.risk_score}</BandBadge></div>
              <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900" data-testid="case-sme-name">{c.sme.business_name}</h1>
              <p className="text-sm text-slate-500">{c.sme.industry} · {c.sme.city}, {c.sme.region} · {c.sme.employees} employees</p></div>
          </div>
          <Actions c={c} onUpdate={setC} />
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
          <Meta label="Protection gap"><span className="font-mono text-rose-600">{money(c.assessment.protection_gap)}</span></Meta>
          <Meta label="Insurable value"><span className="font-mono">{money(c.assessment.total_insurable)}</span></Meta>
          <Meta label="Gap categories">{c.assessment.gaps.map((g) => meta.categories[g.category]).slice(0, 2).join(", ")}{c.assessment.gaps.length > 2 && ` +${c.assessment.gaps.length - 2}`}</Meta>
          <Meta label="Broker">{orgName(c.distributor_id)}</Meta>
          <Meta label="Agent">{agentName(c.agent_id)}</Meta>
          <Meta label="Received · SLA"><span className="font-mono text-xs">{fmtDate(c.created_at)}</span> <span className={`text-xs ${s.cls}`}>{s.text}</span></Meta>
        </div>
      </section>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap justify-start bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {TABS.map(([v, l, I]) => <TabsTrigger key={v} value={v} data-testid={`tab-${v}`} className="gap-1.5 px-3 py-1.5 text-xs data-[state=active]:bg-[#0A1F44] data-[state=active]:text-white"><I className="h-3.5 w-3.5" />{l}</TabsTrigger>)}
        </TabsList>
        <div className="mt-5">
          <TabsContent value="summary"><SummaryTab c={c} onUpdate={setC} onEvidence={(p) => { setFocus(p); setTab("evidence"); }} /></TabsContent>
          <TabsContent value="location">{tab === "location" && <LocationTab c={c} />}</TabsContent>
          <TabsContent value="climate">{tab === "climate" && <ClimateTab c={c} />}</TabsContent>
          <TabsContent value="evidence"><EvidenceTab c={c} focus={focus} /></TabsContent>
          <TabsContent value="assets"><AssetsTab c={c} /></TabsContent>
          <TabsContent value="coverage"><CoverageTab c={c} /></TabsContent>
          <TabsContent value="proposal"><ProposalTab key={c.updated_at} c={c} onUpdate={setC} /></TabsContent>
          <TabsContent value="activity"><ActivityTab c={c} onUpdate={setC} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
