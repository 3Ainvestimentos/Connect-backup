
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Building, Briefcase, Calendar, Link as LinkIcon, Shield } from 'lucide-react';
import Link from 'next/link';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock data, as this info is not in the AuthContext
const userProfileData = {
  department: 'Tecnologia',
  position: 'Desenvolvedor(a) Front-end',
  startDate: '15/01/2023',
  manager: 'Laura Keith',
  remainingVacationDays: 18,
};

export default function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth();
  
  // Simple check for admin role. In a real app, this should be based on roles from a backend.
  const isAdmin = user?.email === 'mock@example.com';

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-body">
        <DialogHeader className="text-center items-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-primary">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User Avatar"} />
                <AvatarFallback className="text-4xl">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={48} />}
                </AvatarFallback>
            </Avatar>
            <DialogTitle className="font-headline text-3xl">{user.displayName}</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-accent" />
                    <div>
                        <p className="font-semibold text-foreground">Cargo</p>
                        <p className="text-muted-foreground">{userProfileData.position}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-accent" />
                    <div>
                        <p className="font-semibold text-foreground">Departamento</p>
                        <p className="text-muted-foreground">{userProfileData.department}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-accent" />
                     <div>
                        <p className="font-semibold text-foreground">Data de Início</p>
                        <p className="text-muted-foreground">{userProfileData.startDate}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-accent" />
                     <div>
                        <p className="font-semibold text-foreground">Gestor(a)</p>
                        <p className="text-muted-foreground">{userProfileData.manager}</p>
                    </div>
                </div>
            </div>
            <Separator />
            <div className="space-y-2">
                <h4 className="font-headline text-base font-semibold">Links Rápidos</h4>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                        <a href="#"><LinkIcon className="mr-2 h-4 w-4" />Editar Perfil</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <a href="#"><LinkIcon className="mr-2 h-4 w-4" />Meus Documentos</a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/contacts"><LinkIcon className="mr-2 h-4 w-4" />Ver Organograma</Link>
                    </Button>
                    {isAdmin && (
                        <Button variant="destructive" size="sm" asChild>
                            <Link href="/admin"><Shield className="mr-2 h-4 w-4" />Painel Admin</Link>
                        </Button>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
