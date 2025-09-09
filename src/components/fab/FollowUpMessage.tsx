"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFabMessages } from '@/contexts/FabMessagesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Componente do Balão de Diálogo ---
interface MessageBubbleProps {
  children: React.ReactNode;
  onClose?: (e: React.MouseEvent) => void;
  className?: string;
}

const MessageBubble = ({ children, onClose, className }: MessageBubbleProps) => {
    return (
        <div className="relative animate-in fade-in-50">
            <div
                className={cn(
                  "w-64 rounded-lg p-4 shadow-lg pr-8",
                  "bg-white text-black border-2",
                   className
                )}
                style={{ borderColor: 'hsl(170, 60%, 50%)' }}
            >
                {children}
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="absolute top-1 right-1 p-1 text-black/50 hover:text-black/80 rounded-full"
                        aria-label="Fechar mensagem"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
            <div 
                className="absolute top-4 -right-2 w-0 h-0"
                style={{
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: `8px solid hsl(170, 60%, 50%)`,
                }}
            />
        </div>
    );
};

export default function FollowUpMessage() {
    const { user } = useAuth();
    const { collaborators } = useCollaborators();
    const { fabMessages, completeFollowUp } = useFabMessages();
    const [isVisible, setIsVisible] = useState(false);

    const currentUser = useMemo(() => {
        if (!user) return null;
        return collaborators.find(c => c.email === user.email);
    }, [user, collaborators]);

    const activeFollowUp = useMemo(() => {
        if (!currentUser) return null;
        const messageForUser = fabMessages.find(msg => msg.userId === currentUser.id3a);
        
        if (messageForUser && messageForUser.status === 'pending_follow_up') {
            return messageForUser;
        }
        return null;
    }, [fabMessages, currentUser]);

    useEffect(() => {
        if (activeFollowUp) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [activeFollowUp]);
    
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentUser?.id3a) {
            completeFollowUp(currentUser.id3a);
        }
    };


    if (!activeFollowUp || !isVisible) {
        return null;
    }
    
    const currentCampaign = activeFollowUp.pipeline[activeFollowUp.activeCampaignIndex];
    if (!currentCampaign) return null;

    return (
         <div className="fixed top-20 right-8 z-50 flex items-start">
             <div className="absolute right-full mr-4 flex flex-col items-end gap-4">
                <MessageBubble onClose={handleClose}>
                     <p className="text-sm">{currentCampaign.followUpMessage}</p>
                </MessageBubble>
            </div>
        </div>
    );
}
