import { useJourney } from "@/context/JourneyContext";
import { BrandBar } from "@/components/BrandBar";
import Step1Identity from "@/components/wizard/Step1Identity";
import StepAddress from "@/components/wizard/StepAddress";
import Step2Size from "@/components/wizard/Step2Size";
import Step3Priorities from "@/components/wizard/Step3Priorities";
import Step4Premises from "@/components/wizard/Step4Premises";
import Step5Insurance from "@/components/wizard/Step5Insurance";
import Step6Evidence from "@/components/wizard/Step6Evidence";
import ProtectionReport from "@/components/wizard/Step7Summary";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

const STEPS = [["Your business", Step1Identity], ["Location", StepAddress], ["Size", Step2Size], ["What matters most", Step3Priorities], ["Premises", Step4Premises], ["Current cover", Step5Insurance], ["Photos and documents", Step6Evidence]];

export default function Journey() {
  const { step, setStep, data } = useJourney();
  const done = step > STEPS.length;
  const [label, Current] = STEPS[Math.min(step, STEPS.length) - 1];
  const canNext = step === 1 ? !!data.businessName && !!data.category : step === 2 ? !!data.lat : true;
  const next = () => { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-[1100] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6"><a href="/" aria-label="Home"><BrandBar /></a>
          {!done && <span className="text-xs font-medium text-slate-500" data-testid="step-indicator">Step {step} of {STEPS.length} · {label}</span>}</div>
        {!done && <div className="h-1 w-full bg-slate-100"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} /></div>}
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {done ? <ProtectionReport /> : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500" key={step}><Current /></div>
            <div className="mt-5 flex items-center justify-end gap-3">
              {step === 1 && !canNext && <p className="text-xs text-amber-600">Add a business name and category to continue.</p>}
              {step === 2 && !canNext && <p className="text-xs text-amber-600">Search for your address or click the map to place the pin.</p>}
              <Button data-testid="next-btn" size="lg" disabled={!canNext} onClick={next} className="bg-[#0A1F44] hover:bg-[#13306a]">
                {step === STEPS.length ? "See my protection report" : "Continue"} <Icons.ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
