import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import BudgetPlanner from "./pages/BudgetPlanner";
import Hotels from "./pages/Hotels";
import Cabs from "./pages/Cabs";
import Food from "./pages/Food";
import Hospitals from "./pages/Hospitals";
import Transport from "./pages/Transport";
import Spots from "./pages/Spots";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Memories from "./pages/Memories";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient();

import { AuthProvider } from "@/context/AuthContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/budget" element={<BudgetPlanner />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/cabs" element={<Cabs />} />
            <Route path="/food" element={<Food />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/transport" element={<Transport />} />
            <Route path="/spots" element={<Spots />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/support" element={<Support />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
