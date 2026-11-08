import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { JourneyProvider } from "@/context/JourneyContext";
import Journey from "@/pages/Journey";
import Landing from "@/pages/Landing";
import ConsoleLayout from "@/pages/console/ConsoleLayout";
import Overview from "@/pages/console/Overview";
import Cases from "@/pages/console/Cases";
import CaseDetail from "@/pages/console/CaseDetail";
import Team from "@/pages/console/Team";
import DeveloperPortal from "@/pages/console/DeveloperPortal";

function App() {
  return (
    <div className="App">
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/in" replace />} />
            <Route path="/quote" element={<Navigate to="/in/quote" replace />} />
            <Route path="/console" element={<ConsoleLayout />}>
              <Route index element={<Overview />} />
              <Route path="cases" element={<Cases />} />
              <Route path="cases/:id" element={<CaseDetail />} />
              <Route path="team" element={<Team />} />
              <Route path="developers" element={<DeveloperPortal />} />
            </Route>
            <Route path="/:market" element={<Landing />} />
            <Route path="/:market/quote" element={<Journey />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </JourneyProvider>
    </div>
  );
}

export default App;
