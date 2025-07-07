
"use client";

import Link from 'next/link';
import { SidebarTrigger } from "@/components/ui/sidebar";
import Image from 'next/image';
import { Button } from '../ui/button';

interface HeaderProps {
  userNav?: React.ReactNode;
  showSidebarTrigger?: boolean;
  showDashboardButton?: boolean;
}

export function Header({ userNav, showSidebarTrigger = true, showDashboardButton = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-[var(--header-height)] w-full items-center gap-x-4 bg-header text-header-foreground px-4 md:px-6">
      {/* Sidebar Trigger for mobile, hidden on md+ */}
      {showSidebarTrigger && (
        <SidebarTrigger className="md:hidden text-header-foreground/80 hover:text-header-foreground" />
      )}

      {/* Logo Section */}
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="https://firebasestorage.googleapis.com/v0/b/a-riva-hub.firebasestorage.app/o/Imagens%20institucionais%20(logos%20e%20etc)%2Flogo_oficial_branca.png?alt=media&token=329d139b-cca1-4aed-95c7-a699fa32f0bb"
            alt="Logo 3A RIVA Hub" 
            width={135} 
            height={30} 
            priority 
          />
        </Link>
      </div>

      {/* Spacer to push user nav to the right */}
      <div className="flex-1" />

      {/* User Navigation */}
      <div className="flex items-center gap-4">
        {showDashboardButton && (
          <Button asChild variant="ghost" className="font-body text-header-foreground/80 hover:bg-transparent hover:font-bold hover:text-header-foreground/80">
            <Link href="/dashboard">Painel Inicial</Link>
          </Button>
        )}
        {userNav}
      </div>
    </header>
  );
}
