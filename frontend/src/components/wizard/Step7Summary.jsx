import { useState, useEffect, useMemo } from "react";
import { useJourney } from "@/context/JourneyContext";
import { runEngine } from "@/lib/riskEngine";
import { categoryLabel } from "@/lib/summary";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";
import { BrokerReviewDialog } from "./BrokerReviewDialog";

const PHASES = ["Reviewing your business profile", "Mapping the risks that apply to your sector", "Comparing your current cover with your needs", "Selecting the right cover and indicative prices"];
const PEERS = {
  manufacturing: { covered: [["Fire & property", 92], ["Business interruption", 61], ["Machinery breakdown", 48], ["Goods in transit", 55]], causes: ["Electrical short circuits", "Machinery overheating", "Flood and water damage", "Theft of stock"] },
  retail: { covered: [["Shop contents", 88], ["Public liability", 72], ["Burglary", 64], ["Business interruption", 38]], causes: ["Burglary and theft", "Water damage", "Customer injury", "Electrical fire"] },
  default: { covered: [["Property & contents", 84], ["Public liability", 66], ["Business interruption", 41], ["Cyber", 22]], causes: ["Fire and electrical faults", "Water damage", "Third-party injury claims", "Data breach and fraud"] },
};
const TESTIMONIALS = [["Our weaving unit had a short-circuit fire in March. The claim was settled in 19 days, and income cover kept wages paid.", "Owner, textile unit, Surat"], ["The report showed we were insured for barely half our machinery value. We fixed it before renewal.", "Director, auto components, Pune"], ["Simple questions, clear answers, and the broker came already knowing our site.", "Founder, food processing, Indore"]];

const Loading = ({ phase }) => (
  <div className="mx-auto max-w-lg py-24 text-center" data-testid="report-loading">
    <div className="relative mx-auto h-16 w-16"><div className="absolute inset-0 animate-spin rounded-full border-4 border-blue-100 border-t-[#0A1F44]" /><Icons.ShieldCheck className="absolute inset-0 m-auto h-7 w-7 text-[#0A1F44]" /></div>
    <h2 className="mt-6 text-xl font-semibold text-slate-900">Analysing your business and finding the best insurance cover for your needs and growth plans</h2>
    <ul className="mt-6 space-y-2 text-left">{PHASES.map((p, i) => (
      <li key={p} className={`flex items-center gap-2.5 text-sm transition-opacity ${i <= phase ? "opacity-100" : "opacity-30"}`}>{i < phase ? <Icons.CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Icons.Circle className="h-4 w-4 text-slate-300" />}{p}</li>))}</ul>
  </div>
);

const Section = ({ title, sub, children, testid }) => (
  <section data-testid={testid}><h2 className="text-lg font-semibold text-slate-900">{title}</h2>{sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}<div className="mt-4">{children}</div></section>
);

export default function ProtectionReport() {
  const { data } = useJourney();
  const [phase, setPhase] = useState(0);
  const [open, setOpen] = useState(false);
  const engine = useMemo(() => runEngine(data), [data]);
  useEffect(() => { const t = setInterval(() => setPhase((p) => p + 1), 900); return () => clearInterval(t); }, []);
  if (phase < PHASES.length + 1) return <Loading phase={phase} />;
  const recs = engine.recommendations;
  const gaps = recs.filter((r) => r.isGap);
  const peers = PEERS[data.category] || PEERS.default;
  const ov = engine.exposure.overall;
  const maxGap = gaps.reduce((s, r) => s + r.quote.max, 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500" data-testid="protection-report">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#0A1F44] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Your Protection Report</p><h1 className="mt-1 text-3xl font-semibold" data-testid="report-business-name">{data.businessName}</h1>
          <p className="mt-1 text-sm text-blue-100">{categoryLabel(data.category)}{data.activity ? ` · ${data.activity}` : ""}{data.city ? ` · ${data.city}` : ""} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></div>
        <div className="flex gap-2 print:hidden">
          <Button data-testid="download-summary-btn" variant="outline" onClick={() => window.print()} className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Icons.Download className="mr-1.5 h-4 w-4" />Download summary</Button>
          <Button data-testid="submit-review-btn" onClick={() => setOpen(true)} className="bg-blue-500 hover:bg-blue-400"><Icons.Send className="mr-1.5 h-4 w-4" />Submit for review</Button>
        </div>
      </div>

      <Section title="Recommended ABC Insure cover" sub="Chosen for your sector, size and the risks you told us about. Prices are indicative and confirmed after review." testid="recommended-cover">
        <div className="grid gap-4 md:grid-cols-2">{recs.map((r) => (
          <div key={r.product.id} data-testid={`cover-card-${r.product.id}`} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-slate-900">{r.product.name}</p><p className="mt-0.5 text-sm text-slate-500">{r.product.tagline}</p></div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${r.isGap ? "bg-rose-50 text-rose-700" : r.status === "Already indicated" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700"}`}>{r.isGap ? "Not covered today" : r.status}</span></div>
            {r.reasonLines?.[0] && <p className="mt-3 text-sm text-slate-600">{r.reasonLines[0]}</p>}
            <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-400">Indicative annual premium</span><span className="font-mono text-lg font-semibold text-[#0A1F44]">₹{r.quote.min.toLocaleString("en-IN")} to ₹{r.quote.max.toLocaleString("en-IN")}</span></div>
          </div>))}</div>
      </Section>

      <Section title="Exposure profile" sub="How exposed your business is in each area, based on your answers." testid="exposure-profile">
        <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 md:grid-cols-[180px_1fr]">
          <div className="text-center"><p className="font-mono text-5xl font-semibold text-[#0A1F44]">{ov.score}</p><p className="text-xs uppercase tracking-wider text-slate-400">Overall exposure</p><p className="mt-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{ov.level}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">{engine.exposure.areas.map((a) => (
            <div key={a.id} data-testid={`exposure-area-${a.id}`}><div className="flex justify-between text-sm"><span className="font-medium text-slate-700">{a.label}</span><span className="text-xs font-semibold text-slate-900">{a.level}</span></div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${a.score >= 75 ? "bg-rose-500" : a.score >= 55 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${a.score}%` }} /></div></div>))}</div>
        </div>
      </Section>

      <Section title="What you may not know" testid="insights">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5"><Icons.ShieldOff className="h-5 w-5 text-rose-600" /><p className="mt-3 text-3xl font-semibold text-rose-700">{gaps.length}</p><p className="text-sm font-semibold text-rose-800">risks with no cover today</p>
            <p className="mt-2 text-xs text-rose-700">{gaps.length ? `${gaps.map((g) => g.product.name).slice(0, 3).join(", ")}. Protecting these costs about ₹${maxGap.toLocaleString("en-IN")} a year at most.` : "Your current cover addresses the main risks we found."}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5"><Icons.Users className="h-5 w-5 text-blue-600" /><p className="mt-3 text-sm font-semibold text-slate-900">How similar businesses are covered</p>
            <ul className="mt-3 space-y-2">{peers.covered.map(([k, v]) => <li key={k} className="text-xs"><div className="flex justify-between"><span className="text-slate-600">{k}</span><span className="font-mono font-semibold">{v}%</span></div><div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-blue-600" style={{ width: `${v}%` }} /></div></li>)}</ul></div>
          <div className="rounded-xl border border-slate-200 bg-white p-5"><Icons.Flame className="h-5 w-5 text-orange-600" /><p className="mt-3 text-sm font-semibold text-slate-900">Most common claims in your sector</p>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">{peers.causes.map((c, i) => <li key={c} className="flex gap-2"><span className="font-mono text-xs text-slate-400">{i + 1}</span>{c}</li>)}</ol></div>
        </div>
      </Section>

      <Section title="Trusted by businesses like yours" testid="social-proof">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-[#0A1F44] p-5 text-white"><p className="text-3xl font-semibold">4.8<span className="text-base text-blue-200">/5</span></p><div className="mt-1 flex text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Icons.Star key={i} className="h-4 w-4 fill-current" />)}</div><p className="mt-3 text-sm text-blue-100">12,400 similar businesses protected</p></div>
          {TESTIMONIALS.map(([q, who]) => <figure key={who} className="rounded-xl border border-slate-200 bg-white p-5"><Icons.Quote className="h-4 w-4 text-blue-300" /><blockquote className="mt-2 text-sm text-slate-700">{q}</blockquote><figcaption className="mt-3 text-xs font-medium text-slate-500">{who}</figcaption></figure>)}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Sample content for demonstration.</p>
      </Section>

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center print:hidden"><h3 className="text-lg font-semibold text-slate-900">Ready to get protected?</h3><p className="text-sm text-slate-500">An ABC Insure partner will review your report and call you with a firm quote.</p><Button data-testid="submit-review-btn-bottom" size="lg" onClick={() => setOpen(true)} className="bg-[#0A1F44] hover:bg-[#13306a]">Submit for review</Button></div>
      <BrokerReviewDialog open={open} onOpenChange={setOpen} data={data} engine={engine} />
    </div>
  );
}
