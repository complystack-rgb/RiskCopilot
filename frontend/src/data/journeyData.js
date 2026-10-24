// Central configuration for the ComplyStack SME discovery journey.
// Kept data-driven so categories, subcategories and options can be extended later.

export const CATEGORIES = [
  { id: "manufacturing", label: "Manufacturing", icon: "Factory" },
  { id: "retail", label: "Retail", icon: "Store" },
  { id: "wholesale", label: "Wholesale and distribution", icon: "PackageOpen" },
  { id: "trading", label: "Trading and import/export", icon: "Ship" },
  { id: "construction", label: "Construction and contracting", icon: "HardHat" },
  { id: "professional", label: "Professional services", icon: "Briefcase" },
  { id: "it", label: "IT and technology", icon: "Cpu" },
  { id: "hospitality", label: "Hospitality and food services", icon: "UtensilsCrossed" },
  { id: "healthcare", label: "Healthcare and wellness", icon: "HeartPulse" },
  { id: "transport", label: "Transport and logistics", icon: "Truck" },
  { id: "agriculture", label: "Agriculture and allied activities", icon: "Wheat" },
  { id: "realestate", label: "Real estate and property management", icon: "Building2" },
  { id: "repair", label: "Repair and maintenance", icon: "Wrench" },
  { id: "education", label: "Education and training", icon: "GraduationCap" },
  { id: "other", label: "Other", icon: "CircleEllipsis" },
];

const o = (arr) => [...arr, "Other", "Not sure"];

export const SUBCATEGORIES = {
  manufacturing: o(["Textiles and garments", "Food processing", "Metal products", "Chemicals", "Furniture", "Electronics", "Plastics", "Machinery"]),
  retail: o(["Grocery", "Clothing", "Electronics", "Furniture", "Building materials", "Pharmacy"]),
  wholesale: o(["Food and beverages", "Textiles", "Industrial supplies", "Electronics", "Building materials"]),
  trading: o(["Import", "Export", "Domestic trading", "Commission agent"]),
  construction: o(["Residential construction", "Commercial construction", "Civil works", "Electrical contracting", "Plumbing", "Interior fit-outs"]),
  professional: o(["Consulting", "Accounting", "Legal services", "Marketing", "Design"]),
  it: o(["Software development", "IT services", "Hardware", "Cloud services"]),
  hospitality: o(["Restaurant", "Café", "Catering", "Hotel", "Bakery", "Food production"]),
  healthcare: o(["Clinic", "Diagnostic centre", "Pharmacy", "Healthcare services"]),
  transport: o(["Road freight", "Warehousing", "Courier", "Passenger transport", "Fleet operations"]),
  agriculture: o(["Farming", "Dairy", "Poultry", "Food processing", "Agricultural trading"]),
  realestate: o(["Property management", "Brokerage", "Development", "Leasing"]),
  repair: o(["Vehicle repair", "Appliance repair", "Equipment maintenance", "General repair"]),
  education: o(["Coaching centre", "Vocational training", "School", "Online education"]),
  other: o([]),
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman and Nicobar Islands",
];

export const HEADCOUNT_OPTIONS = ["Just me", "2–5", "6–10", "11–20", "21–50", "51–100", "More than 100", "Not sure"];

export const PAYROLL_BANDS = [
  "No employees / no payroll", "Below ₹5 lakh", "₹5–15 lakh", "₹15–50 lakh",
  "₹50 lakh–₹1 crore", "₹1–5 crore", "Above ₹5 crore", "Not sure",
];

// Note: "Below ₹10 lakh" and "₹10–50 lakh" removed per requirement.
export const REVENUE_BANDS = [
  "₹50 lakh–₹1 crore", "₹1–5 crore", "₹5–25 crore", "₹25–50 crore", "Above ₹50 crore", "Not sure",
];

export const PRIORITIES = [
  { id: "premises", title: "Premises and buildings", desc: "The space where my business operates.", icon: "Building2" },
  { id: "machinery", title: "Machinery and equipment", desc: "The equipment I need to operate or produce goods.", icon: "Cog" },
  { id: "stock", title: "Stock and materials", desc: "Inventory, raw materials, or finished products.", icon: "Boxes" },
  { id: "assets", title: "Furniture, electronics and other assets", desc: "Computers, furniture, tools and business equipment.", icon: "Laptop" },
  { id: "continuity", title: "Business income and continuity", desc: "The financial impact if operations stop.", icon: "TrendingDown" },
  { id: "employees", title: "Employees", desc: "Employee-related risks and obligations.", icon: "Users" },
  { id: "thirdparty", title: "Customers, suppliers and third parties", desc: "Responsibilities arising from business activities.", icon: "Handshake" },
  { id: "vehicles", title: "Vehicles and goods in transit", desc: "Business vehicles or goods being transported.", icon: "Truck" },
  { id: "notsure", title: "I'm not sure", desc: "Help me identify what matters.", icon: "HelpCircle" },
];

// Conditional follow-up per priority id.
export const PRIORITY_FOLLOWUPS = {
  premises: { q: "Do you own, rent, or share the premises?", options: ["Own", "Rent", "Share", "Not sure"] },
  machinery: { q: "Does your business depend on specific machinery or equipment to operate?", options: ["Yes, critical", "Somewhat", "No", "Not sure"] },
  stock: { q: "Where do you keep stock or raw materials?", options: ["At premises", "In a warehouse", "Multiple locations", "Not sure"] },
  continuity: { q: "If operations stopped unexpectedly, would your revenue stop while expenses continued?", options: ["Yes", "Partly", "No", "Not sure"] },
  employees: { q: "Do you employ staff directly?", options: ["Yes", "No", "Not sure"] },
  vehicles: { q: "Does your business own vehicles or regularly transport goods?", options: ["Owns vehicles", "Transports goods", "Both", "Neither", "Not sure"] },
};

export const PREMISES_OWNERSHIP = [
  "Owned by the business", "Owned personally by the owner", "Rented or leased", "Shared premises",
  "Home-based business", "No fixed premises", "Other", "Not sure",
];

export const LOCATION_TYPES = ["One location", "Multiple locations", "No fixed location", "Not sure"];

export const INSURANCE_TYPES = [
  "Property or fire insurance", "Machinery or equipment insurance", "Stock or inventory insurance",
  "Business interruption or loss of profit", "Public liability", "Product liability",
  "Employee-related insurance", "Commercial vehicle insurance", "Marine cargo or goods-in-transit insurance",
  "Professional indemnity", "Cyber insurance", "Other", "Not sure",
];

export const CLAIM_STATUSES = ["Settled", "Rejected", "Pending", "Withdrawn", "Other", "Not sure"];

export const OWNERSHIP_STRUCTURES = [
  "Sole proprietorship", "Partnership", "Limited Liability Partnership (LLP)",
  "Private Limited Company", "Public Limited Company", "Other", "Not sure",
];

export const OWNER_COUNTS = ["One", "Two", "Three to five", "More than five", "Not sure"];

export const STEPS = [
  { n: 1, title: "Your business", short: "Business" },
  { n: 2, title: "Business size", short: "Size" },
  { n: 3, title: "Protection priorities", short: "Priorities" },
  { n: 4, title: "Premises & operations", short: "Premises" },
  { n: 5, title: "Existing insurance", short: "Insurance" },
  { n: 6, title: "Evidence", short: "Evidence" },
  { n: 7, title: "Protection summary", short: "Summary" },
];

export const currentYears = () => {
  const y = new Date().getFullYear();
  return Array.from({ length: 75 }, (_, i) => String(y - i));
};
