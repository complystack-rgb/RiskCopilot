import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, Pill, RewardCard } from "./shared";
import { HEADCOUNT_OPTIONS, PAYROLL_BANDS, REVENUE_BANDS } from "@/data/journeyData";
import { Input } from "@/components/ui/input";
import * as Icons from "lucide-react";

export default function Step2Size() {
  const { data, update } = useJourney();
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Step 2 of 7" title="Understand your business size" lead="Workforce, payroll and revenue help frame the potential financial impact of disruption." />

      <div>
        <FieldLabel>How many people work in your business?</FieldLabel>
        <Pill options={HEADCOUNT_OPTIONS} value={data.headcount} onChange={(v) => update({ headcount: v })} testidPrefix="headcount" />
      </div>

      <div>
        <FieldLabel>What is your approximate annual payroll?</FieldLabel>
        <Pill options={PAYROLL_BANDS} value={data.payrollBand} onChange={(v) => update({ payrollBand: v })} testidPrefix="payroll" />
        <div className="mt-3 max-w-xs">
          <Input data-testid="payroll-exact" type="number" placeholder="Optional: exact amount (₹)" value={data.payrollExact}
            onChange={(e) => update({ payrollExact: e.target.value })} />
        </div>
      </div>

      <div>
        <FieldLabel>What is your estimated annual revenue?</FieldLabel>
        <Pill options={REVENUE_BANDS} value={data.revenueBand} onChange={(v) => update({ revenueBand: v })} testidPrefix="revenue" />
        <div className="mt-3 max-w-xs">
          <Input data-testid="revenue-exact" type="number" placeholder="Optional: exact amount (₹)" value={data.revenueExact}
            onChange={(e) => update({ revenueExact: e.target.value })} />
        </div>
      </div>

      <WhyThisMatters testid="step2-why">
        These figures frame how much a disruption could cost and which questions may need further review. We don't calculate a recommended coverage amount from them — that needs proper assessment.
      </WhyThisMatters>

      {(data.headcount || data.payrollBand || data.revenueBand) && (
        <RewardCard title="Live business snapshot" testid="reward-snapshot">
          <div className="grid grid-cols-3 gap-3">
            {[{ i: "Users", l: "Workforce", v: data.headcount }, { i: "Wallet", l: "Payroll", v: data.payrollExact ? `₹${Number(data.payrollExact).toLocaleString("en-IN")}` : data.payrollBand }, { i: "TrendingUp", l: "Revenue", v: data.revenueExact ? `₹${Number(data.revenueExact).toLocaleString("en-IN")}` : data.revenueBand }].map((x) => {
              const I = Icons[x.i];
              return (
                <div key={x.l} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <I className="mx-auto h-4 w-4 text-blue-600" />
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{x.l}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{x.v || "—"}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-500">This frames potential impact — it is not a coverage recommendation.</p>
        </RewardCard>
      )}
    </div>
  );
}
