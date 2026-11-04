import { useJourney } from "@/context/JourneyContext";
import { SectionHeader, WhyThisMatters, FieldLabel, OptionCard, Pill, RewardCard } from "./shared";
import { PRIORITIES, PRIORITY_FOLLOWUPS } from "@/data/journeyData";
import { priorityTitle } from "@/lib/summary";
import { Textarea } from "@/components/ui/textarea";

const WHY = {
  premises: "Damage to the space you operate from can halt everything else, it's often the single largest exposure.",
  machinery: "If critical equipment fails or is damaged, production and income can stop even if everything else is intact.",
  stock: "Inventory and raw materials tie up capital and can be destroyed, spoiled or stolen.",
  assets: "Computers, tools and furniture are easy to overlook but costly to replace all at once.",
  continuity: "If revenue stops while rent, salaries and loans continue, the gap can be more damaging than the physical loss.",
  employees: "Employing people creates obligations, from workplace injury to statutory cover.",
  thirdparty: "Your activities can create liability to customers, suppliers and the public.",
  vehicles: "Vehicles and goods in transit face risks on the road that premises cover usually excludes.",
};

export default function Step3Priorities() {
  const { data, update } = useJourney();
  const toggle = (id) => {
    const sel = data.priorities.includes(id);
    let next = sel ? data.priorities.filter((p) => p !== id) : [...data.priorities, id];
    if (id === "notsure" && !sel) next = ["notsure"];
    else next = next.filter((p) => p !== "notsure" || id === "notsure");
    update({ priorities: next });
  };
  const selected = data.priorities;
  const isNotSure = selected.includes("notsure");

  return (
    <div className="space-y-6">
      <SectionHeader title="What would be hardest for your business to lose?" lead="Every business depends on different things. Pick what would be hardest to lose or recover from, choose as many as apply." />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PRIORITIES.map((p) => (
          <OptionCard key={p.id} title={p.title} desc={p.desc} iconName={p.icon} selected={selected.includes(p.id)}
            testid={`priority-${p.id}`} onClick={() => toggle(p.id)} />
        ))}
      </div>

      {!isNotSure && selected.filter((id) => PRIORITY_FOLLOWUPS[id]).map((id) => (
        <div key={id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in duration-300">
          <FieldLabel>{PRIORITY_FOLLOWUPS[id].q}</FieldLabel>
          <Pill options={PRIORITY_FOLLOWUPS[id].options} value={data.priorityFollowups[id] || ""}
            onChange={(v) => update({ priorityFollowups: { ...data.priorityFollowups, [id]: v } })} testidPrefix={`followup-${id}`} />
        </div>
      ))}

      {isNotSure && (
        <div className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <p className="text-sm font-medium text-blue-900">No problem, two quick questions will help us point you in the right direction.</p>
          <div>
            <FieldLabel>1. What assets or resources would be hardest to replace?</FieldLabel>
            <Textarea data-testid="notsure-assets" value={data.notSureAssets} onChange={(e) => update({ notSureAssets: e.target.value })} placeholder="e.g. our main oven, our customer records..." />
          </div>
          <div>
            <FieldLabel>2. What disruption would make it hardest to keep the business running?</FieldLabel>
            <Textarea data-testid="notsure-disruption" value={data.notSureDisruption} onChange={(e) => update({ notSureDisruption: e.target.value })} placeholder="e.g. losing our premises, a key supplier failing..." />
          </div>
        </div>
      )}

      <WhyThisMatters testid="step3-why">
        We ask what matters to you before suggesting any products. That keeps the journey about protecting your business, not selling a predefined list.
      </WhyThisMatters>

      {selected.filter((p) => p !== "notsure").length > 0 && (
        <RewardCard title="Protection priorities (preliminary)" testid="reward-priorities">
          <ul className="space-y-2.5">
            {selected.filter((p) => p !== "notsure").map((id) => (
              <li key={id} className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-sm font-semibold text-slate-800">{priorityTitle(id)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{WHY[id]}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-amber-700">Preliminary only, this is not a final insurance recommendation.</p>
        </RewardCard>
      )}
    </div>
  );
}
