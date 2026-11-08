import { useParams, Navigate, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { getModule, findEndpoint } from "@/data/devportal/modules";
import { SDK_INSTALL, sdkSnippet, LANGS } from "@/lib/codegen";
import { DocH, Section, CodeTabs, CodeBlock, Method } from "@/components/console/dev/shared";
import { EndpointCard } from "@/components/console/dev/EndpointCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Overview = ({ m }) => (
  <div className="space-y-10">
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="What You Can Build"><ul className="space-y-2">{m.capabilities.map((c) => <li key={c} className="flex gap-2 text-sm text-slate-700"><Icons.Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{c}</li>)}</ul></Section>
      <Section title="Access Scopes"><div className="flex flex-wrap gap-2">{m.scopes.map((s) => <code key={s} className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{s}</code>)}</div>
        <p className="text-sm text-slate-500">Keys are granted scopes per module, so a system can read leads without being able to send decisions.</p></Section>
    </div>
    {m.objects.map((o) => (
      <Section key={o.name} title={`The ${o.name} Object`}>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">{o.fields.map(([f, t, d]) => (
          <div key={f} className="grid grid-cols-[minmax(0,160px)_90px_1fr] gap-3 px-4 py-2.5 text-sm"><code className="font-mono text-[12.5px] font-semibold text-slate-900">{f}</code><span className="font-mono text-[11px] text-slate-400">{t}</span><span className="text-slate-600">{d}</span></div>))}</div>
      </Section>))}
    <Section title="Endpoints">
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">{m.endpoints.map((e) => (
        <a key={e.id} href={`#${e.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50"><Method m={e.method} /><code className="font-mono text-[12.5px] text-slate-800">{e.path}</code><span className="ml-auto hidden text-slate-500 sm:inline">{e.title}</span></a>))}</div>
    </Section>
  </div>
);

const Sdk = ({ m }) => (
  <div className="space-y-8">
    <Section title="Install"><CodeTabs testid={`sdk-install-${m.id}`} gen={(l) => SDK_INSTALL[l]} /></Section>
    {m.endpoints.map((e) => (
      <Section key={e.id} title={e.title} sub={<code className="font-mono text-xs text-blue-700">{e.sdk}()</code>}>
        <CodeTabs testid={`sdk-${e.id}`} langs={LANGS.filter(([l]) => l !== "curl")} gen={(l) => sdkSnippet(e, l === "curl" ? "node" : l)} />
      </Section>))}
  </div>
);

const Guide = ({ m }) => (
  <ol className="relative space-y-8 border-l border-slate-200 pl-8">{m.guide.map((g, i) => {
    const e = g.ep && findEndpoint(g.ep);
    return (
      <li key={g.t} className="relative" data-testid={`guide-step-${i + 1}`}>
        <span className="absolute -left-[45px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white font-mono text-xs font-semibold text-blue-700">{i + 1}</span>
        <p className="font-semibold text-slate-900">{g.t}</p><p className="mt-1 max-w-2xl text-sm text-slate-600">{g.b}</p>
        {e && <div className="mt-3 max-w-3xl"><CodeTabs testid={`guide-code-${i + 1}`} gen={(l) => sdkSnippet(e, l)} /></div>}
      </li>);
  })}</ol>
);

const Events = ({ m }) => (
  <div className="space-y-6">
    <p className="text-sm text-slate-600">Events from this module use the standard envelope. See <Link to="/console/developers/webhooks" className="font-semibold text-blue-700 hover:underline">Webhooks</Link> for signing and retries.</p>
    {m.events.map((ev) => (
      <div key={ev.name} className="grid gap-4 xl:grid-cols-2" data-testid={`event-${ev.name}`}>
        <div><code className="font-mono text-sm font-semibold text-slate-900">{ev.name}</code><p className="mt-1 text-sm text-slate-600">{ev.desc}</p></div>
        <CodeBlock title="Payload" code={JSON.stringify({ id: "evt_1Q2w3E", type: ev.name, created: "2026-11-08T07:12:00Z", api_version: "2026-11-01", data: ev.data }, null, 2)} />
      </div>))}
  </div>
);

export default function DevModule() {
  const { id } = useParams();
  const m = getModule(id);
  if (!m) return <Navigate to="/console/developers" replace />;
  const I = Icons[m.icon];
  const tabs = [["overview", "Overview", <Overview m={m} />], ["reference", "API Reference", <div className="space-y-8">{m.endpoints.map((e) => <EndpointCard key={e.id} e={e} />)}</div>], ["sdk", "SDK", <Sdk m={m} />], ["guide", "Integration Guide", <Guide m={m} />], ["events", "Webhook Events", <Events m={m} />]];
  return (
    <div className="space-y-6" data-testid={`module-page-${m.id}`}>
      <DocH eyebrow={`Module · ${m.version} · ${m.status}`} title={m.name} sub={m.summary}
        right={<span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0A1F44] text-white"><I className="h-5 w-5" /></span>} />
      <Tabs defaultValue="overview" key={m.id}>
        <TabsList className="h-auto flex-wrap bg-white ring-1 ring-slate-200">{tabs.map(([v, l]) => <TabsTrigger key={v} value={v} data-testid={`module-tab-${v}`} className="data-[state=active]:bg-[#0A1F44] data-[state=active]:text-white">{l}</TabsTrigger>)}</TabsList>
        {tabs.map(([v, , c]) => <TabsContent key={v} value={v} className="mt-8">{c}</TabsContent>)}
      </Tabs>
    </div>
  );
}
