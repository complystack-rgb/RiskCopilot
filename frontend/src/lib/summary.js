import { CATEGORIES, SUBCATEGORIES, PRIORITIES } from "@/data/journeyData";

export const STATUS = {
  known: { label: "Known", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  verify: { label: "Needs verification", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  limitation: { label: "Potential limitation", cls: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  gap: { label: "Potential gap", cls: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || "";
export const priorityTitle = (id) => PRIORITIES.find((p) => p.id === id)?.title || id;

// Priority -> the cover type most relevant to it.
const PRIORITY_COVER = {
  premises: { label: "premises and buildings", cover: "Property or fire insurance" },
  machinery: { label: "machinery and equipment", cover: "Machinery or equipment insurance" },
  stock: { label: "stock and materials", cover: "Stock or inventory insurance" },
  assets: { label: "furniture, electronics and other assets", cover: "Property or fire insurance" },
  continuity: { label: "business income and continuity", cover: "Business interruption or loss of profit" },
  employees: { label: "employee-related obligations", cover: "Employee-related insurance" },
  thirdparty: { label: "third-party responsibilities", cover: "Public liability" },
  vehicles: { label: "vehicles and goods in transit", cover: "Commercial vehicle insurance" },
};

export function generateConsiderations(data) {
  const out = [];
  const has = data.hasInsurance;
  const covers = data.insuranceTypes || [];
  (data.priorities || []).filter((p) => p !== "notsure").forEach((p) => {
    const map = PRIORITY_COVER[p];
    if (!map) return;
    if (has === "Yes" && covers.includes(map.cover)) {
      out.push({ status: "known", text: `You prioritised ${map.label} and listed ${map.cover}. Confirm the policy describes and values these adequately.` });
    } else if (has === "Yes") {
      out.push({ status: "gap", text: `You prioritised ${map.label}, but ${map.cover} was not among the cover types you listed. Available evidence suggests this may not be addressed yet.` });
    } else if (has === "No") {
      out.push({ status: "gap", text: `You prioritised ${map.label} and reported no current cover. This exposure may not be addressed so far.` });
    } else {
      out.push({ status: "verify", text: `You prioritised ${map.label}. Whether existing cover addresses it is not yet confirmed.` });
    }
  });

  if ((data.uploadedPolicies?.length || 0) > 0 || (data.evidencePolicyDocs?.length || 0) > 0) {
    out.push({ status: "verify", text: "Policy documents were received. The automated read is preliminary only and a verified review is still needed." });
  }
  if (data.manualPolicy?.insurer && !data.manualPolicy?.sumInsured) {
    out.push({ status: "limitation", text: `A policy from ${data.manualPolicy.insurer} was entered without a sum insured. The coverage limit should be confirmed before relying on it.` });
  }
  if (data.hasClaim === "Yes") {
    out.push({ status: "verify", text: "A previous claim was reported. This is context for a reviewer, not evidence of higher risk on its own." });
  }
  if (!has || has === "Not sure") {
    out.push({ status: "verify", text: "Whether the business currently holds commercial insurance is not confirmed. Clarifying this shapes every other consideration." });
  }
  return out;
}

export function nextAction(data) {
  if (!data.businessName || !data.category) return { icon: "ClipboardList", text: "Add missing business information so your summary reflects your actual activity and location." };
  if (data.hasInsurance === "Yes" && (data.uploadedPolicies?.length || 0) === 0 && !data.manualPolicy?.insurer)
    return { icon: "FileUp", text: "Upload or enter your existing policy so its cover can be compared against your priorities." };
  if (data.hasInsurance === "Not sure" || !data.hasInsurance)
    return { icon: "HelpCircle", text: "Clarify whether the business currently holds any commercial insurance." };
  const cons = generateConsiderations(data);
  if (cons.some((c) => c.status === "gap"))
    return { icon: "ShieldAlert", text: "Review the potential gaps highlighted above with a broker before assuming you are covered." };
  return { icon: "UserCheck", text: "Request a broker review to confirm the details that still need verification." };
}

export function activityLabel(data) {
  const sub = data.activity;
  return sub ? `${categoryLabel(data.category)} · ${sub}` : categoryLabel(data.category);
}
