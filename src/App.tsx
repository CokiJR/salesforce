
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuthentication";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";
import Index from "@/pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/dashboard" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<div className="p-4 animate-fade-in">Customers page coming soon</div>} />
              <Route path="products" element={<div className="p-4 animate-fade-in">Products page coming soon</div>} />
              <Route path="orders" element={<div className="p-4 animate-fade-in">Orders page coming soon</div>} />
              <Route path="routes" element={<div className="p-4 animate-fade-in">Routes page coming soon</div>} />
              <Route path="admin" element={<div className="p-4 animate-fade-in">Admin page coming soon</div>} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
