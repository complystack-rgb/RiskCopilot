import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { JourneyProvider } from "@/context/JourneyContext";
import Journey from "@/pages/Journey";

function App() {
  return (
    <div className="App">
      <JourneyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Journey />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </JourneyProvider>
    </div>
  );
}

export default App;
