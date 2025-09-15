"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMessages } from '@/contexts/MessagesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/contexts/CollaboratorsContext';
import { useRouter } from 'next/navigation';
import { useIdleFabMessages } from '@/contexts/IdleFabMessagesContext';

// --- Ícone do Bob ---
function BobIcon({ isAnimated }: { isAnimated: boolean }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" fill="none" className="h-9 w-9">
            <style>
            {`
                @keyframes lamp-on-off {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.1; }
                }
                .animate-lamp {
                animation: lamp-on-off 4s ease-in-out infinite;
                }
            `}
            </style>
            <g className={cn(isAnimated && "animate-lamp")} transform="translate(0, 1.5)">
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

// --- Componente do Balão de Diálogo ---
interface MessageBubbleProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const MessageBubble = ({ children, onClick, className }: MessageBubbleProps) => {
    const bubbleColor = 'hsl(170, 60%, 50%)';

    return (
        <div className="relative animate-in fade-in-50 cursor-pointer" onClick={onClick}>
            <div
                className={cn("w-64 rounded-lg p-4 shadow-lg transition-all bg-[hsl(170,60%,50%)] text-white font-semibold", className)}
            >
                {children}
            </div>
            <div 
                className="absolute top-4 -right-2 w-0 h-0"
                style={{
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: `8px solid ${bubbleColor}`,
                }}
            />
        </div>
    );
};

interface NotificationFABProps {
  hasPendingRequests: boolean;
  hasPendingTasks: boolean;
}

export default function NotificationFAB({ hasPendingRequests, hasPendingTasks }: NotificationFABProps) {
  const { messages, markMessageAsRead } = useMessages();
  const { idleMessages } = useIdleFabMessages();
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const router = useRouter();
  
  const [showNotificationBubble, setShowNotificationBubble] = useState(false);
  const [isIconAnimated, setIsIconAnimated] = useState(false);
  const [showIdleBubble, setShowIdleBubble] = useState(false);
  const [currentIdleIndex, setCurrentIdleIndex] = useState(0);

  const unreadMessages = useMemo(() => {
    if (!user) return [];
    const currentUser = collaborators.find(c => c.email === user.email);
    if (!currentUser) return [];
    
    return messages.filter(msg => {
      if ((msg.deletedBy || []).includes(currentUser.id3a)) {
        return false;
      }
      const isRecipient = msg.recipientIds.includes('all') || msg.recipientIds.includes(currentUser.id3a);
      const isUnread = !msg.readBy.includes(currentUser.id3a);
      return isRecipient && isUnread;
    });
  }, [messages, user, collaborators]);

  const hasUnreadMessages = unreadMessages.length > 0;
  const hasWorkflowNotifications = hasPendingRequests || hasPendingTasks;
  const hasAnyNotification = hasUnreadMessages || hasWorkflowNotifications;
  
  const notificationText = useMemo(() => {
      if (hasPendingTasks) {
          return `Você tem novas tarefas pendentes.\nClique para ver.`;
      }
      if (hasPendingRequests) {
          return `Há solicitações aguardando sua gestão.\nClique para ver.`;
      }
      const count = unreadMessages.length;
      if (count > 0) {
          const messageText = count > 1 ? `${count} novas mensagens` : '1 nova mensagem';
          return `Você tem ${messageText}.\nClique para ver.`;
      }
      return null;
  }, [hasPendingTasks, hasPendingRequests, unreadMessages.length]);

  useEffect(() => {
    if (hasAnyNotification) {
      const timer = setTimeout(() => {
        setShowNotificationBubble(true);
        setIsIconAnimated(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowNotificationBubble(false);
      setIsIconAnimated(false);
    }
  }, [hasAnyNotification]);

  const handleNotificationBubbleClick = () => {
    // This click is only for the notification bubble
    setIsIconAnimated(false);
    setShowNotificationBubble(false);
    setShowIdleBubble(false);

    if (hasPendingTasks) {
        router.push('/me/tasks');
        return;
    }
    if (hasPendingRequests) {
        router.push('/requests');
        return;
    }
    if (hasUnreadMessages) {
      const messagesCard = document.getElementById('messages-card');
      if (messagesCard) {
        messagesCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const currentUser = collaborators.find(c => c.email === user?.email);
        if (currentUser) {
          unreadMessages.forEach(msg => {
            markMessageAsRead(msg.id, currentUser.id3a);
          });
        }
      }
    }
  };

  const handleFabClick = () => {
     // Clicking the FAB itself always deals with idle messages
     setIsIconAnimated(false);
     setShowNotificationBubble(false); // Hide notification if it was showing

     if (idleMessages.length > 0) {
        setShowIdleBubble(true);
        setCurrentIdleIndex(prev => (prev + 1) % idleMessages.length);
     } else {
        // Fallback action if no idle messages are configured
        router.push('/chatbot');
     }
  };
  
  const idleMessageText = useMemo(() => {
      if (!showIdleBubble || idleMessages.length === 0) return null;
      return idleMessages[currentIdleIndex]?.text;
  }, [showIdleBubble, currentIdleIndex, idleMessages]);


  return (
    <div className="fixed top-20 right-8 z-50 flex items-start group">
        <div className="absolute right-full mr-4 flex flex-col items-end gap-4">
            {showNotificationBubble && notificationText && (
                <MessageBubble onClick={handleNotificationBubbleClick}>
                   <p className="text-sm whitespace-pre-line">{notificationText}</p>
                </MessageBubble>
            )}
             {showIdleBubble && idleMessageText && (
                <MessageBubble>
                   <p className="text-sm whitespace-pre-line">{idleMessageText}</p>
                </MessageBubble>
            )}
        </div>

        <div
            className="relative h-14 w-14 cursor-pointer"
            onClick={handleFabClick}
            aria-label="Ver notificações"
        >
            <div
              className={cn(
                "absolute inset-0 bg-background rounded-full border-2 border-[hsl(170,60%,50%)] transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-xl"
              )}
            ></div>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <BobIcon isAnimated={isIconAnimated} />
            </div>
        </div>
    </div>
  );
}
