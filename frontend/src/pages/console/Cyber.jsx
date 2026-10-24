import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { PageHead, Panel, ScoreRing, BandBadge } from "@/components/console/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate } from "@/lib/consoleUi";

const ST = { pass: [Icons.CheckCircle2, "text-emerald-600"], warn: [Icons.AlertTriangle, "text-amber-600"], fail: [Icons.XCircle, "text-rose-600"] };
const GRADE_BAND = { A: "Low", B: "Low", C: "Moderate", D: "Elevated", E: "High" };

const Findings = ({ items }) => (
  <ul className="divide-y divide-slate-100" data-testid="cyber-findings">
    {items.map((f) => { const [I, c] = ST[f.status]; return (
      <li key={f.id} className="grid gap-2 py-3 md:grid-cols-[24px_1fr_auto]" data-testid={`cyber-finding-${f.id}`}>
        <I className={`mt-0.5 h-5 w-5 ${c}`} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{f.title}</p>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-50 px-2 py-1.5 font-mono text-[11px] text-slate-700">{f.evidence}</pre>
          <p className="mt-1 text-[11px] text-slate-500"><Icons.Link2 className="mr-1 inline h-3 w-3" />Source: <span className="font-mono">{f.source}</span></p>
          {f.status !== "pass" && <p className="mt-1 text-xs text-blue-700">→ {f.recommendation}</p>}
        </div>
        <BandBadge band={f.severity} />
      </li>); })}
  </ul>
);

export default function Cyber() {
  const [f, setF] = useState({ url: "", country: "MY", business_name: "" });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const [history, setHistory] = useState([]);
  const loadHistory = () => api.get("/cyber/scans").then((r) => setHistory(r.data));
  useEffect(() => { loadHistory(); }, []);
  const scan = async () => {
    setBusy(true); setRes(null);
    try { const { data } = await api.post("/cyber/scan", f); setRes(data); loadHistory(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const open = (id) => api.get(`/cyber/scans/${id}`).then((r) => setRes(r.data));
  const passed = res?.findings.filter((x) => x.status === "pass").length;

  return (
    <div className="space-y-6">
      <PageHead eyebrow="Pilot · Malaysia & Indonesia" title="Cyber website check" sub="Passive checks on an SME's public website for a first cyber-risk view. Every finding links to the source it came from." />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <Select value={f.country} onValueChange={(v) => setF({ ...f, country: v })}><SelectTrigger data-testid="cyber-country" className="h-10 w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MY">Malaysia</SelectItem><SelectItem value="ID">Indonesia</SelectItem></SelectContent></Select>
        <Input data-testid="cyber-business" value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} placeholder="SME name (optional)" className="h-10 w-56" />
        <div className="relative min-w-[260px] flex-1"><Icons.Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input data-testid="cyber-url" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} onKeyDown={(e) => e.key === "Enter" && f.url && scan()} placeholder="e.g. www.company.com.my" className="h-10 pl-9 font-mono text-sm" /></div>
        <Button data-testid="cyber-scan-btn" disabled={!f.url || busy} onClick={scan} className="h-10 bg-[#0A1F44] hover:bg-[#13306a]">{busy ? <Icons.Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Icons.Radar className="mr-1.5 h-4 w-4" />}{busy ? "Scanning…" : "Run check"}</Button>
      </div>
      {res ? (
        <div className="grid gap-6 lg:grid-cols-3" data-testid="cyber-result">
          <div className="space-y-6">
            <Panel title={res.business_name} icon={Icons.Building2}>
              <div className="flex items-center gap-5"><ScoreRing score={res.score} band={GRADE_BAND[res.grade]} label="Hygiene" /><div><p className="font-mono text-4xl font-bold text-slate-900" data-testid="cyber-grade">{res.grade}</p><p className="text-xs text-slate-500">{passed}/{res.findings.length} checks passed</p><p className="mt-1 font-mono text-[11px] text-slate-400">{res.domain}</p></div></div>
            </Panel>
            <Panel title="Cover considerations" icon={Icons.ShieldCheck}><ul className="space-y-2 text-sm text-slate-700">{res.cover_considerations.map((c) => <li key={c} className="flex gap-2"><Icons.Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{c}</li>)}</ul><p className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-800">{res.regulatory_note}</p></Panel>
            <p className="text-[11px] leading-relaxed text-slate-400">{res.method} This is an indicative view to be validated. It is not an insurer-issued assessment. Scanned {fmtDate(res.scanned_at)}.</p>
          </div>
          <Panel title="Findings with evidence" icon={Icons.FileSearch} className="lg:col-span-2"><Findings items={res.findings} /></Panel>
        </div>
      ) : (
        <Panel title="Recent checks" icon={Icons.History} testid="cyber-history">
          {history.length === 0 ? <p className="text-sm text-slate-500">No checks yet. Enter an SME website above.</p> : (
            <ul className="-my-2 divide-y divide-slate-100">{history.map((h) => (
              <li key={h.id}><button data-testid={`cyber-history-${h.id}`} onClick={() => open(h.id)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50">
                <span className="font-mono text-lg font-bold text-slate-900">{h.grade}</span><span className="flex-1"><span className="block text-sm font-medium text-slate-900">{h.business_name}</span><span className="font-mono text-[11px] text-slate-500">{h.domain}</span></span>
                <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">{h.country}</span><span className="text-xs text-slate-400">{fmtDate(h.scanned_at)}</span></button></li>
            ))}</ul>
          )}
        </Panel>
      )}
    </div>
  );
}
