import { useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { useConsole } from "@/context/ConsoleContext";
import { Panel, BandBadge } from "@/components/console/ui";
import { fmtDate } from "@/lib/consoleUi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

const PRIO = { Essential: "High", Recommended: "Moderate", Optional: "Info" };

const checks = (recs, sel, just, cats) => [
  ...recs.filter((r) => r.priority === "Essential" && !sel.includes(r.product_id)).map((r) => `${r.name} is rated Essential from the evidence but is not selected`),
  ...sel.filter((p) => !recs.some((r) => r.product_id === p)).map((p) => `${cats[p]} has no supporting evidence for this business`),
  ...(just.split(/\s+/).filter(Boolean).length < 12 ? ["The reason is under 12 words, which is too short for the insurer to review"] : []),
];

export const ProposalTab = ({ c, onUpdate }) => {
  const { persona, meta, money, m } = useConsole();
  const recs = c.assessment.recommendations;
  const [sel, setSel] = useState(c.proposal?.products || recs.filter((r) => r.priority !== "Optional").map((r) => r.product_id));
  const [just, setJust] = useState(c.proposal?.justification || "");
  const [busy, setBusy] = useState(false);
  const can = ["visited", "info_requested", "proposal_submitted"].includes(c.status);
  const adv = checks(recs, sel, just, meta.categories);
  const total = recs.filter((r) => sel.includes(r.product_id)).reduce((s, r) => s + r.premium, 0);
  const submit = async () => {
    setBusy(true);
    try { const { data } = await api.post(`/cases/${c.id}/proposal`, { products: sel, justification: just, actor: persona.name }); onUpdate(data); toast.success("Proposal submitted to the insurer"); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Panel title={`Suggested ${m.insurer} cover`} icon={Icons.ShieldCheck} className="lg:col-span-3" testid="suggested-cover">
        <ul className="divide-y divide-slate-100">{recs.map((r) => (
          <li key={r.product_id} className="flex items-start gap-3 py-3.5">
            <Checkbox data-testid={`proposal-product-${r.product_id}`} disabled={!can} checked={sel.includes(r.product_id)} onCheckedChange={() => setSel((s) => s.includes(r.product_id) ? s.filter((x) => x !== r.product_id) : [...s, r.product_id])} className="mt-1" />
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900">{r.name}</p><BandBadge band={PRIO[r.priority]}>{r.priority}</BandBadge></div>
              <p className="mt-0.5 text-xs text-slate-500">{r.reason}</p><p className="mt-1 text-[11px] text-slate-400">Sum insured {money(r.sum_insured)}</p></div>
            <div className="shrink-0 text-right"><p className="font-mono text-sm font-semibold text-[#0A1F44]">{money(r.premium_range[0])} to {money(r.premium_range[1])}</p><p className="text-[10px] text-slate-400">indicative a year</p></div>
          </li>))}</ul>
        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3"><span className="text-xs text-slate-600">{sel.length} covers selected</span><span className="font-mono text-base font-semibold">{money(total)} <span className="text-[10px] font-normal text-slate-400">indicative premium</span></span></div>
      </Panel>
      <div className="space-y-6 lg:col-span-2">
        {c.decision && <div data-testid="insurer-decision" className={`rounded-xl border p-4 text-sm ${c.decision.decision === "approve" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : c.decision.decision === "decline" ? "border-slate-200 bg-slate-50 text-slate-700" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
          <p className="flex items-center gap-2 font-semibold"><Icons.Building2 className="h-4 w-4" />{c.decision.by} · {c.decision.decision === "approve" ? "Quote issued" : c.decision.decision === "decline" ? "Declined" : "More information requested"}</p>
          <p className="mt-1">{c.decision.comment}</p><p className="mt-2 font-mono text-[10px] opacity-70">Received via {c.decision.via} · {fmtDate(c.decision.at)}</p></div>}
        {can ? (
          <Panel title={c.proposal ? "Revise and resubmit" : "Your proposal"} icon={Icons.PenLine} testid="proposal-form">
            <Textarea data-testid="proposal-reason" value={just} onChange={(e) => setJust(e.target.value)} rows={5} placeholder="Why do these covers fit this client? Refer to what you saw on site." />
            <div className="mt-3 space-y-1.5" data-testid="advisory-checks">
              {adv.length === 0 ? <p className="flex items-center gap-1.5 text-xs text-emerald-700"><Icons.CheckCircle2 className="h-4 w-4" />All advisory checks passed</p>
                : adv.map((a) => <p key={a} className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-800"><Icons.AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{a}</p>)}
            </div>
            <Button data-testid="proposal-submit" disabled={busy || !sel.length} onClick={submit} className="mt-4 w-full bg-[#0A1F44] hover:bg-[#13306a]"><Icons.Send className="mr-1.5 h-4 w-4" />{c.proposal ? "Resubmit to insurer" : "Submit to insurer"}</Button>
          </Panel>
        ) : c.proposal ? (
          <Panel title={`Proposal by ${c.proposal.by}`} icon={Icons.FileCheck2} testid="proposal-submitted" action={<span className="text-[11px] text-slate-400">{fmtDate(c.proposal.submitted_at)}</span>}>
            <div className="flex flex-wrap gap-1.5">{c.proposal.products.map((p) => <span key={p} className="rounded-md bg-[#0A1F44] px-2 py-1 text-[11px] font-medium text-white">{m.catalog[p]}</span>)}</div>
            <blockquote className="mt-3 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-600">{c.proposal.justification}</blockquote>
            <p className="mt-3 font-mono text-sm font-semibold">{money(c.proposal.premium)} <span className="text-[10px] font-normal text-slate-400">indicative premium</span></p>
            {c.flags?.length > 0 && <div className="mt-3 space-y-1.5">{c.flags.map((f, i) => <p key={i} className="rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-800">{f.text}</p>)}</div>}
          </Panel>
        ) : <Panel><p className="text-sm text-slate-500" data-testid="proposal-locked">Complete the site visit to unlock the proposal.</p></Panel>}
      </div>
    </div>
  );
};
