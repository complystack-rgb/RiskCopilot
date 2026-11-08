import { useState } from "react";
import ConsoleLayout from "@/pages/console/ConsoleLayout";
import ConsoleLogin from "@/pages/console/ConsoleLogin";
import { SESSION_KEY } from "@/lib/api";

// Shows the sign-in screen until a session token exists; the backend checks the token on every console call.
export default function ConsoleGate() {
  const [, setTick] = useState(0);
  let signedIn = false;
  try { signedIn = !!localStorage.getItem(SESSION_KEY); } catch (e) { signedIn = false; }
  if (!signedIn) return <ConsoleLogin onSignedIn={() => setTick((t) => t + 1)} />;
  return <ConsoleLayout />;
}
