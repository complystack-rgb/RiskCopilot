import { useState } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";
import { useConsole } from "@/context/ConsoleContext";
import { MODULES } from "@/data/devportal/modules";
import { DocH, Section, CodeTabs, CodeBlock, CopyBtn } from "@/components/console/dev/shared";
import { Button } from "@/components/ui/button";

const KeyRow = ({ label, value, env }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3" data-testid={`key-${env}`}>
      <div className="w-40"><p className="text-sm font-semibold text-slate-900">{label}</p><p className="text-[11px] text-slate-400">{env === "test" ? "Sandbox" : "Live"} · all modules</p></div>
      <code className="flex-1 truncate rounded bg-slate-900 px-3 py-2 font-mono text-xs text-blue-100">{show ? value : value.slice(0, 8) + "•".repeat(24)}</code>
      <button data-testid={`key-${env}-reveal`} onClick={() => setShow(!show)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">{show ? "Hide" : "Reveal"}</button>
      <div className="rounded bg-slate-800"><CopyBtn text={value} testid={`key-${env}-copy`} /></div>
    </div>
  );
};

const OAUTH = {
  curl: `curl -X POST "https://auth.complystack.com/oauth/token" \\\n  -d grant_type=client_credentials \\\n  -d client_id=$CLIENT_ID \\\n  -d client_secret=$CLIENT_SECRET \\\n  -d scope="decisions:read decisions:write"`,
  node: `const res = await fetch("https://auth.complystack.com/oauth/token", {\n  method: "POST",\n  body: new URLSearchParams({ grant_type: "client_credentials", client_id, client_secret, scope: "decisions:read decisions:write" }),\n});\nconst { access_token, expires_in } = await res.json();`,
  python: `res = requests.post("https://auth.complystack.com/oauth/token", data={\n    "grant_type": "client_credentials", "client_id": client_id,\n    "client_secret": client_secret, "scope": "decisions:read decisions:write",\n})\ntoken = res.json()["access_token"]`,
  java: `HttpRequest req = HttpRequest.newBuilder(URI.create("https://auth.complystack.com/oauth/token"))\n    .header("Content-Type", "application/x-www-form-urlencoded")\n    .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials&client_id=" + id + "&client_secret=" + secret))\n    .build();`,
  php: `$token = json_decode(file_get_contents("https://auth.complystack.com/oauth/token", false, stream_context_create(["http" => [\n    "method" => "POST",\n    "content" => http_build_query(["grant_type" => "client_credentials", "client_id" => $id, "client_secret" => $secret]),\n]])), true)["access_token"];`,
  go: `cfg := clientcredentials.Config{\n    ClientID: id, ClientSecret: secret,\n    TokenURL: "https://auth.complystack.com/oauth/token",\n    Scopes: []string{"decisions:read", "decisions:write"},\n}\nclient := cfg.Client(ctx)`,
};

export default function DevAuth() {
  const { m, market } = useConsole();
  const mk = market.toLowerCase();
  return (
    <div className="space-y-12">
      <DocH eyebrow="Get Started" title="Authentication" sub="Use API keys for server to server calls, or OAuth 2.0 client credentials when your platform needs short lived, scoped tokens." />
      <Section title="Your API Keys" sub={`Keys for ${m.insurer}. Display only in this preview: creating, rotating and revoking keys arrives with real sign in.`}>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          <KeyRow label="Secret key" env="test" value={`cs_test_${mk}_4eC39HqLyjWDarjtT1zdp7dc`} />
          <KeyRow label="Secret key" env="live" value={`cs_live_${mk}_9fK2mQx7RtB8nZp4Lw1sVc6y`} />
        </div>
        <div className="flex gap-2"><Button data-testid="key-rotate" variant="outline" size="sm" onClick={() => toast.info("Key rotation will be available once real sign in is enabled.")}><Icons.RefreshCw className="mr-1.5 h-3.5 w-3.5" />Rotate Key</Button>
          <Button data-testid="key-create" variant="outline" size="sm" onClick={() => toast.info("Restricted keys will be available once real sign in is enabled.")}><Icons.Plus className="mr-1.5 h-3.5 w-3.5" />Create Restricted Key</Button></div>
      </Section>
      <Section title="API Key Authentication" sub="Send the key as a bearer token on every request. Never ship secret keys in browser or mobile code.">
        <CodeBlock title="Header" code={`Authorization: Bearer cs_test_${mk}_4eC39HqLyjWDarjtT1zdp7dc`} />
      </Section>
      <Section title="OAuth 2.0 Client Credentials" sub="Exchange your client id and secret for an access token valid for one hour, limited to the scopes you request.">
        <ol className="grid gap-3 md:grid-cols-3">{["Request a token with the scopes you need", "Call any endpoint with Authorization: Bearer <access_token>", "Refresh before expires_in runs out"].map((t, i) => (
          <li key={t} className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700"><span className="font-mono text-xs font-semibold text-blue-700">Step {i + 1}</span><p className="mt-1">{t}</p></li>))}</ol>
        <CodeTabs testid="oauth-code" gen={(l) => OAUTH[l]} />
      </Section>
      <Section title="Scopes by Module">
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">{MODULES.map((x) => (
          <div key={x.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm"><span className="w-64 font-medium text-slate-800">{x.name}</span>{x.scopes.map((s) => <code key={s} className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">{s}</code>)}</div>))}</div>
      </Section>
      <Section title="Security Practices">
        <ul className="grid gap-3 md:grid-cols-2">{["Store keys in a secrets manager, never in source control", "Use restricted keys with the fewest scopes per system", "Rotate keys at least every 90 days and on staff exit", "Allow list the IP ranges that call the live API"].map((t) => (
          <li key={t} className="flex gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700"><Icons.ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />{t}</li>))}</ul>
      </Section>
    </div>
  );
}
