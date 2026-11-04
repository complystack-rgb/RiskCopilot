import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, OptionCard, Pill, RewardCard, Icon } from "./shared";
import { CATEGORIES, SUBCATEGORIES, INDIAN_STATES, currentYears } from "@/data/journeyData";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import * as Icons from "lucide-react";

export default function Step1Identity() {
  const { data, update } = useJourney();
  const subs = SUBCATEGORIES[data.category] || [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Tell us about your business" lead="A few basics so we can tailor cover to the way you work." />

      <div>
        <FieldLabel required>Business name</FieldLabel>
        <Input data-testid="business-name-input" placeholder="e.g. Sharma Textiles Pvt Ltd" value={data.businessName}
          onChange={(e) => update({ businessName: e.target.value })} className="max-w-md" />
      </div>

      <div>
        <FieldLabel required>What does your business do?</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CATEGORIES.map((c) => (
            <OptionCard key={c.id} compact title={c.label} iconName={c.icon} selected={data.category === c.id}
              testid={`category-${c.id}`} onClick={() => update({ category: c.id, activity: "" })} />
          ))}
        </div>
      </div>

      {data.category && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
          <FieldLabel>Specific business activity</FieldLabel>
          <Select value={data.activity} onValueChange={(v) => update({ activity: v })}>
            <SelectTrigger data-testid="activity-select" className="max-w-md"><SelectValue placeholder="Select your activity" /></SelectTrigger>
            <SelectContent>{subs.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div>
        <FieldLabel>When did your business start?</FieldLabel>
        <div className="flex items-center gap-4">
          <Select value={data.startYear} onValueChange={(v) => update({ startYear: v, yearNotSure: false })} disabled={data.yearNotSure}>
            <SelectTrigger data-testid="start-year-select" className="w-40"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent className="max-h-64">{currentYears().map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Checkbox data-testid="year-not-sure" checked={data.yearNotSure} onCheckedChange={(v) => update({ yearNotSure: !!v, startYear: v ? "" : data.startYear })} /> Not sure
          </label>
        </div>
      </div>

    </div>
  );
}
