import { useState, useRef } from "react";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { STEPS } from "@/data/journeyData";

export const Icon = ({ name, className }) => {
  const C = Icons[name] || Icons.Circle;
  return <C className={className} />;
};

export const SectionHeader = ({ eyebrow, title, lead }) => (
  <div className="space-y-2">
    {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{eyebrow}</p>}
    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
    {lead && <p className="text-base text-slate-600 leading-relaxed max-w-2xl">{lead}</p>}
  </div>
);

export const WhyThisMatters = ({ children, testid }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
      <button
        type="button"
        data-testid={testid}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-blue-800">
          <Icons.Lightbulb className="h-4 w-4" /> Why this matters
        </span>
        <Icons.ChevronDown className={`h-4 w-4 text-blue-700 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-blue-900/80 leading-relaxed">{children}</div>}
    </div>
  );
};

export const FieldLabel = ({ children, required }) => (
  <label className="block text-sm font-semibold text-slate-800 mb-2">
    {children} {required && <span className="text-rose-500">*</span>}
  </label>
);

// Generic selectable card/chip. `selected` controls style; works for single & multi select.
export const OptionCard = ({ title, desc, iconName, selected, onClick, testid, compact }) => (
  <button
    type="button"
    data-testid={testid}
    onClick={onClick}
    className={`group relative text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      ${selected ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"}`}
  >
    <div className="flex items-start gap-3">
      {iconName && (
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700"}`}>
          <Icon name={iconName} className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <p className={`font-semibold ${compact ? "text-sm" : "text-[15px]"} ${selected ? "text-blue-900" : "text-slate-800"}`}>{title}</p>
        {desc && <p className="mt-0.5 text-xs text-slate-500 leading-snug">{desc}</p>}
      </div>
      {selected && <Icons.CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-blue-600" />}
    </div>
  </button>
);

export const Pill = ({ options, value, onChange, testidPrefix }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        data-testid={`${testidPrefix}-${opt.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        onClick={() => onChange(opt)}
        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
          ${value === opt ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"}`}
      >
        {opt}
      </button>
    ))}
  </div>
);

export const RewardCard = ({ title, children, testid }) => (
  <div data-testid={testid} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
    <div className="mb-3 flex items-center gap-2">
      <Icons.Sparkles className="h-4 w-4 text-amber-500" />
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
    </div>
    {children}
  </div>
);

// Simulated upload + preliminary automated read. Clearly labelled as a demo, no real analysis.
export const UploadField = ({ accept, multiple, files, onChange, testid, kind = "document", analyse = false }) => {
  const inputRef = useRef(null);

  const handleFiles = (list) => {
    const incoming = Array.from(list).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      type: f.type,
      previewUrl: f.type.startsWith("image/") || f.type.startsWith("video/") ? URL.createObjectURL(f) : null,
      status: "uploading",
      progress: 0,
      analysis: null,
    }));
    const next = multiple ? [...files, ...incoming] : incoming;
    onChange(next);
    incoming.forEach((file) => simulate(file.id, next));
  };

  const simulate = (id, baseList) => {
    let p = 0;
    const iv = setInterval(() => {
      p += 20;
      onChange((prev) => prev.map((f) => (f.id === id ? { ...f, progress: Math.min(p, 100) } : f)));
      if (p >= 100) {
        clearInterval(iv);
        onChange((prev) => prev.map((f) => (f.id === id ? {
          ...f,
          status: analyse ? "analysed" : "received",
          analysis: analyse ? buildDemoAnalysis(f.name, kind) : null,
        } : f)));
      }
    }, 250);
  };

  const remove = (id) => onChange((prev) => prev.filter((f) => f.id !== id));

  return (
    <div>
      <button
        type="button"
        data-testid={testid}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/40"
      >
        <Icons.UploadCloud className="h-6 w-6 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">Click to upload {multiple ? "files" : "a file"}</span>
        <span className="text-xs text-slate-400">{accept?.replace(/\./g, "").toUpperCase()}</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={(e) => e.target.files?.length && handleFiles(e.target.files)} />

      {files.length > 0 && (
        <ul className="mt-3 space-y-2" data-testid={`${testid}-list`}>
          {files.map((f) => (
            <li key={f.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                {f.previewUrl && f.type.startsWith("image/") ? (
                  <img src={f.previewUrl} alt={f.name} className="h-12 w-12 rounded object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-slate-500">
                    <Icons.FileText className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB</p>
                  {f.status === "uploading" && (
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${f.progress}%` }} />
                    </div>
                  )}
                  {f.status === "received" && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <Icons.Clock className="h-3 w-3" /> Received — awaiting review
                    </span>
                  )}
                  {f.status === "analysed" && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <Icons.CheckCircle2 className="h-3 w-3" /> Preliminary read complete
                    </span>
                  )}
                </div>
                <button type="button" onClick={() => remove(f.id)} className="text-slate-400 hover:text-rose-500" data-testid={`${testid}-remove`}>
                  <Icons.X className="h-4 w-4" />
                </button>
              </div>
              {f.analysis && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                    <Icons.Bot className="h-3.5 w-3.5" /> Automated preliminary read (demo — not a verified analysis)
                  </p>
                  <ul className="mt-2 space-y-1">
                    {f.analysis.map((line, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <Icons.Dot className="mt-0.5 h-3 w-3 shrink-0 text-blue-400" />{line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function buildDemoAnalysis(filename, kind) {
  if (kind === "policy") {
    return [
      "Document detected as an insurance policy schedule.",
      "Possible policy type reference found — please confirm this matches your intended cover.",
      "A sum insured / coverage limit field appears present but needs manual verification.",
      "Renewal or expiry date could not be confirmed automatically — enter it manually to be sure.",
    ];
  }
  if (kind === "machinery") {
    return [
      "Image appears to show equipment or machinery.",
      "No make, model or serial number could be read automatically.",
      "Add the asset details manually so the item can be described accurately.",
    ];
  }
  return [
    "Media received and stored for this session.",
    "No automated safety or condition assessment has been performed.",
    "A reviewer would confirm what this evidence shows.",
  ];
}
