import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LangLayout } from "./components/LangLayout";
import Index from "./pages/Index";
import AuditForm from "./pages/AuditForm";
import Loading from "./pages/Loading";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/:lang?" element={<LangLayout />}>
            <Route index element={<Index />} />
            <Route path="audit" element={<AuditForm />} />
            <Route path="generating" element={<Loading />} />
            <Route path="report/:auditId" element={<Report />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
