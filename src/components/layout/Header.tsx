"use client";

import Link from 'next/link';
import { Search } from 'lucide-react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from '@/components/ui/input';
import Image from 'next/image';

interface HeaderProps {
  userNav?: React.ReactNode;
}

export function Header({ userNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-60 flex h-[var(--header-height)] w-full items-center gap-x-4 border-b bg-card px-4 md:px-6 shadow-sm">
      {/* Sidebar Trigger for mobile, hidden on md+ */}
      <SidebarTrigger className="md:hidden" />

      {/* Logo Section */}
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="https://i.ibb.co/C52yDwLk/logo-oficial-preta.png" 
            alt="3A RIVA Hub Logo" 
            width={142} 
            height={32} 
            priority 
          />
        </Link>
      </div>

      {/* Search Bar - takes remaining space and centers its content */}
      <div className="flex-1 flex justify-center px-2 sm:px-4">
        <div className="relative w-full max-w-lg"> {/* Adjusted max-width */}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar..."
            className="w-full rounded-lg bg-muted/30 pl-10 pr-4 py-2 text-sm border-border focus:bg-card focus:border-primary font-body"
            aria-label="Barra de pesquisa"
          />
        </div>
      </div>

      {/* User Navigation */}
      <div className="flex items-center">
        {userNav}
      </div>
    </header>
  );
}
