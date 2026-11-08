import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, FieldLabel, OptionCard } from "./shared";
import { CATEGORIES, SUBCATEGORIES, currentYears } from "@/data/journeyData";
import { getMarket } from "@/data/markets";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function Step1Identity() {
  const { data, update } = useJourney();
  const m = getMarket(data.market);
  const subs = SUBCATEGORIES[data.category] || [];
  const ids = data.regIds || {};

  return (
    <div className="space-y-6">
      <SectionHeader title="Your Business" lead="Start with the basics." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="business-id-grid">
        <div>
          <FieldLabel required>Business Name</FieldLabel>
          <Input data-testid="business-name-input" placeholder={m.namePlaceholder} value={data.businessName}
            onChange={(e) => update({ businessName: e.target.value })} />
        </div>
        {m.idFields.map((f) => (
          <div key={f.key}>
            <FieldLabel required>{f.label}</FieldLabel>
            <Input data-testid={`reg-${f.key}-input`} placeholder={f.placeholder} value={ids[f.key] || ""}
              onChange={(e) => update({ regIds: { ...ids, [f.key]: e.target.value } })} />
          </div>
        ))}
      </div>

      <div>
        <FieldLabel required>Business Category</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {CATEGORIES.map((c) => (
            <OptionCard key={c.id} compact title={c.label} iconName={c.icon} selected={data.category === c.id}
              testid={`category-${c.id}`} onClick={() => update({ category: c.id, activity: "" })} />
          ))}
        </div>
      </div>

      {data.category && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
          <FieldLabel>Business Activity</FieldLabel>
          <Select value={data.activity} onValueChange={(v) => update({ activity: v })}>
            <SelectTrigger data-testid="activity-select" className="max-w-md"><SelectValue placeholder="Select Your Activity" /></SelectTrigger>
            <SelectContent>{subs.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      <div>
        <FieldLabel>Year Started</FieldLabel>
        <div className="flex items-center gap-4">
          <Select value={data.startYear} onValueChange={(v) => update({ startYear: v, yearNotSure: false })} disabled={data.yearNotSure}>
            <SelectTrigger data-testid="start-year-select" className="w-40"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent className="max-h-64">{currentYears().map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <Checkbox data-testid="year-not-sure" checked={data.yearNotSure} onCheckedChange={(v) => update({ yearNotSure: !!v, startYear: v ? "" : data.startYear })} /> Not Sure
          </label>
        </div>
      </div>
    </div>
  );
}
