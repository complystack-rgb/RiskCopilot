import { useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { Panel, BandBadge } from "@/components/console/ui";
import { inr, fmtDate } from "@/lib/consoleUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const PRIO = { Essential: "High", Recommended: "Moderate", Optional: "Info" };

const EngineList = ({ recs }) => (
  <ul className="divide-y divide-slate-100" data-testid="engine-recommendations">
    {recs.map((r) => (
      <li key={r.product_id} className="flex items-start gap-3 py-3">
        <BandBadge band={PRIO[r.priority]}>{r.priority}</BandBadge>
        <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{r.name}</p><p className="mt-0.5 text-xs text-slate-500">{r.reason}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">{r.evidence.map((e) => <span key={e} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{e}</span>)}</div></div>
        <div className="shrink-0 text-right"><p className="font-mono text-sm font-bold text-[#0A1F44]">{inr(r.premium_range[0])}–{inr(r.premium_range[1])}</p><p className="text-[10px] text-slate-400">indicative / yr</p></div>
      </li>
    ))}
  </ul>
);

const Flags = ({ flags }) => !flags?.length ? <p className="flex items-center gap-2 text-sm text-emerald-700" data-testid="no-flags"><Icons.CheckCircle2 className="h-4 w-4" /> Fully aligned with the evidence-based recommendation.</p> : (
  <ul className="space-y-2" data-testid="misselling-flags">{flags.map((f, i) => <li key={i} className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800"><Icons.ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /><span><b className="uppercase tracking-wide">{f.type.replace("_", " ")}</b> · {f.text}</span></li>)}</ul>
);

const AgentForm = ({ c, onDone }) => {
  const { meta, persona } = useConsole();
  const prev = c.agent_recommendation;
  const [sel, setSel] = useState(prev?.products || []);
  const [just, setJust] = useState(prev?.justification || "");
  const [busy, setBusy] = useState(false);
  const engineIds = Object.fromEntries(c.report.engine_recommendations.map((r) => [r.product_id, r.priority]));
  const submit = async () => {
    setBusy(true);
    try { const { data } = await api.post(`/cases/${c.id}/recommendation`, { products: sel, justification: just, actor: persona.name }); onDone(data); toast.success(`Recommendation sent to Zurich · ${data.flags.length} flag(s)`); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4" data-testid="agent-recommendation-form">
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(meta.catalog).map(([id, p]) => (
          <label key={id} className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5 transition-colors ${sel.includes(id) ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
            <Checkbox data-testid={`rec-product-${id}`} checked={sel.includes(id)} onCheckedChange={() => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])} className="mt-0.5" />
            <span className="min-w-0"><span className="block text-xs font-semibold text-slate-900">{p.name}</span><span className="block text-[11px] text-slate-500">{engineIds[id] ? `Engine: ${engineIds[id]}` : "Not suggested by the engine"}</span></span>
          </label>
        ))}
      </div>
      <Textarea data-testid="rec-justification" value={just} onChange={(e) => setJust(e.target.value)} rows={4} placeholder="Explain why these products fit this SME, based on what you saw on site. The insurer will review this." />
      <div className="flex items-center justify-between"><span className="font-mono text-[11px] text-slate-400">{just.split(/\s+/).filter(Boolean).length} words · at least 12 recommended</span>
        <Button data-testid="rec-submit-btn" disabled={busy || !sel.length} onClick={submit} className="bg-[#0A1F44] hover:bg-[#13306a]"><Icons.Send className="mr-1.5 h-4 w-4" />{prev ? "Resubmit to Zurich" : "Submit to Zurich"}</Button></div>
    </div>
  );
};

const Review = ({ c, onDone }) => {
  const [comment, setComment] = useState("");
  const act = async (decision) => {
    try { const { data } = await api.post(`/cases/${c.id}/review`, { decision, comment }); onDone(data); toast.success("Decision recorded"); setComment(""); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div className="space-y-3" data-testid="insurer-review">
      <Textarea data-testid="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Comment for the distributor (required when asking for justification)" />
      <div className="flex flex-wrap gap-2">
        <Button data-testid="review-approve-btn" onClick={() => act("approve")} className="bg-emerald-600 hover:bg-emerald-700"><Icons.Check className="mr-1.5 h-4 w-4" /> Approve for quote</Button>
        <Button data-testid="review-justify-btn" variant="outline" disabled={!comment.trim()} onClick={() => act("request_justification")} className="border-rose-300 text-rose-700 hover:bg-rose-50"><Icons.MessageSquareWarning className="mr-1.5 h-4 w-4" /> Request justification</Button>
        <Button data-testid="review-decline-btn" variant="ghost" onClick={() => act("decline")} className="text-slate-500">Decline</Button>
      </div>
    </div>
  );
};

export const RecommendationTab = ({ c, onUpdate }) => {
  const { persona, meta } = useConsole();
  const rec = c.agent_recommendation;
  const canRecommend = persona.role !== "insurer" && !["approved", "declined"].includes(c.status);
  const canReview = persona.role === "insurer" && rec && ["recommendation_submitted", "justification_requested"].includes(c.status);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Engine recommendation · evidence-based" icon={Icons.Cpu}><EngineList recs={c.report.engine_recommendations} /></Panel>
      <div className="space-y-6">
        {rec && (
          <Panel title={`Agent recommendation · ${rec.agent}`} icon={Icons.UserCheck} testid="agent-recommendation" action={<span className="text-[11px] text-slate-400">{fmtDate(rec.submitted_at)}</span>}>
            <div className="flex flex-wrap gap-1.5">{rec.products.map((p) => <span key={p} className="rounded-md bg-[#0A1F44] px-2 py-1 text-[11px] font-medium text-white">{meta.catalog[p]?.name}</span>)}</div>
            <blockquote className="mt-3 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-600">"{rec.justification}"</blockquote>
            <div className="mt-4"><Flags flags={c.flags} /></div>
          </Panel>
        )}
        {c.review && <div data-testid="review-outcome" className={`rounded-lg border p-4 text-sm ${c.review.decision === "approve" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><p className="font-semibold">{c.review.by} · {c.review.decision.replace("_", " ")}</p>{c.review.comment && <p className="mt-1">{c.review.comment}</p>}</div>}
        {canReview && <Panel title="Insurer decision" icon={Icons.Gavel}><Review c={c} onDone={onUpdate} /></Panel>}
        {canRecommend && <Panel title={rec ? "Revise recommendation" : "Submit your recommendation"} icon={Icons.PenLine}><AgentForm c={c} onDone={onUpdate} /></Panel>}
        {!rec && !canRecommend && <Panel><p className="text-sm text-slate-500">Waiting for the assigned agent to inspect the site and submit a recommendation.</p></Panel>}
      </div>
    </div>
  );
};
