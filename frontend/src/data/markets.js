const INR_PER_USD = 83;

export const MARKETS = {
  in: {
    code: "IN", slug: "in", name: "India", currency: "INR", symbol: "₹", fx: 83, locale: "en-IN",
    center: [20.5937, 78.9629], zoom: 5, regionLabel: "State", postcodeLabel: "PIN Code",
    namePlaceholder: "Sharma Textiles Pvt Ltd",
    idFields: [
      { key: "pan", label: "PAN (Corporate)", placeholder: "ABCDE1234F" },
      { key: "gstin", label: "GSTIN (Corporate)", placeholder: "22ABCDE1234F1Z5" },
      { key: "udyam", label: "Udyam Registration Number", placeholder: "UDYAM-XX-00-0000000" },
    ],
    revenueBands: [["₹50 lakh to ₹1 crore", 7500000], ["₹1 to 5 crore", 30000000], ["₹5 to 25 crore", 150000000], ["₹25 to 50 crore", 375000000], ["Above ₹50 crore", 750000000]],
    payrollBands: ["No employees or payroll", "Below ₹5 lakh", "₹5 to 15 lakh", "₹15 to 50 lakh", "₹50 lakh to ₹1 crore", "₹1 to 5 crore", "Above ₹5 crore"],
  },
  my: {
    code: "MY", slug: "my", name: "Malaysia", currency: "MYR", symbol: "RM", fx: 4.7, locale: "en-MY",
    center: [4.2105, 101.9758], zoom: 6, regionLabel: "State", postcodeLabel: "Postcode",
    namePlaceholder: "Tan Brothers Sdn Bhd",
    idFields: [
      { key: "ssm", label: "SSM Registration Number", placeholder: "202301012345" },
      { key: "tin", label: "Tax Identification Number (TIN)", placeholder: "C20880050010" },
      { key: "sst", label: "SST Registration Number", placeholder: "W10-1808-32000123" },
    ],
    revenueBands: [["Below RM 300,000", 150000], ["RM 300,000 to RM 3 million", 1650000], ["RM 3 to 15 million", 9000000], ["RM 15 to 50 million", 32500000], ["Above RM 50 million", 75000000]],
    payrollBands: ["No employees or payroll", "Below RM 100,000", "RM 100,000 to RM 500,000", "RM 500,000 to RM 2 million", "RM 2 to 10 million", "Above RM 10 million"],
  },
  id: {
    code: "ID", slug: "id", name: "Indonesia", currency: "IDR", symbol: "Rp", fx: 15800, locale: "id-ID",
    center: [-2.5489, 118.0149], zoom: 5, regionLabel: "Province", postcodeLabel: "Postal Code",
    namePlaceholder: "PT Maju Bersama Indonesia",
    idFields: [
      { key: "nib", label: "NIB (Business Identification Number)", placeholder: "1234567890123" },
      { key: "npwp", label: "NPWP (Corporate)", placeholder: "0012345678901000" },
      { key: "pkp", label: "PKP Confirmation Number", placeholder: "S-0000PKP/WPJ.00/KP.0000/2024" },
    ],
    revenueBands: [["Below Rp 2 billion", 1000000000], ["Rp 2 to 15 billion", 8500000000], ["Rp 15 to 50 billion", 32500000000], ["Rp 50 to 100 billion", 75000000000], ["Above Rp 100 billion", 150000000000]],
    payrollBands: ["No employees or payroll", "Below Rp 500 million", "Rp 500 million to Rp 2 billion", "Rp 2 to 10 billion", "Rp 10 to 50 billion", "Above Rp 50 billion"],
  },
};

export const MARKET_LIST = Object.values(MARKETS);
export const getMarket = (slug) => MARKETS[(slug || "in").toLowerCase()] || MARKETS.in;

export const toINR = (local, m) => (Number(local) * INR_PER_USD) / m.fx;

export const money = (inr, m) => {
  const v = (inr * m.fx) / INR_PER_USD;
  if (m.code === "IN") {
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)} L`;
    return `₹${Math.round(v).toLocaleString("en-IN")}`;
  }
  if (v >= 1e9) return `${m.symbol} ${(v / 1e9).toFixed(1)} billion`;
  if (v >= 1e6) return `${m.symbol} ${(v / 1e6).toFixed(1)} million`;
  return `${m.symbol} ${Math.round(v).toLocaleString(m.locale)}`;
};

export const revenueMidINR = (label, m) => {
  const b = m.revenueBands.find(([l]) => l === label);
  return b ? toINR(b[1], m) : null;
};
