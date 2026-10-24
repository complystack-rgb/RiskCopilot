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
      <SectionHeader eyebrow="Step 1 of 7" title="Tell us about your business" lead="Your activity and location help determine which exposures may be relevant to you." />

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

      <div>
        <FieldLabel>Where is your business located?</FieldLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <Select value={data.country} onValueChange={(v) => update({ country: v })}>
            <SelectTrigger data-testid="country-select"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="India">India</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
          </Select>
          <Select value={data.state} onValueChange={(v) => update({ state: v })}>
            <SelectTrigger data-testid="state-select"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent className="max-h-64">{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Input data-testid="city-input" placeholder="City" value={data.city} onChange={(e) => update({ city: e.target.value })} />
          <Input data-testid="pin-input" placeholder="PIN code" value={data.pin} onChange={(e) => update({ pin: e.target.value })} />
        </div>
      </div>

      <div>
        <FieldLabel>Business address</FieldLabel>
        <Input data-testid="address-input" placeholder="Apartment/unit, street, locality" value={data.address}
          onChange={(e) => update({ address: e.target.value })} className="max-w-xl" disabled={data.addressLater} />
        <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <Checkbox data-testid="address-later" checked={data.addressLater} onCheckedChange={(v) => update({ addressLater: !!v })} /> I'll complete the detailed address later
        </label>
      </div>

      <WhyThisMatters testid="step1-why">
        Different activities and locations carry different exposures — a food processor near a flood-prone area faces very different risks from a city consultancy. We ask location once and reuse it throughout.
      </WhyThisMatters>

      {(data.businessName || data.category) && (
        <RewardCard title="Business identity card" testid="reward-identity-card">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-blue-100">ComplyStack Profile</p>
                <p className="mt-1 text-xl font-bold">{data.businessName || "Your business"}</p>
                <p className="text-sm text-blue-100">{CATEGORIES.find((c) => c.id === data.category)?.label || "Category pending"}{data.activity ? ` · ${data.activity}` : ""}</p>
              </div>
              <Icons.ShieldCheck className="h-8 w-8 text-blue-200" />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="flex items-center gap-1.5"><Icons.MapPin className="h-3.5 w-3.5" />{[data.city, data.state].filter(Boolean).join(", ") || "Location pending"}</span>
              <span className="flex items-center gap-1.5"><Icons.CalendarClock className="h-3.5 w-3.5" />{data.yearNotSure ? "Year not sure" : data.startYear || "Year pending"}</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Business activity and location help determine which exposures may be relevant to you.</p>
        </RewardCard>
      )}
    </div>
  );
}
