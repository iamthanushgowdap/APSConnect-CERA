"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Smile, MoreHorizontal } from 'lucide-react';
import { getInitials } from '@/components/content/post-item-utils';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { ProfileService } from '@/lib/profile-service';
import type { UserProfile } from '@/types';

interface ChatMessageProps {
  avatarUrl?: string;
  nickName: string;
  messages: string[];
  type?: 'me' | 'other';
  timestamp?: string;
  onEmojiClick?: () => void;
  onMoreClick?: () => void;
  author_uid?: string; // Add author_uid for avatar fetching
}

export function ChatMessage({
  avatarUrl,
  nickName,
  messages,
  type = 'other',
  timestamp,
  onEmojiClick,
  onMoreClick,
  author_uid
}: ChatMessageProps) {
  const { user } = useAuth();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>();
  const [showOptions, setShowOptions] = useState(false);
  const isMe = type === 'me';

  useEffect(() => {
    if (avatarUrl) {
      setUserAvatarUrl(avatarUrl);
      return;
    }

    const loadAuthorAvatar = async () => {
      if (!author_uid) return;
      
      try {
        // 1. Try Supabase first
        const authorProfile = await ProfileService.getProfile(author_uid);
        if (authorProfile?.avatar_url) {
          setUserAvatarUrl(authorProfile.avatar_url);
          return;
        }

        // 2. Fallback to localStorage during transition (remove after migration)
        const localProfileStr = localStorage.getItem(`apsconnect_user_${author_uid}`);
        if (localProfileStr) {
          const localProfile = JSON.parse(localProfileStr) as UserProfile;
          if (localProfile.avatar_url) {
            setUserAvatarUrl(localProfile.avatar_url);
            // Migrate to Supabase
            await ProfileService.cacheProfile(localProfile);
            localStorage.removeItem(`apsconnect_user_${author_uid}`);
          }
        }

        // 3. Current user fallback
        if (user?.uid) {
          const currentUserProfile = await ProfileService.getProfile(user.uid);
          if (currentUserProfile?.avatar_url) {
            setUserAvatarUrl(currentUserProfile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };

    loadAuthorAvatar();
  }, [user, type, avatarUrl, author_uid]);

  return (
    <div
      className={`chat__conversation-board__message-container ${isMe ? 'reversed' : ''}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {!isMe && (
        <div className="chat__conversation-board__message__person">
          <div className="chat__conversation-board__message__person__avatar">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatarUrl || avatarUrl} alt={nickName} />
              <AvatarFallback>{getInitials(nickName)}</AvatarFallback>
            </Avatar>
          </div>
          <span className="chat__conversation-board__message__person__nickname">{nickName}</span>
        </div>
      )}

      <div className="chat__conversation-board__message__context">
        {messages.map((message, index) => (
          <div key={index} className="chat__conversation-board__message__bubble">
            <span>{message}</span>
          </div>
        ))}
      </div>

      <div className={`chat__conversation-board__message__options ${showOptions ? 'flex' : ''}`}>
        <button
          className="btn-icon chat__conversation-board__message__option-button option-item emoji-button"
          onClick={onEmojiClick}
          aria-label="Add emoji reaction"
        >
          <Smile className="h-4 w-4" />
        </button>
        <button
          className="btn-icon chat__conversation-board__message__option-button option-item more-button"
          onClick={onMoreClick}
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {timestamp && (
        <div className="chat__conversation-board__message__date">
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
      )}
    </div>
  );
}
