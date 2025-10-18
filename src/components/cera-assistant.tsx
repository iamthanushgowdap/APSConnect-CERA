// Cera.Ai - Centralized Education Response Assistant
// Core component for Gemini-powered AI assistant

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User, RefreshCw } from 'lucide-react';

// Types for Cera.Ai
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'error';
}

interface UserContext {
  userId: string;
  role: 'admin' | 'faculty' | 'student';
  email: string;
  fullName: string;
  branch?: string;
  semester?: string;
  assignedSubjects?: string[];
  assignedBranches?: string[];
  assignedSemesters?: string[];
}

interface DatabaseContext {
  timetables: any[];
  attendanceRecords: any[];
  subjects: any[];
  userProfiles: any[];
  lastUpdated: Date;
}

export default function CeraAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [databaseContext, setDatabaseContext] = useState<DatabaseContext | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;

  try {
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Cera.Ai: Gemini AI initialized successfully');
    } else {
      console.log('⚠️ Cera.Ai: Gemini API key not available');
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ceraSupabase: any = null;

  try {
    if (supabaseUrl && supabaseKey) {
      ceraSupabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cera.Ai: Supabase client initialized');
    } else {
      console.log('⚠️ Cera.Ai: Supabase credentials not available');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            return records;
          }

          return records.filter((record: any) => {
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) return false;

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) return false;

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records;
    };

    // Simple keyword-based responses
    const lowerQuery = query.toLowerCase().trim();
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');

      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;

      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }

      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');

      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;

      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';

          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }

      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();

      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());

      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);

      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Cera.Ai Assistant</span>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Online" : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Cera.Ai is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about timetables, attendance, or anything else..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isInitialized || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isInitialized || isTyping || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={initializeCera}
            disabled={isTyping}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Types for Cera.Ai
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'error';
}

interface UserContext {
  userId: string;
  role: 'admin' | 'faculty' | 'student';
  email: string;
  fullName: string;
  branch?: string;
  semester?: string;
  assignedSubjects?: string[];
  assignedBranches?: string[];
  assignedSemesters?: string[];
}

interface DatabaseContext {
  timetables: any[];
  attendanceRecords: any[];
  subjects: any[];
  userProfiles: any[];
  lastUpdated: Date;
export default function CeraAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [databaseContext, setDatabaseContext] = useState<DatabaseContext | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;

  try {
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Cera.Ai: Gemini AI initialized successfully');
    } else {
      console.log('⚠️ Cera.Ai: Gemini API key not available');
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ceraSupabase: any = null;

  try {
    if (supabaseUrl && supabaseKey) {
      ceraSupabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cera.Ai: Supabase client initialized');
    } else {
      console.log('⚠️ Cera.Ai: Supabase credentials not available');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            return records;
          }

          return records.filter((record: any) => {
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) return false;

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) return false;

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records;
    };

    // Simple keyword-based responses
    const lowerQuery = query.toLowerCase().trim();
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');

      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;

      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }

      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');

      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;

      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';

          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }

      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();

      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());

      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);

      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Cera.Ai Assistant</span>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Online" : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Cera.Ai is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about timetables, attendance, or anything else..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isInitialized || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isInitialized || isTyping || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={initializeCera}
            disabled={isTyping}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Types for Cera.Ai
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'error';
}

interface UserContext {
  userId: string;
  role: 'admin' | 'faculty' | 'student';
  email: string;
  fullName: string;
  branch?: string;
  semester?: string;
  assignedSubjects?: string[];
  assignedBranches?: string[];
  assignedSemesters?: string[];
}

interface DatabaseContext {
  timetables: any[];
  attendanceRecords: any[];
  subjects: any[];
  userProfiles: any[];
  lastUpdated: Date;
export default function CeraAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [databaseContext, setDatabaseContext] = useState<DatabaseContext | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;

  try {
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Cera.Ai: Gemini AI initialized successfully');
    } else {
      console.log('⚠️ Cera.Ai: Gemini API key not available');
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ceraSupabase: any = null;

  try {
    if (supabaseUrl && supabaseKey) {
      ceraSupabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cera.Ai: Supabase client initialized');
    } else {
      console.log('⚠️ Cera.Ai: Supabase credentials not available');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            return records;
          }

          return records.filter((record: any) => {
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) return false;

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) return false;

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records;
    };

    // Simple keyword-based responses
    const lowerQuery = query.toLowerCase().trim();
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');

      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;

      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }

      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');

      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;

      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';

          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }

      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();

      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());

      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);

      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Cera.Ai Assistant</span>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Online" : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Cera.Ai is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about timetables, attendance, or anything else..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isInitialized || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isInitialized || isTyping || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={initializeCera}
            disabled={isTyping}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [databaseContext, setDatabaseContext] = useState<DatabaseContext | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;

  try {
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Cera.Ai: Gemini AI initialized successfully');
    } else {
      console.log('⚠️ Cera.Ai: Gemini API key not available');
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ceraSupabase: any = null;

  try {
    if (supabaseUrl && supabaseKey) {
      ceraSupabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cera.Ai: Supabase client initialized');
    } else {
      console.log('⚠️ Cera.Ai: Supabase credentials not available');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            return records;
          }

          return records.filter((record: any) => {
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) return false;

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) return false;

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records;
    };

    // Simple keyword-based responses
    const lowerQuery = query.toLowerCase().trim();
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');
      
      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;
      
      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');
      
      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;
      
      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';
          
          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();
      
      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());
      
      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Cera.Ai Assistant</span>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Online" : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Cera.Ai is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about timetables, attendance, or anything else..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isInitialized || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isInitialized || isTyping || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={initializeCera}
            disabled={isTyping}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [databaseContext, setDatabaseContext] = useState<DatabaseContext | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;

  try {
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Cera.Ai: Gemini AI initialized successfully');
    } else {
      console.log('⚠️ Cera.Ai: Gemini API key not available');
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ceraSupabase: any = null;

  try {
    if (supabaseUrl && supabaseKey) {
      ceraSupabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cera.Ai: Supabase client initialized');
    } else {
      console.log('⚠️ Cera.Ai: Supabase credentials not available');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            return records;
          }

          return records.filter((record: any) => {
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) return false;

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) return false;

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records;
    };

    // Simple keyword-based responses
    const lowerQuery = query.toLowerCase().trim();
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');
      
      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;
      
      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');
      
      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;
      
      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';
          
          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();
      
      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());
      
      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Cera.Ai Assistant</span>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Online" : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Cera.Ai is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about timetables, attendance, or anything else..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isInitialized || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isInitialized || isTyping || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={initializeCera}
            disabled={isTyping}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [databaseContext, setDatabaseContext] = useState<DatabaseContext | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini AI
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  let genAI: GoogleGenerativeAI | null = null;

  try {
    if (apiKey) {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Cera.Ai: Gemini AI initialized successfully');
    } else {
      console.log('⚠️ Cera.Ai: Gemini API key not available');
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ceraSupabase: any = null;

  try {
    if (supabaseUrl && supabaseKey) {
      ceraSupabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Cera.Ai: Supabase client initialized');
    } else {
      console.log('⚠️ Cera.Ai: Supabase credentials not available');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            return records;
          }

          return records.filter((record: any) => {
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) return false;

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) return false;

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records;
    };

    // Simple keyword-based responses
    const lowerQuery = query.toLowerCase().trim();
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');
      
      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;
      
      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');
      
      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;
      
      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';
          
          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();
      
      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());
      
      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <span>Cera.Ai Assistant</span>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Online" : "Initializing..."}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 text-red-900 border border-red-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-sm">Cera.Ai is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about timetables, attendance, or anything else..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!isInitialized || isTyping}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isInitialized || isTyping || !inputMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            onClick={initializeCera}
            disabled={isTyping}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
          }
        }
      }, 100);
    }
  }, [messages]);

  // Get database context using API call
      const contextResponse = await fetch('/api/cera?path=database-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const contextResult = await contextResponse.json();
      if (!contextResult.success || !contextResult.data) {
        console.error('❌ Failed to get database context:', contextResult.error);
        setInitializationError('Failed to load database context. Please try again.');
        setIsInitialized(true);
        return;
      }

      setDatabaseContext(contextResult.data);

      // Set up real-time subscriptions using client-side Supabase (anon key)
      setupRealtimeSubscriptions();

      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: `Hello ${context.fullName}! I'm Cera.Ai, your Centralized Education Response Assistant. I'm now connected to the database and ready to help you with any questions about timetables, attendance, subjects, and more. What would you like to know?`,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages([welcomeMessage]);
      setIsInitialized(true);

      console.log('✅ Cera.Ai initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setInitializationError('Failed to initialize Cera.Ai. Please try again.');
      setIsInitialized(true);
      toast({
        title: "Cera.Ai Initialization Failed",
        description: "Unable to connect to the database. Please try again.",
        variant: "destructive"
      });
    }
  }, [user]);

  // Load current database context
  const loadDatabaseContext = useCallback(async () => {
    try {
      console.log('📊 Loading database context for Cera.Ai');

      const contextResponse = await fetch('/api/cera?path=database-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const contextResult = await contextResponse.json();

      if (!contextResult.success || !contextResult.data) {
        console.error('❌ Failed to load database context:', contextResult.error);
        return;
      }

      setDatabaseContext(contextResult.data);
      console.log('✅ Database context loaded:', {
        timetables: contextResult.data.timetables.length,
        attendance: contextResult.data.attendanceRecords.length,
        subjects: contextResult.data.subjects.length,
        profiles: contextResult.data.userProfiles.length
      });

    } catch (error) {
      console.error('❌ Failed to load database context:', error);
    }
  }, []);

  // Set up real-time subscriptions for live data updates
  const setupRealtimeSubscriptions = useCallback(() => {
    console.log('📡 Setting up real-time subscriptions for Cera.Ai');

    const subscription = ceraSupabase
      .channel('cera-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'timetables'
      }, (payload: any) => {
        console.log('📅 Timetable updated:', payload);
        updateDatabaseContext('timetables', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'attendance_records'
      }, (payload: any) => {
        console.log('📝 Attendance updated:', payload);
        updateDatabaseContext('attendance_records', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_profiles'
      }, (payload: any) => {
        console.log('👤 User profile updated:', payload);
        updateDatabaseContext('user_profiles', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'subjects'
      }, (payload: any) => {
        console.log('📚 Subject updated:', payload);
        updateDatabaseContext('subjects', payload);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update database context when real-time changes occur
  const updateDatabaseContext = useCallback((table: string, payload: any) => {
    setDatabaseContext(prev => {
      if (!prev) return null;

      const updated = { ...prev, lastUpdated: new Date() };

      switch (table) {
        case 'timetables':
          if (payload.eventType === 'INSERT') {
            updated.timetables = [...prev.timetables, payload.new];
          } else if (payload.eventType === 'UPDATE') {
            updated.timetables = prev.timetables.map(t =>
              t.id === payload.new.id ? payload.new : t
            );
          } else if (payload.eventType === 'DELETE') {
            updated.timetables = prev.timetables.filter(t => t.id !== payload.old.id);
          }
          break;
        case 'attendance_records':
          if (payload.eventType === 'INSERT') {
            updated.attendanceRecords = [...prev.attendanceRecords, payload.new];
          } else if (payload.eventType === 'UPDATE') {
            updated.attendanceRecords = prev.attendanceRecords.map(p =>
              p.id === payload.new.id ? payload.new : p
            );
          } else if (payload.eventType === 'DELETE') {
            updated.attendanceRecords = prev.attendanceRecords.filter(p => p.id !== payload.old.id);
          }
          break;
        case 'subjects':
          if (payload.eventType === 'INSERT') {
            updated.subjects = [...prev.subjects, payload.new];
          } else if (payload.eventType === 'UPDATE') {
            updated.subjects = prev.subjects.map(s =>
              s.id === payload.new.id ? payload.new : s
            );
          } else if (payload.eventType === 'DELETE') {
            updated.subjects = prev.subjects.filter(s => s.id !== payload.old.id);
          }
          break;
        case 'user_profiles':
          if (payload.eventType === 'INSERT') {
            updated.userProfiles = [...prev.userProfiles, payload.new];
          } else if (payload.eventType === 'UPDATE') {
            updated.userProfiles = prev.userProfiles.map(u =>
              u.id === payload.new.id ? payload.new : u
            );
          } else if (payload.eventType === 'DELETE') {
            updated.userProfiles = prev.userProfiles.filter(u => u.id !== payload.old.id);
          }
          break;
      }

      return updated;
    });
  }, []);

  // Process user query with Gemini AI or keyword matching fallback
  const processQuery = useCallback(async (query: string): Promise<string> => {
    // =======================================================================
    // 🤖 CERA.AI GEMINI AI INTEGRATION
    // =======================================================================
    // Cera.Ai uses Google Gemini AI for intelligent responses when available,
    // falling back to keyword matching when AI is unavailable.
    // =======================================================================

    // If Gemini AI is available, use it
    if (genAI && userContext && databaseContext) {
      try {
        console.log('🤖 Processing query with Gemini:', query);

        // Try gemini-pro model (most compatible)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Using Gemini model: gemini-pro');

        // Build system prompt with user context and database knowledge
        const systemPrompt = `You are Cera.Ai, a Centralized Education Response Assistant for a Student Information Portal.

CURRENT USER CONTEXT:
- Name: ${userContext.fullName}
- Role: ${userContext.role}
- Email: ${userContext.email}
- Branch: ${userContext.branch || 'Not assigned'}
- Semester: ${userContext.semester || 'Not assigned'}

DATABASE KNOWLEDGE:
- Total Timetables: ${databaseContext.timetables?.length || 0}
- Total Attendance Records: ${databaseContext.attendanceRecords?.length || 0}
- Total Subjects: ${databaseContext.subjects?.length || 0}
- Total Users: ${databaseContext.userProfiles?.length || 0}

RESPONSE GUIDELINES:
- Be helpful, accurate, and concise
- Use the current database data for all responses
- Format information clearly (use lists when appropriate)
- If data is not available, clearly state this
- Respect user role permissions
- Always provide actionable information

CURRENT DATE/TIME: ${new Date().toISOString()}`;

        // Create chat session with previous messages
        const previousMessages = messages.filter(msg => msg.role !== 'user' || !msg.content.includes(query));
        let chatHistory = previousMessages.slice(-8).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        // Ensure chat history starts with user message
        if (chatHistory.length === 0 || chatHistory[0].role !== 'user') {
          chatHistory = [
            { role: 'user', parts: [{ text: 'Hello, I am using the education portal.' }] },
            ...chatHistory
          ];
        }

        // Create chat session
        const chat = model.startChat({
          history: chatHistory,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
          }
        });

        // Send query with system context
        const result = await chat.sendMessage(`${systemPrompt}\n\nUser Query: ${query}`);
        const response = result.response.text();

        console.log('✅ Gemini response generated, length:', response.length);
        return response;

      } catch (error) {
        console.error('❌ Gemini API error:', error);
        console.log('🔄 Falling back to keyword matching due to Gemini error');
      }
    } else {
      console.log('⚠️ Gemini AI not available, using keyword matching');
    }

    // =======================================================================
    // 🤖 CERA.AI KEYWORD MATCHING FALLBACK
    // =======================================================================

    console.log('🤖 Processing query with keyword matching:', query);

    // Helper function to filter records based on user role and permissions
    const filterRecordsByPermissions = (records: any[], recordType: 'attendance' | 'timetable' | 'subjects') => {
      if (!userContext || userContext.role === 'admin') {
        return records; // Admins see everything
      }

      if (userContext?.role === 'student') {
        if (recordType === 'attendance') {
          // Students can only see their own attendance records
          return records.filter((record: any) => record.student_uid === userContext?.userId);
        }
        if (recordType === 'timetable') {
          // Students can only see timetables for their branch and semester
          return records.filter(record =>
            record.branch === userContext.branch && record.semester === userContext.semester
          );
        }
        if (recordType === 'subjects') {
          // Students can see subjects for their branch and semester
          return records.filter((record: any) =>
            record.branch === userContext?.branch && record.semester === userContext?.semester
          );
        }
      }

      if (userContext?.role === 'faculty') {
        if (recordType === 'attendance') {
          // Faculty can only see attendance THEY marked for students in their assigned branches/semesters
          console.log('🔒 Faculty filtering - Assigned branches:', userContext.assignedBranches, 'Semesters:', userContext.assignedSemesters);

          if (!userContext.assignedBranches?.length && !userContext.assignedSemesters?.length) {
            console.log('🔒 Faculty has no assigned branches or semesters - allowing all records');
            return records;
          }

          return records.filter((record: any) => {
            // First check ownership - faculty can only see attendance they marked
            const isOwner = record.created_by === userContext?.userId || record.faculty_uid === userContext?.userId;
            if (!isOwner) {
              return false;
            }

            const studentProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
            if (!studentProfile) {
              return false;
            }

            const branchMatch = !userContext?.assignedBranches?.length ||
                               userContext.assignedBranches.includes(studentProfile.branch);
            const semesterMatch = !userContext?.assignedSemesters?.length ||
                             userContext.assignedSemesters.includes(studentProfile.semester);

            return branchMatch && semesterMatch;
          });
        }
        if (recordType === 'timetable') {
          // Faculty can see timetables for their assigned branches/semesters
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
        if (recordType === 'subjects') {
          // Faculty can see subjects for their assigned branches/semesters
          return records.filter((record: any) =>
            (!userContext?.assignedBranches?.length || userContext.assignedBranches.includes(record.branch)) &&
            (!userContext?.assignedSemesters?.length || userContext.assignedSemesters.includes(record.semester))
          );
        }
      }

      return records; // Default: show all
    };

    // Simple keyword-based responses for common queries
    const lowerQuery = query.toLowerCase().trim();

    // Helper function to check if query contains any of the keywords
    const containsAny = (keywords: string[]) => {
      return keywords.some(keyword => lowerQuery.includes(keyword));
    };

    // Greeting patterns
    if (containsAny(['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'])) {
      return `Hello! I'm Cera.Ai, your education assistant. I can help you with information about timetables, attendance, subjects, and more. What would you like to know?`;
    }

    // Timetable patterns
    if (containsAny(['timetable', 'schedule', 'classes', 'timing'])) {
      const timetables = databaseContext?.timetables || [];
      const filteredTimetables = filterRecordsByPermissions(timetables, 'timetable');
      
      let response = `I have access to ${filteredTimetables.length} timetable entries in the system. `;
      
      if (filteredTimetables.length > 0) {
        response += `Here are some recent schedule entries:\n`;
        filteredTimetables.slice(-3).forEach((entry: any, index: number) => {
          const branch = entry.branch || 'Unknown Branch';
          const semester = entry.semester || '';
          response += `${index + 1}. ${branch} ${semester}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view your complete schedule from your dashboard.`;
      return response;
    }

    // Attendance patterns
    if (containsAny(['attendance', 'present', 'absent', 'record'])) {
      const attendanceRecords = databaseContext?.attendanceRecords || [];
      const filteredRecords = filterRecordsByPermissions(attendanceRecords, 'attendance');
      
      let response = `I have access to ${filteredRecords.length} attendance records in the system. `;
      
      if (filteredRecords.length > 0) {
        response += `Here are the most recent attendance entries:\n`;
        filteredRecords.slice(-5).forEach((record: any, index: number) => {
          const userProfile = databaseContext?.userProfiles?.find((profile: any) => profile.id === record.student_uid);
          const student = userProfile?.student_id || 'Unknown Student';
          const subject = record.subject || 'Unknown Subject';
          const status = record.status || 'Present';
          const date = record.date ? new Date(record.date).toLocaleDateString() : 'Unknown Date';
          
          response += `${index + 1}. ${student} - ${subject} - ${status} - ${date}\n`;
        });
      }
      
      response += `\nAs a ${userContext?.role}, you can view comprehensive attendance reports from your dashboard.`;
      return response;
    }

    // Help patterns
    if (containsAny(['help', 'assist', 'support', 'guide', 'how'])) {
      return `I'm here to help! I can assist with:\n• Timetable information and schedules\n• Attendance records and statistics\n• Subject details and faculty assignments\n• Student information queries\n• General academic assistance\n\nWhat specific information would you like to know?`;
    }

    // Default fallback response
    const totalTimetables = databaseContext?.timetables?.length || 0;
    const totalAttendance = databaseContext?.attendanceRecords?.length || 0;
    const totalSubjects = databaseContext?.subjects?.length || 0;
    const totalUsers = databaseContext?.userProfiles?.length || 0;

    let response = `I understand you're asking about "${query}". `;
    response += `Current system overview:\n`;
    response += `📚 Timetables: ${totalTimetables} entries\n`;
    response += `📝 Attendance: ${totalAttendance} records\n`;
    response += `📖 Subjects: ${totalSubjects} courses\n`;
    response += `👥 Users: ${totalUsers} registered\n\n`;

    if (totalTimetables > 0 || totalAttendance > 0 || totalSubjects > 0) {
      response += `Try asking me about:\n`;
      if (totalTimetables > 0) response += `• "Show me the timetable" or "What classes are scheduled?"\n`;
      if (totalAttendance > 0) response += `• "Check attendance" or "Who was present today?"\n`;
      if (totalSubjects > 0) response += `• "What subjects are available?" or "Tell me about courses"\n`;
    }

    response += `\nAs a ${userContext?.role}, you have access to detailed information through your dashboard. What specific information would you like me to help you find?`;

    return response;
  }, [userContext, databaseContext, messages]);

  // Initialize Cera.Ai when component mounts
  const initializeCera = useCallback(async () => {
    console.log('🚀 Initializing Cera.Ai...');

    try {
      // Fetch user context from API
      const contextResponse = await fetch('/api/cera?path=user-profile');
      if (!contextResponse.ok) {
        throw new Error('Failed to fetch user context');
      }
      const contextResult = await contextResponse.json();
      
      console.log('✅ Database context loaded:', {
        timetables: contextResult.data?.timetables?.length || 0,
        attendance: contextResult.data?.attendanceRecords?.length || 0,
        subjects: contextResult.data?.subjects?.length || 0,
        profiles: contextResult.data?.userProfiles?.length || 0
      });

      setUserContext(contextResult.data.userProfile);
      setDatabaseContext(contextResult.data);
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to initialize Cera.Ai:', error);
      setIsInitialized(false);
    }
  }, []);

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping || !isInitialized) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(inputMessage.trim());
      
      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing query:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Focus input when initialized
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await processQuery(userMessage.content);

      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ Error processing message:', error);

      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCera();
  }, [initializeCera]);

  // Auto-focus input when initialized
  useEffect(() => {
    if (isInitialized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInitialized]);

  if (!isInitialized) {
    return (
      <Card className="w-full max-w-4xl mx-auto h-[600px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Bot className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Initializing Cera.Ai</h3>
            {initializationError ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Configuration Error</p>
                <p className="text-sm text-destructive">{initializationError}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Required environment variables:</p>
                  <p><code className="bg-muted px-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY</code></p>
                  <p><code className="bg-muted px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code></p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">Connecting to database and loading context...</p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          Cera.Ai - Education Assistant
          <Badge variant="secondary" className="ml-auto">
            {userContext?.role} Mode
          </Badge>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Connected to database • Last updated: {databaseContext?.lastUpdated ? new Date(databaseContext.lastUpdated).toLocaleTimeString() : 'Unknown'}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src="/cera-avatar.png" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'error'
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t p-4 bg-background">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={initializationError ? "AI service not available" : "Ask me anything about timetables, attendance, or student information..."}
              className="flex-1"
              disabled={isTyping || !!initializationError}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping || !!initializationError}
              size="icon"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={loadDatabaseContext}
              variant="outline"
              size="icon"
              title="Refresh database context"
              disabled={!!initializationError}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {initializationError && (
            <p className="text-xs text-muted-foreground mt-2">
              Cera.Ai is currently unavailable. Please contact your administrator.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CeraAssistant;
