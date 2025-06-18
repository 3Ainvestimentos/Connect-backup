
"use client";

import React, { useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
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
import { Home, Newspaper, FolderOpen, MessageCircle, LogOut, UserCircle, Bot } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';

const navItems = [
  { href: '/dashboard', label: 'Painel Inicial', icon: Home },
  { href: '/news', label: 'Feed de Notícias', icon: Newspaper },
  { href: '/documents', label: 'Documentos', icon: FolderOpen },
  { href: '/chatbot', label: 'Chatbot Bob', icon: Bot },
];

function UserNav() {
  const { user, signOut, loading } = useAuth();

  if (loading) return <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />;
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
        <DropdownMenuItem onClick={signOut} className="cursor-pointer font-body">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen: setSidebarOpen } = useSidebar();


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
     return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
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
      <Sidebar collapsible="icon" variant="sidebar" defaultOpen={false}>
        <SidebarHeader className="p-4 border-b border-sidebar-border items-center h-[var(--header-height)]">
          {/* Logo removed from here */}
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
               <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
                  tooltip={{children: item.label, className: "font-body"}}
                  onClick={handleLinkClick}
                  className="font-body"
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border items-center group-data-[collapsible=icon]:justify-center">
            <div className="group-data-[collapsible=icon]:hidden w-full flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-body">© {new Date().getFullYear()} 3A RIVA</p>
            </div>
             <div className="hidden group-data-[collapsible=icon]:block">
                <UserNav />
            </div>
        </SidebarFooter>
      </Sidebar>
      
      <SidebarInset>
        <Header userNav={<UserNav />}/>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-muted/20 min-h-[calc(100vh-var(--header-height))]"> {/* Increased padding */}
          {children}
        </main>
      </SidebarInset>
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
