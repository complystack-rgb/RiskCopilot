import * as Icons from "lucide-react";
import { useJourney } from "@/context/JourneyContext";
import { categoryLabel, priorityTitle } from "@/lib/summary";

const Row = ({ icon: I, label, value }) => (
  <div className="flex items-start gap-2.5">
    <I className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
);

export default function LiveSummarySidebar() {
  const { data } = useJourney();
  const hasAny = data.businessName || data.category;

  return (
    <aside data-testid="live-summary-sidebar" className="lg:sticky lg:top-6 space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Icons.ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Live business summary</p>
            <p className="text-[11px] text-slate-400">Updates as you go</p>
          </div>
        </div>

        {!hasAny ? (
          <p className="text-sm text-slate-400">Your business snapshot will build here as you answer each step.</p>
        ) : (
          <div className="space-y-3.5">
            <Row icon={Icons.Building2} label="Business" value={data.businessName || "—"} />
            {data.category && <Row icon={Icons.Tag} label="Activity" value={`${categoryLabel(data.category)}${data.activity ? ` · ${data.activity}` : ""}`} />}
            {(data.city || data.state) && <Row icon={Icons.MapPin} label="Location" value={[data.city, data.state].filter(Boolean).join(", ")} />}
            {data.startYear && <Row icon={Icons.CalendarClock} label="Started" value={data.yearNotSure ? "Not sure" : data.startYear} />}
            {data.headcount && <Row icon={Icons.Users} label="Team" value={data.headcount} />}
            {data.revenueBand && <Row icon={Icons.IndianRupee} label="Revenue" value={data.revenueBand} />}
            {data.premisesOwnership && <Row icon={Icons.Home} label="Premises" value={data.premisesOwnership} />}
            {data.hasInsurance && <Row icon={Icons.FileCheck2} label="Insurance" value={data.hasInsurance === "Yes" ? `${data.insuranceTypes.length} type(s) listed` : data.hasInsurance} />}
          </div>
        )}

        {data.priorities?.filter((p) => p !== "notsure").length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">Protection priorities</p>
            <div className="flex flex-wrap gap-1.5">
              {data.priorities.filter((p) => p !== "notsure").map((p) => (
                <span key={p} className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">{priorityTitle(p)}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-slate-400">
        This is a preliminary discovery summary to help you understand your business — not a final insurance recommendation.
      </p>
    </aside>
  );
}
