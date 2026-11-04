import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { BrandBar } from "@/components/BrandBar";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/context/JourneyContext";

const COVERS = [["Building2", "Property & fire", "Buildings, machinery and stock against fire and natural perils."], ["TrendingDown", "Business interruption", "Keeps income flowing while you rebuild after a loss."],
  ["Cog", "Machinery breakdown", "Repairs and replacement for critical equipment."], ["Ship", "Marine & transit", "Goods on the road, at sea and in storage."],
  ["Users", "Liability", "Claims from customers, visitors and the public."], ["ShieldCheck", "Cyber", "Data breaches, fraud and system outages."]];
const TRUST = [["Timer", "Report in minutes", "Answer a few questions and see your protection needs straight away."], ["BadgeCheck", "Advice from licensed partners", "A local partner reviews your report and confirms your quote."], ["Wallet", "Pay only for what you need", "Cover matched to your sector, size and assets."]];

export default function Landing() {
  const nav = useNavigate();
  const { reset } = useJourney();
  const go = () => { reset(); nav("/quote"); };
  const I = (n) => Icons[n];
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3.5 sm:px-6 lg:px-8">
          <BrandBar />
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex"><a href="#cover" className="hover:text-slate-900">Business cover</a><a href="#why" className="hover:text-slate-900">Why ABC Insure</a><a href="/console" data-testid="partner-console-link" className="hover:text-slate-900">Partner login</a></nav>
            <Button data-testid="header-quote-btn" onClick={go} className="ml-4 bg-[#0A1F44] hover:bg-[#13306a]">Get a quote online</Button>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden bg-[#0A1F44]">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100"><Icons.Building2 className="h-3.5 w-3.5" /> Business insurance for SMEs</p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">Know exactly what your business needs to be protected.</h1>
            <p className="mt-5 max-w-xl text-lg text-blue-100">Tell us how you work. In a few minutes you get a clear protection report, recommended cover and indicative prices, then a licensed partner takes it from there.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button data-testid="hero-quote-btn" size="lg" onClick={go} className="h-12 bg-blue-500 px-6 text-base hover:bg-blue-400">Get a quote online <Icons.ArrowRight className="ml-2 h-4 w-4" /></Button>
              <a href="#cover" className="inline-flex h-12 items-center rounded-md border border-white/25 px-6 text-sm font-medium text-white hover:bg-white/10">Explore cover</a></div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            {[["10 min", "to your protection report"], ["6", "cover categories"], ["48 h", "partner response"], ["4.8/5", "customer rating"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"><p className="font-mono text-3xl font-bold text-white">{v}</p><p className="mt-1 text-sm text-blue-100">{l}</p></div>))}
          </div>
        </div>
      </section>
      <section id="cover" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Business cover</p><h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Cover for every part of your business</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{COVERS.map(([ic, t, d]) => { const C = I(ic); return (
          <div key={t} data-testid={`cover-category-${t.toLowerCase().replace(/[^a-z]+/g, "-")}`} className="group rounded-2xl border border-slate-200 p-6 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-[#0A1F44] group-hover:text-white"><C className="h-5 w-5" /></span>
            <p className="mt-4 text-lg font-semibold text-slate-900">{t}</p><p className="mt-1 text-sm text-slate-500">{d}</p></div>); })}</div>
      </section>
      <section id="why" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">{TRUST.map(([ic, t, d]) => { const C = I(ic); return (
          <div key={t} className="flex gap-4"><C className="h-6 w-6 shrink-0 text-blue-700" /><div><p className="font-semibold text-slate-900">{t}</p><p className="mt-1 text-sm text-slate-500">{d}</p></div></div>); })}</div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8"><h2 className="text-3xl font-bold tracking-tight text-slate-900">See your protection report today</h2><p className="mt-2 text-slate-500">No paperwork to start. No obligation.</p><Button data-testid="footer-quote-btn" size="lg" onClick={go} className="mt-6 h-12 bg-[#0A1F44] px-8 hover:bg-[#13306a]">Get a quote online</Button></section>
      <footer className="bg-[#0A1F44]"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-blue-100/70 sm:flex-row sm:justify-between sm:px-6 lg:px-8"><span>© 2026 ABC Insure. Insurance is the subject matter of solicitation.</span><span>Indicative prices are subject to underwriting review.</span></div></footer>
    </div>
  );
}
