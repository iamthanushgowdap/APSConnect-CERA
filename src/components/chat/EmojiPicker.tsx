"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
}

const commonEmojis = [
  '😀', '😂', '🥰', '😍', '🤗', '😉', '😎', '🤔',
  '😮', '😢', '😭', '😤', '😡', '🥺', '😴', '🤯',
  '👍', '👎', '👌', '✌️', '🤞', '👏', '🙌', '🤝',
  '❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
  '🔥', '⭐', '✨', '💫', '🎉', '🎊', '🎈', '🎁'
];

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" side="top" align="start">
        <div className="grid grid-cols-8 gap-2">
          {commonEmojis.map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-muted"
              onClick={() => handleEmojiClick(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
