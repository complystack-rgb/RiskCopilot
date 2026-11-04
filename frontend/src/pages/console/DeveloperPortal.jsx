import { useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { PageHead, Panel } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api/v1`;
const EPS = [
  { m: "GET", p: "/leads/{lead_id}", d: "Fetch the full pre-underwriting package for one lead: SME profile, risk findings, exposure, gaps, machinery, evidence links, broker proposal and advisory checks." },
  { m: "GET", p: "/leads?market=&distributor_id=&agent_id=", d: "List leads for a market, a distribution partner or a single agent." },
  { m: "POST", p: "/leads/{lead_id}/decision", d: "Send the insurer decision on a submitted proposal. Body: decision = approve | request_info | decline, plus an optional comment (required for request_info).", body: '{\n  "decision": "approve",\n  "comment": "Quote issued at indicative terms."\n}' },
];

const Code = ({ children, testid }) => <pre data-testid={testid} className="overflow-x-auto rounded-lg bg-[#0B1530] p-4 font-mono text-[11px] leading-relaxed text-blue-100">{children}</pre>;

const Docs = () => (
  <div className="grid gap-6 lg:grid-cols-3">
    <div className="space-y-6 lg:col-span-2">
      {EPS.map((e) => (
        <Panel key={e.p} testid={`endpoint-${e.m}-${e.p.split("/")[2] || "list"}`}>
          <div className="flex items-center gap-2"><span className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold text-white ${e.m === "GET" ? "bg-emerald-600" : "bg-blue-600"}`}>{e.m}</span><code className="font-mono text-sm font-semibold text-slate-900">/api/v1{e.p}</code></div>
          <p className="mt-2 text-sm text-slate-600">{e.d}</p>
          <div className="mt-3"><Code>{`curl -X ${e.m} "${BASE}${e.p.replace("{lead_id}", "ZIN-26003").split("?")[0]}" \\\n  -H "X-API-Key: <your partner key>"${e.body ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${e.body.replace(/\n\s*/g, " ")}'` : ""}`}</Code></div>
        </Panel>))}
    </div>
    <div className="space-y-6">
      <Panel title="Authentication" icon={Icons.KeyRound}><p className="text-sm text-slate-600">Every request carries an <code className="rounded bg-slate-100 px-1 font-mono text-xs">X-API-Key</code> header. Keys are issued per insurer environment and can be rotated from the admin hub. Requests without a valid key return <b>401</b>.</p></Panel>
      <Panel title="Responses" icon={Icons.Braces}><ul className="space-y-1.5 font-mono text-xs text-slate-600">{[["200", "Success"], ["400", "Invalid body or decision"], ["401", "Missing or invalid key"], ["404", "Lead not found"], ["409", "Lead not awaiting a decision"]].map(([c, d]) => <li key={c}><b className="text-slate-900">{c}</b> · {d}</li>)}</ul></Panel>
      <Panel title="Webhooks" icon={Icons.Webhook}><p className="text-sm text-slate-600">Subscribe to <code className="font-mono text-xs">lead.submitted</code>, <code className="font-mono text-xs">proposal.submitted</code> and <code className="font-mono text-xs">lead.bound</code> to keep core systems in sync. Coming in phase 2.</p></Panel>
    </div>
  </div>
);

const Sandbox = () => {
  const [lead, setLead] = useState("ZIN-26002");
  const [res, setRes] = useState(null);
  const [comment, setComment] = useState("Quote issued at indicative terms.");
  const [busy, setBusy] = useState(false);
  const call = async (fn) => { setBusy(true); try { const { data } = await fn(); setRes({ ok: true, data }); } catch (e) { setRes({ ok: false, data: { detail: errMsg(e) } }); toast.error(errMsg(e)); } finally { setBusy(false); } };
  const get = () => call(() => api.get(`/developer/leads/${lead}`));
  const decide = (decision) => call(() => api.post(`/developer/leads/${lead}/decision`, { decision, comment })).then(() => toast.success("Decision sent. Open the case to see it on the broker side."));
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Lead lookup" icon={Icons.Search}>
          <div className="flex gap-2"><Input data-testid="dev-lead-input" value={lead} onChange={(e) => setLead(e.target.value)} className="font-mono" /><Button data-testid="dev-lookup-btn" disabled={busy} onClick={get}>Send GET</Button></div>
          <p className="mt-2 text-[11px] text-slate-400">Try ZIN-26002, ZMY-26001 or ZID-26003. These leads are waiting for a decision.</p>
        </Panel>
        <Panel title="Send test decision" icon={Icons.Gavel} testid="dev-decision">
          <Textarea data-testid="dev-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button data-testid="dev-approve" disabled={busy} onClick={() => decide("approve")} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
            <Button data-testid="dev-request-info" disabled={busy} variant="outline" onClick={() => decide("request_info")}>Request information</Button>
            <Button data-testid="dev-decline" disabled={busy} variant="ghost" onClick={() => decide("decline")}>Decline</Button>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">This runs the same logic as <code className="font-mono">POST /api/v1/leads/{"{lead_id}"}/decision</code>. The broker sees the result on the case straight away.</p>
        </Panel>
      </div>
      <Panel title="Response" icon={Icons.Braces} className="lg:col-span-3" action={res && <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${res.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{res.ok ? "200 OK" : "ERROR"}</span>}>
        <pre data-testid="dev-response" className="max-h-[640px] overflow-auto rounded-lg bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-emerald-300">{res ? JSON.stringify(res.data, null, 2) : "// Send a request to see the JSON response"}</pre>
      </Panel>
    </div>
  );
};

export default function DeveloperPortal() {
  const { m } = useConsole();
  return (
    <div className="space-y-6">
      <PageHead eyebrow="For insurer IT and underwriting" title="Developer portal" sub={`${m.insurer} systems read every case and send decisions through these APIs. Underwriters work in their own tools.`} />
      <Tabs defaultValue="docs">
        <TabsList className="bg-white ring-1 ring-slate-200"><TabsTrigger value="docs" data-testid="dev-tab-docs">API documentation</TabsTrigger><TabsTrigger value="sandbox" data-testid="dev-tab-sandbox">Lead lookup & test decision</TabsTrigger></TabsList>
        <TabsContent value="docs" className="mt-5"><Docs /></TabsContent>
        <TabsContent value="sandbox" className="mt-5"><Sandbox /></TabsContent>
      </Tabs>
    </div>
  );
}
