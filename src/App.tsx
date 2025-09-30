import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import Dashboard from '@/pages/Dashboard';
import ToolsManager from '@/pages/ToolsManager';
import WorkersProjects from '@/pages/WorkersProjects';
import CheckoutWizard from '@/pages/CheckoutWizard';
import ActiveAssignments from '@/pages/ActiveAssignments';
import Reports from '@/pages/Reports';

const App = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'tools':
        return <ToolsManager />;
      case 'workers-projects':
        return <WorkersProjects />;
      case 'checkout':
        return <CheckoutWizard onNavigate={setCurrentPage} />;
      case 'assignments':
        return <ActiveAssignments />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
            
            <div className="flex-1 flex flex-col">
              {/* Mobile header with trigger */}
              <header className="lg:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center justify-between px-4">
                  <div className="flex items-center">
                    <SidebarTrigger />
                    <h1 className="ml-4 text-lg font-semibold">QTools</h1>
                  </div>
                  <ThemeToggle />
                </div>
              </header>

              {/* Main content */}
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-6">
                  {renderPage()}
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </TooltipProvider>
    </AppDataProvider>
  );
};

export default App;
