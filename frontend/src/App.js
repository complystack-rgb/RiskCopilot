import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { JourneyProvider } from "@/context/JourneyContext";
import Journey from "@/pages/Journey";
import Landing from "@/pages/Landing";
import ConsoleLayout from "@/pages/console/ConsoleLayout";
import Overview from "@/pages/console/Overview";
import Cases from "@/pages/console/Cases";
import CaseDetail from "@/pages/console/CaseDetail";
import Oversight from "@/pages/console/Oversight";
import Team from "@/pages/console/Team";
import Cyber from "@/pages/console/Cyber";

function App() {
  return (
    <div className="App">
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quote" element={<Journey />} />
            <Route path="/console" element={<ConsoleLayout />}>
              <Route index element={<Overview />} />
              <Route path="cases" element={<Cases />} />
              <Route path="cases/:id" element={<CaseDetail />} />
              <Route path="oversight" element={<Oversight />} />
              <Route path="team" element={<Team />} />
              <Route path="cyber" element={<Cyber />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </JourneyProvider>
    </div>
  );
}

export default App;
