import * as Icons from "lucide-react";
import { SDK_META, SDK_INSTALL, LANGS } from "@/lib/codegen";
import { CHANGELOG } from "@/data/devportal/modules";
import { DocH, Section, CodeTabs, CodeBlock } from "@/components/console/dev/shared";

const INIT = {
  node: `import ComplyStack from "@complystack/node";\n\nconst cs = new ComplyStack(process.env.COMPLYSTACK_KEY, {\n  maxRetries: 3,\n  timeout: 20_000,\n});`,
  python: `import complystack\n\ncs = complystack.Client(api_key=os.environ["COMPLYSTACK_KEY"], max_retries=3, timeout=20)`,
  java: `ComplyStack cs = ComplyStack.builder()\n    .apiKey(System.getenv("COMPLYSTACK_KEY"))\n    .maxRetries(3)\n    .build();`,
  php: `$cs = new \\ComplyStack\\Client(getenv("COMPLYSTACK_KEY"), ["max_retries" => 3]);`,
  go: `cs := complystack.NewClient(os.Getenv("COMPLYSTACK_KEY"), complystack.WithMaxRetries(3))`,
};
const NO_CURL = LANGS.filter(([l]) => l !== "curl");

export function DevSdks() {
  return (
    <div className="space-y-12">
      <DocH eyebrow="Get Started" title="SDKs and Libraries" sub="Official libraries handle authentication, retries with backoff, pagination, idempotency keys and typed responses for every module." />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{SDK_META.map(([id, name, pkg, v, req]) => (
        <div key={id} className="rounded-lg border border-slate-200 bg-white p-5" data-testid={`sdk-card-${id}`}>
          <div className="flex items-center justify-between"><p className="font-semibold text-slate-900">{name}</p><span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">v{v}</span></div>
          <code className="mt-2 block truncate font-mono text-xs text-blue-700">{pkg}</code><p className="mt-2 text-xs text-slate-500">{req}</p>
        </div>))}</div>
      <Section title="Install"><CodeTabs testid="sdks-install" gen={(l) => SDK_INSTALL[l]} /></Section>
      <Section title="Initialise the Client"><CodeTabs testid="sdks-init" langs={NO_CURL} gen={(l) => INIT[l] || INIT.node} /></Section>
      <Section title="Shared Behaviour">
        <ul className="grid gap-3 md:grid-cols-2">{[["Retries", "Network errors and 429 or 5xx responses are retried up to three times with exponential backoff."], ["Idempotency", "POST requests get an automatic Idempotency-Key so retries never create duplicates."], ["Pagination", "List methods return iterators that fetch the next page on demand."], ["Versioning", "Each SDK release is pinned to an API version. Upgrade on your own schedule."]].map(([t, b]) => (
          <li key={t} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-sm font-semibold text-slate-900">{t}</p><p className="mt-1 text-sm text-slate-600">{b}</p></li>))}</ul>
      </Section>
    </div>
  );
}

const ERRORS = [["400", "invalid_request", "A parameter is missing or malformed."], ["401", "authentication_failed", "The key is missing, revoked or for the wrong environment."], ["403", "insufficient_scope", "The key lacks the scope for this module."], ["404", "not_found", "The lead, case or resource does not exist."], ["409", "invalid_state", "The resource is not in a state that allows this action."], ["422", "validation_failed", "The body is valid JSON but breaks a business rule."], ["429", "rate_limited", "Too many requests. Retry after the Retry-After header."], ["500", "server_error", "Something went wrong on our side. Safe to retry."]];

export function DevErrors() {
  return (
    <div className="space-y-12">
      <DocH eyebrow="Get Started" title="Errors and Limits" sub="Predictable status codes, a consistent error body and clear rate limits across every module." />
      <Section title="Error Body"><CodeBlock title="409 Conflict" code={JSON.stringify({ error: { type: "invalid_state", message: "Lead is in status 'visited'. A decision needs a submitted proposal.", param: "lead_id", request_id: "req_7Hn2Kq" } }, null, 2)} /></Section>
      <Section title="Status Codes">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" data-testid="error-table">{ERRORS.map(([c, t, d]) => (
          <div key={c} className="grid grid-cols-[60px_minmax(0,200px)_1fr] gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0"><span className={`font-mono font-semibold ${c < "500" && c >= "400" ? "text-amber-600" : "text-rose-600"}`}>{c}</span><code className="font-mono text-[12.5px] text-slate-800">{t}</code><span className="text-slate-600">{d}</span></div>))}</div>
      </Section>
      <Section title="Rate Limits" sub="Limits apply per key. Every response includes X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset.">
        <div className="grid gap-3 md:grid-cols-3">{[["Sandbox", "25 requests per second"], ["Live, read", "100 requests per second"], ["Live, write", "50 requests per second"]].map(([a, b]) => (
          <div key={a} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-[11px] uppercase tracking-wider text-slate-400">{a}</p><p className="mt-1 font-mono text-sm font-semibold text-slate-900">{b}</p></div>))}</div>
      </Section>
      <Section title="Versioning" sub="Send ComplyStack-Version: 2026-11-01 to pin a version. Breaking changes only ship in new dated versions, announced 90 days ahead." />
    </div>
  );
}

const TAG = { Added: "bg-emerald-50 text-emerald-700", Improved: "bg-blue-50 text-blue-700", Changed: "bg-amber-50 text-amber-700" };

export function DevChangelog() {
  return (
    <div className="space-y-8">
      <DocH eyebrow="Get Started" title="Changelog" sub="Every change to the API, SDKs and modules." />
      <ol className="space-y-4">{CHANGELOG.map((c) => (
        <li key={c.date + c.mod} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 md:grid-cols-[120px_1fr]" data-testid="changelog-entry">
          <span className="font-mono text-xs text-slate-500">{c.date}</span>
          <div><div className="flex items-center gap-2"><span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${TAG[c.tag]}`}>{c.tag}</span><span className="text-sm font-semibold text-slate-900">{c.mod}</span></div><p className="mt-1.5 text-sm text-slate-600">{c.text}</p></div>
        </li>))}</ol>
      <p className="flex items-center gap-2 text-xs text-slate-400"><Icons.Rss className="h-3.5 w-3.5" />Subscribe to the changelog feed from your account settings once sign in is enabled.</p>
    </div>
  );
}
