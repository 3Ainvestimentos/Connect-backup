"use client";

import React, { useState, useMemo } from 'react';
import type { Contact } from '@/app/(app)/contacts/page';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ContactsClientProps {
  initialContacts: Contact[];
}

type SortKey = keyof Contact | '';
type SortDirection = 'asc' | 'desc';

export default function ContactsClient({ initialContacts }: ContactsClientProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedContacts = useMemo(() => {
    let items = [...initialContacts];

    if (sortKey) {
      items.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        let comparison = 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return items;
  }, [initialContacts, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const SortableHeader = ({ tkey, label }: { tkey: SortKey, label: string }) => (
    <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:bg-muted/50 font-body">
      {label} {sortKey === tkey && (sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4" /> : <ChevronDown className="inline h-4 w-4" />)}
    </TableHead>
  );

  return (
    <Card className="shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader tkey="name" label="Nome" />
            <SortableHeader tkey="branch" label="Filial" />
            <SortableHeader tkey="position" label="Cargo" />
            <TableHead className="font-body">Email</TableHead>
            <TableHead className="font-body">Slack</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => (
            <TableRow key={contact.id} className="hover:bg-muted/30">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.avatarUrl} alt={contact.name} data-ai-hint={contact.dataAiHint} />
                    <AvatarFallback>{contact.name.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium font-body">{contact.name}</span>
                </div>
              </TableCell>
              <TableCell className="font-body">{contact.branch}</TableCell>
              <TableCell className="font-body">{contact.position}</TableCell>
              <TableCell>
                 <Button variant="link" size="sm" asChild className="text-accent p-0 h-auto font-normal">
                    <Link href={`mailto:${contact.email}`} className="flex items-center gap-2 font-body">
                        <Mail className="h-4 w-4" />
                        <span>{contact.email}</span>
                    </Link>
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 font-body text-muted-foreground">
                    <MessageSquare className="h-4 w-4 text-accent" />
                    <span>{contact.slack}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
