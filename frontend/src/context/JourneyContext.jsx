import { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "complystack_journey_v1";

const DEFAULT_DATA = {
  // Step 1
  market: "IN", regIds: {}, businessName: "", category: "", activity: "", startYear: "", yearNotSure: false,
  country: "India", state: "", city: "", pin: "", address: "", addressLater: false, lat: null, lon: null,
  // Step 2
  headcount: "", payrollBand: "", payrollExact: "", revenueBand: "", revenueExact: "",
  // Step 3
  priorities: [], priorityFollowups: {}, notSureAssets: "", notSureDisruption: "",
  // Step 4
  premisesOwnership: "", locationType: "", extraLocations: [],
  premisesFollowup: "", mainActivities: "", significantMachinery: "", stockOnSite: "", fireProtection: "",
  // Step 5
  hasInsurance: "", insuranceTypes: [], policyMode: "", uploadedPolicies: [],
  manualPolicy: { insurer: "", policyType: "", sumInsured: "", startDate: "", expiryDate: "", premium: "", notes: "" },
  hasClaim: "", claimType: "", claimStatus: "", claimNotes: "",
  ownershipStructure: "", ownerCount: "",
  // Step 6
  premisesMedia: [], machineryPhotos: [],
  machineryDetails: { name: "", manufacturer: "", model: "", serial: "", quantity: "", location: "", year: "", replacementValue: "" },
  evidencePolicyDocs: [],
};

const JourneyContext = createContext(null);

export function JourneyProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_DATA, ...JSON.parse(saved) } : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });
  const [step, setStep] = useState(1);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }));
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setData(DEFAULT_DATA);
    setStep(1);
  }, []);

  return (
    <JourneyContext.Provider value={{ data, update, step, setStep, reset }}>
      {children}
    </JourneyContext.Provider>
  );
}

export const useJourney = () => {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used within JourneyProvider");
  return ctx;
};
