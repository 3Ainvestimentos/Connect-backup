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
    <header className="sticky top-0 z-50 flex h-[var(--header-height)] w-full items-center gap-x-4 bg-header text-header-foreground px-4 md:px-6">
      {/* Sidebar Trigger for mobile, hidden on md+ */}
      <SidebarTrigger className="md:hidden text-header-foreground/80 hover:text-header-foreground" />

      {/* Logo Section */}
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="https://i.ibb.co/7jZ6bJd/logo-oficial-branca.png"
            alt="Logo 3A RIVA Hub" 
            width={135} 
            height={30} 
            priority 
          />
        </Link>
      </div>

      {/* Search Bar - takes remaining space and centers its content */}
      <div className="flex-1 flex justify-center px-2 sm:px-4">
        <div className="relative w-full max-w-lg"> {/* Adjusted max-width */}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-header-foreground/60" />
          <Input
            type="search"
            placeholder="Pesquisar..."
            className="w-full rounded-lg border-transparent bg-header-foreground/10 pl-10 pr-4 py-2 text-sm text-header-foreground placeholder:text-header-foreground/60 focus:border-primary focus:bg-header-foreground/20 font-body"
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
