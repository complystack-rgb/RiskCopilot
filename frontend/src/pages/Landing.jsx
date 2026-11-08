import { useState } from "react";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { MARKETS, MARKET_LIST } from "@/data/markets";
import * as Icons from "lucide-react";
import { BrandBar } from "@/components/BrandBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useJourney } from "@/context/JourneyContext";

const COVERS = [["Building2", "Fire & Property", "Buildings, machinery and stock", "manufacturing"], ["TrendingDown", "Business Interruption", "Lost income after a loss", "manufacturing"],
  ["Cog", "Machinery Breakdown", "Critical plant and equipment", "manufacturing"], ["Ship", "Marine & Transit", "Goods on the move", "wholesale"],
  ["Users", "Public Liability", "Customer and visitor claims", "retail"], ["ShieldCheck", "Cyber", "Data breach and fraud", "it"],
  ["Store", "Shop Insurance", "Retail stock and fittings", "retail"], ["Truck", "Commercial Vehicle", "Fleet of 2 to 20 vehicles", "transport"]];
const STEPS = [["ClipboardList", "Tell us about your business", "Sector, size, location and what you already have."], ["FileBarChart", "Get your Protection Report", "See the risks that apply to you, the gaps in your cover and indicative prices."], ["PhoneCall", "Talk to a licensed partner", "A local partner reviews your report and confirms a firm quote."]];
const WHY = [["BadgeCheck", "Licensed partners near you", "Every quote is reviewed by an authorised local broker."], ["Scale", "Cover matched to real exposure", "We compare what you own with what you have insured."], ["Clock", "Claims support when it counts", "One point of contact from first notice to settlement."], ["Lock", "Your data stays private", "Only your assigned partner and ABC Insure see your details."]];
const SECTORS = ["Textiles & garments", "Food processing", "Auto components", "Pharmaceuticals", "Warehousing", "Retail shops", "IT services", "Hospitality"];
const FAQ = [["Who is this for?", "Owners of small and medium businesses who want business insurance and are not sure what they need."],
  ["Is the price final?", "Prices in your report are indicative. Your partner confirms the final premium after reviewing your details."],
  ["Do I need documents to start?", "No. Photos and policy documents are optional and can be shared with your partner later."],
  ["What happens after I submit?", "Your report goes to a licensed partner, who contacts you within 48 hours."]];

const I = (n) => Icons[n];

const MarketSwitch = ({ m }) => (
  <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold" data-testid="market-switch">
    {MARKET_LIST.map((x) => (
      <Link key={x.slug} to={`/${x.slug}`} data-testid={`market-switch-${x.slug}`} title={x.name}
        className={`rounded-full px-2.5 py-1 transition-colors ${x.slug === m.slug ? "bg-[#0A1F44] text-white" : "text-slate-500 hover:text-slate-900"}`}>{x.code}</Link>
    ))}
  </div>
);

export default function Landing() {
  const nav = useNavigate();
  const { market } = useParams();
  const { reset, update } = useJourney();
  const [name, setName] = useState("");
  if (!MARKETS[market]) return <Navigate to="/in" replace />;
  const m = MARKETS[market];
  const go = (category) => { reset(); update({ market: m.code, country: m.name, ...(name && { businessName: name }), ...(category && { category }) }); nav(`/${m.slug}/quote`); };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3.5 sm:px-6 lg:px-8">
          <BrandBar />
          <div className="flex items-center gap-3 sm:gap-6">
            <MarketSwitch m={m} />
            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex"><a href="#cover" className="hover:text-slate-900">Business Insurance</a><a href="#how" className="hover:text-slate-900">How It Works</a><a href="#faq" className="hover:text-slate-900">FAQs</a><a href="/console" data-testid="partner-console-link" className="hover:text-slate-900">Partner Login</a></nav>
            <Button data-testid="header-quote-btn" onClick={() => go()} className="bg-[#0A1F44] hover:bg-[#13306a]">Get a quote online</Button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50/70 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8 lg:py-20">
          <div className="self-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Business insurance, <span className="text-blue-600">matched to what you actually own.</span></h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">Answer a few questions about your business and get a clear Protection Report with recommended cover and indicative prices.</p>
            <div className="mt-8 flex max-w-lg flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row">
              <Input data-testid="hero-business-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your business name" className="h-12 border-0 text-base shadow-none focus-visible:ring-0" />
              <Button data-testid="hero-quote-btn" size="lg" onClick={() => go()} className="h-12 shrink-0 bg-blue-600 px-6 hover:bg-blue-700">Get a quote online <Icons.ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Icons.ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />No paperwork to start. No obligation.</p>
          </div>
          <div id="cover" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold">Choose the cover you are looking for</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COVERS.map(([ic, t, d, cat]) => { const C = I(ic); return (
                <button key={t} data-testid={`cover-tile-${t.toLowerCase().replace(/[^a-z]+/g, "-")}`} onClick={() => go(cat)}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white"><C className="h-5 w-5" /></span>
                  <span className="text-sm font-semibold leading-tight">{t}</span><span className="text-[11px] leading-snug text-slate-500">{d}</span>
                </button>); })}
            </div>
            <button onClick={() => go()} className="mt-4 flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left text-sm transition-colors hover:bg-blue-50" data-testid="not-sure-btn">
              <span><span className="font-semibold">Not sure what you need?</span> <span className="text-slate-500">We will work it out with you.</span></span><Icons.ChevronRight className="h-4 w-4 text-blue-600" /></button>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
        <span className="font-semibold text-slate-700">Built for</span>{SECTORS.map((s) => <span key={s}>{s}</span>)}</div></section>

      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">{STEPS.map(([ic, t, d], i) => { const C = I(ic); return (
          <div key={t} className="relative rounded-2xl border border-slate-200 p-6"><span className="absolute right-5 top-5 font-mono text-sm text-slate-300">0{i + 1}</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A1F44] text-white"><C className="h-5 w-5" /></span><p className="mt-4 text-lg font-semibold">{t}</p><p className="mt-1 text-sm text-slate-600">{d}</p></div>); })}</div>
      </section>

      <section className="bg-[#0A1F44]"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Why businesses choose ABC Insure</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{WHY.map(([ic, t, d]) => { const C = I(ic); return (
          <div key={t}><C className="h-6 w-6 text-blue-300" /><p className="mt-3 font-semibold text-white">{t}</p><p className="mt-1 text-sm text-blue-100/80">{d}</p></div>); })}</div>
      </div></section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-6">{FAQ.map(([q, a], i) => (
          <AccordionItem key={q} value={`f${i}`}><AccordionTrigger data-testid={`faq-${i}`} className="text-left text-base font-semibold">{q}</AccordionTrigger><AccordionContent className="text-slate-600">{a}</AccordionContent></AccordionItem>))}</Accordion>
        <div className="mt-12 rounded-2xl bg-blue-50 p-8 text-center"><p className="text-xl font-semibold">See your Protection Report today</p><Button data-testid="footer-quote-btn" size="lg" onClick={() => go()} className="mt-4 bg-[#0A1F44] hover:bg-[#13306a]">Get a quote online</Button></div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <BrandBar compact /><span>© 2026 ABC Insure. Insurance is the subject matter of solicitation. Indicative prices are subject to review.</span></div></footer>
    </div>
  );
}
