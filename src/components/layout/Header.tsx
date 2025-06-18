
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  userNav?: React.ReactNode;
}

export function Header({ userNav }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1">
        {/* Optional: Add breadcrumbs or page title here */}
      </div>
      {userNav}
    </header>
  );
}
