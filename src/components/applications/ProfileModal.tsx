
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
import { Separator } from '@/components/ui/separator';
import { User, Building, Briefcase, Pyramid, MapPin, Users } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg font-body">
        <DialogHeader className="text-center items-center">
            <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={currentUserCollaborator?.photoURL || user.photoURL || undefined} alt={user.displayName || "User Avatar"} />
                <AvatarFallback className="text-4xl">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={48} />}
                </AvatarFallback>
            </Avatar>
            <DialogTitle className="font-headline text-3xl">{user.displayName}</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        
        {currentUserCollaborator ? (
          <div className="py-4 space-y-4">
              <Separator />
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                  <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-accent" />
                      <div>
                          <p className="font-semibold text-foreground">Cargo</p>
                          <p className="text-muted-foreground">{currentUserCollaborator.position}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-accent" />
                      <div>
                          <p className="font-semibold text-foreground">Área</p>
                          <p className="text-muted-foreground">{currentUserCollaborator.area}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-accent" />
                      <div>
                          <p className="font-semibold text-foreground">Líder</p>
                          <p className="text-muted-foreground">{currentUserCollaborator.leader}</p>
                      </div>
                  </div>
                   <div className="flex items-center gap-3">
                      <Pyramid className="h-5 w-5 text-accent" />
                       <div>
                          <p className="font-semibold text-foreground">Eixo</p>
                          <p className="text-muted-foreground">{currentUserCollaborator.axis}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-accent" />
                       <div>
                          <p className="font-semibold text-foreground">Cidade</p>
                          <p className="text-muted-foreground">{currentUserCollaborator.city}</p>
                      </div>
                  </div>
              </div>
          </div>
        ) : (
           <div className="py-4 text-center text-muted-foreground">
             <p>Informações detalhadas do colaborador não encontradas.</p>
             <p className="text-xs mt-1">Verifique se o seu email está cadastrado na seção de Colaboradores no painel admin.</p>
           </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" className="hover:bg-muted">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
