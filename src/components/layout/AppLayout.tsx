
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Header } from './Header';
import Link from 'next/link';
import { Home, Newspaper, FolderOpen, LogOut, UserCircle, Bot, FlaskConical, ShoppingCart, LayoutGrid, Sun, Moon, Laptop, HelpCircle, Settings, Shield, BarChart, Mailbox, Workflow, FileText, ListTodo, Fingerprint } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import FAQModal from '@/components/guides/FAQModal';
import ProfileModal from '../applications/ProfileModal';
import { useWorkflows } from '@/contexts/WorkflowsContext';
import { toast } from '@/hooks/use-toast';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { addDocumentToCollection } from '@/lib/firestore-service';


const navItems = [
  { href: '/dashboard', label: 'Painel Inicial', icon: Home, external: false },
  { href: '/news', label: 'Feed de Notícias', icon: Newspaper, external: false },
  { href: '/applications', label: 'Solicitações', icon: Workflow, external: false },
  { href: '/documents', label: 'Documentos', icon: FolderOpen, external: false },
  { href: '/labs', label: 'Labs', icon: FlaskConical, external: false },
  { href: 'https://www.store-3ariva.com.br/', label: 'Store', icon: ShoppingCart, external: true },
  { href: '/chatbot', label: 'Bob', icon: Bot, external: false },
  { href: '/bi', label: 'Business Intelligence', icon: BarChart, external: false, requiredEmail: 'matheus@3ainvestimentos.com.br' },
];

function UserNav({ onProfileClick, hasPendingRequests, hasNewAssignedTasks }: { onProfileClick: () => void; hasPendingRequests: boolean; hasNewAssignedTasks: boolean; }) {
  const { user, signOut, loading, isAdmin, isSuperAdmin, permissions } = useAuth();
  const { theme, setTheme } = useTheme();

  if (loading) return <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />;
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn(
          "relative h-10 w-10 rounded-full p-0 transition-all duration-300",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          hasPendingRequests && "ring-2 ring-offset-2 ring-offset-header-DEFAULT ring-destructive",
          hasNewAssignedTasks && "ring-2 ring-offset-2 ring-offset-header-DEFAULT ring-admin-primary"
        )}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} />
            <AvatarFallback>
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle size={24} />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">
              {user.displayName || "Usuário"}
            </p>
            <p className="text-xs leading-none text-muted-foreground font-body">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer font-body">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
        </DropdownMenuItem>
        {permissions.canViewTasks && (
            <DropdownMenuItem asChild>
                <Link href="/me/tasks" className={cn(
                  "cursor-pointer font-body",
                  hasNewAssignedTasks && "bg-admin-primary/10 text-admin-primary font-bold hover:!bg-admin-primary/20"
                )}>
                    <ListTodo className="mr-2 h-4 w-4" />
                    <span>Minhas Tarefas</span>
                </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
           <Link href="/requests" className={cn(
              "cursor-pointer font-body",
              hasPendingRequests && "bg-destructive/10 text-destructive font-bold hover:!bg-destructive/20"
            )}>
              <Mailbox className="mr-2 h-4 w-4" />
              <span>Caixa de Entrada</span>
            </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
                {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                <span>Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
                <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
                        <DropdownMenuRadioItem value="light">
                            <Sun className="mr-2 h-4 w-4" />
                            <span>Claro</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                            <Moon className="mr-2 h-4 w-4" />
                            <span>Escuro</span>
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
        
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Painéis de controle</DropdownMenuLabel>
                {permissions.canManageWorkflows && <DropdownMenuItem asChild><Link href="/admin/workflows" className="cursor-pointer font-body text-destructive focus:bg-destructive/10 focus:text-destructive"><Workflow className="mr-2 h-4 w-4" /><span>Workflows</span></Link></DropdownMenuItem>}
                {isSuperAdmin && <DropdownMenuItem asChild><Link href="/audit" className="cursor-pointer font-body text-destructive focus:bg-destructive/10 focus:text-destructive"><Fingerprint className="mr-2 h-4 w-4" /><span>Auditoria</span></Link></DropdownMenuItem>}
                {isSuperAdmin && (
                    <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer font-body text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Sistema</span>
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer font-body">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, permissions } = useAuth();
  const { collaborators } = useCollaborators();
  const { theme, setTheme } = useTheme();
  const { requests, hasNewAssignedTasks, loading: workflowsLoading } = useWorkflows();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen: setSidebarOpen } = useSidebar();
  const isChatbotPage = pathname === '/chatbot';
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const hasPendingRequests = useMemo(() => {
    if (!user || workflowsLoading || !requests.length || !permissions.canManageRequests) return false;
    
    // Check if there's any request for a workflow the user owns that is unassigned and not yet viewed by them.
    const currentUserCollab = collaborators.find(c => c.email === user.email);
    if (!currentUserCollab) return false;

    return requests.some(req => 
      req.ownerEmail === user.email && !req.assignee && !req.viewedBy.includes(currentUserCollab.id3a)
    );
  }, [user, requests, workflowsLoading, permissions.canManageRequests, collaborators]);

  // Page view logging
  useEffect(() => {
    if (user && pathname) {
        const currentUserCollab = collaborators.find(c => c.email === user.email);
        if (currentUserCollab) {
            addDocumentToCollection('audit_logs', {
                eventType: 'page_view',
                userId: currentUserCollab.id3a,
                userName: currentUserCollab.name,
                timestamp: new Date().toISOString(),
                details: {
                    path: pathname,
                }
            }).catch(console.error); // Log silently without disturbing user
        }
    }
  }, [pathname, user, collaborators]);


  // Inactivity Logout Logic
  const handleSignOut = useCallback(() => {
    signOut().then(() => {
        toast({
            title: "Sessão Expirada",
            description: "Você foi desconectado por inatividade. Por favor, faça login novamente.",
        });
    });
  }, [signOut]);

  useEffect(() => {
      if (typeof window === 'undefined') return;

      const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
      let inactivityTimer: NodeJS.Timeout;

      const resetTimer = () => {
          clearTimeout(inactivityTimer);
          inactivityTimer = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
      };

      const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
      activityEvents.forEach(event => window.addEventListener(event, resetTimer));

      resetTimer(); // Initialize timer

      return () => {
          clearTimeout(inactivityTimer);
          activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
      };
  }, [handleSignOut]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
     return (
        <div className="flex h-screen w-screen items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
     );
  }
  
  const handleLinkClick = () => {
    if (window.innerWidth < 768) { // md breakpoint from tailwind
        setSidebarOpen(false);
    }
  };


  return (
    <>
      <Header userNav={<UserNav onProfileClick={() => setIsProfileModalOpen(true)} hasPendingRequests={hasPendingRequests} hasNewAssignedTasks={hasNewAssignedTasks} />} showSidebarTrigger={!isChatbotPage} showDashboardButton={isChatbotPage} />
      <div className="flex flex-1 w-full"> 
        {!isChatbotPage && (
          <Sidebar collapsible="icon" variant="sidebar"> 
            <SidebarContent className="flex-1 p-2">
              <SidebarMenu>
                {navItems.map((item) => {
                  if (item.requiredEmail && user.email !== item.requiredEmail) {
                    return null;
                  }
                  
                  const isTestItem = item.label === 'Business Intelligence';

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={!item.external && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))}
                        tooltip={{children: item.label, className: "font-body"}}
                        onClick={handleLinkClick}
                        className={cn("font-body", { "text-red-500 hover:bg-red-500/10 hover:text-red-600 data-[active=true]:bg-red-500 data-[active=true]:text-white": isTestItem })}
                      >
                       <Link
                          href={item.href}
                          {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-2 mt-auto">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={{ children: "Guias e FAQ", className: "font-body" }}
                    onClick={() => {
                        handleLinkClick();
                        setIsFaqModalOpen(true);
                    }}
                    className="font-body"
                  >
                    <HelpCircle />
                    <span>Guias e FAQ</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton tooltip={{ children: "Configurações", className: "font-body" }} className="font-body w-full justify-start">
                        <Settings />
                        <span>Configurações</span>
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-56 mb-2">
                      <DropdownMenuLabel>Tema</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as "light" | "dark")}>
                        <DropdownMenuRadioItem value="light">
                          <Sun className="mr-2 h-4 w-4" />
                          <span>Claro</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                          <Moon className="mr-2 h-4 w-4" />
                          <span>Escuro</span>
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton onClick={signOut} tooltip={{ children: "Sair", className: "font-body" }} className="font-body">
                    <LogOut />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        )}
        
        <SidebarInset>
          {children}
        </SidebarInset>
      </div>
      <FAQModal open={isFaqModalOpen} onOpenChange={setIsFaqModalOpen} />
      <ProfileModal open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
    </>
  );
}


// Main AppLayout component that wraps SidebarProvider
export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}> 
      <AppLayout>{children}</AppLayout>
    </SidebarProvider>
  )
}
