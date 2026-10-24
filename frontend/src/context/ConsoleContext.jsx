import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";

const Ctx = createContext(null);
const KEY = "complystack_persona_v1";
const INSURER = { id: "insurer", role: "insurer", name: "Zurich Underwriting", title: "Insurer · Underwriter" };

export const ConsoleProvider = ({ children }) => {
  const [meta, setMeta] = useState(null);
  const [personaId, setPersonaId] = useState(() => localStorage.getItem(KEY) || "insurer");

  const loadMeta = useCallback(() => api.get("/console/meta").then((r) => setMeta(r.data)), []);
  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { localStorage.setItem(KEY, personaId); }, [personaId]);

  const personas = useMemo(() => {
    if (!meta) return [INSURER];
    const org = (id) => meta.orgs.find((o) => o.id === id);
    return [INSURER, ...meta.agents.filter((a) => a.active).map((a) => ({
      id: a.id, role: a.role, name: a.name, org_id: a.org_id, agent_id: a.role === "agent" ? a.id : undefined,
      title: `${a.role === "admin" ? "Distributor admin" : "Field agent"} · ${org(a.org_id)?.name || ""}`,
    }))];
  }, [meta]);

  const persona = personas.find((p) => p.id === personaId) || INSURER;
  const scope = persona.role === "insurer" ? {} : persona.role === "admin" ? { org_id: persona.org_id } : { agent_id: persona.agent_id };
  const orgName = (id) => meta?.orgs.find((o) => o.id === id)?.name || "—";
  const agentName = (id) => meta?.agents.find((a) => a.id === id)?.name || "Unassigned";

  return <Ctx.Provider value={{ meta, loadMeta, personas, persona, setPersonaId, scope, orgName, agentName }}>{children}</Ctx.Provider>;
};

export const useConsole = () => useContext(Ctx);
