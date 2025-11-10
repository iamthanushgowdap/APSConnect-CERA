"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCnCardDescription } from '@/components/ui/card';
import { getBranches, getUserProfiles, getSubjects, createTimetable, updateTimetable, getTimetables } from '@/lib/supabase-utils';
import { useToast } from '@/hooks/use-toast';
import type { Branch, Semester, TimeTable, TimeTableDaySchedule, TimeTableEntry, DayOfWeek, TimeSlotDescriptor, UserProfile, Subject } from '@/types';
import { defaultBranches, semesters, daysOfWeek, timeSlotDescriptors, saturdayLastSlotIndex, SUBJECT_STORAGE_KEY } from '@/types';
import { useAuth } from '@/components/auth-provider';
import { Loader2, Save, CalendarDays, AlertTriangle } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { supabase } from '@/lib/supabase';

const TIMETABLE_STORAGE_KEY_PREFIX = 'apsconnect_timetable_';
const BRANCH_STORAGE_KEY = 'apsconnect_managed_branches';

const timeTableEntrySchema = z.object({
  period: z.number(),
  type: z.enum(['class', 'lab', 'break']), // NEW: Period type
  subject: z.string().max(100, "Subject name too long").optional(),
  subject_code: z.string().optional(), // NEW
  room_number: z.string().optional(), // NEW
  batch: z.string().optional(), // NEW
  faculty_name: z.string().optional(), // NEW
  is_lab_period: z.boolean().optional(), // NEW
});

const timeTableDayScheduleSchema = z.object({
  day: z.string(),
  entries: z.array(timeTableEntrySchema),
});

const timetableFormSchema = z.object({
  branch: z.string({ required_error: "Branch is required." }),
  semester: z.custom<Semester>(val => semesters.includes(val as Semester), { message: "Semester is required." }),
  schedule: z.array(timeTableDayScheduleSchema),
});

export type TimetableFormValues = z.infer<typeof timetableFormSchema>;

interface TimetableFormProps {
  role: 'admin' | 'faculty';
  facultyAssignedBranches?: Branch[];
  onTimetableUpdate?: () => void;
}

const createEmptySchedule = (): TimeTableDaySchedule[] => {
  return daysOfWeek.map(day => ({
    day,
    entries: timeSlotDescriptors.map((descriptor, periodIndex) => ({
      period: periodIndex,
      type: descriptor.isBreak ? 'break' : 'class', // NEW: Default to break for breaks, class for others
      subject: descriptor.isBreak ? descriptor.label : "no-class",
      subject_code: "",
      room_number: "",
      batch: "",
      faculty_name: "",
      is_lab_period: false,
    })),
  }));
};

export function TimetableForm({ role, facultyAssignedBranches, onTimetableUpdate }: TimetableFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [managedBranches, setManagedBranches] = useState<Branch[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [facultyProfiles, setFacultyProfiles] = useState<UserProfile[]>([]);

  const availableBranchesForForm = role === 'admin' ? managedBranches : (facultyAssignedBranches || []);

  const saveTimetableDraft = async (branch: string, semester: string, schedule: any) => {
    if (!user?.uid) return;

    await supabase.from('drafts').upsert({
      user_id: user.uid,
      form_id: `timetable_${branch}_${semester}`,
      data: { branch, semester, schedule },
      updated_at: new Date().toISOString()
    });
  };

  const loadTimetableDraft = async (branch: string, semester: string) => {
    if (!user?.uid) return null;

    const { data } = await supabase
      .from('drafts')
      .select('data')
      .eq('user_id', user.uid)
      .eq('form_id', `timetable_${branch}_${semester}`)
      .single();

    return data?.data || null;
  };

  const saveManagedBranches = async (branches: Branch[]) => {
    if (!user?.uid) return;

    await supabase
      .from('user_preferences')
      .upsert({ user_id: user.uid, managed_branches: branches }, { onConflict: 'user_id' });
  };

  const form = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      branch: undefined,
      semester: undefined,
      schedule: createEmptySchedule(),
    },
  });

  // Use useWatch for form values to avoid render issues
  const watchedBranch = useWatch({ control: form.control, name: "branch" });
  const watchedSemester = useWatch({ control: form.control, name: "semester" });
  const watchedSchedule = useWatch({ control: form.control, name: "schedule" });

  // Auto-save drafts when schedule changes
  useEffect(() => {
    if (watchedBranch && watchedSemester && watchedSchedule && user?.uid) {
      const timeoutId = setTimeout(async () => {
        await saveTimetableDraft(watchedBranch, watchedSemester, watchedSchedule);
        console.log('💾 Auto-saved timetable draft');
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [watchedBranch, watchedSemester, watchedSchedule, user]);

  // Save managed branches when they change
  useEffect(() => {
    if (managedBranches.length > 0 && user?.uid) {
      saveManagedBranches(managedBranches.map(b => b));
    }
  }, [managedBranches, user]);

  const { fields } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  const loadSubjectsForBranchSemester = useCallback(async (branch: string, semester: string) => {
    try {
      console.log('🔍 Timetable Form: Fetching subjects for', branch, semester);
      const allSubjects = await getSubjects({ branch, semester });
      console.log('✅ Subjects fetched:', allSubjects.length, 'subjects');
      setAvailableSubjects(allSubjects);
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
      setAvailableSubjects([]);
    }
  }, []);

  const fetchFaculty = useCallback(async () => {
    try {
      console.log('🔍 Timetable Form: Fetching faculty profiles...');
      const facultyList = await getUserProfiles({ role: 'faculty' });
      console.log('✅ Faculty fetched:', facultyList.length, 'faculty members');
      setFacultyProfiles(facultyList);
    } catch (error) {
      console.error('❌ Error fetching faculty:', error);
      setFacultyProfiles([]);
    }
  }, []);

  const fetchManagedBranches = useCallback(async () => {
    console.log('🔍 Timetable Form: Fetching branches...');
    try {
      console.log('📡 Calling getBranches()...');
      const branchList = await getBranches();
      console.log('✅ Branches fetched:', branchList);
      setManagedBranches(branchList);
      console.log('✅ Branches set in state:', branchList.length, 'branches');
    } catch (error) {
      console.error('❌ Error fetching branches:', error);
      console.log('🔄 Falling back to default branches');
      setManagedBranches(defaultBranches);
    }
  }, []);

  const loadScheduleFor = useCallback(async (branch: string, semester: string) => {
    if (typeof window !== 'undefined') {
        console.log('🔍 Loading timetable for', branch, semester);

        // 1. First try to load from drafts (Supabase)
        try {
          const draftData = await loadTimetableDraft(branch, semester);
          if (draftData?.schedule) {
            console.log('✅ Loaded timetable from drafts');
            form.setValue('schedule', draftData.schedule);
            return;
          }
        } catch (error) {
          console.error('❌ Failed to load from drafts:', error);
        }

        // 2. Try to load from database
        try {
          const timetables = await getTimetables({ branch, semester });
          const dbTimetable = timetables.find(t => t.branch === branch && t.semester === semester);

          if (dbTimetable && dbTimetable.schedule) {
            console.log('✅ Loaded timetable from database');
            const scheduleFromDb = daysOfWeek.map(dayString => {
              const existingDaySchedule = dbTimetable.schedule.find((ds: any) => ds.day === dayString);
              return {
                day: dayString,
                entries: timeSlotDescriptors.map((descriptor, periodIdx) => {
                  const existingEntry = existingDaySchedule?.entries?.find((e: any) => e.period === periodIdx);

                  if (existingEntry) {
                    return {
                      period: periodIdx,
                      type: existingEntry.type || (descriptor.isBreak ? 'break' : 'class'),
                      subject: existingEntry.subject || (descriptor.isBreak ? descriptor.label : "no-class"),
                      subject_code: existingEntry.subject_code || "",
                      room_number: existingEntry.room_number || "",
                      batch: existingEntry.batch || "",
                      faculty_name: existingEntry.faculty_name || "",
                      is_lab_period: existingEntry.is_lab_period || false,
                    };
                  }

                  return {
                    period: periodIdx,
                    type: descriptor.isBreak ? 'break' : 'class',
                    subject: descriptor.isBreak ? descriptor.label : "no-class",
                    subject_code: "",
                    room_number: "",
                    batch: "",
                    faculty_name: "",
                    is_lab_period: false,
                  };
                }),
              };
            });
            form.setValue('schedule', scheduleFromDb);
            return;
          }
        } catch (error) {
          console.error('❌ Failed to load from database:', error);
        }

        // 3. Fall back to localStorage during transition
        const key = `${TIMETABLE_STORAGE_KEY_PREFIX}${branch}_${semester}`;
        const storedData = localStorage.getItem(key);
        let newSchedule = createEmptySchedule();

        if (storedData) {
            try {
                const timetable = JSON.parse(storedData) as Partial<TimeTable>;
                if (timetable && Array.isArray(timetable.schedule)) {
                    newSchedule = daysOfWeek.map(dayString => {
                        const existingDaySchedule = timetable.schedule!.find(ds => ds.day === dayString);
                        return {
                            day: dayString,
                            entries: timeSlotDescriptors.map((descriptor, periodIdx) => {
                                const existingEntry = existingDaySchedule?.entries.find(e => e.period === periodIdx);

                                if (existingEntry && !existingEntry.type) {
                                    return {
                                        period: periodIdx,
                                        type: descriptor.isBreak ? 'break' : 'class',
                                        subject: existingEntry.subject || (descriptor.isBreak ? descriptor.label : "no-class"),
                                        subject_code: "",
                                        room_number: "",
                                        batch: "",
                                        faculty_name: "",
                                        is_lab_period: false,
                                    };
                                }

                                return existingEntry || {
                                    period: periodIdx,
                                    type: descriptor.isBreak ? 'break' : 'class',
                                    subject: descriptor.isBreak ? descriptor.label : "no-class",
                                    subject_code: "",
                                    room_number: "",
                                    batch: "",
                                    faculty_name: "",
                                    is_lab_period: false,
                                };
                            }),
                        };
                    });
                }
            } catch (error) {
                console.error("Failed to parse schedule from localStorage", error);
            }
        }
        console.log('📱 Loaded timetable from localStorage');
        form.setValue('schedule', newSchedule);
    }
  }, []);

  useEffect(() => {
    setPageIsLoading(true);

    // Load managed branches from Supabase
    const loadManagedBranchesFromSupabase = async () => {
      if (!user?.uid) {
        setManagedBranches(defaultBranches);
        return defaultBranches;
      }

      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('managed_branches')
          .eq('user_id', user.uid)
          .single();

        if (data?.managed_branches && Array.isArray(data.managed_branches)) {
          setManagedBranches(data.managed_branches);
          return data.managed_branches;
        }
      } catch (error) {
        console.error('Error loading branches from Supabase:', error);
      }

      // Fallback to localStorage during migration
      const storedBranchesStr = localStorage.getItem(BRANCH_STORAGE_KEY);
      if (storedBranchesStr) {
        try {
          const parsed = JSON.parse(storedBranchesStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setManagedBranches(parsed);
            // Migrate to Supabase
            await supabase
              .from('user_preferences')
              .upsert({ user_id: user.uid, managed_branches: parsed }, { onConflict: 'user_id' });
            return parsed;
          }
        } catch (e) {
          console.error("Error parsing managed branches:", e);
        }
      }

      setManagedBranches(defaultBranches);
      return defaultBranches;
    };

    const initializeForm = async () => {
      const branchesToSet = await loadManagedBranchesFromSupabase();
      const branchesForRole = role === 'admin' ? branchesToSet : (facultyAssignedBranches || []);
      const initialBranch = branchesForRole[0];
      const initialSemester = semesters[0];

      form.reset({
        branch: initialBranch,
        semester: initialSemester,
        schedule: createEmptySchedule()
      });

      const loadData = async () => {
        await Promise.all([
          fetchFaculty(),
          fetchManagedBranches()
        ]);

        if (initialBranch && initialSemester) {
          await loadScheduleFor(initialBranch, initialSemester);
          await loadSubjectsForBranchSemester(initialBranch, initialSemester);
        }
        setPageIsLoading(false);
      };
      loadData();
    };

    initializeForm();
  }, [role, facultyAssignedBranches, loadScheduleFor, user]);

  const onSubmit = async (data: TimetableFormValues) => {
    if (!user) {
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return;
    }
    if (!data.branch || !data.semester) {
      toast({ title: "Error", description: "Branch and Semester must be selected.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      console.log('🗓️ Saving timetable to database for', data.branch, data.semester);

      const timetableData = {
        id: `${data.branch.toLowerCase()}_${data.semester.toLowerCase().replace(' ', '-')}`,
        branch: data.branch,
        semester: data.semester,
        schedule: data.schedule.map(daySchedule => ({
          day: daySchedule.day as DayOfWeek,
          entries: daySchedule.entries.map((entry, periodIndex) => ({
              period: entry.period,
              type: entry.type,
              subject: timeSlotDescriptors[periodIndex].isBreak
                         ? timeSlotDescriptors[periodIndex].label
                         : entry.subject || "",
              subject_code: entry.subject_code || "",
              room_number: entry.room_number || "",
              batch: entry.batch || "",
              faculty_name: entry.faculty_name || "",
              is_lab_period: entry.is_lab_period || false,
            })),
        })),
        lastUpdatedBy: user.uid,
      };

      // Check if timetable already exists
      console.log('🔍 Checking if timetable exists...');
      const existingTimetables = await getTimetables({ branch: data.branch, semester: data.semester });
      const existingTimetable = existingTimetables.find(t =>
        t.branch === data.branch && t.semester === data.semester
      );

      let result;
      if (existingTimetable) {
        console.log('📝 Updating existing timetable...');
        result = await updateTimetable(existingTimetable.id, {
          schedule: timetableData.schedule,
          lastUpdatedBy: user.uid
        });
      } else {
        console.log('🆕 Creating new timetable...');
        result = await createTimetable(timetableData);
      }

      if (result) {
        console.log('✅ Timetable saved to database successfully');

        // Also save to localStorage as backup
        localStorage.setItem(`${TIMETABLE_STORAGE_KEY_PREFIX}${data.branch}_${data.semester}`, JSON.stringify(timetableData));

        toast({
          title: "Timetable Saved",
          description: `Timetable for ${data.branch} - ${data.semester} has been saved to database.`,
        });
        if (onTimetableUpdate) onTimetableUpdate();
      } else {
        throw new Error('Failed to save timetable');
      }

    } catch (error) {
      console.error("❌ Error saving timetable:", error);
      toast({
        title: "Error Saving Timetable",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubjectSelection = (dayIndex: number, periodIndex: number, subjectId: string) => {
    const currentSchedule = form.getValues('schedule');
    if (currentSchedule[dayIndex]) {
      if (subjectId === "no-class") {
        // Clear the subject data
        currentSchedule[dayIndex].entries[periodIndex].subject = "";
        currentSchedule[dayIndex].entries[periodIndex].subject_code = "";
        currentSchedule[dayIndex].entries[periodIndex].room_number = "";
        currentSchedule[dayIndex].entries[periodIndex].faculty_name = "";
      } else {
        const subject = availableSubjects.find(s => s.id === subjectId);
        if (!subject) return;

        currentSchedule[dayIndex].entries[periodIndex].subject = subject.name;
        currentSchedule[dayIndex].entries[periodIndex].subject_code = subject.code;
        currentSchedule[dayIndex].entries[periodIndex].room_number = subject.room_number || "";

        // Look up real faculty names instead of using IDs
        const facultyNames = (subject.assignedFacultyUids || []).map((uid: string) => {
          const faculty = facultyProfiles.find(f => f.id === uid);
          return faculty ? (faculty.full_name || faculty.display_name || faculty.email.split('@')[0]) : `Unknown Faculty`;
        }).join(', ');

        currentSchedule[dayIndex].entries[periodIndex].faculty_name = facultyNames;
      }
      form.setValue('schedule', currentSchedule);
    }
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-primary flex items-center">
            <CalendarDays className="mr-3 h-6 w-6 sm:h-7 sm:w-7"/> Create/Update Timetable
        </CardTitle>
        <ShadCnCardDescription>Enter or modify the class schedule. Select subjects from the dropdown to auto-populate faculty and room information.</ShadCnCardDescription>
      </CardHeader>
      <CardContent>
        {pageIsLoading ? (
            <div className="flex justify-center items-center py-20 text-muted-foreground">
                <SimpleRotatingSpinner className="mr-2 h-5 w-5 text-primary" /> Loading timetable editor...
            </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select 
                      onValueChange={async (value) => {
                          field.onChange(value);
                          if(value) {
                            await loadScheduleFor(value, form.getValues("semester"));
                            await loadSubjectsForBranchSemester(value, form.getValues("semester"));
                          }
                      }}
                      value={field.value}
                      disabled={role === 'faculty' && facultyAssignedBranches?.length === 1}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableBranchesForForm.length > 0 ? availableBranchesForForm.map(b => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        )) : <SelectItem value="-" disabled>No branches available</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <Select 
                      onValueChange={async (value) => {
                          field.onChange(value);
                          if(value) {
                            const branch = form.getValues("branch");
                            await loadScheduleFor(branch, value);
                            await loadSubjectsForBranchSemester(branch, value);
                          }
                      }}
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Select semester" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {semesters.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border rounded-lg p-4 bg-muted/20">
              <h4 className="font-semibold mb-2">Available Subjects for {watchedBranch} - {watchedSemester}:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {availableSubjects.length > 0 ? availableSubjects.map(subject => (
                  <div key={subject.id} className="text-xs p-2 border rounded bg-background">
                    <div className="font-medium">{subject.name} ({subject.code})</div>
                    <div className="text-muted-foreground">
                      {subject.type === 'lab' ? '🔬 Lab' : '📚 Class'}
                      {subject.room_number && ` • Room: ${subject.room_number}`}
                    </div>
                    <div className="text-muted-foreground">
                      Faculty: {subject.assignedFacultyUids && subject.assignedFacultyUids.length > 0 ? 
                        subject.assignedFacultyUids.map((uid: string) => {
                          const faculty = facultyProfiles.find(f => f.id === uid);
                          return faculty ? (faculty.full_name || faculty.display_name || faculty.email.split('@')[0]) : 'Unknown';
                        }).join(', ') : 
                        'None'}
                    </div>
                  </div>
                )) : (
                  <div className="text-muted-foreground">No subjects created yet. Create subjects first in Subject Management.</div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {fields.map((dayField, dayIndex) => (
                <div key={dayField.id} className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-border">
                    <div className="text-lg font-semibold text-primary min-w-[120px]">
                      {dayField.day}
                    </div>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  {/* Period Cards Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {timeSlotDescriptors.map((descriptor, periodIndex) => {
                      const isSaturday = dayField.day === "Saturday";
                      const isAfterSaturdayCutoff = isSaturday && periodIndex > saturdayLastSlotIndex;
                      const isDisabled = isAfterSaturdayCutoff || descriptor.isBreak;
                      const currentEntry = watchedSchedule?.[dayIndex]?.entries?.[periodIndex];

                      return (
                        <Card key={`${dayField.id}-${periodIndex}`}
                              className={`transition-all duration-200 hover:shadow-md ${
                                descriptor.isBreak
                                  ? 'bg-muted/30 border-dashed'
                                  : currentEntry?.type === 'lab'
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                    : 'bg-card border-border'
                              } ${isAfterSaturdayCutoff ? 'opacity-50' : ''}`}>
                          <CardContent className="p-4">
                            {/* Time and Period Info */}
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-semibold text-sm text-primary">
                                  {descriptor.label}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {descriptor.time}
                                </div>
                              </div>
                              {currentEntry?.type === 'lab' && (
                                <div className="text-orange-600 dark:text-orange-400">
                                  🔬 LAB
                                </div>
                              )}
                            </div>

                            {/* Subject Selection */}
                            {isDisabled ? (
                              <div className="text-center py-3">
                                <div className="text-muted-foreground font-medium text-sm">
                                  {isAfterSaturdayCutoff ? "-" : descriptor.label}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <Select
                                  onValueChange={(subjectId) => handleSubjectSelection(dayIndex, periodIndex, subjectId)}
                                  value={currentEntry?.subject || "no-class"}
                                >
                                  <SelectTrigger className="w-full h-9 text-sm">
                                    <SelectValue placeholder="Select subject" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="no-class">❌ No class</SelectItem>
                                    {availableSubjects.map(subject => (
                                      <SelectItem key={subject.id} value={subject.id}>
                                        <div className="flex flex-col">
                                          <span className="font-medium">
                                            {subject.type === 'lab' ? '🔬' : '📚'} {subject.name}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {subject.code}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {/* Current Assignment Info */}
                                {currentEntry?.subject && currentEntry.subject !== "no-class" && (
                                  <div className="space-y-2 pt-2 border-t border-border/50">
                                    {currentEntry.faculty_name && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-blue-600">👨‍🏫</span>
                                        <span className="text-blue-700 dark:text-blue-300 truncate">
                                          {currentEntry.faculty_name}
                                        </span>
                                      </div>
                                    )}
                                    {currentEntry.room_number && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-green-600">🏫</span>
                                        <span className="text-green-700 dark:text-green-300">
                                          Room {currentEntry.room_number}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t mt-6">
              <Button type="submit" className="w-full sm:w-auto" disabled={isSaving || pageIsLoading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Timetable
              </Button>
            </div>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  );
}
