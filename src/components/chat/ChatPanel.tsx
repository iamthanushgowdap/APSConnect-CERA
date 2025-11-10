"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Smile, Send, X, RefreshCw } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  onSendMessageWithFiles?: (message: string, files: File[]) => void;
  onEmojiClick?: () => void;
  onFileClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function ChatPanel({
  onSendMessage,
  onSendMessageWithFiles,
  onEmojiClick,
  onFileClick,
  placeholder = "Type a message...",
  disabled = false,
  value,
  onChange,
  className = ""
}: ChatPanelProps) {
  const [internalMessage, setInternalMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use controlled value if provided, otherwise use internal state
  const message = value !== undefined ? value : internalMessage;
  const updateMessage = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalMessage(newValue);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && attachedFiles.length === 0) || isSending) return;

    setIsSending(true);
    try {
      if (attachedFiles.length > 0 && onSendMessageWithFiles) {
        // Send with files
        await onSendMessageWithFiles(message.trim(), attachedFiles);
      } else {
        // Send text only
        await onSendMessage(message.trim());
      }

      // Clear both message and files
      updateMessage('');
      setAttachedFiles([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    updateMessage(message + emoji);
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newFiles = Array.from(files);
        setAttachedFiles(prev => [...prev, ...newFiles]);

        // Call onFileClick if provided
        if (onFileClick) {
          onFileClick();
        }
      }
    };
    input.click();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateMessage(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className={`p-4 bg-gradient-to-t from-white/10 to-white/5 dark:from-black/10 dark:to-black/5 backdrop-blur-sm border-t border-white/20 ${className}`}>
      {/* File Preview Section with Glass Effect */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 p-3 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-lg p-2 border border-white/30 dark:border-black/30">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex items-center gap-2">
          <button
            className="h-10 w-10 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-black/20 flex items-center justify-center transition-all duration-200 hover:scale-105"
            onClick={handleFileClick}
            disabled={disabled}
            aria-label="Add file"
          >
            <Plus className="h-5 w-5 text-foreground" />
          </button>

          <EmojiPicker onEmojiSelect={handleEmojiSelect}>
            <button
              className="h-10 w-10 rounded-full bg-white/10 dark:bg-black/10 hover:bg-white/20 dark:hover:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-black/20 flex items-center justify-center transition-all duration-200 hover:scale-105"
              disabled={disabled}
              aria-label="Add emoji"
            >
              <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </EmojiPicker>
        </div>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            className="min-h-[44px] max-h-32 resize-none rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-black/20 px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50"
            placeholder={placeholder || "💬 Type your message..."}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
          />
        </div>

        <Button
          className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachedFiles.length === 0) || isSending}
          size="sm"
        >
          {isSending ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
