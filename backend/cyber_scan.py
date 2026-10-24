"""Live, passive cyber check of a public website. Every finding cites its source."""
import ssl
import socket
from datetime import datetime, timezone
from urllib.parse import urlparse
import httpx
import dns.resolver

SEC_HEADERS = [
    ("strict-transport-security", "HSTS", "High", "Forces browsers to use HTTPS, which blocks downgrade attacks"),
    ("content-security-policy", "Content-Security-Policy", "Elevated", "Limits script injection (XSS)"),
    ("x-frame-options", "X-Frame-Options", "Moderate", "Prevents clickjacking"),
    ("x-content-type-options", "X-Content-Type-Options", "Moderate", "Stops browsers guessing file types (MIME sniffing)"),
    ("referrer-policy", "Referrer-Policy", "Low", "Limits URL details leaked to other sites"),
]


def _txt(name):
    try:
        return [b"".join(r.strings).decode(errors="ignore") for r in dns.resolver.resolve(name, "TXT", lifetime=4)]
    except Exception:
        return []


def _cert(host):
    ctx = ssl.create_default_context()
    with socket.create_connection((host, 443), timeout=5) as sock:
        with ctx.wrap_socket(sock, server_hostname=host) as s:
            c = s.getpeercert()
            return {"issuer": dict(x[0] for x in c["issuer"]).get("organizationName", "?"), "expires": c["notAfter"], "tls": s.version()}


async def scan(url):
    if not url.startswith("http"):
        url = "https://" + url
    host = urlparse(url).hostname
    domain = host[4:] if host.startswith("www.") else host
    findings = []

    def add(fid, title, status, severity, evidence, source, fix):
        findings.append({"id": fid, "title": title, "status": status, "severity": severity, "evidence": evidence, "source": source, "recommendation": fix})

    async with httpx.AsyncClient(follow_redirects=True, timeout=10, headers={"User-Agent": "ComplyStack-CyberCheck/1.0"}) as client:
        try:
            r = await client.get(f"https://{host}")
            headers = {k.lower(): v for k, v in r.headers.items()}
            final = str(r.url)
        except Exception as e:
            raise ValueError(f"Could not reach https://{host}: {e.__class__.__name__}")
        try:
            rh = await client.get(f"http://{host}", follow_redirects=False)
            loc = rh.headers.get("location", "")
            ok = rh.status_code in (301, 302, 307, 308) and loc.startswith("https")
            add("http_redirect", "HTTP redirects to HTTPS", "pass" if ok else "fail", "High",
                f"GET http://{host} → {rh.status_code} {('Location: ' + loc) if loc else ''}".strip(), f"http://{host}", "Redirect all HTTP traffic to HTTPS with a 301")
        except Exception:
            add("http_redirect", "HTTP redirects to HTTPS", "warn", "Moderate", "Port 80 did not respond", f"http://{host}", "Confirm that HTTP is disabled or redirects")

    try:
        cert = _cert(host)
        exp = datetime.strptime(cert["expires"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
        days = (exp - datetime.now(timezone.utc)).days
        add("tls", "Valid TLS certificate", "pass" if days > 21 else "warn", "High",
            f"{cert['tls']} · issued by {cert['issuer']} · expires {exp.date()} ({days} days)", f"TLS handshake {host}:443", "Renew before expiry and turn on auto-renewal")
    except Exception as e:
        add("tls", "Valid TLS certificate", "fail", "High", f"TLS handshake failed: {e.__class__.__name__}", f"{host}:443", "Install a valid certificate from a trusted CA")

    for key, label, sev, why in SEC_HEADERS:
        v = headers.get(key)
        add(f"hdr_{key}", f"{label} header", "pass" if v else "fail", sev, f"{label}: {v[:120]}" if v else f"Header '{label}' not present in response", final,
            f"Add the {label} header. {why}.")

    disclosed = [f"{h}: {headers[h]}" for h in ("server", "x-powered-by", "x-aspnet-version") if h in headers and any(ch.isdigit() for ch in headers[h])]
    add("disclosure", "Server version not disclosed", "warn" if disclosed else "pass", "Moderate", "; ".join(disclosed) or "No version numbers in the Server or X-Powered-By headers", final,
        "Hide software version numbers in response headers")

    cookies = r.headers.get_list("set-cookie") if hasattr(r.headers, "get_list") else []
    weak = [c.split("=")[0] for c in cookies if "secure" not in c.lower() or "httponly" not in c.lower()]
    if cookies:
        add("cookies", "Cookies are Secure and HttpOnly", "warn" if weak else "pass", "Moderate", f"Cookies missing a flag: {', '.join(weak)}" if weak else f"{len(cookies)} cookie(s) set with both flags", final, "Set the Secure, HttpOnly and SameSite flags on session cookies")

    spf = [t for t in _txt(domain) if t.lower().startswith("v=spf1")]
    add("spf", "SPF record published", "pass" if spf else "fail", "Elevated", spf[0][:160] if spf else f"No v=spf1 TXT record on {domain}", f"DNS TXT {domain}", "Publish an SPF record to stop others sending email as this domain")
    dmarc = [t for t in _txt(f"_dmarc.{domain}") if t.lower().startswith("v=dmarc1")]
    pol = (dmarc[0].split("p=")[1].split(";")[0].strip() if dmarc and "p=" in dmarc[0] else None)
    add("dmarc", "DMARC policy enforced", "pass" if pol in ("reject", "quarantine") else "warn" if dmarc else "fail", "Elevated",
        dmarc[0][:160] if dmarc else f"No DMARC record at _dmarc.{domain}", f"DNS TXT _dmarc.{domain}", "Publish DMARC with p=quarantine or p=reject")

    weights = {"High": 18, "Elevated": 12, "Moderate": 7, "Low": 3}
    lost = sum(weights[f["severity"]] * (1 if f["status"] == "fail" else 0.5 if f["status"] == "warn" else 0) for f in findings)
    score = max(5, round(100 - lost))
    return {"url": final, "domain": domain, "score": score,
            "grade": "A" if score >= 85 else "B" if score >= 70 else "C" if score >= 55 else "D" if score >= 40 else "E",
            "findings": findings, "scanned_at": datetime.now(timezone.utc).isoformat(),
            "method": "Passive checks only: one HTTPS GET, one HTTP GET, a TLS handshake and DNS TXT lookups. No intrusive testing."}
