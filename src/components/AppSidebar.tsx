import { LayoutDashboard, Wrench, Users, ShoppingCart, ClipboardList, FileText, X } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { title: 'Tools Manager', icon: Wrench, page: 'tools' },
  { title: 'Workers & Projects', icon: Users, page: 'workers-projects' },
  { title: 'Checkout', icon: ShoppingCart, page: 'checkout' },
  { title: 'Active Assignments', icon: ClipboardList, page: 'assignments' },
  { title: 'Reports', icon: FileText, page: 'reports' },
];

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar();

  const handleNavigation = (page: string) => {
    onNavigate(page);
    
    // Auto-collapse behavior based on screen size
    if (isMobile) {
      // On mobile: close the overlay sidebar
      setOpenMobile(false);
    } else {
      // On desktop: collapse to icon-only if expanded
      if (state === 'expanded') {
        setOpen(false);
      }
    }
  };

  const handleCloseMobile = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Mobile Close Button */}
        {isMobile && (
          // Position the close button absolutely so it doesn't affect layout flow
          // (prevents the sidebar content from being pushed down on small screens)
          <div className="absolute top-2 right-2 z-50 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseMobile}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        )}

        <SidebarGroup>
          {/* Logo Section - Always show logo icon, hide text when collapsed */}
          <div className="flex items-start gap-2 px-3 pt-2 pb-3 border-b border-border/50 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:items-center">
            <img src="/logo.png" alt="QTools Logo" className="h-8 w-8 flex-shrink-0 min-w-[2rem]" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden transition-opacity duration-200">
              QTools
            </span>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  {/* Desktop: Show tooltip when collapsed */}
                  {!isMobile && state === 'collapsed' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => handleNavigation(item.page)}
                          isActive={currentPage === item.page}
                          className="w-full justify-center"
                        >
                          <item.icon className="h-5 w-5" />
                          <span className="sr-only">{item.title}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    /* Mobile or Desktop Expanded: Show full button */
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.page)}
                      isActive={currentPage === item.page}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Remove SidebarFooter - theme toggle moved to top bar */}
    </Sidebar>
  );
}
