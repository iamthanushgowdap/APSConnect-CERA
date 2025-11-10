"use client";

import React, { useEffect, useRef } from 'react';
import { CleanMessage } from './CleanMessage';
import { MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  avatarUrl?: string;
  nickName: string;
  content: string;
  type: 'me' | 'other';
  timestamp?: string;
  messageType?: 'text' | 'image' | 'audio' | 'document' | 'gallery' | 'url';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  duration?: string;
  images?: string[];
  urlPreview?: {
    title: string;
    description: string;
    image: string;
    url: string;
  };
  reactions?: { emoji: string; count: number; users: string[] }[];
  status?: 'sent' | 'delivered' | 'read';
  author_uid?: string; // Add author_uid for avatar fetching
}

interface ChatInterfaceProps {
  messages: Message[];
  onEmojiClick?: (messageId: string) => void;
  onCopyMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onShareMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
  className?: string;
  cardMode?: boolean; // New prop to indicate if used inside a card
}

export function ChatInterface({
  messages,
  onEmojiClick,
  onCopyMessage,
  onDeleteMessage,
  onShareMessage,
  onAddReaction,
  currentUserId,
  className = '',
  cardMode = false
}: ChatInterfaceProps) {
  console.log('🎨 ChatInterface received messages:', messages?.length || 0);
  console.log('🎨 ChatInterface message sample:', messages?.slice(0, 2)?.map(m => ({
    id: m.id,
    content: m.content?.substring(0, 30),
    type: m.type,
    author_uid: m.author_uid,
    avatarUrl: m.avatarUrl
  })));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`h-full overflow-hidden relative ${className}`}>
      {/* Glass background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 dark:from-black/5 dark:via-transparent dark:to-black/5 pointer-events-none" />

      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 dark:scrollbar-thumb-black/20 hover:scrollbar-thumb-white/30 dark:hover:scrollbar-thumb-black/30 px-4 py-2 relative z-10">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 dark:from-blue-400/10 dark:to-purple-500/10 flex items-center justify-center mb-4 backdrop-blur-sm">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to the conversation!</h3>
            <p className="text-muted-foreground max-w-md">
              Be the first to start this conversation. Share your thoughts, ideas, and connect with others in this group.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <CleanMessage
                  message={message}
                  onEmojiClick={() => onEmojiClick?.(message.id)}
                  onCopyMessage={onCopyMessage}
                  onDeleteMessage={onDeleteMessage}
                  onShareMessage={onShareMessage}
                  onAddReaction={onAddReaction}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

// CSS Styles (to be added to globals.css or as styled-components)
export const chatStyles = `
/* Chat Interface Styles */
.chat {
  background: var(--chat-background, rgba(10, 14, 14, 0.95));
  max-width: 600px;
  margin: 25px auto;
  box-sizing: border-box;
  padding: 1em;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.chat::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url(https://images.unsplash.com/photo-1495808985667-ba4ce2ef31b3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80) fixed;
  z-index: -1;
  opacity: 0.1;
}

.chat__conversation-board {
  padding: 1em 0 2em;
  height: calc(100vh - 55px - 2em - 25px * 2 - .5em - 3em);
  overflow: auto;
}

.chat__conversation-board__message-container {
  position: relative;
  display: flex;
  flex-direction: row;
  margin: 0 0 2em 0;
}

.chat__conversation-board__message-container:hover .chat__conversation-board__message__options {
  display: flex;
  align-items: center;
}

.chat__conversation-board__message-container .option-item:not(:last-child) {
  margin: 0 .5em 0 0;
}

.chat__conversation-board__message-container.reversed {
  flex-direction: row-reverse;
}

.chat__conversation-board__message-container.reversed .chat__conversation-board__message__person {
  margin: 0 0 0 1.2em;
}

.chat__conversation-board__message-container.reversed .chat__conversation-board__message__options {
  align-self: center;
  position: absolute;
  left: 0;
  display: none;
}

.chat__conversation-board__message__person {
  text-align: center;
  margin: 0 1.2em 0 0;
}

.chat__conversation-board__message__person__avatar {
  height: 35px;
  width: 35px;
  overflow: hidden;
  border-radius: 50%;
  user-select: none;
  position: relative;
}

.chat__conversation-board__message__person__nickname {
  font-size: 9px;
  color: #484848;
  user-select: none;
  display: none;
}

.chat__conversation-board__message__context {
  max-width: 55%;
  align-self: flex-end;
}

.chat__conversation-board__message__options {
  align-self: center;
  position: absolute;
  right: 0;
  display: none;
}

.chat__conversation-board__message__option-button {
  border: 0;
  background: 0;
  padding: 0;
  margin: 0;
  height: 16px;
  width: 16px;
  outline: none;
  cursor: pointer;
}

.emoji-button svg {
  stroke: var(--chat-options-svg, #a3a3a3);
  fill: transparent;
  width: 100%;
}

.more-button svg {
  stroke: var(--chat-options-svg, #a3a3a3);
  fill: transparent;
  width: 100%;
}

.chat__conversation-board__message__bubble {
  width: fit-content;
  display: inline-table;
  word-wrap: break-word;
  background: var(--chat-bubble-background, #14181a);
  font-size: 13px;
  color: var(--chat-text-color, #a3a3a3);
  padding: .5em .8em;
  line-height: 1.5;
  border-radius: 6px;
  font-family: 'Lato', sans-serif;
  margin: 0 0 .3em;
}

.chat__conversation-board__message__bubble:active {
  background: var(--chat-bubble-active-background, #1a1d1f);
}

.chat__conversation-panel {
  background: var(--chat-panel-background, #131719);
  border-radius: 12px;
  padding: 0 1em;
  height: 55px;
  margin: .5em 0 0;
}

.chat__conversation-panel__container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
}

.chat__conversation-panel__container .panel-item:not(:last-child) {
  margin: 0 1em 0 0;
}

.chat__conversation-panel__button {
  background: grey;
  height: 20px;
  width: 30px;
  border: 0;
  padding: 0;
  outline: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-file-button {
  height: 23px !important;
  min-width: 23px !important;
  width: 23px !important;
  background: var(--chat-add-button-background, #212324) !important;
  border-radius: 50% !important;
}

.emoji-button {
  min-width: 23px !important;
  width: 23px !important;
  height: 23px !important;
  background: transparent !important;
  border-radius: 50% !important;
}

.send-message-button {
  background: var(--chat-send-button-background, #8147fc) !important;
  height: 30px !important;
  min-width: 30px !important;
  border-radius: 50% !important;
  transition: .3s ease !important;
}

.send-message-button:active {
  transform: scale(.97);
}

.chat__conversation-panel__input {
  width: 100%;
  height: 100%;
  outline: none;
  position: relative;
  color: var(--chat-text-color, #a3a3a3);
  font-size: 13px;
  background: transparent;
  border: 0;
  font-family: 'Lato', sans-serif;
  resize: none;
  min-height: 20px;
}

/* Dark Theme Variables */
.chat {
  --chat-background: rgba(10, 14, 14, 0.95);
  --chat-panel-background: #131719;
  --chat-bubble-background: #14181a;
  --chat-add-button-background: #212324;
  --chat-send-button-background: #8147fc;
  --chat-text-color: #a3a3a3;
  --chat-options-svg: #a3a3a3;
}

/* Mobile Responsive */
@media only screen and (max-width: 600px) {
  .chat {
    margin: 0;
    border-radius: 0;
  }

  .chat__conversation-board {
    height: calc(100vh - 55px - 2em - .5em - 3em);
  }

  .chat__conversation-board__message__options {
    display: none !important;
  }
}
`;
