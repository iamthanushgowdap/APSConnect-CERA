
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserProfile, checkExistingUser, getBranches } from '@/lib/supabase-utils';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/components/auth-provider';
import type { Branch } from "@/types";
import type { UserRole } from "@/types";
import type { Semester } from "@/types";
import { defaultBranches, semesters } from "@/types";
import { ShootingStars } from "@/components/ui/shooting-stars";

const SITE_SETTINGS_STORAGE_KEY = 'apsconnect_site_settings_v1';

interface SiteSettings {
  enablestudentregistration?: boolean;
}

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
  semester: z.string({ required_error: "Please select your semester." }),
  pronouns: z.string().max(50, { message: "Pronouns cannot exceed 50 characters." }).optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { updateUserContext } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>(defaultBranches);
  const [studentRegistrationEnabled, setStudentRegistrationEnabled] = useState(true);

  useEffect(() => {
    const loadStudentRegistrationSetting = async () => {
      // EMERGENCY BYPASS: Temporarily disable site settings loading to fix login crashes
      console.log('🔄 Registration setting loading bypassed for emergency fix');
      setStudentRegistrationEnabled(true); // Always allow registration for now
    };

    const fetchBranches = async () => {
      try {
        console.log('📡 Calling getBranches()...');
        const branchList = await getBranches();
        console.log('✅ Branches fetched:', branchList);
        setAvailableBranches(branchList);
      } catch (error) {
        console.error('❌ Error fetching branches:', error);
        console.log('🔄 Falling back to default branches');
        setAvailableBranches(defaultBranches);
      }
    };

    loadStudentRegistrationSetting();
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
      branch: "",
      semester: "",
      pronouns: "",
    }
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
      const userProfileData = {
        email: data.email.toLowerCase(),
        full_name: data.displayName,
        role: 'pending' as UserRole,
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
        id: authData.user.id,
      });

      // Store in localStorage for immediate access
      if (typeof window !== 'undefined') {
        localStorage.setItem(`apsconnect_user_${authData.user.id}`, JSON.stringify({
          ...userProfileData,
          id: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
      }

      // Update auth context immediately with the new user data
      const newUserData = {
        uid: authData.user.id,
        email: data.email.toLowerCase(),
        displayName: data.displayName,
        role: 'pending' as UserRole,
        usn: fullUsn,
        branch: data.branch,
        semester: data.semester as Semester,
        rejectionReason: undefined,
        is_approved: false,
      };

      updateUserContext(newUserData);

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
    <>
      <ShootingStars />
      <div className="container mx-auto px-4 py-8 pt-24 pb-48 min-h-screen" style={{ backgroundColor: 'hsl(var(--background))', fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex justify-center">
        <div className="background relative" style={{
          width: '400px',
          height: '600px',
          margin: '0 auto'
        }}>
          {/* Background Shapes */}
          <div className="shape" style={{
            height: '120px',
            width: '120px',
            position: 'absolute',
            borderRadius: '50%',
            background: 'linear-gradient(#1845ad, #23a2f6)',
            left: '-40px',
            top: '-40px'
          }}></div>
          <div className="shape" style={{
            height: '120px',
            width: '120px',
            position: 'absolute',
            borderRadius: '50%',
            background: 'linear-gradient(to right, #ff512f, #f09819)',
            right: '-20px',
            bottom: '-40px'
          }}></div>
          {studentRegistrationEnabled ? (
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              style={{
                height: '600px',
                width: '400px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                position: 'relative',
                borderRadius: '10px',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                padding: '40px 30px',
                color: 'hsl(var(--foreground))',
                fontFamily: "'Poppins', sans-serif",
                zIndex: 10,
                overflowY: 'auto'
              }}
            >
              <h3 style={{
                fontSize: '28px',
                fontWeight: '500',
                lineHeight: '36px',
                textAlign: 'center',
                marginBottom: '30px'
              }}>
                Create Account
              </h3>

              <Form {...form}>
                <div style={{ marginTop: '20px' }}>
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Thanush Gowda P"
                            style={{
                              display: 'block',
                              height: '45px',
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              padding: '0 10px',
                              fontSize: '14px',
                              fontWeight: '300',
                              color: 'hsl(var(--foreground))',
                              border: '1px solid rgba(255,255,255,0.3)',
                              outline: 'none'
                            }}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            style={{
                              display: 'block',
                              height: '45px',
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              padding: '0 10px',
                              fontSize: '14px',
                              fontWeight: '300',
                              color: 'hsl(var(--foreground))',
                              border: '1px solid rgba(255,255,255,0.3)',
                              outline: 'none'
                            }}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <FormField
                    control={form.control}
                    name="usnSuffix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          University Seat Number (USN)
                        </FormLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            padding: '10px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: 'hsl(var(--foreground))'
                          }}>1AP</span>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., 23CS001"
                              maxLength={7}
                              onInput={(e) => {
                                const inputVal = e.currentTarget.value;
                                if (inputVal.length >= 2 && inputVal.length <=4) {
                                  const yearPart = inputVal.substring(0,2);
                                  const branchPart = inputVal.substring(2,4);
                                  const rollPart = inputVal.substring(4);
                                  e.currentTarget.value = yearPart + branchPart.toUpperCase() + rollPart;
                                } else if (inputVal.length > 4) {
                                  const yearPart = inputVal.substring(0,2);
                                  const branchPart = inputVal.substring(2,4).toUpperCase();
                                  const rollPart = inputVal.substring(4);
                                  e.currentTarget.value = yearPart + branchPart + rollPart;
                                }
                                field.onChange(e);
                              }}
                              style={{
                                display: 'block',
                                height: '45px',
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '3px',
                                padding: '0 10px',
                                fontSize: '14px',
                                fontWeight: '300',
                                color: 'hsl(var(--foreground))',
                                border: '1px solid rgba(255,255,255,0.3)',
                                outline: 'none'
                              }}
                              suppressHydrationWarning
                            />
                          </FormControl>
                        </div>
                        <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
                          e.g., 23CS001
                        </div>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Branch
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <select
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              style={{
                                display: 'block',
                                height: '45px',
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '3px',
                                padding: '0 10px',
                                fontSize: '14px',
                                fontWeight: '300',
                                color: 'hsl(var(--foreground))',
                                border: '1px solid rgba(255,255,255,0.3)',
                                outline: 'none'
                              }}
                            >
                              <option value="" disabled style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))' }}>
                                Select Branch
                              </option>
                              {availableBranches.length > 0 ? (
                                availableBranches.map((branchName) => (
                                  <option key={branchName} value={branchName} style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                                    {branchName}
                                  </option>
                                ))
                              ) : (
                                <option value="disabled" disabled style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                                  No branches configured by admin.
                                </option>
                              )}
                            </select>
                          </FormControl>
                        </Select>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Semester
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <select
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              style={{
                                display: 'block',
                                height: '45px',
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '3px',
                                padding: '0 10px',
                                fontSize: '14px',
                                fontWeight: '300',
                                color: 'hsl(var(--foreground))',
                                border: '1px solid rgba(255,255,255,0.3)',
                                outline: 'none'
                              }}
                            >
                              <option value="" disabled style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--muted-foreground))' }}>
                                Select Semester
                              </option>
                              {semesters.map((sem) => (
                                <option key={sem} value={sem} style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
                                  {sem}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                        </Select>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <FormField
                    control={form.control}
                    name="pronouns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Pronouns (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., she/her, he/him, they/them"
                            style={{
                              display: 'block',
                              height: '45px',
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              padding: '0 10px',
                              fontSize: '14px',
                              fontWeight: '300',
                              color: 'hsl(var(--foreground))',
                              border: '1px solid rgba(255,255,255,0.3)',
                              outline: 'none'
                            }}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            {...field}
                            placeholder="••••••••"
                            style={{
                              display: 'block',
                              height: '45px',
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              padding: '0 10px',
                              fontSize: '14px',
                              fontWeight: '300',
                              color: 'hsl(var(--foreground))',
                              border: '1px solid rgba(255,255,255,0.3)',
                              outline: 'none'
                            }}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ marginTop: '20px' }}>
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'hsl(var(--foreground))',
                          marginBottom: '8px'
                        }}>
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            {...field}
                            placeholder="••••••••"
                            style={{
                              display: 'block',
                              height: '45px',
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '3px',
                              padding: '0 10px',
                              fontSize: '14px',
                              fontWeight: '300',
                              color: 'hsl(var(--foreground))',
                              border: '1px solid rgba(255,255,255,0.3)',
                              outline: 'none'
                            }}
                            suppressHydrationWarning
                          />
                        </FormControl>
                        <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    marginTop: '30px',
                    width: '100%',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    padding: '15px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? "Registering..." : "Register"}
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                  <p style={{ color: 'hsl(var(--foreground))', marginBottom: '10px' }}>
                    Already have an account?{" "}
                    <Link href="/login" style={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', textDecoration: 'underline' }}>
                      Login here
                    </Link>
                  </p>
                </div>
              </Form>
            </form>
          ) : (
            <div
              style={{
                height: '300px',
                width: '400px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                position: 'relative',
                borderRadius: '10px',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                padding: '40px 30px',
                color: 'hsl(var(--foreground))',
                fontFamily: "'Poppins', sans-serif",
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <h3 style={{
                fontSize: '24px',
                fontWeight: '500',
                lineHeight: '32px',
                marginBottom: '20px',
                color: 'hsl(var(--muted-foreground))'
              }}>
                Registration Disabled
              </h3>
              <p style={{
                fontSize: '16px',
                lineHeight: '24px',
                marginBottom: '30px',
                color: 'hsl(var(--muted-foreground))'
              }}>
                Student registration is currently disabled by the administrator. Please contact your faculty or try again later.
              </p>
              <Link href="/login" style={{
                color: 'hsl(var(--primary))',
                fontWeight: 'bold',
                textDecoration: 'underline',
                fontSize: '16px'
              }}>
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
