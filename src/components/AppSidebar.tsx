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
import { useTranslation } from 'react-i18next';

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { state, setOpen, setOpenMobile, isMobile } = useSidebar();
  const { t } = useTranslation();

  const menuItems = [
    { title: t('nav.dashboard'), icon: LayoutDashboard, page: 'dashboard' },
    { title: t('nav.tools'), icon: Wrench, page: 'tools' },
    { title: t('nav.workersProjects'), icon: Users, page: 'workers-projects' },
    { title: t('nav.checkout'), icon: ShoppingCart, page: 'checkout' },
    { title: t('nav.assignments'), icon: ClipboardList, page: 'assignments' },
    { title: t('nav.reports'), icon: FileText, page: 'reports' },
  ];

  const handleNavigation = (page: string) => {
    onNavigate(page);
    if (isMobile) {
      setOpenMobile(false);
    } else {
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
          {/* Logo Section */}
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
    </Sidebar>
  );
}
