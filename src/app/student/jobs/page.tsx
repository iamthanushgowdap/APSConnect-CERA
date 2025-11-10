"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Crown,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  ArrowLeft,
  ExternalLink,
  Search,
  Star,
  Eye,
  Users,
  Calendar,
  Send,
  CheckCircle,
  Filter,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import AlumniCard from "@/components/ui/AlumniCard";

interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  application_deadline: string | null;
  contact_email: string;
  contact_phone: string | null;
  website_url: string | null;
  is_active: boolean;
  eligible_branches: string[];
  eligible_semesters: string[];
  minimum_cgpa: number | null;
  required_skills: string[];
  preferred_skills: string[];
  application_instructions: string;
  application_url: string | null;
  application_email: string | null;
  posted_by_id: string;
  posted_by_name: string;
  posted_by_email: string;
  created_at: string;
  updated_at: string;
  views_count: number;
  applications_count: number;
}

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  branch: string;
  semester: string;
  graduation_year: number;
  skills: string[];
}

interface AlumniProfile {
  id: string;
  full_name: string;
  email: string;
  branch: string;
  semester: string;
  graduation_year: number;
  skills: string[];
  current_position?: string;
  current_company?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  avatar_url?: string;
  bio?: string;
  address?: string;
  placement_job_title?: string;
  placement_company?: string;
}

function AlumniProfilesSection({ studentProfile }: { studentProfile: StudentProfile | null }) {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [alumniLoading, setAlumniLoading] = useState(false);

  useEffect(() => {
    if (!studentProfile) return;

    const fetchAlumniProfiles = async () => {
      setAlumniLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, email, role, branch, semester, graduation_year, skills, current_position, current_company, linkedin_url, github_url, portfolio_url, avatar_url, bio, address, placement_job_title, placement_company')
          .eq('role', 'alumni')  // Only users with role exactly equal to 'alumni'
          .eq('branch', studentProfile.branch)
          .order('graduation_year', { ascending: false });

        if (error) {
          console.error('Error fetching alumni:', error);
        } else {
          // Ensure only pure alumni users are shown (filter out any data inconsistencies)
          const pureAlumni = (data || []).filter(alum => 
            alum.role === 'alumni' && // Double-check role
            alum.full_name && // Ensure name exists
            alum.email // Ensure email exists
          );
          setAlumni(pureAlumni);
        }
      } catch (error) {
        console.error('Error fetching alumni profiles:', error);
      } finally {
        setAlumniLoading(false);
      }
    };

    fetchAlumniProfiles();
  }, [studentProfile]);

  if (alumniLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold">Alumni from {studentProfile?.branch}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alumni.map((alum) => (
          <div key={alum.id} className="flex justify-center">
            <div className="w-full max-w-sm">
              <AlumniCard
                name={alum.full_name}
                jobTitle={alum.current_position && alum.current_company
                  ? `${alum.current_position} at ${alum.current_company}`
                  : alum.current_position || alum.current_company || 'Professional'
                }
                branch={alum.branch}
                avatarUrl={alum.avatar_url || '/api/placeholder/400/600'}
                coverUrl={alum.avatar_url || '/api/placeholder/800/400'}
                about={alum.bio || `${alum.full_name} graduated in ${alum.graduation_year} from ${alum.branch}. ${alum.current_position && alum.current_company ? `Currently working as ${alum.current_position} at ${alum.current_company}.` : 'A dedicated professional in their field.'}`}
                placementJobTitle={alum.placement_job_title}
                placementCompany={alum.placement_company}
                skills={alum.skills}
                contact={{
                  address: alum.address || 'Not specified',
                  phone: '', // Don't show phone number
                  email: alum.email
                }}
                socialLinks={{
                  linkedin: alum.linkedin_url || undefined
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {alumni.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No alumni profiles found</h3>
          <p className="text-muted-foreground">
            Alumni profiles from your branch will appear here as they join the network.
          </p>
        </div>
      )}
    </div>
  );
}

export default function StudentJobsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'alumni'>('jobs');

  useEffect(() => {
    if (!authUser) return;
    checkStudentStatus();
  }, [authUser]);

  const checkStudentStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, role, full_name, email, branch, semester, graduation_year, skills')
        .eq('id', authUser!.uid)
        .single();

      if (profile?.role !== 'student') {
        router.push('/dashboard');
        return;
      }

      setStudentProfile(profile);
      fetchJobsForStudent(profile);
    } catch (error) {
      console.error('Error checking student status:', error);
      router.push('/dashboard');
    }
  };

  const fetchJobsForStudent = async (profile: any) => {
    try {
      setLoading(true);

      // Optimized query with single call and better filtering
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id, title, company, description, requirements, responsibilities, location,
          job_type, experience_level, salary_min, salary_max, salary_currency,
          application_deadline, contact_email, contact_phone, website_url, is_active,
          eligible_branches, eligible_semesters, minimum_cgpa,
          required_skills, preferred_skills,
          application_instructions, application_url, application_email,
          posted_by_id, posted_by_name, posted_by_email, created_at, updated_at,
          views_count, applications_count
        `)
        .eq('is_active', true)
        .contains('eligible_branches', [profile.branch])
        .contains('eligible_semesters', [profile.semester])
        .order('created_at', { ascending: false })
        .limit(50); // Limit results for performance

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: "Error",
          description: 'Failed to load jobs',
          variant: "destructive",
        });
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: 'Failed to load jobs',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openApplyDialog = (job: Job) => {
    setSelectedApplyJob(job);
    setShowApplyDialog(true);
    incrementViews(job.id);
  };

  const incrementViews = async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        await supabase
          .from('jobs')
          .update({ views_count: job.views_count + 1 })
          .eq('id', jobId);
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.required_skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase())) ||
      job.preferred_skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return "Not specified";
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return "Not specified";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isEligible = (job: Job) => {
    if (!studentProfile) return false;

    const hasEligibleBranch = job.eligible_branches.includes(studentProfile.branch);
    const hasEligibleSemester = job.eligible_semesters.includes(studentProfile.semester);
    const meetsCgpa = !job.minimum_cgpa || (studentProfile.graduation_year && true); // Simplified - you might want to add CGPA field

    return hasEligibleBranch && hasEligibleSemester && meetsCgpa;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/student">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Student Portal
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-white">Job Opportunities</h1>
            </div>
            <p className="text-muted-foreground dark:text-gray-300">
              Discover job opportunities tailored for {studentProfile?.branch} students in {studentProfile?.semester}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Briefcase className="h-4 w-4 inline mr-2" />
              Job Opportunities
            </button>
            <button
              onClick={() => setActiveTab('alumni')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alumni'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <UserCheck className="h-4 w-4 inline mr-2" />
              Alumni Profiles
            </button>
          </nav>
        </div>
      </div>

      {/* Profile Info */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{studentProfile?.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                {studentProfile?.branch} • {studentProfile?.semester} • Graduating {studentProfile?.graduation_year}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{studentProfile?.branch}</Badge>
              <Badge variant="secondary">{studentProfile?.semester}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      {activeTab === 'jobs' && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Job Listings */}
      {activeTab === 'jobs' && (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      {isEligible(job) && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Eligible
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                      </span>
                    </CardDescription>
                  </div>

                  <div className="text-right">
                    <Button
                      onClick={() => openApplyDialog(job)}
                      className="w-full"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      How to Apply
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Job Description</h4>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>

                    {job.requirements && (
                      <div>
                        <h4 className="font-semibold mb-2">Requirements</h4>
                        <p className="text-sm text-muted-foreground">{job.requirements}</p>
                      </div>
                    )}

                    {job.responsibilities && (
                      <div>
                        <h4 className="font-semibold mb-2">Responsibilities</h4>
                        <p className="text-sm text-muted-foreground">{job.responsibilities}</p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Eligibility Criteria</h4>
                      <div className="flex flex-wrap gap-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Branches: </span>
                          {job.eligible_branches.map(branch => (
                            <Badge key={branch} variant="outline" className="mr-1">
                              {branch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Semesters: </span>
                          {job.eligible_semesters.map(semester => (
                            <Badge key={semester} variant="secondary" className="mr-1">
                              {semester}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {job.minimum_cgpa && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Minimum CGPA: {job.minimum_cgpa}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Required Skills</h4>
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills.map(skill => (
                          <Badge key={skill} variant="default">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    {job.preferred_skills.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Preferred Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {job.preferred_skills.map(skill => (
                            <Badge key={skill} variant="outline">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Job Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Experience:</span>
                          <span className="capitalize">{job.experience_level} Level</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Posted:</span>
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                        {job.application_deadline && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deadline:</span>
                            <span className={new Date(job.application_deadline) < new Date() ? "text-red-600" : ""}>
                              {formatDate(job.application_deadline)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Views:</span>
                          <span>{job.views_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Applications:</span>
                          <span>{job.applications_count}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Contact</h4>
                      <div className="space-y-1 text-sm">
                        <p>{job.contact_email}</p>
                        {job.contact_phone && <p>{job.contact_phone}</p>}
                        {job.website_url && (
                          <a href={job.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Company Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alumni Profiles */}
      {activeTab === 'alumni' && (
        <AlumniProfilesSection studentProfile={studentProfile} />
      )}

      {activeTab === 'jobs' && filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No job opportunities found</h3>
          <p className="text-muted-foreground">
            {jobs.length === 0
              ? "No jobs are currently available for your branch and semester. Check back later!"
              : "Try adjusting your search criteria"}
          </p>
        </div>
      )}

      {/* Application Instructions Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              How to Apply for {selectedApplyJob?.title}
            </DialogTitle>
            <DialogDescription>
              Follow these instructions to apply for the {selectedApplyJob?.title} position at {selectedApplyJob?.company}.
            </DialogDescription>
          </DialogHeader>

          {selectedApplyJob && (
            <div className="space-y-6">
              {/* Application Instructions */}
              {selectedApplyJob.application_instructions && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Application Instructions
                  </h4>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm leading-relaxed">{selectedApplyJob.application_instructions}</p>
                  </div>
                </div>
              )}

              {/* Application Links */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Apply Now
                </h4>
                <div className="space-y-2">
                  {selectedApplyJob.application_url && (
                    <Button asChild className="w-full">
                      <a
                        href={selectedApplyJob.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Apply Online at {selectedApplyJob.company}
                      </a>
                    </Button>
                  )}

                  {selectedApplyJob.application_email && (
                    <Button variant="outline" asChild className="w-full">
                      <a href={`mailto:${selectedApplyJob.application_email}?subject=Application for ${selectedApplyJob.title} position`}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Application via Email
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Job Summary */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Job Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <p className="font-medium">{selectedApplyJob.company}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{selectedApplyJob.location}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Salary:</span>
                    <p className="font-medium">
                      {formatSalary(selectedApplyJob.salary_min, selectedApplyJob.salary_max, selectedApplyJob.salary_currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline:</span>
                    <p className="font-medium">
                      {selectedApplyJob.application_deadline
                        ? formatDate(selectedApplyJob.application_deadline)
                        : 'No deadline specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
