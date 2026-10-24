import { STATUS_META, BAND_CLS, BAND_HEX } from "@/lib/consoleUi";

export const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, cls: "" };
  return <span data-testid={`status-badge-${status}`} className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{m.label}</span>;
};

export const BandBadge = ({ band, children }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-semibold ${BAND_CLS[band] || BAND_CLS.Info}`}>{children || band}</span>
);

export const ScoreRing = ({ score, band, size = 120, label = "Fire score" }) => {
  const r = size / 2 - 9, c = 2 * Math.PI * r, color = BAND_HEX[band] || "#2563EB";
  return (
    <div className="relative" style={{ width: size, height: size }} data-testid="score-ring">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset 900ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      </div>
    </div>
  );
};

export const Panel = ({ title, icon: Icon, action, children, className = "", testid }) => (
  <section data-testid={testid} className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
    {title && (
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">{Icon && <Icon className="h-4 w-4 text-blue-600" />}{title}</h3>
        {action}
      </div>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const Kpi = ({ label, value, sub, icon: Icon, tone = "text-slate-900", testid }) => (
  <div data-testid={testid} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      {Icon && <Icon className="h-4 w-4 text-slate-400" />}
    </div>
    <p className={`mt-2 font-mono text-2xl font-bold ${tone}`}>{value}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
  </div>
);

export const PageHead = ({ eyebrow, title, sub, right }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">{eyebrow}</p>}
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
    {right}
  </div>
);
