import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useJourney } from "@/context/JourneyContext";
import { MARKETS } from "@/data/markets";
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

const STEPS = [["Your Business", Step1Identity], ["Location", StepAddress], ["Size", Step2Size], ["Priorities", Step3Priorities], ["Premises", Step4Premises], ["Current Cover", Step5Insurance], ["Photos and Documents", Step6Evidence]];

export default function Journey() {
  const { market } = useParams();
  const m = MARKETS[market];
  const { step, setStep, data, update, reset } = useJourney();
  useEffect(() => {
    if (m && data.market !== m.code) { reset(); update({ market: m.code, country: m.name }); }
  }, [m?.code]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return <Navigate to="/in/quote" replace />;

  const done = step > STEPS.length;
  const [label, Current] = STEPS[Math.min(step, STEPS.length) - 1];
  const idsDone = m.idFields.every((f) => (data.regIds?.[f.key] || "").trim());
  const canNext = step === 1 ? !!data.businessName.trim() && idsDone && !!data.category : step === 2 ? !!data.lat : true;
  const next = () => { setStep(step + 1); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-[1100] border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6"><a href={`/${m.slug}`} aria-label="Home"><BrandBar /></a>
          <div className="flex items-center gap-3">
            {!done && <span className="hidden text-xs font-medium text-slate-500 sm:inline" data-testid="step-indicator">Step {step} of {STEPS.length} · {label}</span>}
            <span data-testid="market-tag" className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-800">{m.name} · {m.code}</span>
          </div></div>
        {!done && <div className="h-1 w-full bg-slate-100"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} /></div>}
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {done ? <ProtectionReport /> : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-500" key={step}><Current /></div>
            <div className="mt-5 flex items-center justify-end gap-3">
              {step === 1 && !canNext && <p className="text-xs text-amber-600" data-testid="step1-hint">Fill in all required fields to continue.</p>}
              {step === 2 && !canNext && <p className="text-xs text-amber-600">Search for your address or click the map to place the pin.</p>}
              <Button data-testid="next-btn" size="lg" disabled={!canNext} onClick={next} className="bg-[#0A1F44] hover:bg-[#13306a]">
                {step === STEPS.length ? "See My Protection Report" : "Continue"} <Icons.ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
