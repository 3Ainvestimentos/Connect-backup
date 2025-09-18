
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
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Separator } from '../ui/separator';
import { User, Building, Briefcase, Pyramid, MapPin, Users, Fingerprint } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth();
  const { collaborators } = useCollaborators();

  const currentUserCollaborator = React.useMemo(() => {
    if (!user || !collaborators) return null;
    return collaborators.find(c => c.email === user.email);
  }, [user, collaborators]);

  if (!user) return null;
  
  const displayName = currentUserCollaborator?.name || user.displayName;
  const displayEmail = currentUserCollaborator?.email || user.email;
  const displayPhotoUrl = currentUserCollaborator?.photoURL || user.photoURL || undefined;
  const displayAvatarInitial = displayName ? displayName.charAt(0).toUpperCase() : <User size={48} />;

  const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => (
    <div className="flex items-center gap-4">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="text-sm">
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-muted-foreground">{value || '-'}</p>
        </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl font-body p-0">
        <div className="flex flex-col md:flex-row">
            {/* Left side */}
            <div className="flex flex-col items-center justify-center p-8 bg-muted/50 md:w-2/5 text-center">
                <Avatar className="h-28 w-28 mb-4 border-4 border-background">
                    <AvatarImage src={displayPhotoUrl} alt={displayName || "User Avatar"} />
                    <AvatarFallback className="text-4xl bg-muted">
                        {displayAvatarInitial}
                    </AvatarFallback>
                </Avatar>
                <h2 className="font-headline text-2xl font-bold text-foreground">{displayName}</h2>
                <p className="text-sm text-muted-foreground">{displayEmail}</p>
            </div>

            {/* Right side */}
            <div className="p-8 flex flex-col flex-1">
                <DialogHeader className="mb-4">
                    <DialogTitle className="font-headline text-xl">Detalhes do Colaborador</DialogTitle>
                </DialogHeader>

                {currentUserCollaborator ? (
                  <div className="space-y-4">
                      <InfoItem icon={Fingerprint} label="ID 3A RIVA" value={currentUserCollaborator.id3a} />
                      <Separator />
                      <InfoItem icon={Briefcase} label="Cargo" value={currentUserCollaborator.position} />
                      <Separator />
                      <InfoItem icon={Building} label="Área" value={currentUserCollaborator.area} />
                      <Separator />
                      <InfoItem icon={Users} label="Líder" value={currentUserCollaborator.leader} />
                       <Separator />
                      <InfoItem icon={Pyramid} label="Eixo" value={currentUserCollaborator.axis} />
                       <Separator />
                      <InfoItem icon={MapPin} label="Cidade" value={currentUserCollaborator.city} />
                  </div>
                ) : (
                <div className="py-4 text-center text-muted-foreground">
                    <p>Informações detalhadas do colaborador não encontradas.</p>
                </div>
                )}
                 <DialogFooter className="mt-auto pt-6">
                </DialogFooter>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
