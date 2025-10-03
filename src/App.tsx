import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppDataProvider, useAppData } from '@/contexts/AppDataContext';
import { AppSidebar } from '@/components/AppSidebar';
import Dashboard from '@/pages/Dashboard';
import ToolsManager from '@/pages/ToolsManager';
import WorkersProjects from '@/pages/WorkersProjects';
import CheckoutWizard from '@/pages/CheckoutWizard';
import ActiveAssignments from '@/pages/ActiveAssignments';
import Reports from '@/pages/Reports';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { isLoading } = useAppData();

  const [currentPage, setCurrentPage] = useState('dashboard');


  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center">
              <SidebarTrigger />
              <Link to="/dashboard" className="flex items-center gap-2 ml-4">
                <img src="/logo.png" alt="QTools Logo" className="h-7 w-auto" />
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tools" element={<ToolsManager />} />
              <Route path="/workers-projects" element={<WorkersProjects />} />
              <Route path="/checkout" element={<CheckoutWizard />} />
              <Route path="/assignments" element={<ActiveAssignments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="lg:hidden">
              <SidebarTrigger />
            </div>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-4" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </TooltipProvider>
    </AppDataProvider>
  );
};

export default App;
