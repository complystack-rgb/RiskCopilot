import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { httpSnippet, sdkSnippet } from "@/lib/codegen";
import { CodeTabs, CodeBlock, Method, ParamTable } from "./shared";
import { useState } from "react";

export const EndpointCard = ({ e }) => {
  const [mode, setMode] = useState("http");
  return (
    <article id={e.id} data-testid={`endpoint-${e.id}`} className="scroll-mt-24 grid gap-6 border-t border-slate-200 pt-8 xl:grid-cols-2">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900">{e.title}</h3>
          {e.live && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">Live in sandbox</span>}
        </div>
        <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200"><Method m={e.method} /><code className="truncate font-mono text-[12.5px] text-slate-800">{e.path}</code></div>
        <p className="text-sm leading-relaxed text-slate-600">{e.desc}</p>
        <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Parameters</p><ParamTable params={e.params} /></div>
        {e.live && <Link to={`/console/developers/explorer?ep=${e.id}`} data-testid={`try-${e.id}`} className="inline-flex items-center gap-1.5 rounded-md bg-[#0A1F44] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#13306a]"><Icons.Play className="h-3.5 w-3.5" />Try It in the Explorer</Link>}
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex gap-1 text-[11px] font-semibold">{[["http", "Raw HTTP"], ["sdk", "SDK"]].map(([k, l]) => (
          <button key={k} data-testid={`mode-${e.id}-${k}`} onClick={() => setMode(k)} className={`rounded-md px-2.5 py-1 transition-colors ${mode === k ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{l}</button>))}</div>
        <CodeTabs testid={`code-${e.id}`} gen={(l) => (mode === "sdk" ? sdkSnippet(e, l) : httpSnippet(e, l))} />
        <CodeBlock title="Response · 200" code={JSON.stringify(e.response, null, 2)} />
      </div>
    </article>
  );
};
