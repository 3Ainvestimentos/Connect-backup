
"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePolls, PollType } from '@/contexts/PollsContext';
import { useAuth } from '@/contexts/AuthContext';
import PollModal from './PollModal';
import { useCollaborators } from '@/contexts/CollaboratorsContext';

export default function PollTrigger() {
  const pathname = usePathname();
  const { polls, pollResponses, loadingPolls, loadingResponses } = usePolls();
  const { user } = useAuth();
  const { collaborators } = useCollaborators();
  const [activePoll, setActivePoll] = useState<PollType | null>(null);

  useEffect(() => {
    if (loadingPolls || loadingResponses || !user) return;

    const currentUser = collaborators.find(c => c.email === user.email);
    if (!currentUser) return;

    const potentialPolls = polls.filter(p => {
      // Is the poll active and targeting the current page?
      if (!p.isActive || p.targetPage !== pathname) {
        return false;
      }
      
      // Is the user in the target audience?
      const isTargeted = p.recipientIds.includes('all') || p.recipientIds.includes(currentUser.id3a);
      if (!isTargeted) {
        return false;
      }

      // Has the user already responded?
      const responsesForThisPoll = pollResponses[p.id] || [];
      const hasResponded = responsesForThisPoll.some(r => r.userId === currentUser.id3a);
      
      return !hasResponded;
    });

    // We can add logic here to pick one if multiple are available, for now, just pick the first.
    if (potentialPolls.length > 0) {
      // Add a small delay to not be too intrusive on page load
      const timer = setTimeout(() => {
        setActivePoll(potentialPolls[0]);
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    } else {
        setActivePoll(null);
    }

  }, [pathname, polls, pollResponses, user, collaborators, loadingPolls, loadingResponses]);

  if (!activePoll) return null;

  return (
    <PollModal
      poll={activePoll}
      open={!!activePoll}
      onOpenChange={(isOpen) => {
        if (!isOpen) setActivePoll(null);
      }}
    />
  );
}
