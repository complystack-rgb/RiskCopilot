import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, Pill, OptionCard, RewardCard, UploadField } from "./shared";
import { INSURANCE_TYPES, CLAIM_STATUSES, OWNERSHIP_STRUCTURES, OWNER_COUNTS } from "@/data/journeyData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import * as Icons from "lucide-react";

export default function Step5Insurance() {
  const { data, update } = useJourney();
  const toggleType = (t) => update({ insuranceTypes: data.insuranceTypes.includes(t) ? data.insuranceTypes.filter((x) => x !== t) : [...data.insuranceTypes, t] });
  const mp = data.manualPolicy;
  const setMp = (patch) => update({ manualPolicy: { ...mp, ...patch } });

  return (
    <div className="space-y-6">
      <SectionHeader title="Understand your existing insurance" lead="Anything you tell us here is self-reported and is not treated as verified coverage." />

      <div>
        <FieldLabel>Does your business currently have commercial insurance?</FieldLabel>
        <Pill options={["Yes", "No", "Not sure"]} value={data.hasInsurance} onChange={(v) => update({ hasInsurance: v })} testidPrefix="has-insurance" />
      </div>

      {data.hasInsurance === "Yes" && (
        <>
          <div>
            <FieldLabel>What types of insurance do you currently have?</FieldLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INSURANCE_TYPES.map((t) => (
                <OptionCard key={t} compact title={t} selected={data.insuranceTypes.includes(t)} onClick={() => toggleType(t)}
                  testid={`insurance-type-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.Upload className="h-4 w-4 text-blue-600" /> Option A, Upload policy documents</p>
              <UploadField accept=".pdf,.jpg,.png" multiple kind="policy" testid="policy-upload"
                files={data.uploadedPolicies} onChange={(v) => update((prev) => ({ uploadedPolicies: typeof v === "function" ? v(prev.uploadedPolicies) : v }))} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Icons.PencilLine className="h-4 w-4 text-blue-600" /> Option B, Enter details manually</p>
              <Input data-testid="policy-insurer" placeholder="Insurer name" value={mp.insurer} onChange={(e) => setMp({ insurer: e.target.value })} />
              <Input data-testid="policy-type" placeholder="Policy type" value={mp.policyType} onChange={(e) => setMp({ policyType: e.target.value })} />
              <Input data-testid="policy-sum" placeholder="Sum insured / coverage limit (₹)" value={mp.sumInsured} onChange={(e) => setMp({ sumInsured: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input data-testid="policy-start" type="date" value={mp.startDate} onChange={(e) => setMp({ startDate: e.target.value })} />
                <Input data-testid="policy-expiry" type="date" value={mp.expiryDate} onChange={(e) => setMp({ expiryDate: e.target.value })} />
              </div>
              <Input data-testid="policy-premium" placeholder="Annual premium (₹)" value={mp.premium} onChange={(e) => setMp({ premium: e.target.value })} />
              <Textarea data-testid="policy-notes" placeholder="Optional notes" value={mp.notes} onChange={(e) => setMp({ notes: e.target.value })} />
              <p className="text-xs text-slate-400">Skip anything you don't know.</p>
            </div>
          </div>
        </>
      )}

      <div>
        <FieldLabel>Has your business made an insurance claim before?</FieldLabel>
        <Pill options={["Yes", "No", "Not sure"]} value={data.hasClaim} onChange={(v) => update({ hasClaim: v })} testidPrefix="has-claim" />
        {data.hasClaim === "Yes" && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <Input data-testid="claim-type" placeholder="Type of incident (optional)" value={data.claimType} onChange={(e) => update({ claimType: e.target.value })} />
            <div className="sm:col-span-2"><FieldLabel>Claim status</FieldLabel>
              <Pill options={CLAIM_STATUSES} value={data.claimStatus} onChange={(v) => update({ claimStatus: v })} testidPrefix="claim-status" /></div>
            <Textarea data-testid="claim-notes" className="sm:col-span-2" placeholder="Additional details (optional)" value={data.claimNotes} onChange={(e) => update({ claimNotes: e.target.value })} />
            <p className="sm:col-span-2 text-xs text-slate-500">A previous claim does not automatically mean the business is high risk or ineligible.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><FieldLabel>Business ownership structure</FieldLabel>
          <Pill options={OWNERSHIP_STRUCTURES} value={data.ownershipStructure} onChange={(v) => update({ ownershipStructure: v })} testidPrefix="ownership-structure" /></div>
        <div><FieldLabel>How many owners does the business have?</FieldLabel>
          <Pill options={OWNER_COUNTS} value={data.ownerCount} onChange={(v) => update({ ownerCount: v })} testidPrefix="owner-count" /></div>
      </div>

      <WhyThisMatters testid="step5-why">
        Knowing what you already hold lets us focus on what may need a closer look rather than repeating cover you have. Having no insurance doesn't automatically mean you're underinsured, it just means the next step is to understand your exposures.
      </WhyThisMatters>

      {data.hasInsurance && (
        <RewardCard title="Existing protection summary" testid="reward-existing">
          <div className="space-y-3 text-sm">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><Icons.UserCheck className="h-3.5 w-3.5" /> Information you provided</p>
              <p className="text-slate-600">{data.hasInsurance === "Yes" ? (data.insuranceTypes.length ? data.insuranceTypes.join(", ") : "Cover types not yet selected") : `No commercial insurance reported (${data.hasInsurance}).`}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700"><Icons.FileText className="h-3.5 w-3.5" /> Documents received</p>
              <p className="text-slate-600">{data.uploadedPolicies.length ? `${data.uploadedPolicies.length} file(s), preliminary read only` : (mp.insurer ? `Manual entry: ${mp.insurer}` : "None")}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700"><Icons.AlertTriangle className="h-3.5 w-3.5" /> Still needs verification</p>
              <p className="text-slate-600">{data.hasInsurance === "Yes" ? "Policy wording, sum insured and exclusions have not been verified." : "Your exposures and protection options are the next thing to explore."}</p>
            </div>
          </div>
        </RewardCard>
      )}
    </div>
  );
}
