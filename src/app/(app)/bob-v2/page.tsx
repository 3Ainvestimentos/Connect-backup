"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { useEffect } from "react";

export default function BobV2Page() {
  const { setOpen } = useSidebar();

  // Force sidebar to be collapsed on this page and restore on unmount
  useEffect(() => {
    setOpen(false);
    
    return () => setOpen(true);
  }, [setOpen]);

  return (
    <div className="h-full w-full relative">
      <iframe
        src="https://studio--bob-10-d25zl.us-central1.hosted.app"
        className="w-full h-full border-none"
        title="Assistente Bob 2.0"
        allow="microphone"
      ></iframe>
    </div>
  );
}
