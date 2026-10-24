// ComplyStack deterministic SME risk & recommendation engine.
// Scores every meaningful input, derives exposure areas, maps the business to Zurich SME
// products, and produces indicative (non-binding) annual premium estimates plus an
// underwriting-style narrative. Fully deterministic — no external AI call.

import { ZURICH_PRODUCTS } from "@/data/zurichProducts";
import { categoryLabel } from "@/lib/summary";

const REVENUE_MID = {
  "₹50 lakh–₹1 crore": 7500000,
  "₹1–5 crore": 30000000,
  "₹5–25 crore": 150000000,
  "₹25–50 crore": 375000000,
  "Above ₹50 crore": 750000000,
};
const HEADCOUNT_MID = {
  "Just me": 1, "2–5": 3, "6–10": 8, "11–20": 15, "21–50": 35, "51–100": 75, "More than 100": 150,
};

export const fmtINR = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
};

const INDUSTRY_RISK = {
  manufacturing: { label: "machinery breakdown, fire and product liability", weight: 1.15 },
  construction: { label: "on-site injury, third-party and contract works exposure", weight: 1.25 },
  hospitality: { label: "fire, food safety and public liability", weight: 1.15 },
  healthcare: { label: "professional liability and equipment dependency", weight: 1.1 },
  retail: { label: "stock, premises and customer footfall", weight: 1.0 },
  wholesale: { label: "stock accumulation and goods-in-transit", weight: 1.05 },
  trading: { label: "goods-in-transit and credit exposure", weight: 1.05 },
  transport: { label: "motor fleet and cargo", weight: 1.2 },
  professional: { label: "professional indemnity and cyber", weight: 0.95 },
  it: { label: "cyber, data and professional indemnity", weight: 0.95 },
  agriculture: { label: "weather, livestock and machinery", weight: 1.1 },
  realestate: { label: "property damage and owner liability", weight: 1.0 },
  repair: { label: "tools, third-party and premises", weight: 1.0 },
  education: { label: "premises, safeguarding and public liability", weight: 0.95 },
  other: { label: "general business exposure", weight: 1.0 },
};

const band = (s) => (s >= 75 ? "High" : s >= 55 ? "Elevated" : s >= 30 ? "Moderate" : "Low");
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

function deriveInputs(d) {
  const turnover = d.revenueExact ? Number(d.revenueExact) : (REVENUE_MID[d.revenueBand] || 15000000);
  const employees = HEADCOUNT_MID[d.headcount] ?? 4;
  const vehicles = (d.priorities?.includes("vehicles") || d.category === "transport")
    ? Math.max(2, Math.min(20, Math.round(employees / 4))) : 0;
  return { turnover, employees, vehicles };
}

export function computeExposure(d) {
  const { employees, turnover, vehicles } = deriveInputs(d);
  const pr = d.priorities || [];
  const covers = d.hasInsurance === "Yes" ? d.insuranceTypes || [] : [];
  const highRev = turnover >= 150000000;
  const area = (id, label, base, rules) => {
    let score = base; const factors = [];
    rules.forEach(([cond, pts, why]) => { if (cond) { score += pts; if (why) factors.push(`${pts > 0 ? "+" : ""}${pts} ${why}`); } });
    return { id, label, score: clamp(score), level: band(clamp(score)), factors };
  };

  const areas = [
    area("property", "Property & assets", 28, [
      [d.premisesOwnership === "Owned by the business", 18, "premises owned by the business"],
      [["premises", "machinery", "stock", "assets"].some((p) => pr.includes(p)), 16, "assets flagged as hard to lose"],
      [d.locationType === "Multiple locations", 10, "multiple operating locations"],
      [["No", "Not sure"].includes(d.fireProtection), 10, "fire protection unconfirmed"],
      [!covers.includes("Property or fire insurance") && ["premises", "assets"].some((p) => pr.includes(p)), 14, "no property cover indicated"],
      [covers.includes("Property or fire insurance"), -12, "property cover already indicated"],
    ]),
    area("liability", "Liability", 34, [
      [employees > 10, 14, "sizeable workforce"],
      [pr.includes("thirdparty"), 12, "third-party responsibilities prioritised"],
      [["construction", "manufacturing", "healthcare", "hospitality"].includes(d.category), 12, "higher-liability sector"],
      [!covers.includes("Public liability"), 12, "no public liability indicated"],
      [covers.includes("Public liability"), -14, "public liability already indicated"],
    ]),
    area("continuity", "Business continuity", 30, [
      [pr.includes("continuity"), 24, "continuity flagged as critical"],
      [d.priorityFollowups?.continuity === "Yes", 10, "revenue would stop while costs continue"],
      [highRev, 12, "higher revenue at risk"],
      [!covers.includes("Business interruption or loss of profit"), 14, "no business interruption cover indicated"],
      [covers.includes("Business interruption or loss of profit"), -14, "interruption cover already indicated"],
    ]),
    area("people", "People & employees", 18, [
      [pr.includes("employees"), 20, "employee risk prioritised"],
      [employees > 20, 18, "large team"],
      [employees > 5 && employees <= 20, 10, "growing team"],
      [d.priorityFollowups?.employees === "Yes", 8, "staff employed directly"],
      [covers.includes("Employee-related insurance"), -16, "employee cover already indicated"],
    ]),
    area("motor", "Motor & transit", 8, [
      [vehicles > 0, 30, "business vehicles / transit exposure"],
      [d.category === "transport", 15, "transport & logistics sector"],
      [pr.includes("stock") && ["wholesale", "trading"].includes(d.category), 10, "stock moved between sites"],
      [vehicles > 0 && !covers.includes("Commercial vehicle insurance"), 15, "no motor cover indicated"],
      [covers.includes("Commercial vehicle insurance"), -12, "motor cover already indicated"],
    ]),
    area("cyber", "Cyber & professional", 18, [
      [["it", "professional"].includes(d.category), 26, "advice / data-driven sector"],
      [highRev, 10, "higher revenue increases exposure"],
      [!covers.includes("Cyber insurance"), 10, "no cyber cover indicated"],
      [!covers.includes("Professional indemnity") && d.category === "professional", 10, "no professional indemnity indicated"],
    ]),
  ];

  const w = { property: 1.1, liability: 1.2, continuity: 1.1, people: 0.9, motor: 0.8, cyber: 0.9 };
  const overall = clamp(areas.reduce((s, a) => s + a.score * w[a.id], 0) / areas.reduce((s, a) => s + w[a.id], 0));
  return { areas, overall: { score: overall, level: band(overall) } };
}

function quoteFor(product, d) {
  const { turnover, employees, vehicles } = deriveInputs(d);
  const r = product.rate;
  let base = r.floor || 0;
  if (r.turnoverRate) base += turnover * r.turnoverRate;
  if (r.perEmployee) base += employees * r.perEmployee;
  if (r.perVehicle) base += (vehicles || 2) * r.perVehicle;

  const drivers = [];
  if (r.turnoverRate) drivers.push(`Turnover ${fmtINR(turnover)}`);
  if (r.perEmployee) drivers.push(`${employees} employee(s)`);
  if (r.perVehicle) drivers.push(`${vehicles || 2} vehicle(s)`);

  let mult = (INDUSTRY_RISK[d.category]?.weight || 1);
  if (d.hasClaim === "Yes") { mult *= 1.15; drivers.push("Prior claim loading"); }
  if (r.propertyLoad) {
    if (d.fireProtection === "Yes") { mult *= 0.92; drivers.push("Fire protection credit"); }
    else if (["No", "Not sure"].includes(d.fireProtection)) { mult *= 1.06; }
  }
  base *= mult;
  return { min: Math.round((base * 0.85) / 500) * 500, max: Math.round((base * 1.2) / 500) * 500, drivers };
}

const p_industry = (p, cat) => p.industries.includes(cat);

const sectorPhrase = (cat) => {
  const label = categoryLabel(cat);
  const text = /^[A-Z]{2,}/.test(label) ? label : label.toLowerCase();
  return `${/^[aeiou]/i.test(text) ? "an" : "a"} ${text}`;
};

export function recommendProducts(d) {
  const pr = (d.priorities || []).filter((p) => p !== "notsure");
  const covers = d.hasInsurance === "Yes" ? d.insuranceTypes || [] : [];

  const scored = ZURICH_PRODUCTS.map((p) => {
    const industryMatch = p.industries.includes(d.category);
    const matchedPriorities = p.priorities.filter((x) => pr.includes(x));
    const structureBad = p.structureFit && d.ownershipStructure && !p.structureFit.includes(d.ownershipStructure);
    let relevance = 0;
    if (industryMatch) relevance += 3;
    relevance += matchedPriorities.length * 2;
    if (["commercial-combined", "combined-liability"].includes(p.id)) relevance += 1; // baseline SME cover
    if (structureBad) relevance -= 5;

    const alreadyHas = p.coverTypes.length > 0 && p.coverTypes.every((c) => covers.includes(c)) && p.coverTypes.length <= covers.length;
    const partiallyHas = p.coverTypes.some((c) => covers.includes(c));

    const reasonLines = [];
    if (industryMatch) reasonLines.push(`Designed for ${sectorPhrase(d.category).replace(/^an? /, "")} businesses like yours.`);
    matchedPriorities.forEach((mp) => {
      const m = { premises: "protecting your premises", machinery: "covering machinery you depend on", stock: "covering stock and materials", assets: "covering business assets", continuity: "protecting income if operations stop", employees: "meeting employee obligations", thirdparty: "covering third-party liability", vehicles: "covering vehicles and goods in transit" };
      if (m[mp]) reasonLines.push(`Directly addresses ${m[mp]} — which you flagged as hard to lose.`);
    });
    if (reasonLines.length === 0) reasonLines.push("A common SME baseline cover worth reviewing.");

    return { product: p, relevance, matchedPriorities, alreadyHas, partiallyHas, reasonLines, structureBad };
  }).filter((x) => x.relevance > 0 && (!d.category || p_industry(x.product, d.category))).sort((a, b) => b.relevance - a.relevance);

  const top = scored.slice(0, 6);
  return top.map((x, i) => {
    const quote = quoteFor(x.product, d);
    const status = x.alreadyHas ? "Already indicated" : i < 3 ? "Recommended" : "Worth considering";
    const isGap = !x.alreadyHas && !x.partiallyHas && x.matchedPriorities.length > 0;
    const missing = [!d.revenueBand && "revenue", !d.headcount && "team size", d.hasInsurance !== "Yes" && d.hasInsurance !== "No" && "existing cover"].filter(Boolean);
    const confidence = missing.length === 0 ? "High" : missing.length === 1 ? "Medium" : "Indicative";
    return { ...x, quote, status, isGap, confidence };
  });
}

export function buildNarrative(d, exposure, recs) {
  const { turnover, employees } = deriveInputs(d);
  const lines = [];
  const ind = INDUSTRY_RISK[d.category];
  if (d.category) lines.push(`As ${sectorPhrase(d.category)} business, your profile typically carries ${ind?.label || "general business"} exposure. Our engine weighted this sector accordingly.`);
  const ranked = [...exposure.areas].sort((a, b) => b.score - a.score);
  if (d.revenueBand || d.headcount) {
    const topTwo = ranked.slice(0, 2).map((a) => `${a.label.toLowerCase()} (${a.level})`).join(" and ");
    lines.push(`With an estimated turnover around ${fmtINR(turnover)} and roughly ${employees} people, your size feeds directly into the scores — your highest-scoring areas are ${topTwo}.`);
  }

  const hi = ranked[0];
  if (hi) lines.push(`Your highest exposure area is ${hi.label.toLowerCase()} (${hi.level}). Key drivers: ${hi.factors.slice(0, 2).map((f) => f.replace(/^[+-]\d+ /, "")).join("; ") || "limited information available"}.`);

  if (d.premisesOwnership === "Owned by the business") lines.push("Because the business owns its premises, buildings sit on your balance sheet — property cover becomes more central than for a tenant.");
  else if (d.premisesOwnership === "Rented or leased") lines.push("As a tenant, the building itself may be the landlord's responsibility, but your fit-out, stock and contents usually are not — a common blind spot.");
  if (d.locationType === "Multiple locations") lines.push("Operating from multiple locations multiplies both property and liability touchpoints; policies should list every site.");
  if (["No", "Not sure"].includes(d.fireProtection)) lines.push("Fire protection is unconfirmed. We have not assumed it is absent — but confirming it could reduce property premiums.");

  if (d.hasInsurance === "No") lines.push("You reported no current commercial insurance. That isn't a verdict of underinsurance — it simply means every recommended product below represents a fresh consideration rather than a comparison.");
  else if (d.hasInsurance === "Yes") {
    const gaps = recs.filter((r) => r.isGap);
    if (gaps.length) lines.push(`You already hold some cover, but ${gaps.map((g) => g.product.name).join(", ")} appears to address priorities your listed policies may not — worth verifying against the wording.`);
    else lines.push("Your listed cover broadly aligns with your priorities; the main task is verifying limits, exclusions and valuations.");
  }
  if (d.hasClaim === "Yes") lines.push("A prior claim is noted. Insurers price for this, but it does not make you uninsurable — context and remediation matter more than the claim alone.");

  const headline = `${exposure.overall.level} overall exposure profile`;
  return { headline, narrative: lines };
}

export function runEngine(d) {
  const exposure = computeExposure(d);
  const recommendations = recommendProducts(d);
  const narrative = buildNarrative(d, exposure, recommendations);
  return { exposure, recommendations, narrative };
}
