"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Clock, ExternalLink, Filter, ArrowLeft } from 'lucide-react';
import type { Event } from '@/types';
import { format, isPast, isFuture, isToday } from 'date-fns';

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadEvents();
  }, [user, router]);

  const loadEvents = async () => {
    try {
      if (!user) return;

      // Get events that target the user's role
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .contains('target_audience', [user.role])
        .order('event_date', { ascending: true });

      if (error) throw error;

      // Further filter events based on branch/semester if user is a student
      let filteredEvents = data || [];

      if (user.role === 'student' && user.branch) {
        filteredEvents = filteredEvents.filter((event: Event) => {
          // If event has specific branches, check if user's branch is included
          if (event.target_branches && event.target_branches.length > 0) {
            if (!event.target_branches.includes(user.branch!)) {
              return false;
            }
          }

          // If event has specific semesters, check if user's semester is included
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

  const getEventStatus = (eventDate: string) => {
    const date = new Date(eventDate);
    if (isToday(date)) return 'today';
    if (isPast(date)) return 'past';
    if (isFuture(date)) return 'upcoming';
    return 'upcoming';
  };

  const getFilteredEvents = () => {
    return events.filter((event) => {
      const status = getEventStatus(event.event_date);
      if (filter === 'upcoming') return status === 'upcoming' || status === 'today';
      if (filter === 'past') return status === 'past';
      return true;
    });
  };

  const getEventTypeColor = (type: Event['event_type']) => {
    const colors: Record<Event['event_type'], string> = {
      academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      workshop: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      seminar: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type] || colors.other;
  };

  const getBackPath = () => {
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'faculty':
        return '/faculty';
      case 'student':
        return '/student';
      default:
        return '/';
    }
  };

  const handleBack = () => {
    router.push(getBackPath());
  };

  const filteredEvents = getFilteredEvents();
  const upcomingCount = events.filter((e) => getEventStatus(e.event_date) !== 'past').length;
  const pastCount = events.filter((e) => getEventStatus(e.event_date) === 'past').length;

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary mb-2 flex items-center gap-3">
          <Calendar className="h-8 w-8" />
          Campus Events
        </h1>
        <p className="text-muted-foreground">
          Discover and participate in upcoming campus events
        </p>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingCount})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({events.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Events Found</h3>
            <p className="text-muted-foreground">
              {filter === 'upcoming' && 'No upcoming events at the moment. Check back later!'}
              {filter === 'past' && 'No past events to display.'}
              {filter === 'all' && 'No events available yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const status = getEventStatus(event.event_date);
            const eventDate = new Date(event.event_date);

            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={getEventTypeColor(event.event_type)}>
                      {event.event_type}
                    </Badge>
                    {status === 'today' && (
                      <Badge variant="destructive">Today</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Event Details */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(eventDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>

                    {event.event_time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{event.event_time}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {/* Registration Info */}
                    {event.registration_deadline && isFuture(new Date(event.registration_deadline)) && (
                      <div className="text-xs text-muted-foreground">
                        Registration closes: {format(new Date(event.registration_deadline), 'MMM d, yyyy')}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {event.registration_link && status !== 'past' && (
                      <Button 
                        className="w-full mt-4" 
                        size="sm"
                        asChild
                      >
                        <a href={event.registration_link} target="_blank" rel="noopener noreferrer">
                          Register Now
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </Button>
                    )}

                    {/* Target Info */}
                    {(event.target_branches || event.target_semesters) && (
                      <div className="pt-3 border-t text-xs text-muted-foreground">
                        {event.target_branches && event.target_branches.length > 0 && (
                          <div>For: {event.target_branches.join(', ')}</div>
                        )}
                        {event.target_semesters && event.target_semesters.length > 0 && (
                          <div>Semesters: {event.target_semesters.join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
