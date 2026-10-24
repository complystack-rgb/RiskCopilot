import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZURICH_PRODUCTS } from "@/data/zurichProducts";

const Icon = ({ name, className }) => { const C = Icons[name] || Icons.Circle; return <C className={className} />; };

const TRUST = [
  { icon: "Star", title: "Five-star eTrading insurer", desc: "Best Software House Insurer four years running (2023–26)." },
  { icon: "MessageSquare", title: "Answers in ~2 minutes", desc: "Expert SME underwriters on live chat during business hours." },
  { icon: "ShieldCheck", title: "Cover built around you", desc: "Modular products across every major line of SME business." },
];

export default function Landing() {
  const navigate = useNavigate();
  const go = () => navigate("/quote");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A1F44] text-white"><Icons.ShieldCheck className="h-5 w-5" /></div>
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-tight text-[#0A1F44]">ComplyStack</p>
              <p className="-mt-0.5 text-[11px] font-medium text-blue-700">Powered by Zurich</p>
            </div>
          </div>
          <Button data-testid="header-quote-btn" onClick={go}>Get a quote online <Icons.ArrowRight className="ml-1.5 h-4 w-4" /></Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A1F44] text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #2563EB 0, transparent 45%), radial-gradient(circle at 80% 0%, #1D4ED8 0, transparent 40%)" }} />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              <Icons.Sparkles className="h-3.5 w-3.5" /> Insurance for small & medium-sized enterprises
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight">
              Protect everything you've<br />built — in minutes.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-blue-100/90 leading-relaxed">
              Answer a few guided questions and our risk engine shows you where your business may be exposed, which Zurich SME products fit, and an indicative premium — before you ever speak to anyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button data-testid="hero-quote-btn" onClick={go} size="lg" className="bg-white text-[#0A1F44] hover:bg-blue-50">
                Get a quote online <Icons.ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button data-testid="hero-learn-btn" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                Explore cover
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-5 text-sm text-blue-100/80">
              <span className="flex items-center gap-1.5"><Icons.Check className="h-4 w-4 text-blue-300" /> No login needed</span>
              <span className="flex items-center gap-1.5"><Icons.Check className="h-4 w-4 text-blue-300" /> No email gate</span>
              <span className="flex items-center gap-1.5"><Icons.Check className="h-4 w-4 text-blue-300" /> Indicative pricing</span>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <img src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?crop=entropy&cs=srgb&fm=jpg&w=900&q=80" alt="SME team at work"
              className="rounded-2xl border border-white/10 shadow-2xl" />
            <div className="absolute -bottom-5 -left-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Indicative quote</p>
              <p className="text-2xl font-extrabold text-[#0A1F44]">₹42,000<span className="text-sm font-medium text-slate-400">/yr</span></p>
              <p className="text-xs text-emerald-600">Commercial Combined · 3 covers matched</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-7xl mx-auto grid sm:grid-cols-3 gap-5 px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        {TRUST.map((t) => (
          <div key={t.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon name={t.icon} className="h-5 w-5" /></div>
            <p className="mt-3 font-bold text-slate-900">{t.title}</p>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </section>

      {/* Products */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Our core products and cover</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Cover for every kind of SME</h2>
          <p className="mt-3 text-slate-600">We trade across multiple lines of business. The guided journey matches you to the products below and estimates a premium for each.</p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ZURICH_PRODUCTS.map((p) => (
            <div key={p.id} data-testid={`product-card-${p.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A1F44] text-white transition-colors group-hover:bg-blue-600"><Icon name={p.icon} className="h-5 w-5" /></div>
              <p className="mt-3 font-bold text-slate-900">{p.name}</p>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">{p.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[#0A1F44]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 py-12">
          <div>
            <h2 className="text-2xl font-bold text-white">Ready to see where you stand?</h2>
            <p className="mt-1 text-blue-100/80">The journey takes a few minutes and your answers stay on this device.</p>
          </div>
          <Button data-testid="cta-quote-btn" onClick={go} size="lg" className="bg-white text-[#0A1F44] hover:bg-blue-50 shrink-0">
            Get a quote online <Icons.ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-xs text-slate-400">
        ComplyStack is a discovery demo aligned to Zurich's SME proposition. Premiums shown are indicative estimates generated by a rule engine, not binding quotes.
      </footer>
    </div>
  );
}
