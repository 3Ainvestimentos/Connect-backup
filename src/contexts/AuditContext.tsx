
"use client";

import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface AuditContextType {
  dateRange: DateRange | undefined;
  setDateRange: (date: DateRange | undefined) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

// Set the start date for the audit logs
const AUDIT_START_DATE = new Date('2024-08-01');

export const AuditProvider = ({ children }: { children: ReactNode }) => {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const value = useMemo(() => ({
        dateRange,
        setDateRange,
    }), [dateRange]);

    return (
        <AuditContext.Provider value={value}>
            {children}
        </AuditContext.Provider>
    );
};

export const useAudit = (): AuditContextType => {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
};
