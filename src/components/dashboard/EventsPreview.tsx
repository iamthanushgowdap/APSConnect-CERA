"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Event, Semester } from '@/types';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';

interface EventsPreviewProps {
  user: {
    uid: string;
    role: string;
    branch?: string;
    semester?: Semester;
  };
}

export function EventsPreview({ user }: EventsPreviewProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-cycle through events every 3 seconds (pause on hover)
  useEffect(() => {
    loadUpcomingEvents();
  }, [user]);

  useEffect(() => {
    if (events.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentEventIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [events.length, isHovered]);

  const loadUpcomingEvents = async () => {
    try {
      if (!user) {
        return;
      }

      // Get ALL upcoming events for slideshow
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .contains('target_audience', [user.role])
        .gte('event_date', new Date().toISOString().split('T')[0]) // Today and future
        .order('event_date', { ascending: true })
        .limit(10); // Get up to 10 events for slideshow

      if (error) {
        console.error('Error loading events:', error);
        throw error;
      }

      // Further filter events based on branch/semester if user is a student
      let filteredEvents = data || [];

      if (user.role === 'student' && user.branch) {
        filteredEvents = filteredEvents.filter((event: Event) => {
          // If event has specific branches, check if user's branch is included
          // If no specific branches, include all events
          if (event.target_branches && event.target_branches.length > 0) {
            if (!event.target_branches.includes(user.branch!)) {
              return false;
            }
          }

          // If event has specific semesters, check if user's semester is included
          // If no specific semesters, include all events
          if (event.target_semesters && event.target_semesters.length > 0 && user.semester) {
            if (!event.target_semesters.includes(user.semester)) {
              return false;
            }
          }

          return true;
        });
      }

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateBadge = (eventDate: string) => {
    const date = new Date(eventDate);
    const days = differenceInDays(date, new Date());

    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (days <= 7) return `${days} days`;
    return format(date, 'MMM d, yyyy');
  };

  const nextEvent = () => {
    setCurrentEventIndex((prevIndex) => (prevIndex + 1) % events.length);
  };

  const getEventTypeBadge = (eventType: string) => {
    const types = {
      'academic': { text: 'Academic', color: 'bg-primary/20 text-primary border-primary/30' },
      'cultural': { text: 'Cultural', color: 'bg-chart-1/20 text-chart-1 border-chart-1/30' },
      'sports': { text: 'Sports', color: 'bg-chart-2/20 text-chart-2 border-chart-2/30' },
      'technical': { text: 'Technical', color: 'bg-chart-3/20 text-chart-3 border-chart-3/30' },
      'social': { text: 'Social', color: 'bg-chart-4/20 text-chart-4 border-chart-4/30' },
      'placement': { text: 'Placement', color: 'bg-chart-5/20 text-chart-5 border-chart-5/30' },
      'other': { text: 'Other', color: 'bg-muted/20 text-muted-foreground border-muted/30' },
    };

    const type = types[eventType?.toLowerCase() as keyof typeof types] || types.other;
    return type;
  };

  if (loading) {
    return (
      <div className="relative z-10 mb-6">
        <div className="w-full bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50 animate-pulse shadow-lg rounded-xl border border-primary/20">
          <div className="px-4 py-3 flex items-center justify-between max-w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-8 w-8 bg-primary-foreground/20 rounded-lg flex-shrink-0"></div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-primary-foreground/20 rounded w-3/4"></div>
                  <div className="h-5 bg-primary-foreground/15 rounded-full w-16"></div>
                </div>
                <div className="h-3 bg-primary-foreground/10 rounded w-1/2"></div>
              </div>
            </div>
            <div className="ml-3 h-7 bg-primary-foreground/20 rounded-lg w-16 flex-shrink-0"></div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null; // Don't show if no events
  }

  return (
    <>
      {/* 🔔 Current Event Banner - Slideshow */}
      <div
        className="w-full relative z-10 mb-6 animate-in slide-in-from-top-2 duration-500 cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => router.push('/events')}
      >
        <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-primary-foreground shadow-lg rounded-xl border border-primary/20 overflow-hidden">
          {/* Sliding container for all events */}
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentEventIndex * 100}%)` }}
          >
            {events.map((event, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full px-4 py-3 flex items-center justify-between max-w-full relative"
              >
                {/* Animated background for smooth transitions */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse"></div>

                <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
                  {/* Icon */}
                  <div className="h-8 w-8 flex items-center justify-center bg-primary-foreground/20 rounded-lg flex-shrink-0 transition-all duration-300">
                    <Calendar className="h-4 w-4" />
                  </div>

                  {/* Event Summary - with smooth transition */}
                  <div className="min-w-0 flex-1 animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        <span className="font-bold">{event.title}</span>
                      </p>
                      {event.event_type && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getEventTypeBadge(event.event_type).color}`}>
                          {getEventTypeBadge(event.event_type).text}
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-90 truncate">
                      {getDateBadge(event.event_date)} • {event.location || 'Campus'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Button */}
          {events.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent banner click navigation
                nextEvent();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded-full transition-all duration-200 backdrop-blur-sm"
              aria-label="Next event"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Event Indicators */}
          {events.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {events.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentEventIndex
                      ? 'bg-primary-foreground scale-125'
                      : 'bg-primary-foreground/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
