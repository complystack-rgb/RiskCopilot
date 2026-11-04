import { NavLink, Outlet, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ConsoleProvider, useConsole } from "@/context/ConsoleContext";
import { BrandBar } from "@/components/BrandBar";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

const NAV = [
  { to: "/console", end: true, label: "Overview", icon: Icons.LayoutDashboard },
  { to: "/console/cases", label: "Cases", icon: Icons.FolderKanban },
  { to: "/console/team", label: "Team", icon: Icons.Users, admin: true },
  { to: "/console/developers", label: "Developer portal", icon: Icons.Code2 },
];

const GeoSwitcher = () => {
  const { meta, market, setMarket } = useConsole();
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5" data-testid="geo-switcher">
      {Object.values(meta.markets).map((mk) => (
        <button key={mk.code} data-testid={`geo-${mk.code}`} onClick={() => setMarket(mk.code)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${market === mk.code ? "bg-[#0A1F44] text-white shadow-sm" : "text-slate-600 hover:bg-white"}`}>
          <Icons.Globe2 className="h-3.5 w-3.5" /><span className="hidden lg:inline">{mk.name}</span><span className={`hidden sm:inline font-mono text-[10px] ${market === mk.code ? "text-blue-200" : "text-slate-400"}`}>{mk.currency}</span>
        </button>
      ))}
    </div>
  );
};

const PersonaSwitcher = () => {
  const { personas, persona, setPersonaId } = useConsole();
  if (!persona) return null;
  return (
    <Select value={persona.id} onValueChange={setPersonaId}>
      <SelectTrigger data-testid="persona-switcher" className="h-10 w-[52px] sm:w-[200px] xl:w-[250px] border-slate-200 bg-white text-left">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">{persona.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>
          <div className="hidden min-w-0 leading-tight sm:block"><p className="truncate text-xs font-semibold text-slate-900">{persona.name}</p><p className="truncate text-[10px] text-slate-500">{persona.title}</p></div>
        </div>
      </SelectTrigger>
      <SelectContent>{personas.map((p) => <SelectItem key={p.id} value={p.id} data-testid={`persona-option-${p.id}`}>{p.name} · {p.role === "admin" ? "Admin" : "Agent"}</SelectItem>)}</SelectContent>
    </Select>
  );
};

const Shell = () => {
  const { meta, persona, m } = useConsole();
  if (!meta) return <p className="p-8 text-sm text-slate-500">Loading…</p>;
  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
        <Link to="/console" className="min-w-0 overflow-hidden"><BrandBar /></Link>
        <div className="flex shrink-0 items-center gap-2"><GeoSwitcher /><PersonaSwitcher /></div>
      </header>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col bg-[#0A1F44] px-3 py-5 md:flex">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-blue-200/60">Broker workspace</p>
          <nav className="mt-2 space-y-0.5">
            {NAV.filter((n) => !n.admin || persona?.role === "admin").map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${isActive ? "bg-white/10 font-semibold text-white" : "text-blue-100/70 hover:bg-white/5 hover:text-white"}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-lg bg-white/5 p-3">
            <p className="text-[10px] uppercase tracking-widest text-blue-200/60">Market</p>
            <p className="mt-1 text-sm font-semibold text-white">{m.name}</p>
            <p className="text-[11px] text-blue-100/60">{m.insurer} · {m.regulator}</p>
          </div>
        </aside>
        <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-slate-200 bg-white py-1.5 md:hidden" data-testid="mobile-nav">
          {NAV.filter((n) => !n.admin || persona?.role === "admin").map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${isActive ? "text-[#0A1F44]" : "text-slate-400"}`}><n.icon className="h-5 w-5" />{n.label.split(" ")[0]}</NavLink>
          ))}
        </nav>
        <main className="min-w-0 flex-1 p-4 pb-20 md:pb-4 lg:p-7"><div className="mx-auto max-w-[1500px]"><Outlet /></div></main>
      </div>
    </div>
  );
};

export default function ConsoleLayout() {
  return <ConsoleProvider><Shell /></ConsoleProvider>;
}
