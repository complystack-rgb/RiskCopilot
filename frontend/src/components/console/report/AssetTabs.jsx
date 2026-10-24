import * as Icons from "lucide-react";
import { Panel } from "@/components/console/ui";
import { inr } from "@/lib/consoleUi";

export const MachineryTab = ({ r }) => (
  <Panel title="Machinery register · extracted from ID plates" icon={Icons.Cog} action={<span className="font-mono text-xs text-slate-500">Plant total {inr(r.sums_insured.plant)}</span>} testid="machinery-register">
    <div className="-mx-5 -my-5 overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["#", "Machine", "Manufacturer · Model", "Serial", "Year", "Units", "Replacement value", "Fire relevance", "OCR"].map((h) => <th key={h} className="px-4 py-2.5">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {r.machinery.map((m) => (
            <tr key={m.id} data-testid={`machine-row-${m.id}`}>
              <td className="px-4 py-3 font-mono text-slate-400">{m.id}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{m.type}</td>
              <td className="px-4 py-3">{m.manufacturer} <span className="text-slate-400">·</span> {m.model}</td>
              <td className="px-4 py-3 font-mono">{m.serial}</td>
              <td className="px-4 py-3 font-mono">{m.year} <span className={m.age > 10 ? "text-amber-600" : "text-slate-400"}>({m.age}y)</span></td>
              <td className="px-4 py-3 font-mono">{m.units}</td>
              <td className="px-4 py-3 font-mono font-semibold">{inr(m.replacement_value)}</td>
              <td className="max-w-[240px] px-4 py-3 text-slate-600">{m.fire_relevance}</td>
              <td className="px-4 py-3"><span className={`font-mono font-semibold ${m.ocr_confidence > 0.9 ? "text-emerald-600" : "text-amber-600"}`}>{Math.round(m.ocr_confidence * 100)}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Panel>
);

export const PriorPolicyTab = ({ r }) => {
  const p = r.prior_policy;
  if (!p) return <Panel title="Previous insurance" icon={Icons.FileText}><p className="text-sm text-slate-500" data-testid="no-prior-policy">The SME reported no previous fire policy. Treat every recommended cover as new rather than a replacement.</p></Panel>;
  const ratio = Math.round((100 * p.sum_insured) / r.total_sum_insured);
  return (
    <div className="grid gap-6 lg:grid-cols-3" data-testid="prior-policy">
      <Panel title="Extracted policy schedule" icon={Icons.FileText} className="lg:col-span-1">
        <dl className="space-y-2.5 text-xs">
          {[["Insurer", p.insurer], ["Product", p.product], ["Policy no.", p.policy_no], ["Expiry", p.expiry], ["Sum insured", inr(p.sum_insured)], ["Premium", inr(p.premium)], ["Add-ons", p.addons.join(", ") || "None"], ["Source", p.source]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-slate-100 pb-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-mono font-semibold text-slate-900">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-slate-400">Extraction confidence {Math.round(p.extraction_confidence * 100)}%</p>
      </Panel>
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Declared vs observed" icon={Icons.Scale}>
          <div className="space-y-3 text-xs">
            {[["Declared in previous policy", p.sum_insured, "bg-slate-400"], ["Observed in ComplyStack evidence", r.total_sum_insured, "bg-[#0A1F44]"]].map(([l, v, c]) => (
              <div key={l}><div className="mb-1 flex justify-between"><span className="text-slate-600">{l}</span><span className="font-mono font-semibold">{inr(v)}</span></div><div className="h-3 rounded bg-slate-100"><div className={`h-full rounded ${c}`} style={{ width: `${(v / r.total_sum_insured) * 100}%` }} /></div></div>
            ))}
            <p className={`rounded-md border p-3 font-medium ${ratio < 85 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`} data-testid="underinsurance-ratio">The previous sum insured covers {ratio}% of the assets observed.{ratio < 85 && " If the average clause applies, claims could be cut in proportion."}</p>
          </div>
        </Panel>
        <Panel title="Observations" icon={Icons.Lightbulb}><ul className="space-y-2 text-sm text-slate-700">{p.observations.map((o) => <li key={o} className="flex gap-2"><Icons.AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{o}</li>)}</ul></Panel>
      </div>
    </div>
  );
};
