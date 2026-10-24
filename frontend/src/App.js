import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { JourneyProvider } from "@/context/JourneyContext";
import Journey from "@/pages/Journey";
import Landing from "@/pages/Landing";

function App() {
  return (
    <div className="App">
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quote" element={<Journey />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </JourneyProvider>
    </div>
  );
}

export default App;
