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
import { Home, Newspaper, FolderOpen, LogOut, UserCircle, Bot, FlaskConical, ShoppingCart, LayoutGrid, Sun, Moon, Laptop, HelpCircle, Settings, Shield, BarChart, Mailbox, Workflow, FileText, ListTodo, Fingerprint, Edit, LayoutDashboard, TestTube2, Briefcase, Target, Banknote, ListChecks, Award, MessageSquarePlus, Compass, NotebookPen, Rss } from 'lucide-react';
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
import { addDocumentToCollection, updateDocumentInCollection } from '@/lib/firestore-service';
import { useApplications } from '@/contexts/ApplicationsContext';
import PollTrigger from '@/components/polls/PollTrigger';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { TermsOfUseModal } from '../auth/TermsOfUseModal';
import NotificationFAB from '../fab/NotificationFAB';
import { useFabMessages } from '@/contexts/FabMessagesContext';
import { DailyRssModal } from '../rss/DailyRssModal';


export const navItems = [
  { href: '/dashboard', label: 'Painel Inicial', icon: Home, external: false, permission: null },
  { href: '/news', label: 'Feed de Notícias', icon: Newspaper, external: false, permission: null },
  { href: '/applications', label: 'Solicitações', icon: Workflow, external: false, permission: null },
  { href: '/documents', label: 'Documentos', icon: FolderOpen, external: false, permission: null },
  { href: '/labs', label: 'Labs', icon: FlaskConical, external: false, permission: null },
  { href: '/rankings', label: 'Rankings e Campanhas', icon: Award, external: false, permission: 'canViewRankings' },
  { href: '/bi', label: 'Business Intelligence', icon: BarChart, external: false, permission: 'canViewBI' },
  { href: 'https://www.store-3ariva.com.br/', label: 'Store', icon: ShoppingCart, external: true, permission: null },
  { href: '/chatbot', label: 'Bob', icon: Bot, external: false, permission: null },
];

function UserNav({ onProfileClick, hasPendingRequests, hasPendingTasks }: { onProfileClick: () => void; hasPendingRequests: boolean; hasPendingTasks: boolean; }) {
  const { user, signOut, loading, isAdmin, isSuperAdmin, permissions } = useAuth();
  const { theme, setTheme } = useTheme();
  const { collaborators } = useCollaborators();

  const currentUserCollaborator = useMemo(() => {
    if (!user) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  if (loading) return <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />;
  if (!user) return null;

  const displayName = currentUserCollaborator?.name || user.displayName;
  const displayEmail = currentUserCollaborator?.email || user.email;
  const displayPhotoUrl = currentUserCollaborator?.photoURL || user.photoURL || undefined;

  const hasTools = permissions.canManageRequests || permissions.canViewTasks || permissions.canViewCRM || permissions.canViewStrategicPanel;
  const hasAdminPanels = permissions.canManageContent || permissions.canManageWorkflows || isSuperAdmin;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={displayPhotoUrl} alt={displayName || "User Avatar"} />
            <AvatarFallback>
              {displayName ? displayName.charAt(0).toUpperCase() : <UserCircle size={24} />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-headline">
              {displayName || "Usuário"}
            </p>
            <p className="text-xs leading-none text-muted-foreground font-body">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
         <DropdownMenuItem onClick={onProfileClick} className="cursor-pointer font-body">
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
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
        
        {hasTools && <DropdownMenuSeparator />}
        
        {hasTools && (
            <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Ferramentas</DropdownMenuLabel>
              {permissions.canManageRequests && (
                <DropdownMenuItem asChild>
                <Link href="/requests" className={cn(
                    "cursor-pointer font-body",
                    hasPendingRequests && "bg-admin-primary/10 text-admin-primary font-bold hover:!bg-admin-primary/20"
                    )}>
                    <Mailbox className="mr-2 h-4 w-4" />
                    <span>Gestão de Solicitações</span>
                    </Link>
                </DropdownMenuItem>
              )}
            {permissions.canViewTasks && (
                <DropdownMenuItem asChild>
                    <Link href="/me/tasks" className={cn(
                        "cursor-pointer font-body",
                        hasPendingTasks && "bg-admin-primary/10 text-admin-primary font-bold hover:!bg-admin-primary/20"
                    )}>
                        <ListTodo className="mr-2 h-4 w-4" />
                        <span>Minhas Tarefas/Ações</span>
                    </Link>
                </DropdownMenuItem>
            )}
            {permissions.canViewCRM && (
                <DropdownMenuItem asChild><Link href="/admin/crm" className="cursor-pointer font-body"><NotebookPen className="mr-2 h-4 w-4" /><span>CRM Interno</span></Link></DropdownMenuItem>
            )}
            {permissions.canViewStrategicPanel && (
                <DropdownMenuItem asChild><Link href="/admin/strategic-panel" className="cursor-pointer font-body"><Target className="mr-2 h-4 w-4" /><span>Painel Estratégico</span></Link></DropdownMenuItem>
            )}
            </DropdownMenuGroup>
        )}
        
        
        {hasAdminPanels && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Painéis de controle</DropdownMenuLabel>
                {permissions.canManageContent && <DropdownMenuItem asChild><Link href="/admin/content" className="cursor-pointer font-body"><Edit className="mr-2 h-4 w-4" /><span>Conteúdo</span></Link></DropdownMenuItem>}
                {isSuperAdmin && <DropdownMenuItem asChild><Link href="/admin/fab-messages" className="cursor-pointer font-body"><MessageSquarePlus className="mr-2 h-4 w-4" /><span>Mensagens FAB</span></Link></DropdownMenuItem>}
                {permissions.canManageWorkflows && <DropdownMenuItem asChild><Link href="/admin/workflows" className="cursor-pointer font-body"><Workflow className="mr-2 h-4 w-4" /><span>Workflows</span></Link></DropdownMenuItem>}
                {isSuperAdmin && (
                  <>
                     <DropdownMenuItem asChild><Link href="/dra/pagamentos" className="cursor-pointer font-body text-destructive focus:bg-destructive/10 focus:text-destructive"><Banknote className="mr-2 h-4 w-4" /><span>Custos/Infraestrutura</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/audit" className="cursor-pointer font-body text-destructive focus:bg-destructive/10 focus:text-destructive"><Fingerprint className="mr-2 h-4 w-4" /><span>Auditoria</span></Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/admin" className="cursor-pointer font-body text-destructive focus:bg-destructive/10 focus:text-destructive"><Shield className="mr-2 h-4 w-4" /><span>Sistema</span></Link></DropdownMenuItem>
                  </>
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
  const { user, loading, signOut, permissions, isSuperAdmin } = useAuth();
  const { collaborators, loading: collaboratorsLoading } = useCollaborators();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { theme, setTheme } = useTheme();
  const { requests, loading: workflowsLoading } = useWorkflows();
  const { fabMessages } = useFabMessages();
  const { workflowDefinitions } = useApplications();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen: setSidebarOpen } = useSidebar();
  
  const isFullscreenPage = ['/chatbot', '/admin/crm', '/admin/strategic-panel', '/dra/pagamentos'].includes(pathname);
  
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const currentUserCollab = useMemo(() => {
    if (!user) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  const hasActiveCampaign = useMemo(() => {
    if (!currentUserCollab) return false;
    const messageForUser = fabMessages.find(msg => msg.userId === currentUserCollab.id3a);
    return messageForUser && (messageForUser.status === 'pending_cta' || messageForUser.status === 'pending_follow_up');
  }, [fabMessages, currentUserCollab]);


  useEffect(() => {
    if (loading || collaboratorsLoading || settingsLoading || isSuperAdmin) return;
    
    if (currentUserCollab) {
      const userTermsVersion = currentUserCollab.acceptedTermsVersion || 0;
      if (userTermsVersion < settings.termsVersion) {
        setShowTermsModal(true);
      }
    }
  }, [currentUserCollab, settings.termsVersion, loading, collaboratorsLoading, settingsLoading, isSuperAdmin]);
  
  const handleAcceptTerms = async () => {
    if (!currentUserCollab) return false;
    try {
        await updateDocumentInCollection('collaborators', currentUserCollab.id, {
            acceptedTermsVersion: settings.termsVersion
        });
        setShowTermsModal(false);
        toast({ title: "Termos aceitos!", description: "Obrigado! Você já pode acessar a plataforma."});
        return true;
    } catch(e) {
        toast({ title: "Erro", description: "Não foi possível salvar sua confirmação. Tente novamente.", variant: 'destructive'});
        return false;
    }
  };

  const handleDeclineTerms = () => {
      signOut();
  };

  const hasPendingRequests = useMemo(() => {
    if (!user || workflowsLoading || !requests.length || !permissions.canManageRequests) return false;
    
    const currentUserCollab = collaborators.find(c => c.email === user?.email);
    if (!currentUserCollab) return false;

    return requests.some(req => {
        if (req.isArchived) return false;
        
        const isOwnerWithUnassignedTask = (req.ownerEmail === user.email) && !req.assignee;
        
        return isOwnerWithUnassignedTask;
    });
  }, [user, requests, workflowsLoading, permissions.canManageRequests, collaborators]);
  
  const hasPendingTasks = useMemo(() => {
    if (!user || workflowsLoading || !requests.length) return false;
    const currentUserCollab = collaborators.find(c => c.email === user.email);
    if (!currentUserCollab) return false;
    
    const hasNewTask = requests.some(req => {
      if (req.isArchived || req.assignee?.id !== currentUserCollab.id3a) {
        return false;
      }
      const definition = workflowDefinitions.find(d => d.name === req.type);
      if (!definition || !definition.statuses || definition.statuses.length === 0) {
        return false;
      }
      const initialStatusId = definition.statuses[0].id;
      return req.status === initialStatusId;
    });

    if(hasNewTask) return true;

    const hasActionRequest = requests.some(req => {
      if (req.isArchived) return false;
      const actionRequestsForStatus = req.actionRequests?.[req.status] || [];
      return actionRequestsForStatus.some(
        ar => ar.userId === currentUserCollab.id3a && ar.status === 'pending'
      );
    });

    return hasActionRequest;
  }, [user, requests, workflowsLoading, collaborators, workflowDefinitions]);


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

      const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
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
    <div className="flex min-h-screen flex-col">
      <Header userNav={<UserNav onProfileClick={() => setIsProfileModalOpen(true)} hasPendingRequests={hasPendingRequests} hasPendingTasks={hasPendingTasks} />} showSidebarTrigger={!isFullscreenPage} showDashboardButton={isFullscreenPage} />
      <div className="flex flex-1"> 
        {!isFullscreenPage && (
          <Sidebar collapsible="icon" variant="sidebar"> 
            <SidebarContent className="flex-1 p-2">
              <SidebarMenu>
                {navItems.map((item) => {
                  if (item.permission && !permissions[item.permission as keyof typeof permissions]) {
                    return null;
                  }
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={!item.external && (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))}
                        tooltip={{children: item.label, className: "font-body"}}
                        onClick={handleLinkClick}
                        className="font-body"
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
                  <SidebarMenuButton onClick={signOut} tooltip={{ children: "Sair", className: "font-body" }} className="font-body">
                    <LogOut />
                    <span>Sair</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
        )}
        <main className={cn("flex-1", !isFullscreenPage && "md:ml-[var(--sidebar-width-icon)]")}>
          {children}
            <NotificationFAB hasPendingRequests={hasPendingRequests} hasPendingTasks={hasPendingTasks} />
        </main>
      </div>
      <PollTrigger />
      <DailyRssModal forceOpen={false} />
      <FAQModal open={isFaqModalOpen} onOpenChange={setIsFaqModalOpen} />
      <ProfileModal open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen} />
      <TermsOfUseModal
        isOpen={showTermsModal}
        termsUrl={settings.termsUrl}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />
    </div>
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
