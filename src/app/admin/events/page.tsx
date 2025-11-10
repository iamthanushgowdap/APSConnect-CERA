"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, Edit, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import type { Event } from '@/types';
import { defaultBranches, semesters } from '@/types';

export default function AdminEventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    event_type: 'academic' as Event['event_type'],
    target_audience: [] as string[],
    target_branches: [] as string[],
    target_semesters: [] as string[],
    registration_link: '',
    registration_deadline: '',
    is_active: true
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    loadEvents();
  }, [user, router]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!formData.title || !formData.description || !formData.event_date || formData.event_date.trim() === '') {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields, including a valid event date',
        variant: 'destructive'
      });
      return;
    }

    // Additional date validation
    const selectedDate = new Date(formData.event_date);
    if (isNaN(selectedDate.getTime())) {
      toast({
        title: 'Invalid Date',
        description: 'Please select a valid event date',
        variant: 'destructive'
      });
      return;
    }

    // Validate that the event date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate < today) {
      toast({
        title: 'Invalid Date',
        description: 'Event date cannot be in the past',
        variant: 'destructive'
      });
      return;
    }

    if (formData.target_audience.length === 0) {
      toast({
        title: 'Missing Target Audience',
        description: 'Please select at least one target audience',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('Creating event with data:', formData);

      const eventData: Omit<Event, 'id'> = {
        ...formData,
        target_audience: formData.target_audience as any,
        target_branches: formData.target_branches.length > 0 ? formData.target_branches : undefined,
        target_semesters: formData.target_semesters.length > 0 ? (formData.target_semesters as any) : undefined,
        event_date: formData.event_date, // Already in YYYY-MM-DD format from HTML date input
        registration_deadline: formData.registration_deadline && formData.registration_deadline.trim() !== '' ? formData.registration_deadline : undefined,
        created_by_uid: user.uid,
        created_by_name: user.displayName || 'Admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Event data to be inserted:', eventData);

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      // Create notifications for target audience
      await createEventNotifications(data);

      toast({
        title: 'Success',
        description: 'Event created successfully'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        event_type: 'academic',
        target_audience: [],
        target_branches: [],
        target_semesters: [],
        registration_link: '',
        registration_deadline: '',
        is_active: true
      });

      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive'
      });
    }
  };

  const createEventNotifications = async (event: Event) => {
    try {
      // Get target users based on audience
      let query = supabase
        .from('user_profiles')
        .select('id');

      // Filter by target audience roles
      query = query.in('role', event.target_audience);

      // Filter by branches if specified
      if (event.target_branches && event.target_branches.length > 0) {
        query = query.in('branch', event.target_branches);
      }

      // Filter by semesters if specified (only for students)
      if (event.target_semesters && event.target_semesters.length > 0) {
        query = query.in('semester', event.target_semesters);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      if (users && users.length > 0) {
        const notifications = users.map(user => ({
          id: `event-${event.id}-${user.id}-${Date.now()}`,
          user_id: user.id,
          type: 'event',
          title: `New Event: ${event.title}`,
          message: `${event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)} event on ${new Date(event.event_date).toLocaleDateString()}`,
          href: '/events',
          created_at: new Date().toISOString(),
          read: false
        }));

        const { error: notifError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating notifications:', notifError);
        } else {
          console.log(`✅ Created ${notifications.length} notifications for event`);
        }
      }
    } catch (error) {
      console.error('Error in createEventNotifications:', error);
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Event ${!currentStatus ? 'activated' : 'deactivated'}`
      });

      loadEvents();
    } catch (error) {
      console.error('Error toggling event status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event status',
        variant: 'destructive'
      });
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });

      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete event',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            Events Management
          </h1>
          <p className="text-muted-foreground mt-2">Create and manage campus events</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancel' : 'Create Event'}
        </Button>
      </div>

      {/* Event Creation Form */}
      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Fill in the details to create a new event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Annual Tech Fest 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type *</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: Event['event_type']) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_time">Event Time</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Main Auditorium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_link">Registration Link</Label>
                  <Input
                    id="registration_link"
                    value={formData.registration_link}
                    onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
                    placeholder="https://forms.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registration_deadline">Registration Deadline</Label>
                  <Input
                    id="registration_deadline"
                    type="date"
                    value={formData.registration_deadline}
                    onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the event..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Target Audience *</Label>
                <div className="flex gap-4">
                  {['student', 'faculty', 'alumni'].map((audience) => (
                    <div key={audience} className="flex items-center space-x-2">
                      <Checkbox
                        id={`audience-${audience}`}
                        checked={formData.target_audience.includes(audience)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              target_audience: [...formData.target_audience, audience]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              target_audience: formData.target_audience.filter((a) => a !== audience)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`audience-${audience}`} className="capitalize cursor-pointer">
                        {audience}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {formData.target_audience.includes('student') && (
                <>
                  <div className="space-y-2">
                    <Label>Target Branches (Optional - leave empty for all)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {defaultBranches.map((branch) => (
                        <div key={branch} className="flex items-center space-x-2">
                          <Checkbox
                            id={`branch-${branch}`}
                            checked={formData.target_branches.includes(branch)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  target_branches: [...formData.target_branches, branch]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  target_branches: formData.target_branches.filter((b) => b !== branch)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`branch-${branch}`} className="cursor-pointer text-sm">
                            {branch}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Semesters (Optional - leave empty for all)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {semesters.map((semester) => (
                        <div key={semester} className="flex items-center space-x-2">
                          <Checkbox
                            id={`semester-${semester}`}
                            checked={formData.target_semesters.includes(semester)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  target_semesters: [...formData.target_semesters, semester]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  target_semesters: formData.target_semesters.filter((s) => s !== semester)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`semester-${semester}`} className="cursor-pointer text-sm">
                            {semester}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Event</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first event to get started</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className={!event.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {event.title}
                      {!event.is_active && (
                        <span className="text-xs font-normal text-muted-foreground">(Inactive)</span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="capitalize bg-primary/10 text-primary px-2 py-1 rounded">
                          {event.event_type}
                        </span>
                        <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                        {event.event_time && <span>🕒 {event.event_time}</span>}
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleEventStatus(event.id, event.is_active)}
                    >
                      {event.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="font-medium">Target Audience:</span>{' '}
                    {event.target_audience.map((a: string) => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}
                  </div>
                  {event.target_branches && event.target_branches.length > 0 && (
                    <div>
                      <span className="font-medium">Branches:</span> {event.target_branches.join(', ')}
                    </div>
                  )}
                  {event.target_semesters && event.target_semesters.length > 0 && (
                    <div>
                      <span className="font-medium">Semesters:</span> {event.target_semesters.join(', ')}
                    </div>
                  )}
                </div>
                {event.registration_link && (
                  <div className="mt-4">
                    <Button size="sm" asChild>
                      <a href={event.registration_link} target="_blank" rel="noopener noreferrer">
                        Register Now
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
