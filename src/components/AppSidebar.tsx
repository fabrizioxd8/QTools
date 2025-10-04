import { LayoutDashboard, Wrench, Users, ShoppingCart, ClipboardList, FileText } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

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
