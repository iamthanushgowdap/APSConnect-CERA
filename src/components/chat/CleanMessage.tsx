"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SupabaseStorage } from '@/lib/supabase-storage';
import { getInitials } from '@/components/content/post-item-utils';
import { useAuth } from '@/components/auth-provider';
import { Copy, Share, Trash2, X, MoreHorizontal } from 'lucide-react';
import type { UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  avatarUrl?: string;
  nickName: string;
  content: string;
  type: 'me' | 'other';
  timestamp?: string;
  messageType?: 'text' | 'image' | 'audio' | 'document' | 'gallery' | 'url' | 'file';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  duration?: string;
  images?: string[];
  attachments?: any[];
  urlPreview?: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
  reactions?: { emoji: string; count: number; users: string[] }[];
  status?: 'sent' | 'delivered' | 'read';
  author_uid?: string; // Add author_uid to fetch correct avatar
}

interface CleanMessageProps {
  message: Message;
  onEmojiClick?: (messageId: string) => void;
  onCopyMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
}

export function CleanMessage({
  message,
  onEmojiClick,
  onCopyMessage,
  onDeleteMessage,
  onShareMessage,
  onAddReaction
}: CleanMessageProps) {
  const { user } = useAuth();
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | undefined>(undefined);
  const [avatarError, setAvatarError] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [reactionEmojis] = useState(['👍', '❤️', '😂', '😮', '😢', '😡']);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAvatarError = () => {
    console.error('❌ Avatar failed to load:', {
      userAvatarUrl,
      messageAvatarUrl: message.avatarUrl,
      messageId: message.id,
      nickName: message.nickName
    });
    setAvatarError(true);
  };

  // Reset avatar error when avatar URL changes
  useEffect(() => {
    setAvatarError(false);
  }, [userAvatarUrl, message.avatarUrl]);

  console.log('🎯 CleanMessage RENDERED for message ID:', message.id, {
    nickName: message.nickName,
    finalAvatarUrl: userAvatarUrl || message.avatarUrl,
    userAvatarUrl,
    messageAvatarUrl: message.avatarUrl,
    hasAvatarError: avatarError
  });

  // Load user avatar from localStorage first, then Supabase if needed
  // But only if message doesn't already have an avatarUrl
  useEffect(() => {
    console.log('🎯 CleanMessage avatar loading triggered for message:', {
      id: message.id,
      hasAvatarUrl: !!message.avatarUrl,
      author_uid: message.author_uid,
      type: message.type,
      nickName: message.nickName
    });

    if (message.avatarUrl) {
      // Message already has an avatar URL from the database
      console.log('🎯 CleanMessage using provided avatarUrl:', message.avatarUrl);

      // Validate the avatar URL
      if (message.avatarUrl && message.avatarUrl.startsWith('http')) {
        console.log('✅ Avatar URL is valid HTTP URL');
        setUserAvatarUrl(message.avatarUrl);
      } else if (message.avatarUrl && message.avatarUrl.startsWith('data:')) {
        console.log('✅ Avatar URL is base64 data URL');
        setUserAvatarUrl(message.avatarUrl);
      } else {
        console.log('⚠️ Avatar URL format unknown or invalid:', message.avatarUrl);
        setUserAvatarUrl(undefined); // This will show initials
      }
      return;
    }

    // For messages without avatarUrl, fetch the author's avatar by author_uid
    const loadAuthorAvatar = async () => {
      if (message.type === 'other' && typeof window !== 'undefined') {
        // If message has author_uid, fetch that specific user's avatar
        if (message.author_uid) {
          console.log('🔍 CleanMessage: Fetching avatar for author_uid:', message.author_uid);

          // First check localStorage for this specific user
          const authorProfileStr = localStorage.getItem(`apsconnect_user_${message.author_uid}`);
          if (authorProfileStr) {
            try {
              const authorProfile = JSON.parse(authorProfileStr) as UserProfile;
              if (authorProfile.avatar_url) {
                console.log('✅ CleanMessage: Found author avatar in localStorage:', authorProfile.avatar_url);
                setUserAvatarUrl(authorProfile.avatar_url);
                return;
              } else {
                console.log('⚠️ CleanMessage: Author profile in localStorage but no avatar_url');
              }
            } catch (e) {
              console.error('❌ CleanMessage: Error parsing author profile from localStorage:', e);
            }
          } else {
            console.log('⚠️ CleanMessage: No author profile found in localStorage for:', message.author_uid);
          }

          // If not in localStorage, fetch from Supabase
          try {
            console.log('🌐 CleanMessage: Fetching from Supabase for author:', message.author_uid);
            const { data, error } = await supabase
              .from('user_profiles')
              .select('avatar_url')
              .eq('id', message.author_uid)
              .single();

            if (!error && data?.avatar_url) {
              console.log('✅ CleanMessage: Found author avatar in Supabase:', data.avatar_url);
              setUserAvatarUrl(data.avatar_url);

              // Update localStorage for future use
              const existingProfileStr = localStorage.getItem(`apsconnect_user_${message.author_uid}`);
              if (existingProfileStr) {
                try {
                  const existingProfile = JSON.parse(existingProfileStr);
                  existingProfile.avatar_url = data.avatar_url;
                  localStorage.setItem(`apsconnect_user_${message.author_uid}`, JSON.stringify(existingProfile));
                  console.log('💾 CleanMessage: Updated localStorage with avatar');
                } catch (e) {
                  console.error('❌ CleanMessage: Error updating localStorage:', e);
                }
              }
            } else {
              console.log('⚠️ CleanMessage: No avatar found in Supabase for author:', message.author_uid, 'error:', error);
            }
          } catch (error) {
            console.error('❌ CleanMessage: Error fetching author avatar from Supabase:', error);
          }
          return;
        }

        // Fallback: use current user's avatar (for backward compatibility)
        console.log('⚠️ CleanMessage: No author_uid, using current user fallback');

        // First try localStorage
        const userProfileStr = localStorage.getItem(`apsconnect_user_${user?.uid}`);
        if (userProfileStr) {
          const userProfile = JSON.parse(userProfileStr) as UserProfile;
          if (userProfile.avatar_url) {
            setUserAvatarUrl(userProfile.avatar_url);
            return;
          }
        }

        // If not in localStorage, try fetching from Supabase
        if (user?.uid) {
          try {
            console.log('🔍 Fetching user avatar from Supabase for user:', user.uid);
            const { data, error } = await supabase
              .from('user_profiles')
              .select('avatar_url')
              .eq('id', user.uid)
              .single();

            if (!error && data?.avatar_url) {
              console.log('✅ Found avatar in Supabase');
              setUserAvatarUrl(data.avatar_url);

              // Update localStorage for future use
              const existingProfileStr = localStorage.getItem(`apsconnect_user_${user.uid}`);
              if (existingProfileStr) {
                const existingProfile = JSON.parse(existingProfileStr);
                existingProfile.avatar_url = data.avatar_url;
                localStorage.setItem(`apsconnect_user_${user.uid}`, JSON.stringify(existingProfile));
              }
            } else {
              console.log('⚠️ No avatar found in Supabase');
            }
          } catch (error) {
            console.error('❌ Error fetching avatar from Supabase:', error);
          }
        }
      }
    };

    loadAuthorAvatar();
  }, [user, message.type, message.avatarUrl, message.author_uid]);

  const isMe = message.type === 'me';

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Double click triggered for message:', message.id);
    setSelectedMessageId(selectedMessageId === message.id ? null : message.id);
  };

  const handleCopyMessage = () => {
    if (onCopyMessage) {
      onCopyMessage(message.id);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleShareMessage = () => {
    if (onShareMessage) {
      onShareMessage(message.id);
    } else {
      if (navigator.share) {
        navigator.share({
          title: 'Shared Message',
          text: message.content,
        });
      }
    }
  };

  const handleDeleteMessage = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
    }
  };

  const toggleReaction = (emoji: string) => {
    if (onAddReaction) {
      onAddReaction(message.id, emoji);
    }
    setSelectedMessageId(null);
  };

  // Audio controls
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to detect and convert URLs to clickable links
  const renderTextWithLinks = (text: string) => {
    if (!text) return text;

    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Split text by URLs and create elements
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Check if this part is a URL
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      } else {
        // This is regular text
        return part;
      }
    });
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'audio':
        return (
          <div className="leading-1.5 flex w-full max-w-[320px] flex-col">
            {message.content && (
              <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{message.content}</p>
            )}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={message.mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={() => setIsPlaying(false)}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="flex-shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1H6zM12 4a1 1 0 00-1 1v10a1 1 0 001 1h1a1 1 0 001-1V5a1 1 0 00-1-1h-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1 cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{message.fileSize ? `${(Number(message.fileSize) / 1024).toFixed(1)} KB` : 'Audio'}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="leading-1.5 flex w-full max-w-[320px] flex-col">
            <div className="flex items-start bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
              <div className="me-2">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white pb-2">
                  <svg fill="none" aria-hidden="true" className="w-5 h-5 shrink-0" viewBox="0 0 20 21">
                    <g clipPath="url(#clip0_3173_1381)">
                      <path fill="#E2E5E7" d="M5.024.5c-.688 0-1.25.563-1.25 1.25v17.5c0 .688.562 1.25 1.25 1.25h12.5c.687 0 1.25-.563 1.25-1.25V5.5l-5-5h-8.75z"/>
                      <path fill="#B0B7BD" d="M15.024 5.5h3.75l-5-5v3.75c0 .688.562 1.25 1.25 1.25z"/>
                      <path fill="#CAD1D8" d="M18.774 9.25l-3.75-3.75h3.75v3.75z"/>
                      <path fill="#F15642" d="M16.274 16.75a.627.627 0 01-.625.625H1.899a.627.627 0 01-.625-.625V10.5c0-.344.281-.625.625-.625h13.75c.344 0 .625.281.625.625v6.25z"/>
                      <path fill="#fff" d="M3.998 12.342c0-.165.13-.345.34-.345h1.154c.65 0 1.235.435 1.235 1.269 0 .79-.585 1.23-1.235 1.23h-.834v.66c0 .22-.14.344-.32.344a.337.337 0 01-.34-.344v-2.814zm.66.284v1.245h.834c.335 0 .6-.295.6-.605 0-.35-.265-.64-.6-.64h-.834zM7.706 15.5c-.165 0-.345-.09-.345-.31v-2.838c0-.18.18-.31.345-.31H8.85c2.284 0 2.234 3.458.045 3.458h-1.19zm.315-2.848v2.239h.83c1.349 0 1.409-2.24 0-2.24h-.83zM11.894 13.486h1.274c.18 0 .36.18.36.355 0 .165-.18.3-.36.3h-1.274v1.049c0 .175-.124.31-.3.31-.22 0-.354-.135-.354-.31v-2.839c0-.18.135-.31.355-.31h1.754c.22 0 .35.13.35.31 0 .16-.13.34-.35.34h-1.455v.795z"/>
                      <path fill="#CAD1D8" d="M15.649 17.375H3.774V18h11.875a.627.627 0 00.625-.625v-.625a.627.627 0 01-.625.625z"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_3173_1381">
                        <path fill="#fff" d="M0 0h20v20H0z" transform="translate(0 .5)"/>
                      </clipPath>
                    </defs>
                  </svg>
                  {message.fileName || "Flowbite Terms & Conditions"}
                </span>
                <span className="flex text-xs font-normal text-gray-500 dark:text-gray-400 gap-2">
                  12 Pages
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="self-center" width="3" height="4" viewBox="0 0 3 4" fill="none">
                    <circle cx="1.5" cy="2" r="1.5" fill="#6B7280"/>
                  </svg>
                  {message.fileSize || "18 MB"}
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="self-center" width="3" height="4" viewBox="0 0 3 4" fill="none">
                    <circle cx="1.5" cy="2" r="1.5" fill="#6B7280"/>
                  </svg>
                  PDF
                </span>
              </div>
              <div className="inline-flex self-center items-center">
                {/* Download functionality moved to 3-dot menu */}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="leading-1.5 flex w-full max-w-[320px] flex-col">
            {message.content && (
              <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{message.content}</p>
            )}
            <div className="mt-2">
              <img
                src={message.mediaUrl || "/docs/images/blog/image-2.jpg"}
                className="rounded-lg"
                alt="Shared image"
              />
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="leading-1.5 flex w-full max-w-[320px] flex-col">
            {message.content && (
              <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{message.content}</p>
            )}
            <div className="grid gap-4 grid-cols-2 mt-2">
              {(message.images || []).slice(0, 4).map((imageUrl, index) => (
                <div key={index} className="relative">
                  {index === 3 && (message.images || []).length > 4 ? (
                    <>
                      <Button className="absolute w-full h-full bg-gray-900/90 hover:bg-gray-900/50 transition-all duration-300 rounded-lg flex items-center justify-center">
                        <span className="text-xl font-medium text-white">+{(message.images || []).length - 4}</span>
                      </Button>
                      <img src={imageUrl} className="rounded-lg" alt={`Gallery image ${index + 1}`} />
                    </>
                  ) : (
                    <img src={imageUrl} className="rounded-lg" alt={`Gallery image ${index + 1}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{message.status === 'delivered' ? 'Delivered' : 'Sent'}</span>
              {/* Save all functionality moved to 3-dot menu */}
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="flex flex-col w-full max-w-[320px] leading-1.5">
            <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{message.content}</p>
            {message.urlPreview && (
              <a href={message.urlPreview.url} className="bg-gray-50 dark:bg-gray-600 rounded-xl p-4 mb-2 hover:bg-gray-200 dark:hover:bg-gray-500">
                <img src={message.urlPreview.image} className="rounded-lg mb-2" alt="URL preview" />
                <span className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">{message.urlPreview.title}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">{message.urlPreview.description}</span>
              </a>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="leading-1.5 flex w-full max-w-[320px] flex-col">
            {message.content && (
              <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white">{message.content}</p>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="space-y-2">
                {message.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default: // text
        return (
          <p className="text-sm font-normal py-2 text-gray-900 dark:text-white">
            {renderTextWithLinks(message.content || 'No content')}
          </p>
        );
    }
  };

  return (
    <div className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : ''} relative group`}>
      {!isMe && (
        <div className="flex flex-col items-center gap-1">
          <Avatar className="w-8 h-8 rounded-full">
            <AvatarImage
              src={userAvatarUrl || message.avatarUrl}
              alt={message.nickName}
              onError={handleAvatarError}
            />
            <AvatarFallback>{getInitials(message.nickName)}</AvatarFallback>
          </Avatar>

          {/* 3-dot menu button under avatar for received messages */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm border border-white/10 dark:border-black/10 rounded-full transition-all duration-200 opacity-70 hover:opacity-100 shadow-lg"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20 dark:border-black/20">
              <DialogHeader>
                <DialogTitle className="text-center text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Message Actions
                </DialogTitle>
                <DialogDescription className="text-center">
                  Choose an action for this message
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <Button
                  variant="outline"
                  className="h-12 justify-start p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  onClick={handleCopyMessage}
                >
                  <Copy className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">Copy Message</div>
                    <div className="text-xs text-muted-foreground">Copy message text to clipboard</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start p-4 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                  onClick={handleShareMessage}
                >
                  <Share className="h-5 w-5 mr-3 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <div className="font-medium">Share Message</div>
                    <div className="text-xs text-muted-foreground">Share message with others</div>
                  </div>
                </Button>

                {/* Download options for attachments */}
                {(message.attachments as any[]) && (message.attachments as any[]).length > 0 && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Attachments</div>
                    {(message.attachments as any[]).map((attachment: any, index: number) => (
                      <Button
                        key={`download-${index}`}
                        variant="outline"
                        className="h-12 justify-start p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                        onClick={async () => {
                          try {
                            await SupabaseStorage.downloadFile(attachment.url, attachment.name);
                          } catch (error) {
                            console.error('❌ Download failed:', error);
                            alert('Download failed. The file may not be available.');
                          }
                        }}
                      >
                        <svg className="w-5 h-5 mr-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium truncate">{attachment.name}</div>
                          <div className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </Button>
                    ))}
                  </>
                )}

                {isMe && (
                  <Button
                    variant="outline"
                    className="h-12 justify-start p-4 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                    onClick={handleDeleteMessage}
                  >
                    <Trash2 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Delete Message</div>
                      <div className="text-xs text-muted-foreground">Remove this message permanently</div>
                    </div>
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className={`flex flex-col w-full max-w-[320px] leading-1.5 ${isMe ? 'items-end' : ''} relative`}>
        {!isMe && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{message.nickName}</span>
            {message.timestamp && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {new Date(message.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {isMe && (
          <div className="flex items-center space-x-2 rtl:space-x-reverse justify-end">
            {message.timestamp && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                {new Date(message.timestamp!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-900 dark:text-white">You</span>
          </div>
        )}

        <div className="relative">
          <div
            className="cursor-pointer"
            onDoubleClick={handleDoubleClick}
          >
            {renderMessageContent()}
          </div>
        </div>

        {/* Reactions */}
        {(message.reactions as any[]) && (message.reactions as any[]).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 ml-2">
            {(message.reactions as any[]).map((reaction, index) => (
              <button
                key={index}
                onClick={() => toggleReaction(reaction.emoji)}
                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  reaction.users.includes("user1")
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                }`}
              >
                <span>{reaction.emoji}</span>
                <span className="ml-1">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reaction options (shown on double click) */}
        {selectedMessageId === message.id && (
          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 border dark:border-gray-700 z-50 flex gap-1">
            {reactionEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => toggleReaction(emoji)}
                className="text-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={`Add ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setSelectedMessageId(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <span className={`text-sm font-normal text-gray-500 dark:text-gray-400 ${isMe ? 'self-end' : ''}`}>
          {message.status === 'delivered' ? 'Delivered' : message.status === 'read' ? 'Read' : 'Sent'}
        </span>
      </div>

      {isMe && (
        <div className="flex flex-col items-center gap-1">
          {/* 3-dot menu button under avatar for sent messages */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm border border-white/10 dark:border-black/10 rounded-full transition-all duration-200 opacity-70 hover:opacity-100 shadow-lg"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white/95 dark:bg-black/95 backdrop-blur-xl border-white/20 dark:border-black/20">
              <DialogHeader>
                <DialogTitle className="text-center text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Message Actions
                </DialogTitle>
                <DialogDescription className="text-center">
                  Choose an action for this message
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <Button
                  variant="outline"
                  className="h-12 justify-start p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  onClick={handleCopyMessage}
                >
                  <Copy className="h-5 w-5 mr-3 text-blue-600 dark:text-blue-400" />
                  <div className="text-left">
                    <div className="font-medium">Copy Message</div>
                    <div className="text-xs text-muted-foreground">Copy message text to clipboard</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-12 justify-start p-4 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                  onClick={handleShareMessage}
                >
                  <Share className="h-5 w-5 mr-3 text-green-600 dark:text-green-400" />
                  <div className="text-left">
                    <div className="font-medium">Share Message</div>
                    <div className="text-xs text-muted-foreground">Share message with others</div>
                  </div>
                </Button>

                {/* Download options for attachments */}
                {(message.attachments as any[]) && (message.attachments as any[]).length > 0 && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">Attachments</div>
                    {(message.attachments as any[]).map((attachment: any, index: number) => (
                      <Button
                        key={`download-${index}`}
                        variant="outline"
                        className="h-12 justify-start p-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                        onClick={async () => {
                          try {
                            await SupabaseStorage.downloadFile(attachment.url, attachment.name);
                          } catch (error) {
                            console.error('❌ Download failed:', error);
                            alert('Download failed. The file may not be available.');
                          }
                        }}
                      >
                        <svg className="w-5 h-5 mr-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium truncate">{attachment.name}</div>
                          <div className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </Button>
                    ))}
                  </>
                )}

                {isMe && (
                  <Button
                    variant="outline"
                    className="h-12 justify-start p-4 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                    onClick={handleDeleteMessage}
                  >
                    <Trash2 className="h-5 w-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Delete Message</div>
                      <div className="text-xs text-muted-foreground">Remove this message permanently</div>
                    </div>
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Avatar className="w-8 h-8 rounded-full">
            <AvatarImage src={message.avatarUrl} alt={message.nickName} />
            <AvatarFallback>{getInitials(message.nickName)}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}
