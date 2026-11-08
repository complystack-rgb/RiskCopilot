import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { MODULES, ALL_ENDPOINTS, findEndpoint } from "@/data/devportal/modules";
import { sdkSnippet, SDK_INSTALL } from "@/lib/codegen";
import { DocH, CodeTabs, Section } from "@/components/console/dev/shared";

const STEPS = [
  ["Get your sandbox key", "Copy the test key from Authentication. Sandbox data is isolated from live cases.", "authentication"],
  ["Install an SDK", "Official libraries for Node.js, Python, Java, PHP and Go, or call the REST API directly.", "sdks"],
  ["Make your first call", "Fetch an underwriting package for a sandbox lead.", "explorer"],
  ["Subscribe to webhooks", "Receive lead, case and decision events instead of polling.", "webhooks"],
];

export default function DevHome() {
  const first = findEndpoint("decisions.package");
  return (
    <div className="space-y-12">
      <DocH eyebrow="Developer Platform" title="Build on the ComplyStack Insurance Platform"
        sub="Seven product modules, each with its own APIs, SDK methods, events and integration guide. Use them together for the full SME journey or one at a time inside your own systems." />
      <div className="grid gap-3 sm:grid-cols-3">{[["Modules", MODULES.length], ["Endpoints", ALL_ENDPOINTS.length], ["Event types", MODULES.reduce((s, m) => s + m.events.length, 0)]].map(([l, v]) => (
        <div key={l} className="rounded-lg border border-slate-200 bg-white px-5 py-4"><p className="text-[11px] uppercase tracking-wider text-slate-400">{l}</p><p className="mt-1 font-mono text-2xl font-semibold text-slate-900" data-testid={`dev-stat-${l.toLowerCase().replace(" ", "-")}`}>{v}</p></div>))}</div>
      <Section title="Quickstart" sub="From zero to your first response in about five minutes.">
        <div className="grid gap-6 xl:grid-cols-2">
          <ol className="space-y-3">{STEPS.map(([t, b, to], i) => (
            <li key={t}><Link to={`/console/developers/${to}`} data-testid={`quickstart-${i + 1}`} className="group flex gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-semibold text-blue-700">{i + 1}</span>
              <div><p className="text-sm font-semibold text-slate-900">{t}</p><p className="mt-0.5 text-sm text-slate-500">{b}</p></div>
              <Icons.ArrowRight className="ml-auto mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" /></Link></li>))}</ol>
          <CodeTabs testid="quickstart-code" gen={(l) => (l === "curl" ? sdkSnippet(first, l) : `# Install\n${SDK_INSTALL[l]}\n\n# Call\n${sdkSnippet(first, l)}`)} />
        </div>
      </Section>
      <Section title="Product Modules" sub="Each module is versioned and documented on its own.">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{MODULES.map((m) => {
          const I = Icons[m.icon];
          return (
            <Link key={m.id} to={`/console/developers/modules/${m.id}`} data-testid={`module-card-${m.id}`} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
              <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0A1F44] text-white"><I className="h-4 w-4" /></span>
                <span className="font-mono text-[10px] text-slate-400">{m.version} · {m.status}</span></div>
              <p className="mt-3 font-semibold text-slate-900">{m.name}</p>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">{m.summary}</p>
              <p className="mt-4 flex gap-3 font-mono text-[11px] text-slate-500"><span>{m.endpoints.length} endpoints</span><span>{m.events.length} events</span><code className="ml-auto text-blue-700">{m.base}</code></p>
            </Link>);
        })}</div>
      </Section>
      <Section title="Environments">
        <div className="grid gap-3 md:grid-cols-2">{[["Sandbox", "https://sandbox.api.complystack.com", "cs_test_", "Test data, no effect on real cases. Free and unlimited for development."], ["Live", "https://api.complystack.com", "cs_live_", "Real leads and decisions. Requires an approved integration review."]].map(([n, u, p, d]) => (
          <div key={n} className="rounded-lg border border-slate-200 bg-white p-5"><p className="font-semibold text-slate-900">{n}</p><code className="mt-1 block font-mono text-xs text-blue-700">{u}</code><p className="mt-2 text-sm text-slate-500">{d}</p><p className="mt-2 font-mono text-[11px] text-slate-400">Key prefix {p}</p></div>))}</div>
      </Section>
    </div>
  );
}
