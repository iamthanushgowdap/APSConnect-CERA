
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription as ShadCnFormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription as ShadCnCardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createUserProfile, checkExistingUser, getBranches } from '@/lib/supabase-utils';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, Branch, Semester } from "@/types";
import { defaultBranches, semesters } from "@/types";
import { Icons } from "@/components/icons";


const usnSuffixRegex = /^[0-9]{2}[A-Za-z]{2}[0-9]{3}$/;
const BRANCH_STORAGE_KEY = 'apsconnect_managed_branches';

const registerSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  usnSuffix: z.string()
    .length(7, { message: "USN Suffix must be 7 characters (e.g., 23CS001)." })
    .regex(usnSuffixRegex, { message: "Format: YYBBBNNN (e.g., 23CS001 where YY is year, BB branch, NNN roll no)." })
    .transform(val => {
      return val.substring(0, 2) + val.substring(2, 4).toUpperCase() + val.substring(4, 7);
    }),
  branch: z.string({ required_error: "Please select your branch." }),
  semester: z.string({ required_error: "Please select your semester." }) as z.ZodSchema<Semester>,
  pronouns: z.string().max(50, { message: "Pronouns cannot exceed 50 characters." }).optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(defaultBranches);

  useEffect(() => {
    console.log('🔄 Registration page: Fetching branches...');
    const fetchBranches = async () => {
      try {
        console.log('📡 Calling getBranches()...');
        const branchList = await getBranches();
        console.log('✅ Branches fetched:', branchList);
        setAvailableBranches(branchList);
        console.log('✅ Branches set in state:', branchList.length, 'branches');
      } catch (error) {
        console.error('❌ Error fetching branches:', error);
        console.log('🔄 Falling back to default branches');
        setAvailableBranches(defaultBranches);
      }
    };

    fetchBranches();
  }, []);


  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      usnSuffix: "",
      branch: undefined,
      semester: undefined,
      pronouns: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    const fullUsn = `1AP${data.usnSuffix}`;

    try {
      // Check if USN already exists in Supabase
      const existingUsers = await checkExistingUser(fullUsn, fullUsn);
      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Registration Failed",
          description: "This USN is already registered. Please contact your faculty.",
          variant: "destructive",
          duration: 5000,
        });
        setIsLoading(false);
        return;
      }

      // Map semester string to year number
      const semesterToYear: Record<string, number> = {
        "1st Sem": 1,
        "2nd Sem": 2,
        "3rd Sem": 3,
        "4th Sem": 4,
        "5th Sem": 5,
        "6th Sem": 6,
        "7th Sem": 7,
        "8th Sem": 8,
      };
      const yearOfStudy = semesterToYear[data.semester] || 1;

      // Create Supabase auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            displayName: data.displayName,
            role: 'pending',
            usn: fullUsn,
            branch: data.branch,
            semester: data.semester,
          }
        }
      });

      if (authError) {
        throw new Error(`Authentication setup failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Failed to create authentication account');
      }

      // Create user profile in Supabase with the auth user ID
      const userProfileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> = {
        email: data.email.toLowerCase(),
        full_name: data.displayName,
        role: 'pending',
        usn: fullUsn,
        student_id: fullUsn,
        department: data.branch,
        year_of_study: yearOfStudy.toString(),
        pronouns: data.pronouns || undefined,
        branch: data.branch,
        semester: data.semester,
        is_approved: false,
      };

      await createUserProfile({
        ...userProfileData,
        id: authData.user.id, // Use the auth user's ID
      } as UserProfile);

      // Also store in localStorage for immediate login effect (temporary)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`apsconnect_user_${fullUsn}`, JSON.stringify({
          ...userProfileData,
          id: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        localStorage.setItem('mockUser', JSON.stringify({
          uid: authData.user.id,
          displayName: data.displayName,
          email: data.email.toLowerCase(),
          role: 'pending',
          usn: fullUsn,
          branch: data.branch,
          semester: data.semester,
          pronouns: data.pronouns || undefined,
        }));
      }

      toast({
        title: "Registration Submitted",
        description: "Your registration is pending admin/faculty approval. You will be notified once approved.",
        duration: 3000,
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] items-center justify-center py-8 sm:py-12 px-4">
      <Card className="w-full max-w-sm sm:max-w-lg shadow-xl">
        <CardHeader className="text-center items-center">
            <Icons.AppLogo className="h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">Create an Account</CardTitle>
          <ShadCnCardDescription className="text-base">Join APSConnect to stay updated with college activities.</ShadCnCardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Thanush Gowda P" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="usnSuffix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">University Seat Number (USN)</FormLabel>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-medium p-2.5 border border-input rounded-md bg-muted">1AP</span>
                      <FormControl>
                        <Input
                          placeholder="e.g., 23CS001"
                          {...field}
                          className="text-sm sm:text-base"
                          maxLength={7}
                          onInput={(e) => {
                            const inputVal = e.currentTarget.value;
                            // Automatically convert branch part to uppercase dynamically
                            if (inputVal.length >= 2 && inputVal.length <=4) { // YYBB
                                const yearPart = inputVal.substring(0,2);
                                const branchPart = inputVal.substring(2,4);
                                const rollPart = inputVal.substring(4);
                                e.currentTarget.value = yearPart + branchPart.toUpperCase() + rollPart;
                            } else if (inputVal.length > 4) { // YYBBBNNN
                                const yearPart = inputVal.substring(0,2);
                                const branchPart = inputVal.substring(2,4).toUpperCase(); // Ensure branch is uppercase
                                const rollPart = inputVal.substring(4);
                                e.currentTarget.value = yearPart + branchPart + rollPart;
                            }
                            field.onChange(e); // Propagate change to RHF
                          }}
                          suppressHydrationWarning
                        />
                      </FormControl>
                    </div>
                    <ShadCnFormDescription className="text-xs sm:text-sm">
                      e.g., 23CS001
                    </ShadCnFormDescription>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="branch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Branch</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} >
                        <FormControl>
                          <SelectTrigger className="text-sm sm:text-base" suppressHydrationWarning>
                            <SelectValue placeholder="Select your branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableBranches.length > 0 ? (
                            availableBranches.map((branchName) => (
                              <SelectItem key={branchName} value={branchName} className="text-sm sm:text-base">
                                {branchName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="disabled" disabled className="text-sm sm:text-base">
                              No branches configured by admin.
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs sm:text-sm"/>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Semester</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm sm:text-base" suppressHydrationWarning>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {semesters.map((sem) => (
                            <SelectItem key={sem} value={sem} className="text-sm sm:text-base">
                              {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs sm:text-sm"/>
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                control={form.control}
                name="pronouns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Pronouns (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., she/her, he/him, they/them" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="text-sm sm:text-base" suppressHydrationWarning/>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm"/>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full text-sm sm:text-base" disabled={isLoading} suppressHydrationWarning>
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm">
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
