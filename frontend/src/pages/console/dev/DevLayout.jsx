import { NavLink, Outlet, Navigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { useConsole } from "@/context/ConsoleContext";
import { MODULES } from "@/data/devportal/modules";

const GUIDES = [["", "Overview", "BookOpen"], ["authentication", "Authentication", "KeyRound"], ["sdks", "SDKs and Libraries", "Package"], ["webhooks", "Webhooks", "Webhook"], ["errors", "Errors and Limits", "TriangleAlert"], ["explorer", "API Explorer", "Terminal"], ["changelog", "Changelog", "History"]];

const Item = ({ to, label, icon, end }) => {
  const I = Icons[icon];
  return (
    <NavLink to={`/console/developers${to ? "/" + to : ""}`} end={end} data-testid={`devnav-${to || "overview"}`}
      className={({ isActive }) => `flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${isActive ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
      <I className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{label}</span>
    </NavLink>
  );
};

export default function DevLayout() {
  const { isUnderwriter, persona } = useConsole();
  if (persona && !isUnderwriter) return <Navigate to="/console" replace />;
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]" data-testid="dev-portal">
      <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="mb-4 rounded-lg bg-[#0A1F44] px-3 py-3 text-white"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-300">ComplyStack</p><p className="text-sm font-semibold">Developer Platform</p><p className="mt-1 font-mono text-[10px] text-blue-200">API version 2026-11-01</p></div>
        <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Get Started</p>
        <nav className="space-y-0.5">{GUIDES.map(([to, l, i]) => <Item key={to} to={to} label={l} icon={i} end={!to} />)}</nav>
        <p className="mt-5 px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Product Modules</p>
        <nav className="space-y-0.5">{MODULES.map((m) => <Item key={m.id} to={`modules/${m.id}`} label={m.name} icon={m.icon} />)}</nav>
      </aside>
      <div className="min-w-0 pb-16"><Outlet /></div>
    </div>
  );
}
