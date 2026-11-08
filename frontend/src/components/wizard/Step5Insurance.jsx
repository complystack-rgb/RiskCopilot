import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, Pill, OptionCard, RewardCard, UploadField } from "./shared";
import { INSURANCE_TYPES, CLAIM_STATUSES, OWNERSHIP_STRUCTURES, OWNER_COUNTS } from "@/data/journeyData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as Icons from "lucide-react";
import { getMarket } from "@/data/markets";

export default function Step5Insurance() {
  const { data, update } = useJourney();
  const toggleType = (t) => update({ insuranceTypes: data.insuranceTypes.includes(t) ? data.insuranceTypes.filter((x) => x !== t) : [...data.insuranceTypes, t] });
  const mp = data.manualPolicy;
  const m = getMarket(data.market);
  const setMp = (patch) => update({ manualPolicy: { ...mp, ...patch } });

  return (
    <div className="space-y-6">
      <SectionHeader title="Current Insurance" lead="Tell us about any cover you already have." />

      <div>
        <FieldLabel>Current Commercial Insurance</FieldLabel>
        <Pill options={["Yes", "No", "Not sure"]} value={data.hasInsurance} onChange={(v) => update({ hasInsurance: v })} testidPrefix="has-insurance" />
      </div>

      {data.hasInsurance === "Yes" && (
        <>
          <div>
            <FieldLabel>Current Cover Types</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSURANCE_TYPES.map((t) => (
                <OptionCard key={t} compact title={t} selected={data.insuranceTypes.includes(t)} onClick={() => toggleType(t)}
                  testid={`insurance-type-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.Upload className="h-4 w-4 text-blue-600" /> Upload Policy Documents</p>
              <UploadField accept=".pdf,.jpg,.png" multiple kind="policy" testid="policy-upload"
                files={data.uploadedPolicies} onChange={(v) => update((prev) => ({ uploadedPolicies: typeof v === "function" ? v(prev.uploadedPolicies) : v }))} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.PencilLine className="h-4 w-4 text-blue-600" /> Enter Details Manually</p>
              <Input data-testid="policy-insurer" placeholder="Insurer Name" value={mp.insurer} onChange={(e) => setMp({ insurer: e.target.value })} />
              <Input data-testid="policy-type" placeholder="Policy Type" value={mp.policyType} onChange={(e) => setMp({ policyType: e.target.value })} />
              <Input data-testid="policy-sum" placeholder={`Sum Insured (${m.currency})`} value={mp.sumInsured} onChange={(e) => setMp({ sumInsured: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input data-testid="policy-start" type="date" value={mp.startDate} onChange={(e) => setMp({ startDate: e.target.value })} />
                <Input data-testid="policy-expiry" type="date" value={mp.expiryDate} onChange={(e) => setMp({ expiryDate: e.target.value })} />
              </div>
              <Input data-testid="policy-premium" placeholder={`Annual Premium (${m.currency})`} value={mp.premium} onChange={(e) => setMp({ premium: e.target.value })} />
              <Textarea data-testid="policy-notes" placeholder="Notes (Optional)" value={mp.notes} onChange={(e) => setMp({ notes: e.target.value })} />
            </div>
          </div>
        </>
      )}

      <div>
        <FieldLabel>Previous Claims</FieldLabel>
        <Pill options={["Yes", "No", "Not sure"]} value={data.hasClaim} onChange={(v) => update({ hasClaim: v })} testidPrefix="has-claim" />
        {data.hasClaim === "Yes" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <Input data-testid="claim-type" placeholder="Incident Type (Optional)" value={data.claimType} onChange={(e) => update({ claimType: e.target.value })} />
            <div className="sm:col-span-2"><FieldLabel>Claim Status</FieldLabel>
              <Pill options={CLAIM_STATUSES} value={data.claimStatus} onChange={(v) => update({ claimStatus: v })} testidPrefix="claim-status" /></div>
            <Textarea data-testid="claim-notes" className="sm:col-span-2" placeholder="Additional Details (Optional)" value={data.claimNotes} onChange={(e) => update({ claimNotes: e.target.value })} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><FieldLabel>Ownership Structure</FieldLabel>
          <Pill options={OWNERSHIP_STRUCTURES} value={data.ownershipStructure} onChange={(v) => update({ ownershipStructure: v })} testidPrefix="ownership-structure" /></div>
        <div><FieldLabel>Number of Owners</FieldLabel>
          <Pill options={OWNER_COUNTS} value={data.ownerCount} onChange={(v) => update({ ownerCount: v })} testidPrefix="owner-count" /></div>
      </div>

      <WhyThisMatters testid="step5-why">
        Knowing what you already hold lets us focus on what may need a closer look rather than repeating cover you have. Having no insurance doesn't automatically mean you're underinsured, it just means the next step is to understand your exposures.
      </WhyThisMatters>

      {data.hasInsurance && (
        <RewardCard title="Existing Cover" testid="reward-existing">
          <div className="space-y-3 text-sm">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Icons.UserCheck className="h-3.5 w-3.5" /> Cover Reported</p>
              <p className="text-slate-600">{data.hasInsurance === "Yes" ? (data.insuranceTypes.length ? data.insuranceTypes.join(", ") : "No cover types selected") : `Commercial insurance: ${data.hasInsurance}`}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700"><Icons.FileText className="h-3.5 w-3.5" /> Documents</p>
              <p className="text-slate-600">{data.uploadedPolicies.length ? `${data.uploadedPolicies.length} file(s) uploaded` : (mp.insurer ? `Manual entry: ${mp.insurer}` : "None")}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Icons.AlertTriangle className="h-3.5 w-3.5" /> To Be Verified</p>
              <p className="text-slate-600">{data.hasInsurance === "Yes" ? "Policy wording, sum insured and exclusions." : "Your partner will review your exposures."}</p>
            </div>
          </div>
        </RewardCard>
      )}
    </div>
  );
}
