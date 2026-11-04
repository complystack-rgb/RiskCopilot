import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { money as fmt } from "@/lib/consoleUi";

const Ctx = createContext(null);

export const ConsoleProvider = ({ children }) => {
  const [meta, setMeta] = useState(null);
  const [market, setMarketRaw] = useState(() => localStorage.getItem("cs_market") || "IN");
  const [personaId, setPersonaId] = useState(() => localStorage.getItem("cs_persona_v2") || "ag-ritika");

  const loadMeta = useCallback(() => api.get("/console/meta").then((r) => setMeta(r.data)), []);
  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { localStorage.setItem("cs_market", market); localStorage.setItem("cs_persona_v2", personaId); }, [market, personaId]);

  const personas = useMemo(() => (meta?.agents || []).filter((a) => a.active && a.market === market).map((a) => ({
    ...a, title: `${a.role === "admin" ? "Broker admin" : "Field agent"} · ${meta.orgs.find((o) => o.id === a.org_id)?.name || ""}`,
  })), [meta, market]);

  const persona = personas.find((p) => p.id === personaId) || personas.find((p) => p.role === "admin") || personas[0];
  const setMarket = (m) => { setMarketRaw(m); const admin = meta?.agents.find((a) => a.market === m && a.role === "admin"); if (admin) setPersonaId(admin.id); };
  const scope = !persona ? { market } : persona.role === "admin" ? { market, org_id: persona.org_id } : { market, agent_id: persona.id };
  const orgName = (id) => meta?.orgs.find((o) => o.id === id)?.name || "N/A";
  const agentName = (id) => meta?.agents.find((a) => a.id === id)?.name || "Unassigned";
  const m = meta?.markets[market];
  const money = (n) => fmt(n, market);

  return <Ctx.Provider value={{ meta, loadMeta, market, setMarket, m, money, personas, persona, setPersonaId, scope, orgName, agentName }}>{children}</Ctx.Provider>;
};

export const useConsole = () => useContext(Ctx);
