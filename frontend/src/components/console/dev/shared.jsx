import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { LANGS } from "@/lib/codegen";

const EVT = "cs-lang";
export const useLang = () => {
  const [lang, setL] = useState(() => localStorage.getItem("cs_dev_lang") || "curl");
  useEffect(() => { const f = (e) => setL(e.detail); window.addEventListener(EVT, f); return () => window.removeEventListener(EVT, f); }, []);
  const setLang = (l) => { localStorage.setItem("cs_dev_lang", l); window.dispatchEvent(new CustomEvent(EVT, { detail: l })); };
  return [lang, setLang];
};

export const CopyBtn = ({ text, testid }) => (
  <button data-testid={testid} onClick={() => navigator.clipboard?.writeText(text).then(() => toast.success("Copied"), () => toast.error("Copy is blocked in this browser"))}
    className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-slate-400 transition-colors hover:bg-white/10 hover:text-white"><Icons.Copy className="h-3 w-3" />Copy</button>
);

export const CodeBlock = ({ code, title, testid, className = "" }) => (
  <div className={`overflow-hidden rounded-lg border border-[#1E2A4A] bg-[#0B1530] ${className}`} data-testid={testid}>
    <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5"><span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{title}</span><CopyBtn text={code} /></div>
    <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-blue-100">{code}</pre>
  </div>
);

export const CodeTabs = ({ gen, testid, langs = LANGS }) => {
  const [lang, setLang] = useLang();
  const code = gen(lang);
  return (
    <div className="overflow-hidden rounded-lg border border-[#1E2A4A] bg-[#0B1530]" data-testid={testid}>
      <div className="flex items-center justify-between gap-2 border-b border-white/5 px-2">
        <div className="flex overflow-x-auto">{langs.map(([id, label]) => (
          <button key={id} data-testid={`${testid}-lang-${id}`} onClick={() => setLang(id)}
            className={`whitespace-nowrap border-b-2 px-2.5 py-2 text-[11px] font-semibold transition-colors ${lang === id ? "border-blue-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}>{label}</button>))}</div>
        <CopyBtn text={code} testid={`${testid}-copy`} />
      </div>
      <pre className="max-h-[420px] overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-blue-100">{code}</pre>
    </div>
  );
};

const METHOD_CLS = { GET: "bg-emerald-600", POST: "bg-blue-600", PATCH: "bg-amber-600", DELETE: "bg-rose-600" };
export const Method = ({ m }) => <span className={`inline-block w-12 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-white ${METHOD_CLS[m]}`}>{m}</span>;

export const ParamTable = ({ params }) => (
  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
    {params.map((p) => (
      <div key={p.in + p.name} className="grid grid-cols-[minmax(0,180px)_1fr] gap-3 px-4 py-2.5 text-sm">
        <div><code className="font-mono text-[12.5px] font-semibold text-slate-900">{p.name}</code>
          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{p.type} · {p.in}{p.required && <span className="ml-1 text-rose-500">required</span>}</p></div>
        <p className="text-slate-600">{p.desc}</p>
      </div>))}
  </div>
);

export const DocH = ({ eyebrow, title, sub, right }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
    <div className="max-w-3xl"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">{eyebrow}</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>{sub && <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{sub}</p>}</div>{right}
  </div>
);

export const Section = ({ id, title, children, sub }) => (
  <section id={id} className="scroll-mt-24 space-y-4"><div><h2 className="text-lg font-semibold text-slate-900">{title}</h2>{sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}</div>{children}</section>
);
