"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileDown, Send, Mic, MicOff, Trash2, MessageSquare, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { SpinnerWithDot } from '@/components/ui/loading-spinners';
import { Dock, DockIcon, DockItem, DockLabel } from "@/components/ui/dock";

interface Message {
  id: string
  text: string
  sender: 'user' | 'cera'
  timestamp: Date
  type: 'text' | 'profile_card'
  status?: 'sent' | 'delivered' | 'read'
}

interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'ml';
  voiceEnabled: boolean;
}

interface ProfileCardProps {
  message: Message;
  onGenerateResume: () => void;
  isGeneratingResume: boolean;
}

function ProfileCard({ message, onGenerateResume, isGeneratingResume }: ProfileCardProps) {
  const profileData = JSON.parse(message.text);
  const profile = profileData.data;

  return (
    <div className="profile-card">
      <style jsx>{`
        .profile-card {
          max-width: none;
          width: 100%;
          margin: 0 auto;
          background: var(--secondary-color, #ffffff);
          border: 1px solid var(--border-color, rgba(59, 130, 246, 0.15));
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 6px 24px rgba(14, 21, 40, 0.08);
          font-family: Inter, system-ui, sans-serif;
          color: var(--text-color, #0f172a);
          transition: all 0.3s ease;
        }

        .profile-header {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;
          font-weight: 600;
        }

        .profile-info {
          flex: 1;
        }

        .profile-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-color, #1e293b);
          margin-bottom: 4px;
        }

        .profile-role {
          font-size: 14px;
          color: var(--subheading-color, #64748b);
          background: var(--primary-color, #f1f5f9);
          padding: 4px 8px;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .profile-note {
          font-size: 12px;
          color: var(--subheading-color, #64748b);
          text-align: center;
          margin-bottom: 12px;
          font-style: italic;
        }

        .profile-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .detail-item {
          background: var(--primary-color, #f8fafc);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 8px;
          padding: 12px;
        }

        .detail-label {
          font-size: 12px;
          color: var(--subheading-color, #64748b);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 16px;
          color: var(--text-color, #1e293b);
          font-weight: 600;
        }

        .profile-actions {
          margin-top: 16px;
          text-align: center;
        }

        .resume-button {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: 0.2s ease;
        }

        .resume-button:hover {
          background: linear-gradient(135deg, #059669, #047857);
        }

        .resume-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>

      <div className="profile-header">
        <div className="profile-avatar">
          {(profile.full_name || profile.display_name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-name">{profile.full_name || profile.display_name || 'Student'}</div>
          <div className="profile-role">{profile.role || 'student'}</div>
        </div>
      </div>

      <div className="profile-note">Profile information from your account settings</div>

      <div className="profile-details">
        <div className="detail-item">
          <div className="detail-label">USN</div>
          <div className="detail-value">{profile.student_id || profile.usn || 'Not provided'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Branch</div>
          <div className="detail-value">{profile.branch || profile.department || 'Not specified'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Semester</div>
          <div className="detail-value">{profile.semester || profile.year_of_study || 'Not specified'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Email</div>
          <div className="detail-value">{profile.email || 'Not provided'}</div>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className="resume-button"
          onClick={onGenerateResume}
          disabled={isGeneratingResume}
        >
          {isGeneratingResume ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4" />
              Generate Resume
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function CERAPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [showResumeButton, setShowResumeButton] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'kn' | 'te' | 'ta' | 'ml'>('en');
  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    theme: 'light',
    language: 'en',
    voiceEnabled: false
  });

  // TTS State Management - Simplified
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [autoSpeakResponses, setAutoSpeakResponses] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast();

  // Role-based access control - only allow students
  const allowedRoles = ['student'];
  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (userPrefs.language) {
      setSelectedLanguage(userPrefs.language);
    }
  }, [userPrefs.language]);

  // Load available voices for TTS
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    // Start with empty messages - no welcome message
    setMessages([])
  }, [])

  // Listen for messages from profile card resume button
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'generate_resume') {
        handleGenerateResume();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerWithDot className="h-12 w-12 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You must be logged in to access CERA AI.</p>
          <a href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
        <div className="text-center max-w-2xl mx-auto px-6">
          <div className="text-6xl md:text-8xl font-bold text-red-600 dark:text-red-400 mb-8">
            ACCESS DENIED
          </div>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
            CERA AI is only available for students.
          </p>
          <a href={user.role === 'admin' ? '/admin' : user.role === 'faculty' ? '/faculty' : user.role === 'alumni' ? '/alumni' : '/student'} className="bg-primary text-primary-foreground px-6 py-3 rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors inline-block">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/\n/g, '<br>')
  }

  const clearChat = () => {
    setMessages([])
    setShowResumeButton(false)
    setShowGraph(false)
    setGraphData(null)
    // Reset to welcome message after clearing
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: "I am CERA, your education assistant. I am here to help you with your assignments, fees, attendance, schedule, and more.",
        sender: 'cera',
        timestamp: new Date(),
        type: 'text',
        status: 'read'
      }
      setMessages([welcomeMessage])
    }, 200)
  }

  const handleGenerateResume = async () => {
    if (user?.role !== 'student') {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: '❌ **Resume Generation Not Available**\n\nResume generation is only available for students. Faculty, alumni, and admin users do not have access to this feature.',
        sender: 'cera',
        timestamp: new Date(),
        type: 'text',
        status: 'read'
      }]);
      return;
    }

    if (!user) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I need your user information to generate a resume.',
        sender: 'cera',
        timestamp: new Date(),
        type: 'text',
        status: 'read'
      }]);
      return;
    }

    setIsGeneratingResume(true);

    try {
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.uid)
        .single();

      if (error || !profileData) {
        throw new Error('Could not fetch your profile data. Please complete your profile first.');
      }

      const loadingToast = toast({
        title: "Generating Resume",
        description: "Creating your professional CV...",
      });

      const resumeHTML = generateResumeHTML(profileData);

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          html: resumeHTML,
          fileName: `${profileData.full_name || 'Resume'}_CV.pdf`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${profileData.full_name || 'Resume'}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      loadingToast.dismiss?.();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: '✅ **Resume Downloaded Successfully!**\n\nYour professional CV has been saved to your downloads folder. You can now share it with potential employers!',
        sender: 'cera',
        timestamp: new Date(),
        type: 'text',
        status: 'read'
      }]);

      toast({
        title: "Resume Downloaded",
        description: "Your professional CV has been saved to your downloads folder.",
        duration: 5000,
      });

    } catch (error: any) {
      console.error('Error generating resume:', error);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: `❌ **Resume Generation Failed**\n\n${error.message || 'An error occurred while generating your resume. Please try again or complete your profile first.'}`,
        sender: 'cera',
        timestamp: new Date(),
        type: 'text',
        status: 'read'
      }]);

      toast({
        title: "Error",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // TTS Functions
  const preprocessTextForSpeech = (text: string): string => {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, 'code block')
      .replace(/`([^`]+)`/g, '$1')
      // Handle links - speak the text, not the URL
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove or simplify emojis (they can cause issues)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      // Handle mathematical expressions
      .replace(/[\d+\-*/=()]+/g, (match) => {
        if (match.length > 10) return 'mathematical expression';
        return match.replace(/\+/g, 'plus').replace(/-/g, 'minus').replace(/\*/g, 'times').replace(/\//g, 'divided by');
      })
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speakText = async (text: string, options: { autoSpeak?: boolean; manual?: boolean } = {}) => {
    // Allow manual speech from buttons regardless of TTS toggle state
    // Only auto-speak requires TTS to be enabled
    if (!options.manual && !ttsEnabled && !options.autoSpeak) return;
    if (!('speechSynthesis' in window)) {
      toast({
        title: "TTS Not Supported",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Stop any current speech
      if (isSpeaking) {
        speechSynthesis.cancel();
      }

      const processedText = preprocessTextForSpeech(text);
      
      if (!processedText.trim()) {
        console.log('No speakable text found');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(processedText);
      
      // Set default voice to Google Hindi India
      const googleHindiVoice = availableVoices.find(voice => 
        voice.name.includes('Google') && 
        (voice.name.includes('हिन्दी') || voice.name.includes('Hindi')) &&
        voice.lang === 'hi-IN'
      );
      
      if (googleHindiVoice) {
        utterance.voice = googleHindiVoice;
      } else {
        // Fallback to first available Hindi voice, then English
        const hindiVoices = availableVoices.filter(voice => voice.lang.startsWith('hi'));
        if (hindiVoices.length > 0) {
          utterance.voice = hindiVoices[0];
        } else {
          // Ultimate fallback to first English voice
          const englishVoices = availableVoices.filter(voice => voice.lang.startsWith('en'));
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
          }
        }
      }
      
      // Set default speech properties
      utterance.rate = 1; // Normal speed
      utterance.pitch = 1; // Normal pitch
      utterance.volume = 1;
      // Language will be set based on the voice selected above

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentUtterance(utterance);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentUtterance(null);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        setCurrentUtterance(null);
        
        // Don't show toast for 'interrupted' errors (expected when stopping speech)
        if (event.error !== 'interrupted') {
          toast({
            title: "Speech Error",
            description: "An error occurred while speaking. Please try again.",
            variant: "destructive",
          });
        }
      };

      // Speak
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      setCurrentUtterance(null);
      toast({
        title: "Speech Error",
        description: "Failed to initialize text-to-speech.",
        variant: "destructive",
      });
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentUtterance(null);
    }
  };

  const toggleTTS = () => {
    if (ttsEnabled) {
      // Disable TTS and auto-speak
      if (isSpeaking) {
        stopSpeaking();
      }
      setTtsEnabled(false);
      setAutoSpeakResponses(false);
      toast({
        title: "🔇 Auto-Speak Disabled",
        description: "Text-to-speech for new messages is now turned off",
        variant: "default",
      });
    } else {
      // Enable TTS with auto-speak for text messages only
      setTtsEnabled(true);
      setAutoSpeakResponses(true);
      toast({
        title: "🔊 Auto-Speak Enabled",
        description: "Text messages will now be spoken automatically",
        variant: "default",
      });
    }
  };

  // Helper function to determine if TTS button should show for a message
  // Available for all appropriate messages, independent of main TTS toggle
  const canShowTtsButton = (message: Message): boolean => {
    // Don't show TTS button for profile cards
    if (message.type === 'profile_card') {
      return false;
    }
    
    // Don't show for HTML cards (messages with <style> tags)
    if (message.text && message.text.includes('<style>')) {
      return false;
    }
    
    // Show for all text messages (welcome, simple responses, etc.)
    if (typeof message.text === 'string') {
      const hasHtmlTags = /<[^>]*>/g.test(message.text);
      return !hasHtmlTags; // Show for plain text messages
    }
    
    return false;
  };

  const copyMessage = (copyButton: any) => {
    const messageText = copyButton.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
  };

  const generateResumeHTML = (profile: any) => {
    const formatDescription = (text: string) => {
      if (!text) return '';
      const items = text.split(/[\n\r]|•/).map(item => item.trim()).filter(item => item.length > 0);
      if (items.length === 0) return '';
      return `<ul style="padding-left: 20px; margin-top: 4px;">${items.map(item => `<li style="margin-bottom: 2px; font-size: 10pt;">${item}</li>`).join('')}</ul>`;
    };

    const isStudent = profile.role === 'student';
    const isAlumni = profile.role === 'alumni';

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${profile.full_name || 'Resume'} - CV</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Arial:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        max-width: 880px;
        margin: 0 auto;
        padding: 32px 80px;
        position: relative;
        box-sizing: border-box;
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #000;
        background: white;
      }

      .header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #2c3e50;
        padding-bottom: 16px;
      }

      .header h1 {
        font-family: Arial, sans-serif;
        font-size: 20pt;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .contact-info {
        font-size: 10pt;
        margin: 8px 0;
        text-align: center;
      }

      .contact-info a {
        color: #2c3e50;
        text-decoration: none;
      }

      .section {
        margin-bottom: 20px;
      }

      .section h2 {
        font-family: Arial, sans-serif;
        font-size: 13pt;
        font-weight: 600;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 16px 0 8px 0;
        border-bottom: 1px solid #34495e;
        padding-bottom: 2px;
      }

      .experience-item, .education-item {
        margin-bottom: 12px;
      }

      .position-title, .degree, .project-title {
        font-weight: 900;
        font-size: 11pt;
        margin-bottom: 2px;
        color: #000000;
      }

      .organization, .institution {
        font-style: italic;
        color: #34495e;
        margin-bottom: 4px;
        font-weight: 600;
      }

      .date {
        font-size: 10pt;
        color: #666;
        float: right;
        font-weight: normal;
      }

      .details {
        margin-left: 16px;
        margin-top: 4px;
      }

      .details ul {
        list-style: disc;
        padding-left: 20px;
        margin-top: 4px;
        font-size: 10pt;
      }

      .details li {
        margin-bottom: 2px;
      }

      li {
        margin-bottom: 1px;
      }

      .clearfix::after {
        content: '';
        display: table;
        clear: both;
      }

      .gpa {
        font-weight: 900;
        color: #000000;
      }

      @media print {
        body {
          margin: 0;
          padding: 20px;
          background: white !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }

        html, body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        body {
          padding: 20mm;
          box-sizing: border-box;
        }

        .header {
          margin-bottom: 20px;
          page-break-after: avoid;
        }

        .section {
          page-break-inside: avoid;
        }

        h2 {
          page-break-after: avoid;
        }

        .experience-item, .education-item {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${profile.full_name || 'Name Not Provided'}</h1>
      <div class="contact-info">
        ${profile.email || ''} | ${profile.phone || ''} | ${profile.address || ''}<br>
        ${profile.linkedin_url ? `<a href="${profile.linkedin_url}">LinkedIn</a> | ` : ''}${profile.github_url ? `<a href="${profile.github_url}">GitHub</a> | ` : ''}${profile.portfolio_url ? `<a href="${profile.portfolio_url}">Portfolio</a>` : ''}
      </div>
    </div>

    ${(profile.bio || profile.summary) ? `
    <div class="section">
      <h2>Professional Summary</h2>
      <p style="font-size: 10pt; margin-top: 4px;">${profile.bio || profile.summary}</p>
    </div>
    ` : ''}

    ${profile.education && profile.education.length > 0 ? `
    <div class="section">
      <h2>Education</h2>
      ${profile.education.map((edu: any) => `
        <div class="clearfix" style="margin-bottom: 12px;">
          <span class="degree">${edu.degree || 'Degree Not Specified'}</span>
          <span class="date">${edu.graduationYear || 'Year Not Specified'}</span>
        </div>
        <div class="institution">${edu.institution || 'Institution Not Specified'}</div>
        <div><span class="gpa">${edu.scoreType === 'cgpa' ? 'CGPA' : 'Score'}: ${edu.score || 'N/A'}</span></div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.experience && profile.experience.length > 0 ? `
    <div class="section">
      <h2>Experience</h2>
      ${profile.experience.map((exp: any) => `
        <div style="margin-bottom: 12px;">
          <div class="clearfix">
            <span class="position-title">${exp.title || 'Position Not Specified'}</span>
            <span class="date">${exp.duration || 'Duration Not Specified'}</span>
          </div>
          <div class="organization">${exp.company || 'Company Not Specified'}</div>
          ${exp.description ? `<div style="margin-left: 16px; margin-top: 4px;">${formatDescription(exp.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.projects && profile.projects.length > 0 ? `
    <div class="section">
      <h2>Projects</h2>
      ${profile.projects.map((proj: any) => `
        <div style="margin-bottom: 12px;">
          <div class="clearfix">
            <span class="project-title">${proj.title || 'Project Title'}</span>
          </div>
          ${proj.description ? `<div style="margin-left: 16px; margin-top: 4px;">${formatDescription(proj.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.skills && profile.skills.length > 0 ? `
    <div class="section">
      <h2>Technical Skills</h2>
      <p style="font-size: 10pt; margin-top: 4px;"><strong>Skills:</strong> ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}</p>
    </div>
    ` : ''}

    ${profile.certifications && profile.certifications.length > 0 ? `
    <div class="section">
      <h2>Certifications</h2>
      <ul style="font-size: 10pt; padding-left: 20px;">
        ${profile.certifications.map((cert: any) => `
          <li style="margin-bottom: 2px;">
            <strong>${cert.name || 'Certification Name'}</strong>${cert.issuingBody ? `, ${cert.issuingBody}` : ''}${cert.year ? ` (${cert.year})` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${profile.achievements && profile.achievements.length > 0 ? `
    <div class="section">
      <h2>Achievements & Honors</h2>
      <ul style="font-size: 10pt; padding-left: 20px;">
        ${profile.achievements.map((achievement: any) => `
          <li style="margin-bottom: 2px;">${achievement.description || achievement}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${isAlumni ? `
    <div class="section">
      <h2>Professional Information</h2>
      ${profile.placement_company ? `<p style="font-size: 10pt;"><strong>Company:</strong> ${profile.placement_company}</p>` : ''}
      ${profile.placement_job_title ? `<p style="font-size: 10pt;"><strong>Position:</strong> ${profile.placement_job_title}</p>` : ''}
      ${profile.referral_info ? `<p style="font-size: 10pt;"><strong>Referral Info:</strong> ${profile.referral_info}</p>` : ''}
    </div>
    ` : ''}

  </body>
</html>`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return

    setShowResumeButton(false);

    const userMessage: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text',
      status: 'sent'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const requestData = {
        userQuery: text,
        userContext: {
          user_id: user.uid,
          branch: user.branch || 'Unknown',
          semester: user.semester || 'Unknown',
          full_name: user.displayName || 'Student'
        },
        language: selectedLanguage,
        theme: userPrefs.theme,
        voiceEnabled: userPrefs.voiceEnabled
      };

      const response = await fetch('/api/cera/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        if (data.answer && typeof data.answer === 'object' && data.answer.type === 'profile_card') {
          setMessages(prev => [...prev, {
            id: `cera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: JSON.stringify(data.answer),
            sender: 'cera',
            timestamp: new Date(),
            type: 'profile_card',
            status: 'read'
          }]);
        } else {
          setMessages(prev => [...prev, { 
            id: `cera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            text: data.answer, 
            sender: 'cera', 
            timestamp: new Date(), 
            type: 'text', 
            status: 'read' 
          }]);
        }

        // Auto-speak CERA responses if TTS is enabled (only for plain text responses)
        if (autoSpeakResponses && ttsEnabled && !isSpeaking) {
          let speakableText = '';
          let shouldSpeak = false;
          
          // Only speak plain text responses (welcome messages, simple text responses)
          // Skip HTML cards, styled responses, and profile cards
          if (typeof data.answer === 'string') {
            // Check if it's plain text (no HTML tags, no card styling)
            const hasHtmlTags = /<[^>]*>/g.test(data.answer);
            const isWelcomeMessage = data.answer.toLowerCase().includes('hello') || 
                                   data.answer.toLowerCase().includes('welcome') ||
                                   data.answer.toLowerCase().includes('how can i help');
            const isSimpleResponse = !hasHtmlTags && data.answer.length < 500; // Simple responses under 500 chars
            
            if (isWelcomeMessage || isSimpleResponse) {
              speakableText = data.answer;
              shouldSpeak = true;
            }
          } else if (typeof data.answer === 'object' && data.answer?.type === 'profile_card') {
            // Explicitly skip profile cards
            shouldSpeak = false;
          }
          
          if (shouldSpeak && speakableText && typeof speakableText === 'string' && speakableText.trim()) {
            // Small delay to ensure message is rendered first
            setTimeout(() => speakText(speakableText, { autoSpeak: true }), 500);
          }
        }

        if (data.graphData) {
          setShowGraph(true);
          setGraphData(data.graphData);
        }

        if (data.notifications && data.notifications.length > 0 && user) {
          import('@/lib/supabase').then(async ({ supabase }) => {
            try {
              const notifications = data.notifications.map((notif: any) => ({
                id: `cera-${notif.type}-${Date.now()}-${Math.random()}`,
                user_id: user.uid,
                type: notif.type,
                title: notif.type === 'assignment_deadline' ? 'Assignment Due Soon' :
                       notif.type === 'low_attendance' ? 'Low Attendance Warning' :
                       notif.type === 'fee_due' ? 'Overdue Fees' : 'CERA Notification',
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
              }
            } catch (err) {
              console.error('Exception while saving CERA notifications:', err);
            }
          });
        }

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
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: data.error || data.detail || 'An unknown error occurred on the server.',
          sender: 'cera',
          timestamp: new Date(),
          type: 'text',
          status: 'read'
        }]);
      }
    } catch (error) {
      console.error("🚨 Fetch error:", error);
      setMessages(prev => [...prev, {
        id: `fetch-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: 'A network error occurred. Please check your connection and API key.',
        sender: 'cera',
        timestamp: new Date(),
        type: 'text',
        status: 'read'
      }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => setIsRecording(true)
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsRecording(false)
      }
      recognition.onerror = () => setIsRecording(false)
      recognition.onend = () => setIsRecording(false)

      if (isRecording) recognition.stop()
      else recognition.start()
    }
  }

  const changeLanguage = async (newLanguage: 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'ml') => {
    setSelectedLanguage(newLanguage);
    setUserPrefs((prev: UserPreferences) => ({ ...prev, language: newLanguage }));
    await saveUserPreferences({ language: newLanguage });

    // Send a language change message to get the translated response from the API
    const languageMessage = `change language to ${newLanguage === 'hi' ? 'hindi' : newLanguage === 'kn' ? 'kannada' : newLanguage === 'te' ? 'telugu' : newLanguage === 'ta' ? 'tamil' : newLanguage === 'ml' ? 'malayalam' : 'english'}`;
    await sendMessage(languageMessage);
  };

  const saveUserPreferences = async (preferences: { theme?: string; language?: string; voiceEnabled?: boolean }) => {
    try {
      const dbPreferences: any = {
        user_id: user?.uid,
        updated_at: new Date().toISOString()
      };

      if (preferences.theme !== undefined) dbPreferences.theme = preferences.theme;
      if (preferences.language !== undefined) dbPreferences.language = preferences.language;
      if (preferences.voiceEnabled !== undefined) dbPreferences.voice_enabled = preferences.voiceEnabled;

      const { error } = await supabase
        .from('user_preferences')
        .upsert(dbPreferences, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving user preferences:', error);
      }
    } catch (error) {
      console.error('Error in saveUserPreferences:', error);
    }
  };

  return (
    <div>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap");
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: "Poppins", sans-serif;
        }
        :root {
          /* Light mode colors */
          --text-color: #222;
          --subheading-color: #a0a0a0;
          --placeholder-color: #6c6c6c;
          --primary-color: #fff;
          --secondary-color: #e9eef6;
          --secondary-hover-color: #dbe1ea;
        }
        .dark {
          /* Dark mode colors when .dark class is on documentElement */
          --text-color: #e3e3e3;
          --subheading-color: #828282;
          --placeholder-color: #a6a6a6;
          --primary-color: #242424;
          --secondary-color: #383838;
          --secondary-hover-color: #444;
        }
        body {
          background: var(--primary-color);
        }
        .header,
        .chat-list .message,
        .typing-form {
          margin: 0 auto;
          max-width: 980px;
        }
        .header {
          margin-top: 6vh;
          padding: 1rem;
          overflow-x: hidden;
        }
        body.hide-header .header {
          margin: 0;
          display: none;
        }
        .header :where(.title, .subtitle) {
          color: var(--text-color);
          font-weight: 500;
          line-height: 4rem;
        }
        .header .title {
          font-size: 3rem;
          font-weight: 700;
          color: var(--heading-color);
          background-clip: text;
          background: linear-gradient(to right, #4285f4, #d96570);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          white-space: nowrap;
          line-height: 1.2;
          position: relative;
          z-index: 10;
        }
        .header .subtitle {
          font-size: 2rem;
          color: var(--subheading-color);
        }
        .chat-list {
          padding: 2rem 1rem 12rem;
          max-height: 100vh;
          overflow-y: auto;
          scrollbar-color: #999 transparent;
        }
        .chat-list .message.incoming {
          margin-top: 1.5rem;
        }
        .chat-list .message .message-content {
          display: flex;
          gap: 1.5rem;
          width: 100%;
          align-items: center;
        }
        .chat-list .message .text {
          color: var(--text-color);
          white-space: pre-wrap;
        }
        .chat-list .message.error .text {
          color: #e55865;
        }
        .chat-list .message.loading .text {
          display: none;
        }
        .chat-list .message .avatar {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 50%;
          align-self: flex-start;
        }
        .chat-list .message.loading .avatar {
          animation: rotate 3s linear infinite;
        }
        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }
        .chat-list .message .icon {
          color: var(--text-color);
          cursor: pointer;
          height: 35px;
          width: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          font-size: 1.25rem;
          margin-left: 3.5rem;
          visibility: hidden;
        }
        .chat-list .message .icon.hide {
          visibility: hidden;
        }
        .chat-list .message:not(.loading, .error):hover .icon:not(.hide) {
          visibility: visible;
        }
        .chat-list .message .icon:hover {
          background: var(--secondary-hover-color);
        }
        .chat-list .message .loading-indicator {
          display: none;
          gap: 0.8rem;
          width: 100%;
          flex-direction: column;
        }
        .chat-list .message.loading .loading-indicator {
          display: flex;
        }
        .chat-list .message .loading-indicator .loading-bar {
          height: 11px;
          width: 100%;
          border-radius: 0.135rem;
          background-position: -800px 0;
          background: linear-gradient(to right, #4285f4, var(--primary-color), #4285f4);
          animation: loading 3s linear infinite;
        }
        .chat-list .message .loading-indicator .loading-bar:last-child {
          width: 70%;
        }
        @keyframes loading {
          0% {
            background-position: -800px 0;
          }
          100% {
            background-position: 800px 0;
          }
        }
        .typing-area {
          position: fixed;
          width: 100%;
          left: 0;
          bottom: 0;
          padding: 1rem;
          background: var(--primary-color);
        }
        .typing-area :where(.typing-form, .action-buttons) {
          display: flex;
          gap: 0.75rem;
        }
        .typing-form .input-wrapper {
          width: 100%;
          height: 56px;
          display: flex;
          position: relative;
        }
        .typing-form .typing-input {
          height: 100%;
          width: 100%;
          border: none;
          outline: none;
          resize: none;
          font-size: 1rem;
          color: var(--text-color);
          padding: 1.1rem 4rem 1.1rem 1.5rem;
          border-radius: 100px;
          background: var(--secondary-color);
        }
        .typing-form .typing-input:focus {
          background: var(--secondary-hover-color);
        }
        .typing-form .typing-input::placeholder {
          color: var(--placeholder-color);
        }
        .typing-area .icon {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          font-size: 1.4rem;
          color: var(--text-color);
          align-items: center;
          justify-content: center;
          background: var(--secondary-color);
          transition: 0.2s ease;
        }
        .typing-area .icon:hover {
          background: var(--secondary-hover-color);
        }
        .typing-form #send-message-button {
          position: absolute;
          right: 0;
          outline: none;
          border: none;
          transform: scale(0);
          background: transparent;
          transition: transform 0.2s ease;
        }
        .typing-form .typing-input:valid ~ #send-message-button {
          transform: scale(1);
        }
        .typing-area .disclaimer-text {
          text-align: center;
          font-size: 0.85rem;
          margin-top: 1rem;
          color: var(--placeholder-color);
        }
        /* Responsive media query code for small screen */
        @media (max-width: 768px) {
          .header :is(.title, .subtitle) {
            font-size: 2rem;
            line-height: 2.6rem;
          }
          .header .subtitle {
            font-size: 1.7rem;
          }
          .hero-container {
            flex-direction: column;
            gap: 1rem;
            padding: 0 0.5rem;
            min-height: auto;
          }
          .hero-left, .hero-right {
            width: 100%;
          }
          
          .hero-right .card {
            height: 300px !important;
            margin-top: 1rem;
          }
          .suggestion-list {
            width: 100%;
            margin-left: 0;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
            padding: 0 0.5rem;
            margin-top: 1vh;
          }
          .suggestion-list .suggestion {
            padding: 1rem;
            min-height: 100px;
          }
          .suggestion-list .suggestion .icon {
            width: 36px;
            height: 36px;
            font-size: 1.1rem;
            margin-top: 1rem;
          }
          .typing-area :where(.typing-form, .action-buttons) {
            gap: 0.4rem;
          }
          .typing-form .input-wrapper {
            height: 50px;
          }
          .typing-form .typing-input {
            padding: 1.1rem 3.5rem 1.1rem 1.2rem;
          }
          .typing-area .icon {
            height: 50px;
            width: 50px;
          }
          .typing-area .disclaimer-text {
            font-size: 0.75rem;
            margin-top: 0.5rem;
          }
        }
      `}</style>

      {/* Header - Show only when no queries have been made */}
      {messages.length <= 1 && (
        <header className="header">
          <div className="hero-container">
            <div className="hero-left">
              <h1 className="title">Hello, there! I'm CERA,</h1>
              <p className="subtitle">How can I help you today?</p>

              <Dock className="bg-gray-50 dark:bg-neutral-900 border-0 shadow-none">
                <DockItem onClick={() => sendMessage("show my timetable")}>
                  <DockIcon>
                    <span className="material-symbols-rounded text-2xl">schedule</span>
                  </DockIcon>
                  <DockLabel>Show my timetable</DockLabel>
                </DockItem>
                <DockItem onClick={() => sendMessage("show my assignments")}>
                  <DockIcon>
                    <span className="material-symbols-rounded text-2xl">assignment</span>
                  </DockIcon>
                  <DockLabel>Show my assignments</DockLabel>
                </DockItem>
                <DockItem onClick={() => sendMessage("show my attendance")}>
                  <DockIcon>
                    <span className="material-symbols-rounded text-2xl">school</span>
                  </DockIcon>
                  <DockLabel>Show my attendance</DockLabel>
                </DockItem>
                <DockItem onClick={() => sendMessage("show my fees")}>
                  <DockIcon>
                    <span className="material-symbols-rounded text-2xl">payments</span>
                  </DockIcon>
                  <DockLabel>Show my fees</DockLabel>
                </DockItem>
                <DockItem onClick={() => sendMessage("show events")}>
                  <DockIcon>
                    <span className="material-symbols-rounded text-2xl">event</span>
                  </DockIcon>
                  <DockLabel>Show events</DockLabel>
                </DockItem>
                <DockItem onClick={() => sendMessage("tell me about me")}>
                  <DockIcon>
                    <span className="material-symbols-rounded text-2xl">person</span>
                  </DockIcon>
                  <DockLabel>About me</DockLabel>
                </DockItem>
              </Dock>
            </div>

            <div className="hero-right">
              <Card className="w-full h-[500px] bg-transparent dark:bg-transparent relative overflow-hidden border-0 shadow-none">
                <div className="flex h-full">
                  <div className="flex-1 relative">
                    <SplineScene
                      scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                      className="w-full h-full scale-125 object-cover"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </header>
      )}

      <div className="chat-list">
        {messages.map((message) => {
          const isHTMLCard = message.sender === 'cera' && message.text.includes('<style>');
          
          return (
            <div key={message.id} className={`message ${message.sender === 'cera' ? 'incoming' : 'outgoing'}`}>
              <div className="message-content">
                {message.sender === 'cera' && (
                  <img className="avatar" src="/chatbot-icon.png" alt="CERA avatar" />
                )}

                {message.type === 'profile_card' ? (
                  <ProfileCard message={message} onGenerateResume={handleGenerateResume} isGeneratingResume={isGeneratingResume} />
                ) : (
                  <p className="text" dangerouslySetInnerHTML={{ __html: isHTMLCard ? message.text : formatMessage(message.text) }}></p>
                )}

                {message.sender === 'cera' && ('speechSynthesis' in window) && canShowTtsButton(message) && (
                  <div className="flex gap-1 ml-2">
                    <button 
                      onClick={() => speakText(message.text, { manual: true })} 
                      className="tts-message-button"
                      title="Speak this message"
                      disabled={isSpeaking}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--secondary-color)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        color: 'var(--text-color)',
                        opacity: isSpeaking ? 0.5 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isSpeaking) {
                          e.currentTarget.style.background = 'var(--secondary-hover-color)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--secondary-color)';
                      }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>volume_up</span>
                    </button>
                  </div>
                )}

                {message.sender === 'user' && (
                  <button onClick={() => copyMessage(message.text)} className="icon">
                    <span className="material-symbols-rounded w-5 h-5 flex items-center justify-center">content_copy</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="message incoming loading">
            <div className="message-content">
              <img className="avatar" src="/chatbot-icon.png" alt="CERA avatar" />
              <p className="text"></p>
              <div className="loading-indicator">
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
                <div className="loading-bar"></div>
              </div>
            </div>
          </div>
        )}

        {showResumeButton && (
          <div className="message incoming">
            <div className="message-content">
              <img className="avatar" src="/chatbot-icon.png" alt="CERA avatar" />
              <div>
                <button
                  onClick={handleGenerateResume}
                  disabled={isGeneratingResume}
                  className="px-6 py-3 rounded-lg transition-all bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:border dark:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {isGeneratingResume ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating Resume...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Generate & Download Resume</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showGraph && graphData && (
          <div className="message incoming">
            <div className="message-content">
              <img className="avatar" src="/chatbot-icon.png" alt="CERA avatar" />
              <div className="p-4 rounded-2xl border bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    📊
                  </div>
                  <h3 className="font-semibold text-lg flex-1">Attendance Analysis by Subject</h3>
                  <button
                    onClick={() => {
                      setShowGraph(false);
                      setGraphData(null);
                    }}
                    className="w-6 h-6 bg-gray-300 hover:bg-gray-400 rounded-full flex items-center justify-center text-xs transition-colors"
                    title="Close graph"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {graphData.chartData?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium truncate" title={item.subject}>
                        {item.subject}
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-right text-sm font-semibold">
                        {item.percentage}%
                      </div>
                      <div className="w-16 text-xs text-gray-500 text-right">
                        ({item.present}/{item.total})
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {graphData.summary?.bestSubject?.subject || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Best Performance</div>
                    <div className="text-sm font-semibold">
                      {graphData.summary?.bestSubject?.percentage || 0}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {graphData.summary?.worstSubject?.subject || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Needs Attention</div>
                    <div className="text-sm font-semibold">
                      {graphData.summary?.worstSubject?.percentage || 0}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                  <div className="text-sm text-gray-600">
                    Overall Attendance: <span className="font-bold text-blue-600">
                      {graphData.summary?.overallPercentage || 0}%
                    </span> ({graphData.summary?.totalRecords || 0} records analyzed)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isRecording && (
          <div className="message incoming">
            <div className="message-content">
              <img className="avatar" src="/chatbot-icon.png" alt="CERA avatar" />
              <p className="text">🎤 Listening... (press Send when done)</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="typing-area">
        <form className="typing-form" onSubmit={(e) => { e.preventDefault(); sendMessage(inputValue); }}>
          <div className="input-wrapper">
            <input 
              type="text" 
              placeholder="Enter a prompt here" 
              className="typing-input" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              required 
              suppressHydrationWarning
            />
            <button id="send-message-button" className="icon" type="submit" suppressHydrationWarning>
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="action-buttons">
            <div className="flex items-center gap-1">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLanguage === 'en'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                title="English"
                suppressHydrationWarning
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLanguage === 'hi'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                title="Hindi"
                suppressHydrationWarning
              >
                हि
              </button>
              <button
                onClick={() => changeLanguage('kn')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLanguage === 'kn'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                title="Kannada"
                suppressHydrationWarning
              >
                ಕ
              </button>
              <button
                onClick={() => changeLanguage('te')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLanguage === 'te'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                title="Telugu"
                suppressHydrationWarning
              >
                తె
              </button>
              <button
                onClick={() => changeLanguage('ta')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLanguage === 'ta'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                title="Tamil"
                suppressHydrationWarning
              >
                த
              </button>
              <button
                onClick={() => changeLanguage('ml')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLanguage === 'ml'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700'
                }`}
                title="Malayalam"
                suppressHydrationWarning
              >
                മ
              </button>
            </div>

            <button id="voice-toggle-button" className="icon" onClick={handleVoiceInput} suppressHydrationWarning>
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* TTS Controls - Simplified */}
            {('speechSynthesis' in window) && (
              <>
                <button 
                  className={`icon ${ttsEnabled ? 'bg-blue-500 text-white' : ''}`}
                  onClick={toggleTTS}
                  title={ttsEnabled ? 'Disable Auto-Speak (Text Messages Only)' : 'Enable Auto-Speak (Text Messages Only)'}
                  suppressHydrationWarning
                >
                  {ttsEnabled ? (
                    <span className="material-symbols-rounded w-5 h-5">volume_up</span>
                  ) : (
                    <span className="material-symbols-rounded w-5 h-5">volume_off</span>
                  )}
                </button>
              </>
            )}

            <button id="delete-chat-button" className="icon" onClick={clearChat} suppressHydrationWarning>
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </form>
        <p className="disclaimer-text">
          CERA may display inaccurate info, so double-check responses.
        </p>
      </div>
    </div>
  )
}
