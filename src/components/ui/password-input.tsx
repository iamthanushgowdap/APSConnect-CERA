"use client";

import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends Omit<InputProps, 'type'> {
  className?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const togglePasswordVisibility = () => {
      setIsAnimating(true);
      setShowPassword(!showPassword);
      // Reset animation state after a short delay
      setTimeout(() => setIsAnimating(false), 300);
    };

    return (
      <div className="relative group">
        <Input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn(
            "pr-10 transition-all duration-300 ease-in-out",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
            "hover:shadow-md hover:shadow-primary/5",
            className
          )}
        />

        {/* Eye Icon Button */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "p-1 rounded-md transition-all duration-300 ease-in-out",
            "hover:bg-primary/10 hover:scale-110 active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
            "group-hover:text-primary",
            isAnimating && "animate-pulse"
          )}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <div className="relative w-5 h-5">
            {/* Eye Off Icon */}
            <EyeOff
              className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-300 ease-in-out",
                showPassword
                  ? "opacity-0 scale-0 rotate-180"
                  : "opacity-100 scale-100 rotate-0",
                "text-muted-foreground group-hover:text-primary"
              )}
            />

            {/* Eye Icon */}
            <Eye
              className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-300 ease-in-out",
                showPassword
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-0 -rotate-180",
                "text-primary"
              )}
            />
          </div>
        </button>

        {/* Animated background effect */}
        <div className={cn(
          "absolute inset-0 rounded-md pointer-events-none transition-all duration-300",
          "bg-gradient-to-r from-transparent via-primary/5 to-transparent",
          "opacity-0 group-hover:opacity-100",
          showPassword && "from-primary/10 via-primary/5 to-primary/10"
        )} />

        {/* Ripple effect on click */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-md overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 animate-ping rounded-md" />
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
