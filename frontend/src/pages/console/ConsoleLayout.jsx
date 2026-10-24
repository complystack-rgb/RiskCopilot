import { NavLink, Outlet, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { ConsoleProvider, useConsole } from "@/context/ConsoleContext";
import { BrandBar } from "@/components/BrandBar";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

const NAV = [
  { to: "/console", end: true, label: "Overview", icon: Icons.LayoutDashboard, roles: ["insurer", "admin", "agent"] },
  { to: "/console/cases", label: "Case queue", icon: Icons.Inbox, roles: ["insurer", "admin", "agent"] },
  { to: "/console/oversight", label: "Oversight", icon: Icons.ShieldAlert, roles: ["insurer"] },
  { to: "/console/team", label: "Team", icon: Icons.Users, roles: ["insurer", "admin"] },
  { to: "/console/cyber", label: "Cyber check", icon: Icons.Globe, roles: ["insurer", "admin", "agent"], tag: "MY · ID" },
];

const PersonaSwitcher = () => {
  const { personas, persona, setPersonaId, meta } = useConsole();
  const groups = [{ label: "Insurer", items: personas.filter((p) => p.role === "insurer") },
    ...(meta?.orgs || []).map((o) => ({ label: o.name, items: personas.filter((p) => p.org_id === o.id) }))];
  return (
    <Select value={persona.id} onValueChange={setPersonaId}>
      <SelectTrigger data-testid="persona-switcher" className="h-10 w-[260px] border-slate-300 bg-white text-left">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0A1F44] text-[10px] font-bold text-white">{persona.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>
          <div className="min-w-0 leading-tight"><p className="truncate text-xs font-semibold text-slate-900">{persona.name}</p><p className="truncate text-[10px] text-slate-500">{persona.title}</p></div>
        </div>
      </SelectTrigger>
      <SelectContent className="max-h-96">
        {groups.map((g) => (
          <SelectGroup key={g.label}>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-slate-400">{g.label}</SelectLabel>
            {g.items.map((p) => <SelectItem key={p.id} value={p.id} data-testid={`persona-option-${p.id}`}>{p.name} · {p.role === "insurer" ? "Underwriter" : p.role === "admin" ? "Admin" : "Agent"}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
};

const Shell = () => {
  const { persona, meta, loadMeta } = useConsole();
  const reset = async () => { await api.post("/console/reset-demo"); await loadMeta(); toast.success("Demo data reset"); window.location.reload(); };
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 lg:px-6">
        <div className="flex items-center gap-4"><Link to="/console"><BrandBar /></Link><span className="hidden md:inline rounded-md bg-[#0A1F44] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">Partner console</span></div>
        <div className="flex items-center gap-2">
          <button data-testid="reset-demo-btn" onClick={reset} className="hidden lg:flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"><Icons.RotateCcw className="h-3.5 w-3.5" /> Reset demo</button>
          <Link to="/" data-testid="open-sme-journey" className="hidden lg:flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100"><Icons.ExternalLink className="h-3.5 w-3.5" /> SME journey</Link>
          <PersonaSwitcher />
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-56 shrink-0 flex-col bg-[#0A1F44] px-3 py-5 md:flex">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-blue-200/60">Workspace</p>
          <nav className="mt-2 space-y-0.5">
            {NAV.filter((n) => n.roles.includes(persona.role)).map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end} data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) => `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? "bg-white/10 font-semibold text-white" : "text-blue-100/70 hover:bg-white/5 hover:text-white"}`}>
                <n.icon className="h-4 w-4" />{n.label}{n.tag && <span className="ml-auto rounded bg-blue-500/20 px-1.5 text-[9px] font-bold text-blue-200">{n.tag}</span>}
              </NavLink>
            ))}
          </nav>
          <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-widest text-blue-200/60">Product lines</p>
          <ul className="mt-2 space-y-1 px-3">
            {(meta?.product_lines || []).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-[11px] text-blue-100/70">
                <span className="truncate">{p.name}</span>
                <span className={`shrink-0 rounded px-1.5 py-px text-[9px] font-bold ${p.state === "Live" ? "bg-emerald-400/20 text-emerald-300" : p.state === "Pilot" ? "bg-blue-400/20 text-blue-200" : "bg-white/5 text-blue-200/50"}`}>{p.state}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto rounded-md border border-white/10 p-3 text-[10px] leading-relaxed text-blue-100/60">Demo environment. Evidence findings and premiums are illustrative, not insurer-issued.</div>
        </aside>
        <main className="min-w-0 flex-1 p-4 lg:p-6"><div className="mx-auto max-w-[1500px]">{meta ? <Outlet /> : <p className="text-sm text-slate-500">Loading console…</p>}</div></main>
      </div>
    </div>
  );
};

export default function ConsoleLayout() {
  return <ConsoleProvider><Shell /></ConsoleProvider>;
}
