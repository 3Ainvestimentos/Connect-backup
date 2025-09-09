"use client";

import AdminGuard from "@/components/auth/AdminGuard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ManageFabMessages } from "@/components/admin/ManageFabMessages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, PieChart, Users, BarChart, Search, Filter } from "lucide-react";
import TagDistributionChart from "@/components/admin/TagDistributionChart";
import CampaignStatusChart from "@/components/admin/CampaignStatusChart";
import { useCollaborators } from "@/contexts/CollaboratorsContext";
import { useFabMessages } from "@/contexts/FabMessagesContext";
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";


export default function FabMessagesAdminPage() {
    const { collaborators } = useCollaborators();
    const { fabMessages } = useFabMessages();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => 
        collaborators.filter(c => c.axis === 'Comercial' || ['desenvolvedor@3ariva.com.br', 'matheus@3ainvestimentos.com.br'].includes(c.email)).map(c => c.id3a)
    );

    const commercialUsers = useMemo(() => {
        const testUsers = [
            'desenvolvedor@3ariva.com.br',
            'matheus@3ainvestimentos.com.br'
        ];
        return collaborators
          .filter(c => c.axis === 'Comercial' || testUsers.includes(c.email))
          .sort((a,b) => a.name.localeCompare(b.name));
    }, [collaborators]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return commercialUsers;
        const lowercasedTerm = searchTerm.toLowerCase();
        return commercialUsers.filter(user => 
            user.name.toLowerCase().includes(lowercasedTerm) || 
            user.email.toLowerCase().includes(lowercasedTerm) ||
            user.area.toLowerCase().includes(lowercasedTerm) ||
            user.position.toLowerCase().includes(lowercasedTerm) ||
            user.segment.toLowerCase().includes(lowercasedTerm) ||
            user.leader.toLowerCase().includes(lowercasedTerm)
        );
    }, [commercialUsers, searchTerm]);
    
    const selectedMessages = useMemo(() => {
        return fabMessages.filter(msg => selectedUserIds.includes(msg.userId));
    }, [fabMessages, selectedUserIds]);

    const handleSelectUser = (userId: string, checked: boolean) => {
        setSelectedUserIds(prev => 
            checked ? [...prev, userId] : prev.filter(id => id !== userId)
        );
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(filteredUsers.map(u => u.id3a));
        } else {
            setSelectedUserIds([]);
        }
    };
    
    const isAllSelected = useMemo(() => {
        return filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id3a));
    }, [filteredUsers, selectedUserIds]);

    return (
        <AdminGuard>
            <div className="space-y-6 p-6 md:p-8">
                <PageHeader
                    title="Mensagens FAB"
                    description="Crie e monitore mensagens flutuantes para os usuários."
                />
                
                 <Tabs defaultValue="management" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="management">
                             <ListChecks className="mr-2 h-4 w-4" />
                             Gerenciamento
                        </TabsTrigger>
                        <TabsTrigger value="monitoring">
                            <PieChart className="mr-2 h-4 w-4" />
                            Monitoramento
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="management" className="mt-6">
                         <ManageFabMessages />
                    </TabsContent>
                    <TabsContent value="monitoring" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users />Seleção de Colaboradores</CardTitle>
                                <CardDescription>Selecione os colaboradores para filtrar os dados dos gráficos abaixo. Atualmente exibindo dados para {selectedUserIds.length} colaborador(es).</CardDescription>
                                <div className="relative pt-2">
                                     <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground" />
                                     <Input 
                                        placeholder="Buscar colaborador por nome, email, área, cargo..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                     />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-64">
                                    <div className="border rounded-lg overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">
                                                        <Checkbox
                                                            checked={isAllSelected}
                                                            onCheckedChange={handleSelectAll}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Área</TableHead>
                                                    <TableHead>Cargo</TableHead>
                                                    <TableHead>Segmento</TableHead>
                                                    <TableHead>Líder</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredUsers.map(user => (
                                                    <TableRow key={user.id} data-state={selectedUserIds.includes(user.id3a) ? 'selected' : ''}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedUserIds.includes(user.id3a)}
                                                                onCheckedChange={checked => handleSelectUser(user.id3a, !!checked)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">{user.name}</TableCell>
                                                        <TableCell>{user.email}</TableCell>
                                                        <TableCell>{user.area}</TableCell>
                                                        <TableCell>{user.position}</TableCell>
                                                        <TableCell>{user.segment}</TableCell>
                                                        <TableCell>{user.leader}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <TagDistributionChart messages={selectedMessages} />
                            <CampaignStatusChart messages={selectedMessages} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminGuard>
    );
}
