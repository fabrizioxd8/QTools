import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Users, ShoppingCart, ClipboardList, FileText } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

const menuItems = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { title: 'Tools Manager', icon: Wrench, path: '/tools' },
  { title: 'Workers & Projects', icon: Users, path: '/workers-projects' },
  { title: 'Checkout', icon: ShoppingCart, path: '/checkout' },
  { title: 'Active Assignments', icon: ClipboardList, path: '/assignments' },
  { title: 'Reports', icon: FileText, path: '/reports' },
];

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { setOpen } = useSidebar();

  const handleNavigation = (page: string) => {
    onNavigate(page);
    setOpen(false);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
           <div className="flex items-center gap-2 px-3 py-4">
            <img src="/logo.png" alt="QTools Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold">QTools</span>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    onClick={() => handleNavigation(item.page)}
                    isActive={currentPage === item.page}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-center p-2">
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
