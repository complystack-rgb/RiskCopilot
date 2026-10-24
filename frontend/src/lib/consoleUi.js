export const STATUS_META = {
  new: { label: "New lead", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  assigned: { label: "Assigned", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  inspection_scheduled: { label: "Inspection scheduled", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  inspected: { label: "Inspected", cls: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  recommendation_submitted: { label: "Insurer review", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  justification_requested: { label: "Justification requested", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  approved: { label: "Approved", cls: "bg-emerald-600 text-white border-emerald-600" },
  declined: { label: "Declined", cls: "bg-slate-200 text-slate-600 border-slate-300" },
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

export const inr = (n) => {
  if (n == null) return "—";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

export const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(m, 0)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
};

export const slaInfo = (c) => {
  if (["approved", "declined"].includes(c.status)) return { text: "Closed", cls: "text-slate-400" };
  const h = Math.round((new Date(c.sla_due).getTime() - Date.now()) / 3600000);
  if (h < 0) return { text: `Breached ${-h}h`, cls: "text-rose-600 font-semibold" };
  return { text: `${h}h left`, cls: h < 12 ? "text-amber-600 font-semibold" : "text-slate-600" };
};

export const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
