
"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";

export default function BobV2Page() {
  const { setOpen } = useSidebar();

  // Ensure sidebar is managed by this page's hover logic
  useEffect(() => {
    // Set initial state
    setOpen(false);
    
    // Cleanup when leaving the page
    return () => setOpen(true);
  }, [setOpen]);

  return (
    <>
      <div 
        className="fixed left-0 top-0 h-full w-4 z-50"
        onMouseEnter={() => setOpen(true)}
      />
      <div
        className="h-full w-full relative"
        onMouseEnter={() => setOpen(false)}
      >
        <iframe
          src="https://studio--bob-10-d25zl.us-central1.hosted.app"
          className="w-full h-full border-none"
          title="Assistente Bob 2.0"
          allow="microphone"
        ></iframe>
      </div>
    </>
  );
}
