import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, FieldLabel, Pill, RewardCard } from "./shared";
import { HEADCOUNT_OPTIONS } from "@/data/journeyData";
import { getMarket } from "@/data/markets";
import { Input } from "@/components/ui/input";
import * as Icons from "lucide-react";

export default function Step2Size() {
  const { data, update } = useJourney();
  const m = getMarket(data.market);
  const fmt = (v) => `${m.symbol} ${Number(v).toLocaleString(m.locale)}`;
  return (
    <div className="space-y-6">
      <SectionHeader title="Business Size" lead="Your team size and revenue help set the right sums insured." />

      <div>
        <FieldLabel>Number of Employees</FieldLabel>
        <Pill options={HEADCOUNT_OPTIONS} value={data.headcount} onChange={(v) => update({ headcount: v })} testidPrefix="headcount" />
      </div>

      <div>
        <FieldLabel>Annual Payroll</FieldLabel>
        <Pill options={[...m.payrollBands, "Not sure"]} value={data.payrollBand} onChange={(v) => update({ payrollBand: v })} testidPrefix="payroll" />
        <div className="mt-3 max-w-xs">
          <Input data-testid="payroll-exact" type="number" placeholder={`Exact Amount in ${m.currency} (Optional)`} value={data.payrollExact}
            onChange={(e) => update({ payrollExact: e.target.value })} />
        </div>
      </div>

      <div>
        <FieldLabel>Annual Revenue</FieldLabel>
        <Pill options={[...m.revenueBands.map(([l]) => l), "Not sure"]} value={data.revenueBand} onChange={(v) => update({ revenueBand: v })} testidPrefix="revenue" />
        <div className="mt-3 max-w-xs">
          <Input data-testid="revenue-exact" type="number" placeholder={`Exact Amount in ${m.currency} (Optional)`} value={data.revenueExact}
            onChange={(e) => update({ revenueExact: e.target.value })} />
        </div>
      </div>

      {(data.headcount || data.payrollBand || data.revenueBand) && (
        <RewardCard title="Business Snapshot" testid="reward-snapshot">
          <div className="grid grid-cols-3 gap-3">
            {[{ i: "Users", l: "Workforce", v: data.headcount }, { i: "Wallet", l: "Payroll", v: data.payrollExact ? fmt(data.payrollExact) : data.payrollBand }, { i: "TrendingUp", l: "Revenue", v: data.revenueExact ? fmt(data.revenueExact) : data.revenueBand }].map((x) => {
              const I = Icons[x.i];
              return (
                <div key={x.l} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <I className="mx-auto h-4 w-4 text-blue-600" />
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{x.l}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{x.v || "Not given"}</p>
                </div>
              );
            })}
          </div>
        </RewardCard>
      )}
    </div>
  );
}
