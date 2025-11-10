'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Send, Loader, Mic, MicOff } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';

const MESSAGE_TYPES = {
  USER: 'user',
  CERA: 'cera',
  SYSTEM: 'system'
};

interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'kn' | 'te';
  voiceEnabled: boolean;
}

const CERAChat = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    voiceEnabled: false
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Load user preferences on component mount
  useEffect(() => {
    if (user?.uid) {
      loadUserPreferences();
    }
  }, [user?.uid]);

  // Apply theme to document when preferences change
  useEffect(() => {
    applyTheme(userPrefs.theme);
  }, [userPrefs.theme]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize messages when user data loads
  useEffect(() => {
    if (user?.displayName) {
      console.log('👤 CERAChat User object:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        usn: user.usn,
        hasBranch: !!user.branch,
        hasSemester: !!user.semester,
        hasUsn: !!user.usn
      });
      setMessages([{
        type: MESSAGE_TYPES.CERA,
        text: `Hello ${user.displayName}, I am CERA, your Centralized Education Response Assistant. Ask me anything about your assignments, fees, or attendance!`
      }]);
    }
  }, [user?.displayName]);

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1f2937';
      document.body.style.color = '#f9fafb';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#374151';
    }
  };

  const loadUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user preferences:', error);
        return;
      }

      if (data) {
        // Map snake_case database columns to camelCase
        const preferences = {
          language: data.language || 'en',
          theme: data.theme || 'light',
          voiceEnabled: data.voice_enabled || false
        };
        setUserPrefs(preferences);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const saveUserPreferences = async (preferences: { theme?: string; language?: string; voiceEnabled?: boolean }) => {
    try {
      // Map camelCase to snake_case for database
      const dbPreferences: any = {
        user_id: user?.uid,
        updated_at: new Date().toISOString()
      };

      if (preferences.theme !== undefined) dbPreferences.theme = preferences.theme;
      if (preferences.language !== undefined) dbPreferences.language = preferences.language;
      if (preferences.voiceEnabled !== undefined) dbPreferences.voice_enabled = preferences.voiceEnabled;

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(dbPreferences, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving preferences:', error);
        // Don't show error to user for preference saving issues
      } else {
        console.log('✅ Preferences saved successfully');

        // If theme was changed, update the global app theme
        if (preferences.theme && typeof window !== 'undefined') {
          // Update localStorage to trigger theme toggle button
          localStorage.setItem('color-theme', preferences.theme);

          // Update DOM directly for immediate effect
          document.documentElement.classList.toggle('dark', preferences.theme === 'dark');

          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: preferences.theme }
          }));
        }
      }
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
    }
  };

  const startSpeechToText = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.lang = getLanguageCode(userPrefs.language);
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-send after speech recognition
      setTimeout(() => handleSend({ preventDefault: () => {} } as any), 500);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopSpeechToText = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const getLanguageCode = (language: string) => {
    const codes = {
      en: 'en-US',
      hi: 'hi-IN',
      kn: 'kn-IN',
      te: 'te-IN'
    };
    return codes[language as keyof typeof codes] || 'en-US';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || authLoading || !user) return;

    const userQuery = input.trim();
    setMessages(prev => [...prev, { type: MESSAGE_TYPES.USER, text: userQuery }]);
    setInput('');
    setIsLoading(true);

    try {
      const requestData = {
        userQuery,
        userContext: {
          user_id: user.uid,
          branch: user.branch || 'Unknown',
          semester: user.semester || 'Unknown',
          full_name: user.displayName || 'Student'
        },
        language: userPrefs.language,
        theme: userPrefs.theme,
        voiceEnabled: userPrefs.voiceEnabled
      };

      console.log('🚀 Sending to API:', requestData);

      const response = await fetch('/api/cera/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('📦 API Response:', data);

      if (data.success) {
        setMessages(prev => [...prev, { type: MESSAGE_TYPES.CERA, text: data.answer }]);

        // Save CERA notifications to database only (real-time subscription handles UI updates)
        if (data.notifications && data.notifications.length > 0 && user) {
          // Save to Supabase database - real-time subscription will update UI automatically
          import('@/lib/supabase').then(async ({ supabase }) => {
            const notifications = data.notifications.map((notif: any) => ({
              id: `cera-${notif.type}-${Date.now()}-${Math.random()}`,
              user_id: user.uid,
              type: notif.type,
              title: notif.type === 'assignment_deadline' ? 'Assignment Due Soon' :
                     notif.type === 'low_attendance' ? 'Low Attendance Warning' :
                     notif.type === 'overdue_fees' ? 'Overdue Fees' : 'CERA Notification',
              message: notif.message,
              href: '/cera',
              created_at: new Date().toISOString(),
              read: false
            }));

            const { error } = await supabase
              .from('notifications')
              .insert(notifications);

            if (error) {
              console.error('Error saving CERA notifications:', error);
            } else {
              console.log(`Saved ${notifications.length} CERA notifications to database`);
            }
          });
        }

        // Update preferences if they changed
        if (data.language !== userPrefs.language ||
            data.theme !== userPrefs.theme ||
            data.voiceEnabled !== userPrefs.voiceEnabled) {
          const newPrefs: UserPreferences = {
            language: data.language || userPrefs.language,
            theme: data.theme || userPrefs.theme,
            voiceEnabled: data.voiceEnabled !== undefined ? data.voiceEnabled : userPrefs.voiceEnabled
          };
          setUserPrefs(newPrefs);
          await saveUserPreferences(newPrefs);
        }
      } else {
        console.error('❌ API returned error:', data);
        setMessages(prev => [...prev, {
          type: MESSAGE_TYPES.SYSTEM,
          text: data.error || data.detail || 'An unknown error occurred on the server.'
        }]);
      }
    } catch (error) {
      console.error("🚨 Fetch error:", error);
      setMessages(prev => [...prev, {
        type: MESSAGE_TYPES.SYSTEM,
        text: 'A network error occurred. Please check your connection and API key.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const MessageBubble = ({ message }: { message: { type: string; text: string } }) => {
    const isUser = message.type === MESSAGE_TYPES.USER;
    const isSystem = message.type === MESSAGE_TYPES.SYSTEM;
    const isCera = message.type === MESSAGE_TYPES.CERA;

    let bgClass = userPrefs.theme === 'dark'
      ? 'bg-gray-700 text-gray-100'
      : 'bg-gray-100 text-gray-800';
    let alignment = 'justify-start';
    let IconComponent = Bot;

    if (isUser) {
      bgClass = 'bg-indigo-500 text-white';
      alignment = 'justify-end';
      IconComponent = User;
    } else if (isSystem) {
      bgClass = userPrefs.theme === 'dark'
        ? 'bg-red-900 text-red-200 border border-red-700'
        : 'bg-red-100 text-red-600 border border-red-300';
      alignment = 'justify-center';
    }

    // Check if the message contains HTML (starts with <div>)
    const isHtmlContent = isCera && message.text.trim().startsWith('<div');

    return (
      <div className={`flex ${alignment} my-2 w-full`}>
        <div className={`flex items-start ${isHtmlContent ? 'max-w-4xl' : 'max-w-xl'} mx-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isSystem && (
            <div className={`p-2 rounded-full ${isUser
              ? 'ml-3 bg-indigo-100 text-indigo-500'
              : userPrefs.theme === 'dark'
                ? 'mr-3 bg-gray-600 text-gray-300'
                : 'mr-3 bg-gray-200 text-gray-700'
            }`}>
              <IconComponent size={18} />
            </div>
          )}
          <div className={`px-4 py-3 rounded-xl shadow-md ${bgClass} ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'} ${isHtmlContent ? 'max-w-none' : ''}`}>
            {isHtmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: message.text }} />
            ) : (
              <p className="whitespace-pre-wrap">{message.text}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const userRole = user?.role || 'student';

  return (
    <div className={`flex flex-col h-screen w-full max-w-4xl mx-auto shadow-xl ${
      userPrefs.theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b ${
        userPrefs.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
      } flex justify-between items-center sticky top-0 z-10`}>
        <h1 className={`text-2xl font-extrabold flex items-center ${
          userPrefs.theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700'
        }`}>
          <Bot className="w-6 h-6 mr-2" /> CERA AI Assistant
        </h1>
        <div className="flex items-center space-x-4">
          <span className={`text-sm px-3 py-1 rounded-full border ${
            userPrefs.theme === 'dark'
              ? 'text-gray-300 bg-gray-600 border-gray-500'
              : 'text-gray-500 bg-indigo-50 border-indigo-200'
          }`}>
            Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </span>
          <span className={`text-sm px-3 py-1 rounded-full border ${
            userPrefs.theme === 'dark'
              ? 'text-gray-300 bg-gray-600 border-gray-500'
              : 'text-gray-500 bg-indigo-50 border-indigo-200'
          }`}>
            Lang: {userPrefs.language.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Chat Window */}
      <div
        ref={chatWindowRef}
        className={`flex-grow p-4 overflow-y-auto space-y-3 ${
          userPrefs.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start my-2">
            <div className="flex items-start mx-2">
              <div className={`p-2 rounded-full mr-3 ${
                userPrefs.theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}>
                <Bot size={18} />
              </div>
              <div className={`px-4 py-3 rounded-xl shadow-md ${
                userPrefs.theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'
              } rounded-tl-none flex items-center space-x-2`}>
                <Loader className="w-4 h-4 animate-spin" />
                <span>CERA is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className={`p-4 border-t sticky bottom-0 ${
        userPrefs.theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={isListening ? stopSpeechToText : startSpeechToText}
            className={`p-3 rounded-full shadow-lg transition duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : userPrefs.theme === 'dark'
                  ? 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                  : 'bg-gray-400 hover:bg-gray-500 text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`flex-grow p-3 border rounded-full focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-150 ${
              userPrefs.theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            }`}
            placeholder={authLoading ? 'Loading user data...' : `Ask CERA a question about your ${userRole} data...`}
            disabled={isLoading || authLoading || !user}
          />
          <button
            type="submit"
            className={`p-3 rounded-full shadow-lg transition duration-300 ${
              isLoading || authLoading || !user
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            disabled={isLoading || authLoading || !user}
          >
            <Send size={24} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default CERAChat;
