
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, Branch, defaultBranches, Semester, semesters, Subject, SUBJECT_STORAGE_KEY } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Users, Loader2, Trash2, Edit3, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label'; 
import { Checkbox } from '@/components/ui/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription as ShadCnFormDescription,
} from "@/components/ui/form";
import { getUserProfiles, updateUserProfile, createUserProfileForce, deleteUserProfile, createFaculty, getBranches } from '@/lib/supabase-utils';
import { supabase } from '@/lib/supabase';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';

const BRANCH_STORAGE_KEY = 'apsconnect_managed_branches';

const facultyFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  pronouns: z.string().max(50, "Pronouns too long.").optional().or(z.literal('')),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits.").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  assignedBranches: z.array(z.string()).min(1, "At least one branch must be selected."),
  assignedSemesters: z.array(z.string()).optional(), 
  facultyTitle: z.string().optional().or(z.literal('')),
}).refine(data => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FacultyFormValues = z.infer<typeof facultyFormSchema>;

export default function ManageFacultyTab() {
  const [facultyMembers, setFacultyMembers] = useState<UserProfile[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(defaultBranches);

  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      pronouns: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      assignedBranches: [],
      assignedSemesters: [],
      facultyTitle: "",
    },
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchList = await getBranches();
        setAvailableBranches(branchList);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setAvailableBranches(defaultBranches);
      }
    };

    fetchBranches();
  }, []);


  const fetchFacultyAndSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load faculty from database
      const allUsers = await getUserProfiles({ role: 'faculty' });
      setFacultyMembers(allUsers.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));

      // Load subjects from database instead of localStorage
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
        setAllSubjects([]);
      } else {
        setAllSubjects(subjectsData || []);
        console.log('Loaded subjects from database:', subjectsData?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching faculty and subjects:', error);
      setFacultyMembers([]);
      setAllSubjects([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFacultyAndSubjects();
  }, [fetchFacultyAndSubjects]);

  const handleFormSubmit = async (data: FacultyFormValues) => {
    try {
      if (!editingFaculty) {
        // Check if email already exists
        const existingUsers = await getUserProfiles();
        const existingUser = existingUsers.find(u => u.email.toLowerCase() === data.email.toLowerCase());
        if (existingUser) {
          toast({
            title: "Error Creating Faculty",
            description: "This email address is already in use by another account.",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }
      }

      if (editingFaculty) {
        // Update existing faculty
        await updateUserProfile(editingFaculty.id, {
          full_name: data.displayName,
          pronouns: data.pronouns || undefined,
          phone: data.phoneNumber || undefined,
          assigned_branches: data.assignedBranches,
          assigned_semesters: data.assignedSemesters as Semester[] || [],
          faculty_title: data.facultyTitle || undefined,
          updated_at: new Date().toISOString(),
        });
        toast({
          title: "Faculty Updated",
          description: `${data.displayName} has been successfully updated.`,
          duration: 3000,
        });
      } else {
        // For new faculty, use the dedicated createFaculty function
        const createdFaculty = await createFaculty({
          email: data.email,
          password: data.password!,
          displayName: data.displayName,
          pronouns: data.pronouns,
          phone: data.phoneNumber,
          assignedBranches: data.assignedBranches,
          assignedSemesters: data.assignedSemesters || [],
          facultyTitle: data.facultyTitle,
        });

        if (!createdFaculty) {
          throw new Error('Failed to create faculty');
        }

        toast({
          title: "Faculty Created",
          description: `${data.displayName} has been successfully added. They can now login with their email.`,
          duration: 5000,
        });
      }

      fetchFacultyAndSubjects();
      setIsFormOpen(false);
      setEditingFaculty(null);
      form.reset();
    } catch (error) {
      console.error('Error saving faculty:', error);
      toast({
        title: "Error",
        description: "Failed to save faculty. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const openEditDialog = (faculty: UserProfile) => {
    setEditingFaculty(faculty);
    form.reset({
      displayName: faculty.full_name || "",
      email: faculty.email,
      pronouns: faculty.pronouns || "",
      phoneNumber: faculty.phone || "",
      assignedBranches: faculty.assigned_branches || [],
      assignedSemesters: faculty.assigned_semesters || [],
      facultyTitle: faculty.faculty_title || "",
      password: "",
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };

  const openCreateDialog = () => {
    setEditingFaculty(null);
    form.reset({ 
        displayName: "",
        email: "",
        pronouns: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        assignedBranches: [],
        assignedSemesters: [],
        facultyTitle: "",
    });
    setIsFormOpen(true);
  }

  const handleDeleteFaculty = async (email: string) => {
    if (window.confirm("Are you sure you want to delete this faculty member? This action cannot be undone.")) {
      try {
        // Find the faculty member by email to get their ID
        const facultyToDelete = facultyMembers.find(f => f.email === email);
        if (!facultyToDelete) {
          toast({
            title: "Error",
            description: "Faculty member not found.",
            variant: "destructive",
            duration: 3000,
          });
          return;
        }

        // Delete from database
        const success = await deleteUserProfile(facultyToDelete.id);
        if (success) {
          toast({
            title: "Faculty Deleted",
            description: `Faculty member ${email} has been deleted.`,
            duration: 3000,
          });
          fetchFacultyAndSubjects(); // Refresh the list
        } else {
          throw new Error("Delete operation failed");
        }
      } catch (error) {
        console.error('Error deleting faculty:', error);
        toast({
          title: "Error",
          description: "Failed to delete faculty. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
  };

  const getSubjectsForFaculty = (facultyUid: string): Subject[] => {
    return allSubjects.filter(subject => subject.assignedFacultyUids?.includes(facultyUid) || false);
  };


  const filteredFaculty = facultyMembers.filter(faculty => {
    const searchLower = searchTerm.toLowerCase();
    const facultySubjects = getSubjectsForFaculty(faculty.id);

    return (
      faculty.full_name?.toLowerCase().includes(searchLower) ||
      faculty.email.toLowerCase().includes(searchLower) ||
      faculty.pronouns?.toLowerCase().includes(searchLower) ||
      faculty.assigned_branches?.some((b: string) => b.toLowerCase().includes(searchLower)) ||
      faculty.assigned_semesters?.some((s: string) => s.toLowerCase().includes(searchLower)) ||
      faculty.faculty_title?.toLowerCase().includes(searchLower) ||
      faculty.phone?.includes(searchLower) ||
      facultySubjects.some(s => s.name.toLowerCase().includes(searchLower) || s.code.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><SimpleRotatingSpinner className="h-8 w-8 text-primary" /> <span className="ml-2">Loading faculty...</span></div>;
  }

  return (
    <div className="space-y-6">
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
        setIsFormOpen(isOpen);
        if (!isOpen) {
            form.reset();
            setEditingFaculty(null);
        }
      }}>
        <DialogTrigger asChild>
          <Button onClick={openCreateDialog} className="mb-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Faculty
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFaculty ? "Edit Faculty Member" : "Add New Faculty Member"}</DialogTitle>
            <DialogDescription>
              {editingFaculty ? "Update the details of the faculty member." : "Enter the details for the new faculty member."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Dr. Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="jane.doe@example.com" {...field} disabled={!!editingFaculty} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pronouns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pronouns (Optional)</FormLabel>
                    <FormControl><Input placeholder="e.g., she/her, he/him" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl><Input type="tel" placeholder="9876543210" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facultyTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Role (e.g., Professor, HOD)</FormLabel>
                    <FormControl><Input placeholder="Professor of CSE" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedBranches"
                render={() => (
                  <FormItem>
                    <FormLabel>Assigned Branches</FormLabel>
                     <ShadCnFormDescription>
                      {availableBranches.length === 0 ? "No branches defined by admin yet. Please add branches in Branch Management first." : "Select branches."}
                    </ShadCnFormDescription>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                      {availableBranches.map((branch) => (
                        <FormField
                          key={branch}
                          control={form.control}
                          name="assignedBranches"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={branch}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(branch)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), branch])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== branch
                                            )
                                          );
                                    }}
                                    disabled={availableBranches.length === 0 && !defaultBranches.includes(branch)}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {branch}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedSemesters"
                render={() => (
                  <FormItem>
                    <FormLabel>Assigned Semesters (Optional)</FormLabel>
                     <ShadCnFormDescription>
                      Select all semesters this faculty member is associated with.
                    </ShadCnFormDescription>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded-md">
                      {semesters.map((semester) => (
                        <FormField
                          key={semester}
                          control={form.control}
                          name="assignedSemesters"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={semester}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(semester)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), semester])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== semester
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {semester}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingFaculty ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                    <FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{editingFaculty ? "Confirm New Password" : "Confirm Password"}</FormLabel>
                    <FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingFaculty ? "Update Faculty" : "Create Faculty"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="text-primary h-6 w-6" />
            Faculty List
          </CardTitle>
          <CardDescription>Manage all faculty accounts.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search faculty..."
              className="pl-8 w-full sm:w-1/2 lg:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          {filteredFaculty.length === 0 && searchTerm === '' ? (
             <p className="text-muted-foreground">No faculty members found. Click "Add New Faculty" to create one.</p>
          ) : filteredFaculty.length === 0 && searchTerm !== '' ? (
            <p className="text-muted-foreground">No faculty members match your search criteria.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Title/Role</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead>Semesters</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map(faculty => (
                  <TableRow key={faculty.id}>
                    <TableCell>{faculty.full_name || 'N/A'}</TableCell>
                    <TableCell>{faculty.email}</TableCell>
                    <TableCell>{faculty.faculty_title || 'N/A'}</TableCell>
                    <TableCell>
                        {faculty.assigned_branches && faculty.assigned_branches.length > 0
                          ? faculty.assigned_branches.map((b: string) => <Badge key={b} variant="outline" className="mr-1 mb-1">{b}</Badge>)
                          : <Badge variant="secondary">N/A</Badge>}
                    </TableCell>
                     <TableCell>
                        {faculty.assigned_semesters && faculty.assigned_semesters.length > 0
                          ? faculty.assigned_semesters.map((s: string) => <Badge key={s} variant="secondary" className="mr-1 mb-1">{s}</Badge>)
                          : <Badge variant="secondary">N/A</Badge>}
                    </TableCell>
                     <TableCell>
                        {getSubjectsForFaculty(faculty.id).length > 0
                          ? getSubjectsForFaculty(faculty.id).map(s => <Badge key={s.id} variant="outline" className="mr-1 mb-1 bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700">{s.name} ({s.code})</Badge>)
                          : <span className="text-xs text-muted-foreground">None</span>}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(faculty)}>
                            <Edit3 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteFaculty(faculty.email)}>
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
