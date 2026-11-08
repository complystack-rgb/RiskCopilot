import { API_HOST } from "@/data/devportal/modules";

export const LANGS = [["curl", "cURL"], ["node", "Node.js"], ["python", "Python"], ["java", "Java"], ["php", "PHP"], ["go", "Go"]];
const KEY = "cs_test_4eC39HqLyjWDarjtT1zdp7dc";

const sample = (e) => {
  const val = (p) => (p.example === "" || p.example === undefined ? null : p.example);
  let path = e.path;
  const query = {}, body = {};
  e.params.forEach((p) => {
    const v = val(p);
    if (v === null) return;
    if (p.in === "path") path = path.replace(`{${p.name}}`, v);
    else if (p.in === "query") query[p.name] = v;
    else body[p.name] = v;
  });
  const qs = Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : "";
  return { url: `${API_HOST}${path}${qs}`, body: Object.keys(body).length ? body : null, args: { ...Object.fromEntries(e.params.filter((p) => p.in === "path").map((p) => [p.name, val(p)])), ...query, ...body } };
};

const j = (o, n = 2) => JSON.stringify(o, null, n);
const pyLit = (v) => j(v).replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None");
const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const pascal = (s) => camel(s).replace(/^./, (c) => c.toUpperCase());
const phpLit = (v) => (Array.isArray(v) ? `[${v.map(phpLit).join(", ")}]` : v && typeof v === "object" ? `[${Object.entries(v).map(([k, x]) => `'${k}' => ${phpLit(x)}`).join(", ")}]` : typeof v === "string" ? `'${v}'` : String(v));
const goLit = (v) => (typeof v === "string" ? `"${v}"` : v && typeof v === "object" ? `map[string]any${j(v).replace(/\n/g, " ")}` : String(v));

export const httpSnippet = (e, lang) => {
  const { url, body } = sample(e);
  const b = body ? j(body) : null;
  switch (lang) {
    case "curl": return `curl -X ${e.method} "${url}" \\\n  -H "Authorization: Bearer ${KEY}"${b ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${j(body, 0)}'` : ""}`;
    case "node": return `const res = await fetch("${url}", {\n  method: "${e.method}",\n  headers: {\n    Authorization: \`Bearer \${process.env.COMPLYSTACK_KEY}\`,${b ? `\n    "Content-Type": "application/json",` : ""}\n  },${b ? `\n  body: JSON.stringify(${b.replace(/\n/g, "\n  ")}),` : ""}\n});\nconst data = await res.json();`;
    case "python": return `import os, requests\n\nres = requests.${e.method.toLowerCase()}(\n    "${url}",\n    headers={"Authorization": f"Bearer {os.environ['COMPLYSTACK_KEY']}"},${b ? `\n    json=${pyLit(body).replace(/\n/g, "\n    ")},` : ""}\n)\ndata = res.json()`;
    case "java": return `HttpClient client = HttpClient.newHttpClient();\nHttpRequest req = HttpRequest.newBuilder()\n    .uri(URI.create("${url}"))\n    .header("Authorization", "Bearer " + System.getenv("COMPLYSTACK_KEY"))${b ? `\n    .header("Content-Type", "application/json")` : ""}\n    .method("${e.method}", ${b ? `HttpRequest.BodyPublishers.ofString("${j(body, 0).replace(/"/g, '\\"')}")` : "HttpRequest.BodyPublishers.noBody()"})\n    .build();\nHttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());`;
    case "php": return `<?php\n$ch = curl_init("${url}");\ncurl_setopt_array($ch, [\n    CURLOPT_CUSTOMREQUEST => "${e.method}",\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_HTTPHEADER => [\n        "Authorization: Bearer " . getenv("COMPLYSTACK_KEY"),${b ? `\n        "Content-Type: application/json",` : ""}\n    ],${b ? `\n    CURLOPT_POSTFIELDS => json_encode(${phpLit(body)}),` : ""}\n]);\n$data = json_decode(curl_exec($ch), true);`;
    case "go": return `${b ? `payload := strings.NewReader(\`${j(body, 0)}\`)\n` : ""}req, _ := http.NewRequest("${e.method}", "${url}", ${b ? "payload" : "nil"})\nreq.Header.Set("Authorization", "Bearer "+os.Getenv("COMPLYSTACK_KEY"))${b ? `\nreq.Header.Set("Content-Type", "application/json")` : ""}\nres, err := http.DefaultClient.Do(req)\nif err != nil {\n    log.Fatal(err)\n}\ndefer res.Body.Close()`;
    default: return "";
  }
};

export const sdkSnippet = (e, lang) => {
  const { args } = sample(e);
  const parts = e.sdk.split(".");
  const a = Object.entries(args).filter(([, v]) => v !== null);
  switch (lang) {
    case "curl": return httpSnippet(e, "curl");
    case "node": return `import ComplyStack from "@complystack/node";\n\nconst cs = new ComplyStack(process.env.COMPLYSTACK_KEY);\nconst result = await cs.${parts.map(camel).join(".")}(${j(Object.fromEntries(a.map(([k, v]) => [camel(k), v])))});`;
    case "python": return `import complystack\n\ncs = complystack.Client(api_key=os.environ["COMPLYSTACK_KEY"])\nresult = cs.${parts.map((p) => p.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())).join(".")}(\n${a.map(([k, v]) => `    ${k}=${pyLit(v).replace(/\n/g, " ")},`).join("\n")}\n)`;
    case "java": return `ComplyStack cs = new ComplyStack(System.getenv("COMPLYSTACK_KEY"));\nvar params = ${pascal(parts[parts.length - 1])}Params.builder()\n${a.map(([k, v]) => `    .${camel(k)}(${typeof v === "object" ? `Map.of(${Object.entries(v).map(([x, y]) => `"${x}", ${JSON.stringify(y)}`).join(", ")})` : JSON.stringify(v)})`).join("\n")}\n    .build();\nvar result = cs.${parts.slice(0, -1).map((p) => camel(p) + "()").join(".")}.${camel(parts[parts.length - 1])}(params);`;
    case "php": return `<?php\n$cs = new \\ComplyStack\\Client(getenv("COMPLYSTACK_KEY"));\n$result = $cs->${parts.slice(0, -1).join("->")}${parts.length > 1 ? "->" : ""}${camel(parts[parts.length - 1])}(${phpLit(Object.fromEntries(a))});`;
    case "go": return `cs := complystack.NewClient(os.Getenv("COMPLYSTACK_KEY"))\nresult, err := cs.${parts.map(pascal).join(".")}(ctx, &complystack.${pascal(parts[parts.length - 1])}Params{\n${a.map(([k, v]) => `    ${pascal(k)}: ${goLit(v)},`).join("\n")}\n})`;
    default: return "";
  }
};

export const SDK_INSTALL = {
  curl: "# No install needed. Every endpoint is plain HTTPS and JSON.",
  node: "npm install @complystack/node",
  python: "pip install complystack",
  java: "<dependency>\n  <groupId>com.complystack</groupId>\n  <artifactId>complystack-java</artifactId>\n  <version>3.2.0</version>\n</dependency>",
  php: "composer require complystack/complystack-php",
  go: "go get github.com/complystack/complystack-go/v3",
};

export const SDK_META = [
  ["node", "Node.js", "@complystack/node", "4.6.1", "Node 18 or later, TypeScript types included"],
  ["python", "Python", "complystack", "3.9.0", "Python 3.9 or later, sync and async clients"],
  ["java", "Java", "com.complystack:complystack-java", "3.2.0", "Java 11 or later"],
  ["php", "PHP", "complystack/complystack-php", "2.8.4", "PHP 8.1 or later"],
  ["go", "Go", "github.com/complystack/complystack-go/v3", "3.4.0", "Go 1.21 or later, context aware"],
];

export const webhookVerify = {
  curl: "# Webhook signatures are verified in your server code. Pick a language tab.",
  node: `import crypto from "crypto";\n\nfunction verify(rawBody, header, secret) {\n  const [t, v1] = header.split(",").map((p) => p.split("=")[1]);\n  const expected = crypto.createHmac("sha256", secret).update(\`\${t}.\${rawBody}\`).digest("hex");\n  const fresh = Math.abs(Date.now() / 1000 - Number(t)) < 300;\n  return fresh && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));\n}`,
  python: `import hmac, hashlib, time\n\ndef verify(raw_body: bytes, header: str, secret: str) -> bool:\n    t, v1 = [p.split("=")[1] for p in header.split(",")]\n    expected = hmac.new(secret.encode(), f"{t}.".encode() + raw_body, hashlib.sha256).hexdigest()\n    return abs(time.time() - int(t)) < 300 and hmac.compare_digest(expected, v1)`,
  java: `boolean verify(String rawBody, String header, String secret) throws Exception {\n    String[] p = header.split(",");\n    String t = p[0].split("=")[1], v1 = p[1].split("=")[1];\n    Mac mac = Mac.getInstance("HmacSHA256");\n    mac.init(new SecretKeySpec(secret.getBytes(), "HmacSHA256"));\n    String expected = HexFormat.of().formatHex(mac.doFinal((t + "." + rawBody).getBytes()));\n    return MessageDigest.isEqual(expected.getBytes(), v1.getBytes());\n}`,
  php: `function verify(string $rawBody, string $header, string $secret): bool {\n    [$t, $v1] = array_map(fn($p) => explode("=", $p)[1], explode(",", $header));\n    $expected = hash_hmac("sha256", "$t.$rawBody", $secret);\n    return abs(time() - (int)$t) < 300 && hash_equals($expected, $v1);\n}`,
  go: `func verify(rawBody []byte, header, secret string) bool {\n    parts := strings.Split(header, ",")\n    t := strings.Split(parts[0], "=")[1]\n    v1 := strings.Split(parts[1], "=")[1]\n    mac := hmac.New(sha256.New, []byte(secret))\n    mac.Write([]byte(t + "."))\n    mac.Write(rawBody)\n    return hmac.Equal([]byte(hex.EncodeToString(mac.Sum(nil))), []byte(v1))\n}`,
};
