
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useFabMessages, FabMessageType } from '@/contexts/FabMessagesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { Button } from '@/components/ui/button';
import { getIcon } from '@/lib/icons';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function MessageFAB() {
    const { user } = useAuth();
    const { collaborators } = useCollaborators();
    const { fabMessages, markAsRead, markAsClicked } = useFabMessages();
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentUser = useMemo(() => {
        if (!user) return null;
        return collaborators.find(c => c.email === user.email);
    }, [user, collaborators]);

    const unreadMessages = useMemo(() => {
        if (!currentUser) return [];
        return fabMessages.filter(msg => {
            const isTargeted = msg.targetUserIds.includes(currentUser.id3a);
            const isRead = msg.readByUserIds.includes(currentUser.id3a);
            return isTargeted && !isRead;
        });
    }, [fabMessages, currentUser]);

    const currentMessage = unreadMessages.length > 0 ? unreadMessages[currentIndex] : null;

    useEffect(() => {
        if (currentIndex >= unreadMessages.length && unreadMessages.length > 0) {
            setCurrentIndex(unreadMessages.length - 1);
        }
    }, [unreadMessages, currentIndex]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % unreadMessages.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + unreadMessages.length) % unreadMessages.length);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentMessage && currentUser) {
            markAsRead(currentMessage.id, currentUser.id3a);
        }
    };
    
    const handleCtaClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentMessage && currentUser) {
            markAsClicked(currentMessage.id, currentUser.id3a);
            markAsRead(currentMessage.id, currentUser.id3a);
        }
    };

    if (!currentMessage) {
        return null;
    }

    const Icon = getIcon(currentMessage.icon);

    return (
        <div className="fixed top-20 right-4 z-50 w-80">
            <div className="bg-card shadow-lg rounded-lg border p-4 animate-in fade-in-0 zoom-in-95 slide-in-from-top-4">
                <button 
                    onClick={handleDismiss} 
                    className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Dispensar mensagem"
                >
                    <X className="h-4 w-4" />
                </button>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 bg-primary/10 text-primary p-2 rounded-full">
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-sm text-foreground">{currentMessage.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{currentMessage.content}</p>
                    </div>
                </div>
                 <div className="mt-3 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        {unreadMessages.length > 1 && (
                            <>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handlePrev}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-muted-foreground">{currentIndex + 1} / {unreadMessages.length}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleNext}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                     <Button asChild size="sm" className="h-8 text-xs" onClick={handleCtaClick}>
                        <a href={currentMessage.ctaLink} target="_blank" rel="noopener noreferrer">
                            {currentMessage.ctaText}
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
}

