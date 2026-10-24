import { BrandBar } from "@/components/BrandBar";
import { useJourney } from "@/context/JourneyContext";
import { STEPS } from "@/data/journeyData";
import LiveSummarySidebar from "@/components/wizard/LiveSummarySidebar";
import Step1Identity from "@/components/wizard/Step1Identity";
import Step2Size from "@/components/wizard/Step2Size";
import Step3Priorities from "@/components/wizard/Step3Priorities";
import Step4Premises from "@/components/wizard/Step4Premises";
import Step5Insurance from "@/components/wizard/Step5Insurance";
import Step6Evidence from "@/components/wizard/Step6Evidence";
import Step7Summary from "@/components/wizard/Step7Summary";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

const STEP_COMPONENTS = { 1: Step1Identity, 2: Step2Size, 3: Step3Priorities, 4: Step4Premises, 5: Step5Insurance, 6: Step6Evidence, 7: Step7Summary };

export default function Journey() {
  const { step, setStep, data, reset } = useJourney();
  const Current = STEP_COMPONENTS[step];
  const canNext = step === 1 ? !!data.businessName && !!data.category : true;
  const pct = Math.round((step / STEPS.length) * 100);

  const go = (n) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          <a href="/" aria-label="Home"><BrandBar /></a>
          <button onClick={reset} data-testid="restart-btn" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700">
            <Icons.RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Start over</span>
          </button>
        </div>
        <div className="h-1 w-full bg-slate-100"><div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <nav className="mb-6 flex items-center gap-1 overflow-x-auto pb-1" data-testid="step-nav">
          {STEPS.map((s) => {
            const active = s.n === step, done = s.n < step;
            return (
              <button key={s.n} data-testid={`step-tab-${s.n}`} onClick={() => go(s.n)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors
                  ${active ? "bg-blue-600 text-white" : done ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "text-slate-400 hover:bg-slate-100"}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${active ? "bg-white/20" : done ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                  {done ? <Icons.Check className="h-3 w-3" /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.short}</span>
              </button>
            );
          })}
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <main className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
              <Current />
            </div>
            <div className="mt-5 flex items-center justify-between">
              <Button variant="ghost" data-testid="back-btn" disabled={step === 1} onClick={() => go(step - 1)}>
                <Icons.ArrowLeft className="mr-1.5 h-4 w-4" /> Back
              </Button>
              {step < STEPS.length ? (
                <Button data-testid="next-btn" disabled={!canNext} onClick={() => go(step + 1)}>
                  Continue <Icons.ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button data-testid="finish-btn" onClick={() => go(1)}><Icons.CheckCircle2 className="mr-1.5 h-4 w-4" /> Review from start</Button>
              )}
            </div>
            {step === 1 && !canNext && <p className="mt-2 text-right text-xs text-amber-600">Add a business name and category to continue.</p>}
          </main>

          <div className="lg:col-span-4">
            <LiveSummarySidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
