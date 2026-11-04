export const STATUS_META = {
  new: { label: "New", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  contacted: { label: "Contacted", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  visit_scheduled: { label: "Visit scheduled", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  visited: { label: "Visited", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  proposal_submitted: { label: "Proposal submitted", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  info_requested: { label: "Information requested", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  quoted: { label: "Quoted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  bound: { label: "Bound", cls: "bg-emerald-600 text-white border-emerald-600" },
  lost: { label: "Lost", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};
export const PIPELINE = Object.keys(STATUS_META);

export const BAND_CLS = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Elevated: "bg-orange-50 text-orange-700 border-orange-200",
  High: "bg-rose-50 text-rose-700 border-rose-200",
  Info: "bg-blue-50 text-blue-700 border-blue-200",
};
export const BAND_HEX = { Low: "#059669", Moderate: "#D97706", Elevated: "#EA580C", High: "#DC2626", Info: "#2563EB" };
export const CAT_HEX = { property: "#0A1F44", bi: "#2563EB", machinery: "#0891B2", marine: "#7C3AED", liability: "#D97706", cyber: "#DB2777" };

const fix = (n, d) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en", { maximumFractionDigits: d });
export const money = (n, market = "IN") => {
  if (n == null) return "N/A";
  const a = Math.abs(n), s = n < 0 ? "-" : "";
  if (market === "IN") return a >= 1e7 ? `${s}₹${fix(a / 1e7, 2)} Cr` : a >= 1e5 ? `${s}₹${fix(a / 1e5, 1)} L` : `${s}₹${Math.round(a).toLocaleString("en-IN")}`;
  if (market === "MY") return a >= 1e6 ? `${s}RM ${fix(a / 1e6, 2)}M` : a >= 1e3 ? `${s}RM ${fix(a / 1e3, 0)}K` : `${s}RM ${Math.round(a)}`;
  return a >= 1e12 ? `${s}Rp ${fix(a / 1e12, 2)} T` : a >= 1e9 ? `${s}Rp ${fix(a / 1e9, 1)} M` : a >= 1e6 ? `${s}Rp ${fix(a / 1e6, 0)} Jt` : `${s}Rp ${Math.round(a).toLocaleString("id-ID")}`;
};

export const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 0)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

export const slaInfo = (c) => {
  if (["bound", "lost", "quoted", "proposal_submitted"].includes(c.status)) return { text: "N/A", cls: "text-slate-300" };
  const h = Math.round((new Date(c.sla_due).getTime() - Date.now()) / 3600000);
  if (h < 0) return { text: `Breached ${-h}h`, cls: "text-rose-600 font-semibold" };
  return { text: `${h}h left`, cls: h < 12 ? "text-amber-600 font-semibold" : "text-slate-600" };
};

export const fmtDate = (iso) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
