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

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex">
      <SidebarContent>
        <SidebarGroup>
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-4">
            <img src="/logo.png" alt="QTools Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold">QTools</span>
          </Link>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <Link to={item.path}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.path}
                      tooltip={item.title}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
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
