"use client";

import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

export function ThemeToggleButton() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load theme from Supabase once on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // First check localStorage for immediate response
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          setCurrentTheme(savedTheme);
          document.documentElement.classList.toggle('dark', savedTheme === 'dark');
          setIsLoading(false);
          return;
        }

        if (!user?.uid) {
          // Fallback to system preference if no user
          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const systemTheme = systemPrefersDark ? 'dark' : 'light';
          setCurrentTheme(systemTheme);
          document.documentElement.classList.toggle('dark', systemTheme === 'dark');
          localStorage.setItem('theme', systemTheme);
          setIsLoading(false);
          return;
        }

        // Load from Supabase
        const { data } = await supabase
          .from('user_preferences')
          .select('theme')
          .eq('user_id', user.uid)
          .single();

        if (data?.theme) {
          setCurrentTheme(data.theme);
          document.documentElement.classList.toggle('dark', data.theme === 'dark');
          localStorage.setItem('theme', data.theme);
        } else {
          // New user - set default theme
          const defaultTheme = 'light';
          setCurrentTheme(defaultTheme);
          document.documentElement.classList.toggle('dark', false);
          localStorage.setItem('theme', defaultTheme);

          // Save default theme to Supabase
          await supabase
            .from('user_preferences')
            .upsert({ user_id: user.uid, theme: defaultTheme }, { onConflict: 'user_id' });
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = systemPrefersDark ? 'dark' : 'light';
        setCurrentTheme(systemTheme);
        document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        localStorage.setItem('theme', systemTheme);
      }
      setIsLoading(false);
    };

    loadTheme();
  }, []); // Remove user dependency to prevent re-loading

  const setTheme = async (newTheme: string) => {
    try {
      // Update localStorage immediately for instant response
      localStorage.setItem('theme', newTheme);

      // Update DOM immediately
      document.documentElement.classList.toggle('dark', newTheme === 'dark');

      // Update local state
      setCurrentTheme(newTheme);

      // Update Supabase in background (don't await to prevent UI blocking)
      if (user?.uid) {
        (async () => {
          try {
            await supabase
              .from('user_preferences')
              .upsert({ user_id: user.uid, theme: newTheme }, { onConflict: 'user_id' });
          } catch (error) {
            console.error('Error saving theme to Supabase:', error);
          }
        })();
      }
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      disabled={isLoading}
      aria-label={currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      suppressHydrationWarning
      className="relative overflow-hidden w-14 h-8 rounded-full flex items-center justify-between px-1.5"
    >
      <div className={cn(
        "absolute left-1 transition-transform duration-300 ease-in-out",
        currentTheme === 'dark' ? 'translate-x-6' : 'translate-x-0'
      )}>
        {currentTheme === 'light' ?
            <Sun className="h-5 w-5 text-yellow-500" /> :
            <Moon className="h-5 w-5 text-slate-400" />}
      </div>
    </Button>
  );
}
