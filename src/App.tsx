import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppDataProvider, useAppData } from '@/contexts/AppDataContext';
import { AppSidebar } from '@/components/AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import Dashboard from '@/pages/Dashboard';
import ToolsManager from '@/pages/ToolsManager';
import WorkersProjects from '@/pages/WorkersProjects';
import CheckoutWizard from '@/pages/CheckoutWizard';
import ActiveAssignments from '@/pages/ActiveAssignments';
import Reports from '@/pages/Reports';
import { Loader2, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AppContent = () => {
  const { isLoading } = useAppData();
  const { toggleSidebar, isMobile } = useSidebar();
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
        {/* Enhanced Top Bar */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            {/* Mobile Layout: Logo + Menu button on left, Theme toggle on right */}
            {isMobile ? (
              <>
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="QTools Logo" className="h-8 w-8" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSidebar}
                    className="h-8 w-8 p-0"
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </div>
                <ThemeToggle />
              </>
            ) : (
              /* Desktop Layout: Menu button on left, Theme toggle on right */
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="h-8 w-8 p-0"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
                <ThemeToggle />
              </>
            )}
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
        <SidebarProvider defaultOpen={false}>
          <AppContent />
        </SidebarProvider>
      </TooltipProvider>
    </AppDataProvider>
  );
};

export default App;
