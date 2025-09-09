
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFabMessages } from '@/contexts/FabMessagesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. Ícone SVG do "Bob"
function BobIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" fill="none" className="h-9 w-9">
            <g transform="translate(0, 1.5)">
                <circle cx="12" cy="6.5" r="5.5" fill="#FFFFE0" opacity="0.3"/>
                <circle cx="12" cy="6.5" r="4.5" fill="#FFFFE0" opacity="0.5"/>
                <path d="M12 11.5C9.23858 11.5 7 9.26142 7 6.5C7 3.73858 9.23858 1.5 12 1.5C14.7614 1.5 17 3.73858 17 6.5C17 9.26142 14.7614 11.5 12 11.5Z" stroke="#374151" strokeWidth="0.75" fill="rgba(209, 213, 219, 0.3)"/>
                <path d="M10.5 7.5L11.25 5L12 7.5L12.75 5L13.5 7.5" stroke="#FFE066" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </g>
            <path d="M9.5 12.5 H14.5 V14.0 H9.5 Z" fill="#6B7280" stroke="#374151" strokeWidth="0.6"/>
            <path d="M9.5 14.0 C9.5 14.5 10 14.5 10.5 14.5 H13.5 C14 14.5 14.5 14.5 14.5 14.0 L14 13.75 H10 L9.5 14.0 Z" fill="#6B7280" stroke="#374151" strokeWidth="0.6"/>
            <line x1="9.5" y1="13.0" x2="14.5" y2="13.0" stroke="#4B5563" strokeWidth="0.5"/>
            <line x1="9.5" y1="13.5" x2="14.5" y2="13.5" stroke="#4B5563" strokeWidth="0.5"/>
            <rect x="4" y="14.5" width="16" height="8.5" rx="3.5" fill="#E5E7EB" stroke="#6B7280" strokeWidth="1"/>
            <rect x="2.5" y="16" width="2" height="5.5" rx="1.5" fill="#9CA3AF" stroke="#4B5563" strokeWidth="0.75"/>
            <rect x="19.5" y="16" width="2" height="5.5" rx="1.5" fill="#9CA3AF" stroke="#4B5563" strokeWidth="0.75"/>
            <circle cx="8.5" cy="18.75" r="1.8" fill="#DFB87F"/>
            <circle cx="8.0" cy="18.25" r="0.5" fill="#FFFFFF" opacity="0.9"/>
            <circle cx="15.5" cy="18.75" r="1.8" fill="#DFB87F"/>
            <circle cx="15.0" cy="18.25" r="0.5" fill="#FFFFFF" opacity="0.9"/>
        </svg>
    );
}

// 2. Componente do Balão de Diálogo
interface MessageBubbleProps {
  children: React.ReactNode;
  onClick?: () => void;
  onClose?: (e: React.MouseEvent) => void;
  hasCloseButton?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const MessageBubble = ({ children, onClick, onClose, hasCloseButton, variant = 'primary', className }: MessageBubbleProps) => {
    const bubbleColor = 'hsl(170, 60%, 50%)';
    const borderColor = 'hsl(170, 60%, 50%)';

    const baseClasses = "w-64 rounded-lg p-4 shadow-lg transition-all";
    const variantClasses = {
        primary: "bg-[hsl(170,60%,50%)] text-white font-semibold cursor-pointer",
        secondary: "bg-white text-black border-2",
    };

    return (
        <div className="relative animate-in fade-in-50" onClick={onClick}>
            <div
                className={cn(baseClasses, variantClasses[variant], hasCloseButton && "pr-8", className)}
                style={{ borderColor: variant === 'secondary' ? borderColor : 'transparent' }}
            >
                {children}
                {hasCloseButton && (
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
                    borderLeft: `8px solid ${variant === 'secondary' ? borderColor : bubbleColor}`,
                }}
            />
        </div>
    );
};


export default function MessageFAB() {
    const { user } = useAuth();
    const { collaborators } = useCollaborators();
    const { fabMessages, markCampaignAsClicked, completeFollowUp } = useFabMessages();

    const currentUser = useMemo(() => {
        if (!user) return null;
        return collaborators.find(c => c.email === user.email);
    }, [user, collaborators]);

    const activeMessage = useMemo(() => {
        if (!currentUser) return null;
        const messageForUser = fabMessages.find(msg => msg.userId === currentUser.id3a);
        
        const isActiveState = messageForUser && (messageForUser.status === 'pending_cta' || messageForUser.status === 'pending_follow_up');
        
        return isActiveState ? messageForUser : null;
    }, [fabMessages, currentUser]);


    const handleCtaClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (activeMessage && currentUser) {
            markCampaignAsClicked(currentUser.id3a);
        }
    };
    
    const handleFollowUpClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeMessage && currentUser) {
            completeFollowUp(currentUser.id3a);
        }
    };

    if (!activeMessage) {
        return null;
    }
    
    const currentCampaign = activeMessage.pipeline[activeMessage.activeCampaignIndex];
    if (!currentCampaign) return null;

    const isCtaPending = activeMessage.status === 'pending_cta';
    const isFollowUpPending = activeMessage.status === 'pending_follow_up';

    return (
         <div className="fixed top-20 right-8 z-50">
            <div className="absolute right-full mr-4 flex flex-col items-end gap-4 w-64">
                {isCtaPending && (
                     <MessageBubble 
                        variant="primary"
                        onClick={handleCtaClick}
                    >
                         <p className="text-sm">{currentCampaign.ctaMessage}</p>
                    </MessageBubble>
                )}
                {isFollowUpPending && (
                     <MessageBubble 
                        variant="secondary"
                        onClose={handleFollowUpClose}
                        hasCloseButton
                    >
                         <p className="text-sm">{currentCampaign.followUpMessage}</p>
                    </MessageBubble>
                )}
            </div>
            
            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full bg-background border-2 border-[hsl(170,60%,50%)] shadow-lg flex-shrink-0",
                    isCtaPending && "animate-pulse-bg"
                )}
                aria-label="Nova mensagem"
            >
                <BobIcon />
            </Button>
        </div>
    );
}
