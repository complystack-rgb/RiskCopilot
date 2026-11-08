import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { JourneyProvider } from "@/context/JourneyContext";
import Journey from "@/pages/Journey";
import Landing from "@/pages/Landing";
import ConsoleGate from "@/pages/console/ConsoleGate";
import Overview from "@/pages/console/Overview";
import Cases from "@/pages/console/Cases";
import CaseDetail from "@/pages/console/CaseDetail";
import Team from "@/pages/console/Team";
import DevLayout from "@/pages/console/dev/DevLayout";
import DevHome from "@/pages/console/dev/DevHome";
import DevModule from "@/pages/console/dev/DevModule";
import DevAuth from "@/pages/console/dev/DevAuth";
import DevWebhooks from "@/pages/console/dev/DevWebhooks";
import DevExplorer from "@/pages/console/dev/DevExplorer";
import { DevSdks, DevErrors, DevChangelog } from "@/pages/console/dev/DevGuides";

function App() {
  return (
    <div className="App">
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/in" replace />} />
            <Route path="/quote" element={<Navigate to="/in/quote" replace />} />
            <Route path="/console" element={<ConsoleGate />}>
              <Route index element={<Overview />} />
              <Route path="cases" element={<Cases />} />
              <Route path="cases/:id" element={<CaseDetail />} />
              <Route path="team" element={<Team />} />
              <Route path="developers" element={<DevLayout />}>
                <Route index element={<DevHome />} />
                <Route path="authentication" element={<DevAuth />} />
                <Route path="sdks" element={<DevSdks />} />
                <Route path="webhooks" element={<DevWebhooks />} />
                <Route path="errors" element={<DevErrors />} />
                <Route path="explorer" element={<DevExplorer />} />
                <Route path="changelog" element={<DevChangelog />} />
                <Route path="modules/:id" element={<DevModule />} />
              </Route>
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
