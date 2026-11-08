import { MODULES } from "@/data/devportal/modules";
import { webhookVerify } from "@/lib/codegen";
import { DocH, Section, CodeTabs, CodeBlock } from "@/components/console/dev/shared";

const ENVELOPE = { id: "evt_1Q2w3E", type: "decision.recorded", created: "2026-11-08T07:12:00Z", api_version: "2026-11-01", livemode: false, data: { lead_id: "ZIN-26002", decision: "approve" } };
const RETRY = [["1", "Immediately"], ["2", "After 1 minute"], ["3", "After 10 minutes"], ["4", "After 1 hour"], ["5", "After 6 hours"], ["6", "After 24 hours, then the endpoint is paused"]];

export default function DevWebhooks() {
  return (
    <div className="space-y-12">
      <DocH eyebrow="Get Started" title="Webhooks" sub="ComplyStack sends an HTTPS POST to your endpoint whenever something changes, so your systems stay in sync without polling." />
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" data-testid="webhooks-note">Webhook delivery is documentation only in this preview. Endpoints and delivery logs arrive with real sign in.</div>
      <Section title="Event Envelope" sub="Every event shares this structure. The data object depends on the event type.">
        <CodeBlock title="POST https://your-app.example/webhooks/complystack" code={JSON.stringify(ENVELOPE, null, 2)} />
      </Section>
      <Section title="Verifying Signatures" sub="Each request carries a ComplyStack-Signature header: t=<unix time>,v1=<HMAC SHA256 of t.body>. Reject requests older than five minutes.">
        <CodeBlock title="Header" code="ComplyStack-Signature: t=1762585920,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd" />
        <CodeTabs testid="webhook-verify" gen={(l) => webhookVerify[l]} />
      </Section>
      <Section title="Delivery and Retries" sub="Respond with any 2xx status within 10 seconds. Anything else is retried with backoff. Events may arrive out of order or more than once, so deduplicate on id.">
        <div className="grid gap-2 sm:grid-cols-3">{RETRY.map(([n, t]) => <div key={n} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"><span className="font-mono text-xs text-blue-700">Attempt {n}</span><p className="text-slate-700">{t}</p></div>)}</div>
      </Section>
      <Section title="Event Catalog">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white" data-testid="event-catalog">
          {MODULES.flatMap((m) => m.events.map((e) => (
            <div key={e.name} className="grid grid-cols-[minmax(0,220px)_minmax(0,200px)_1fr] gap-3 border-b border-slate-100 px-4 py-2.5 text-sm last:border-0">
              <code className="font-mono text-[12.5px] font-semibold text-slate-900">{e.name}</code><span className="text-slate-500">{m.name}</span><span className="text-slate-600">{e.desc}</span>
            </div>)))}
        </div>
      </Section>
    </div>
  );
}
