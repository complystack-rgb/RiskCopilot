import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as Icons from "lucide-react";
import { api } from "@/lib/api";
import { ALL_ENDPOINTS, findEndpoint } from "@/data/devportal/modules";
import { httpSnippet } from "@/lib/codegen";
import { DocH, CodeBlock, Method } from "@/components/console/dev/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LIVE = ALL_ENDPOINTS.filter((e) => e.live);
const init = (e) => Object.fromEntries(e.params.map((p) => [p.name, typeof p.example === "object" ? JSON.stringify(p.example) : String(p.example ?? "")]));

const send = (e, vals) => {
  let path = e.live.path;
  const params = {}, body = {};
  e.params.forEach((p) => {
    const v = vals[p.name];
    if (v === "") return;
    if (p.in === "path" && !e.live.pathToQuery) path = path.replace(`{${p.name}}`, encodeURIComponent(v));
    else if (p.in === "body") body[p.name] = v;
    else params[p.name] = v;
  });
  return e.live.method === "post" ? api.post(path, body) : api.get(path, { params });
};

export default function DevExplorer() {
  const [sp, setSp] = useSearchParams();
  const e = findEndpoint(sp.get("ep")) && findEndpoint(sp.get("ep")).live ? findEndpoint(sp.get("ep")) : LIVE[0];
  const [vals, setVals] = useState(() => init(e));
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const pick = (id) => { setSp({ ep: id }); setVals(init(findEndpoint(id))); setRes(null); };
  const preview = useMemo(() => httpSnippet({ ...e, params: e.params.map((p) => ({ ...p, example: vals[p.name] })) }, "curl"), [e, vals]);

  const run = async () => {
    setBusy(true); const t = performance.now();
    try { const r = await send(e, vals); setRes({ ok: true, status: r.status, ms: Math.round(performance.now() - t), data: r.data }); }
    catch (err) { setRes({ ok: false, status: err.response?.status || 0, ms: Math.round(performance.now() - t), data: err.response?.data || { detail: err.message } }); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <DocH eyebrow="Get Started" title="API Explorer" sub="Send real requests to the sandbox. Endpoints marked live in sandbox run against this console's data. Decisions you send here show up on the broker case." />
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <div><p className="mb-1.5 text-xs font-semibold text-slate-700">Endpoint</p>
              <Select value={e.id} onValueChange={pick}><SelectTrigger data-testid="explorer-endpoint-select"><SelectValue /></SelectTrigger>
                <SelectContent>{LIVE.map((x) => <SelectItem key={x.id} value={x.id}>{x.method} {x.path} · {x.moduleName}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200"><Method m={e.method} /><code className="truncate font-mono text-xs">{e.path}</code></div>
            {e.params.map((p) => (
              <div key={p.name}><p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700"><code className="font-mono">{p.name}</code><span className="font-normal text-slate-400">{p.in}{p.required ? ", required" : ""}</span></p>
                <Input data-testid={`explorer-param-${p.name}`} value={vals[p.name]} onChange={(ev) => setVals({ ...vals, [p.name]: ev.target.value })} className="font-mono text-xs" /></div>))}
            <Button data-testid="explorer-send" disabled={busy} onClick={run} className="w-full bg-[#0A1F44] hover:bg-[#13306a]">{busy ? <Icons.Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Icons.Send className="mr-1.5 h-4 w-4" />}Send Request</Button>
            <p className="text-[11px] text-slate-400">Sandbox leads waiting for a decision: ZIN-26002, ZMY-26001, ZID-26003.</p>
          </div>
          <CodeBlock title="Equivalent request" code={preview} testid="explorer-curl" />
        </div>
        <div className="xl:col-span-3">
          <div className="overflow-hidden rounded-lg border border-[#1E2A4A] bg-slate-950">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Response</span>
              {res && <span data-testid="explorer-status" className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold ${res.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>{res.status || "ERR"} · {res.ms} ms</span>}
            </div>
            <pre data-testid="explorer-response" className={`h-[640px] overflow-auto p-4 font-mono text-[11.5px] leading-relaxed ${res && !res.ok ? "text-rose-300" : "text-emerald-300"}`}>{res ? JSON.stringify(res.data, null, 2) : "// Send a request to see the response"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
