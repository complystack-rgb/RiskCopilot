import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, Pill, RewardCard } from "./shared";
import { PREMISES_OWNERSHIP, LOCATION_TYPES } from "@/data/journeyData";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

// Business-type specific follow-up prompt.
const TYPE_FOLLOWUP = {
  manufacturing: "Are machinery, raw materials or finished goods kept on-site?",
  retail: "Is stock stored on-site or in a separate warehouse?",
  wholesale: "Is stock stored on-site or in a separate warehouse?",
  transport: "Does the business operate its own vehicles or primarily use third parties?",
  professional: "Do operations depend on an office, specialist equipment, or customer premises?",
  it: "Do operations depend on an office, specialist equipment, or customer premises?",
};

export default function Step4Premises() {
  const { data, update } = useJourney();
  const followupQ = TYPE_FOLLOWUP[data.category];
  const safety = ["Yes", "No", "Not sure"];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Step 4 of 7" title="Understand your premises and operations" lead="A clear picture of where and how you operate helps identify what may need protecting." />

      <div>
        <FieldLabel>Do you own or rent your business premises?</FieldLabel>
        <Pill options={PREMISES_OWNERSHIP} value={data.premisesOwnership} onChange={(v) => update({ premisesOwnership: v })} testidPrefix="ownership" />
      </div>

      <div>
        <FieldLabel>Does your business operate from more than one location?</FieldLabel>
        <Pill options={LOCATION_TYPES} value={data.locationType} onChange={(v) => update({ locationType: v })} testidPrefix="location-type" />
        {data.locationType === "Multiple locations" && (
          <div className="mt-3 space-y-2 max-w-md">
            {data.extraLocations.map((loc, i) => (
              <div key={i} className="flex gap-2">
                <Input data-testid={`extra-location-${i}`} placeholder={`Location ${i + 2} (city / area)`} value={loc}
                  onChange={(e) => update({ extraLocations: data.extraLocations.map((l, j) => (j === i ? e.target.value : l)) })} />
                <Button variant="ghost" size="icon" data-testid={`remove-location-${i}`}
                  onClick={() => update({ extraLocations: data.extraLocations.filter((_, j) => j !== i) })}><Icons.X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" data-testid="add-location-btn" onClick={() => update({ extraLocations: [...data.extraLocations, ""] })}>
              <Icons.Plus className="mr-1 h-4 w-4" /> Add another location (you can finish this later)
            </Button>
          </div>
        )}
      </div>

      {followupQ && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <FieldLabel>{followupQ}</FieldLabel>
          <Textarea data-testid="type-followup" value={data.premisesFollowup} onChange={(e) => update({ premisesFollowup: e.target.value })} placeholder="A short answer is fine." />
        </div>
      )}

      <div className="space-y-4">
        <p className="text-sm font-semibold text-slate-800">Optional operational details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><FieldLabel>Main activities at the premises</FieldLabel>
            <Input data-testid="main-activities" value={data.mainActivities} onChange={(e) => update({ mainActivities: e.target.value })} placeholder="Optional" /></div>
          <div><FieldLabel>Significant machinery or equipment</FieldLabel>
            <Input data-testid="significant-machinery" value={data.significantMachinery} onChange={(e) => update({ significantMachinery: e.target.value })} placeholder="Optional" /></div>
          <div><FieldLabel>Stock stored on-site</FieldLabel>
            <Input data-testid="stock-onsite" value={data.stockOnSite} onChange={(e) => update({ stockOnSite: e.target.value })} placeholder="Optional" /></div>
          <div><FieldLabel>Known fire-protection arrangements</FieldLabel>
            <Pill options={safety} value={data.fireProtection} onChange={(v) => update({ fireProtection: v })} testidPrefix="fire-protection" /></div>
        </div>
        <p className="text-xs text-slate-500">For safety details we offer "Not sure" — a missing or uncertain answer is never treated as proof a safety measure is absent.</p>
      </div>

      <WhyThisMatters testid="step4-why">
        Whether you own, rent or share your premises changes who is responsible for what. Operating from several locations, or storing stock off-site, can leave exposures that a single-premises policy may not cover.
      </WhyThisMatters>

      {(data.premisesOwnership || data.locationType) && (
        <RewardCard title="Premises & operations summary" testid="reward-premises">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-slate-400">Ownership</dt><dd className="font-medium text-slate-700">{data.premisesOwnership || "—"}</dd></div>
            <div><dt className="text-xs text-slate-400">Locations</dt><dd className="font-medium text-slate-700">{data.locationType || "—"}{data.extraLocations.filter(Boolean).length ? ` (+${data.extraLocations.filter(Boolean).length})` : ""}</dd></div>
            <div><dt className="text-xs text-slate-400">Fire protection</dt><dd className="font-medium text-slate-700">{data.fireProtection || "Needs confirmation"}</dd></div>
            <div><dt className="text-xs text-slate-400">Machinery noted</dt><dd className="font-medium text-slate-700">{data.significantMachinery || "—"}</dd></div>
          </dl>
          {(!data.fireProtection || data.fireProtection === "Not sure") && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700"><Icons.AlertTriangle className="h-3.5 w-3.5" /> Some safety details may need confirmation.</p>
          )}
        </RewardCard>
      )}
    </div>
  );
}
