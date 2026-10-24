import { useJourney } from "@/context/JourneyContext";
import { SectionHeader } from "./shared";
import { STATUS, generateConsiderations, nextAction, activityLabel, priorityTitle } from "@/lib/summary";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { toast } from "sonner";

const Glance = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-slate-800">{value || "Not provided"}</p>
  </div>
);

export default function Step7Summary() {
  const { data, setStep } = useJourney();
  const considerations = generateConsiderations(data);
  const action = nextAction(data);
  const NextIcon = Icons[action.icon] || Icons.ArrowRight;

  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.businessName || "complystack").replace(/\s+/g, "-").toLowerCase()}-protection-summary.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary downloaded");
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Step 7 of 7" title="Your business protection summary" lead="A preliminary discovery summary built from your answers. It is not a final insurance recommendation." />

      <div className="flex flex-wrap gap-2">
        <Button data-testid="summary-download-btn" onClick={download}><Icons.Download className="mr-2 h-4 w-4" /> Download summary (JSON)</Button>
        <Button variant="outline" data-testid="summary-print-btn" onClick={() => window.print()}><Icons.Printer className="mr-2 h-4 w-4" /> Print / Save as PDF</Button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"><Icons.LayoutGrid className="h-5 w-5 text-blue-600" /> Your business at a glance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Glance label="Business" value={data.businessName} />
          <Glance label="Activity" value={activityLabel(data)} />
          <Glance label="Location" value={[data.city, data.state].filter(Boolean).join(", ")} />
          <Glance label="Premises" value={data.premisesOwnership} />
          <Glance label="Team" value={data.headcount} />
          <Glance label="Revenue" value={data.revenueExact ? `₹${Number(data.revenueExact).toLocaleString("en-IN")}` : data.revenueBand} />
          <Glance label="Payroll" value={data.payrollExact ? `₹${Number(data.payrollExact).toLocaleString("en-IN")}` : data.payrollBand} />
          <Glance label="Ownership" value={data.ownershipStructure} />
          <Glance label="Insurance" value={data.hasInsurance === "Yes" ? data.insuranceTypes.join(", ") || "Yes" : data.hasInsurance} />
        </div>
        {data.priorities.filter((p) => p !== "notsure").length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Protection priorities</p>
            <div className="flex flex-wrap gap-1.5">
              {data.priorities.filter((p) => p !== "notsure").map((p) => (
                <span key={p} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">{priorityTitle(p)}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900"><Icons.Search className="h-5 w-5 text-amber-600" /> What may need a closer look</h3>
        <p className="mb-4 text-sm text-slate-500">These relate only to your answers. A missing answer is never labelled a confirmed insurance gap.</p>
        <div className="mb-4 flex flex-wrap gap-3 text-xs">
          {Object.values(STATUS).map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 text-slate-500"><span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label}</span>
          ))}
        </div>
        {considerations.length === 0 ? (
          <p className="text-sm text-slate-500">Answer a few more steps and relevant considerations will appear here.</p>
        ) : (
          <ul className="space-y-2.5" data-testid="considerations-list">
            {considerations.map((c, i) => {
              const s = STATUS[c.status];
              return (
                <li key={i} className={`flex items-start gap-3 rounded-xl border p-3.5 ${s.cls}`}>
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                  <div>
                    <span className="mr-2 inline-block rounded-full border bg-white/70 px-2 py-0.5 text-[11px] font-bold">{s.label}</span>
                    <span className="text-sm text-slate-700">{c.text}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-blue-900"><Icons.Flag className="h-5 w-5" /> What to do next</h3>
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white"><NextIcon className="h-4 w-4" /></span>
          <p className="text-sm font-medium text-slate-700">{action.text}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" data-testid="edit-business-btn" onClick={() => setStep(1)}><Icons.Pencil className="mr-1.5 h-4 w-4" /> Edit business info</Button>
          <Button variant="outline" data-testid="edit-insurance-btn" onClick={() => setStep(5)}><Icons.FileText className="mr-1.5 h-4 w-4" /> Review insurance</Button>
          <Button data-testid="broker-review-btn" onClick={() => toast.success("Broker review requested — a reviewer would follow up (demo).")}><Icons.UserCheck className="mr-1.5 h-4 w-4" /> Request a broker review</Button>
        </div>
      </section>

      <p className="text-xs text-slate-400">This summary provides value even if some questions were skipped. It is preliminary and does not confirm or deny any insurance coverage.</p>
    </div>
  );
}
