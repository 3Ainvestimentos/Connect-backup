
"use client";

import React from 'react';
import SuperAdminGuard from '@/components/auth/SuperAdminGuard';
import { EventLogView } from '@/components/audit/EventLogView';

export default function AuditPage() {

  return (
    <SuperAdminGuard>
      <div className="space-y-6">
        <EventLogView />
      </div>
    </SuperAdminGuard>
  );
}
