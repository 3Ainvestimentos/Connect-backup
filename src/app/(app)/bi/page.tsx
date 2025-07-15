"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function BIPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // A simple guard to prevent access if not the correct user.
  // This is a secondary check; the primary is in the layout.
  if (!loading && user?.email !== 'matheus@3ainvestimentos.com.br') {
    router.replace('/dashboard');
    return null;
  }
  
  return (
    <div className="flex-grow p-0 m-0 h-full w-full">
        <iframe
            title="Captação"
            width="100%"
            height="100%"
            src="https://app.powerbi.com/reportEmbed?reportId=752f561a-52b6-493d-ad99-4522540ac331&autoAuth=true&ctid=d2846deb-ade2-4957-9aa4-54f24234d220"
            frameBorder="0"
            allowFullScreen={true}
            className="border-0 rounded-none w-full h-full"
        ></iframe>
    </div>
  );
}
