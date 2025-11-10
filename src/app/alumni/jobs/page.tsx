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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Filter,
  Settings,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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

interface JobFormData {
  title: string;
  company: string;
  description: string;
  requirements: string;
  responsibilities: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  application_deadline: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  eligible_branches: string[];
  eligible_semesters: string[];
  minimum_cgpa: string;
  required_skills: string[];
  preferred_skills: string[];
  application_instructions: string;
  application_url: string;
  application_email: string;
}

const initialFormData: JobFormData = {
  title: "",
  company: "",
  location: "",
  description: "",
  requirements: "",
  responsibilities: "",
  job_type: "full-time",
  experience_level: "entry",
  salary_min: "",
  salary_max: "",
  salary_currency: "INR",
  application_deadline: "",
  contact_email: "",
  contact_phone: "",
  website_url: "",
  eligible_branches: [],
  eligible_semesters: [],
  minimum_cgpa: "",
  required_skills: [],
  preferred_skills: [],
  application_instructions: "",
  application_url: "",
  application_email: "",
};

const branches = [
  "CSE",
  "EC",
  "EEE",
  "ISE",
  "ME"
];

const semesters = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester"
];

export default function AlumniJobsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!authUser) return;
    checkAlumniStatus();
  }, [authUser]);

  const checkAlumniStatus = async () => {
    try {
      console.log('Checking alumni status for user:', authUser?.uid);
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role, full_name, email')
        .eq('id', authUser!.uid)
        .single();

      console.log('Profile data:', profile);
      console.log('Profile error:', error);

      if (error) {
        console.error('Database error:', error);
        toast({
          title: "Database Error",
          description: 'Unable to verify user permissions',
          variant: "destructive",
        });
        router.push('/dashboard');
        return;
      }

      if (profile?.role !== 'alumni') {
        console.log('User is not alumni, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      console.log('User is alumni, fetching jobs');
      fetchJobs();
    } catch (error) {
      console.error('Error checking alumni status:', error);
      toast({
        title: "Error",
        description: 'Unable to verify user permissions',
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      console.log('Fetching jobs for user:', authUser?.uid);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('posted_by_id', authUser!.uid)
        .order('created_at', { ascending: false });

      console.log('Jobs data:', data);
      console.log('Jobs error:', error);

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: "Database Error",
          description: 'Unable to load job postings. Database tables may not exist yet.',
          variant: "destructive",
        });
        // Show empty state instead of crashing
        setJobs([]);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Connection Error",
        description: 'Unable to connect to database. Please check your configuration.',
        variant: "destructive",
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!authUser) return;

    try {
      setSubmitting(true);

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', authUser.uid)
        .single();

      if (!profile) {
        toast({
          title: "Error",
          description: 'Profile not found',
          variant: "destructive",
        });
        return;
      }

      const jobData = {
        ...formData,
        posted_by_id: authUser.uid,
        posted_by_name: profile.full_name,
        posted_by_email: profile.email,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        minimum_cgpa: formData.minimum_cgpa ? parseFloat(formData.minimum_cgpa) : null,
        application_deadline: formData.application_deadline || null,
        contact_phone: formData.contact_phone || null,
        website_url: formData.website_url || null,
      };

      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (error) {
        console.error('Error creating job:', error);
        toast({
          title: "Error",
          description: 'Failed to create job',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: 'Job created successfully!',
        });
        setIsCreateDialogOpen(false);
        setFormData(initialFormData);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: 'Failed to create job',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditJob = async () => {
    if (!editingJob) return;

    try {
      setSubmitting(true);

      const jobData = {
        ...formData,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        minimum_cgpa: formData.minimum_cgpa ? parseFloat(formData.minimum_cgpa) : null,
        application_deadline: formData.application_deadline || null,
        contact_phone: formData.contact_phone || null,
        website_url: formData.website_url || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', editingJob.id);

      if (error) {
        console.error('Error updating job:', error);
        toast({
          title: "Error",
          description: 'Failed to update job',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: 'Job updated successfully!',
        });
        setIsEditDialogOpen(false);
        setEditingJob(null);
        setFormData(initialFormData);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: "Error",
        description: 'Failed to update job',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) {
        console.error('Error deleting job:', error);
        toast({
          title: "Error",
          description: 'Failed to delete job',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: 'Job deleted successfully!',
        });
        fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: 'Failed to delete job',
        variant: "destructive",
      });
    }
  };

  const toggleJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: !isActive })
        .eq('id', jobId);

      if (error) {
        console.error('Error updating job status:', error);
        toast({
          title: "Error",
          description: 'Failed to update job status',
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Job ${!isActive ? 'activated' : 'deactivated'} successfully!`,
        });
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: 'Failed to update job status',
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements || "",
      responsibilities: job.responsibilities || "",
      location: job.location,
      job_type: job.job_type,
      experience_level: job.experience_level,
      salary_min: job.salary_min?.toString() || "",
      salary_max: job.salary_max?.toString() || "",
      salary_currency: job.salary_currency,
      application_deadline: job.application_deadline || "",
      contact_email: job.contact_email,
      contact_phone: job.contact_phone || "",
      website_url: job.website_url || "",
      eligible_branches: job.eligible_branches,
      eligible_semesters: job.eligible_semesters,
      minimum_cgpa: job.minimum_cgpa?.toString() || "",
      required_skills: job.required_skills,
      preferred_skills: job.preferred_skills,
      application_instructions: job.application_instructions || "",
      application_url: job.application_url || "",
      application_email: job.application_email || "",
    });
    setIsEditDialogOpen(true);
  };

  const addSkill = (skill: string, type: 'required' | 'preferred') => {
    if (!skill.trim()) return;
    const newSkills = [...formData[type === 'required' ? 'required_skills' : 'preferred_skills']];
    if (!newSkills.includes(skill.trim())) {
      newSkills.push(skill.trim());
      setFormData(prev => ({
        ...prev,
        [type === 'required' ? 'required_skills' : 'preferred_skills']: newSkills
      }));
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string, type: 'required' | 'preferred') => {
    const newSkills = formData[type === 'required' ? 'required_skills' : 'preferred_skills'].filter(s => s !== skill);
    setFormData(prev => ({
      ...prev,
      [type === 'required' ? 'required_skills' : 'preferred_skills']: newSkills
    }));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && job.is_active) ||
      (filterStatus === "inactive" && !job.is_active);

    return matchesSearch && matchesStatus;
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
                <Link href="/alumni">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Alumni
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-green-600 dark:text-green-400" />
              <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-white">Job Board</h1>
            </div>
            <p className="text-muted-foreground dark:text-gray-300">
              Create and manage job opportunities for students from your company
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Job Posting</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a job posting that will be visible to eligible students.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="e.g. Google"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Bangalore, Karnataka"
                    />
                  </div>

                  <div>
                    <Label htmlFor="job_type">Job Type</Label>
                    <Select value={formData.job_type} onValueChange={(value) => setFormData(prev => ({ ...prev, job_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience_level">Experience Level</Label>
                    <Select value={formData.experience_level} onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="salary_min">Min Salary</Label>
                      <Input
                        id="salary_min"
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="salary_max">Max Salary</Label>
                      <Input
                        id="salary_max"
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="salary_currency">Currency</Label>
                    <Select value={formData.salary_currency} onValueChange={(value) => setFormData(prev => ({ ...prev, salary_currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="application_deadline">Application Deadline</Label>
                    <Input
                      id="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimum_cgpa">Minimum CGPA</Label>
                    <Input
                      id="minimum_cgpa"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={formData.minimum_cgpa}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_cgpa: e.target.value }))}
                      placeholder="e.g. 7.0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the role, responsibilities, and what the candidate will do..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                      placeholder="List the qualifications, experience, and skills required..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsibilities">Responsibilities</Label>
                    <Textarea
                      id="responsibilities"
                      value={formData.responsibilities}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                      placeholder="List the key responsibilities and duties..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Eligible Branches *</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                      {branches.map(branch => (
                        <div key={branch} className="flex items-center space-x-2">
                          <Checkbox
                            id={`branch-${branch}`}
                            checked={formData.eligible_branches.includes(branch)}
                            onCheckedChange={(checked) => {
                              const newBranches = checked
                                ? [...formData.eligible_branches, branch]
                                : formData.eligible_branches.filter(b => b !== branch);
                              setFormData(prev => ({ ...prev, eligible_branches: newBranches }));
                            }}
                          />
                          <Label htmlFor={`branch-${branch}`} className="text-sm">{branch}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Eligible Semesters *</Label>
                    <div className="grid grid-cols-2 gap-2 border rounded p-2">
                      {semesters.map(semester => (
                        <div key={semester} className="flex items-center space-x-2">
                          <Checkbox
                            id={`semester-${semester}`}
                            checked={formData.eligible_semesters.includes(semester)}
                            onCheckedChange={(checked) => {
                              const newSemesters = checked
                                ? [...formData.eligible_semesters, semester]
                                : formData.eligible_semesters.filter(s => s !== semester);
                              setFormData(prev => ({ ...prev, eligible_semesters: newSemesters }));
                            }}
                          />
                          <Label htmlFor={`semester-${semester}`} className="text-sm">{semester}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="application_instructions">Application Instructions *</Label>
                    <Textarea
                      id="application_instructions"
                      value={formData.application_instructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_instructions: e.target.value }))}
                      placeholder="How should students apply? e.g., Send resume to email, Apply via company website, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="application_url">Application URL</Label>
                    <Input
                      id="application_url"
                      type="url"
                      value={formData.application_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_url: e.target.value }))}
                      placeholder="https://company.com/careers/apply"
                    />
                  </div>

                  <div>
                    <Label htmlFor="application_email">Application Email</Label>
                    <Input
                      id="application_email"
                      type="email"
                      value={formData.application_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, application_email: e.target.value }))}
                      placeholder="applications@company.com"
                    />
                  </div>

                  <div>
                    <Label>Required Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add required skill"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput, 'required'))}
                      />
                      <Button type="button" onClick={() => addSkill(skillInput, 'required')} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.required_skills.map(skill => (
                        <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill, 'required')}>
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Preferred Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        value=""
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add preferred skill"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput, 'preferred'))}
                      />
                      <Button type="button" onClick={() => addSkill(skillInput, 'preferred')} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.preferred_skills.map(skill => (
                        <Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => removeSkill(skill, 'preferred')}>
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} disabled={submitting}>
                  {submitting ? "Creating..." : "Create Job"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Job Listings */}
      <div className="grid grid-cols-1 gap-6">
        {filteredJobs.map((job) => (
          <Card key={job.id} className={`transition-all ${!job.is_active ? 'opacity-60' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    {!job.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
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

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleJobStatus(job.id, job.is_active)}
                  >
                    {job.is_active ? (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(job)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <Trash2 className="h-4 w-4" />
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
                    <h4 className="font-semibold mb-2">Eligibility</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.eligible_branches.map(branch => (
                        <Badge key={branch} variant="outline">{branch}</Badge>
                      ))}
                      {job.eligible_semesters.map(semester => (
                        <Badge key={semester} variant="secondary">{semester}</Badge>
                      ))}
                    </div>
                    {job.minimum_cgpa && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Minimum CGPA: {job.minimum_cgpa}
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills.map(skill => (
                        <Badge key={skill} variant="default">{skill}</Badge>
                      ))}
                      {job.preferred_skills.map(skill => (
                        <Badge key={skill} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
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
                          <span>{formatDate(job.application_deadline)}</span>
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

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {jobs.length === 0 ? "No job postings yet" : "No jobs match your search"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {jobs.length === 0
              ? "You haven't created any job postings yet. Click 'Post New Job' to get started!"
              : "Try adjusting your search criteria or filter settings"}
          </p>
          {jobs.length === 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-left max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> If you're seeing this message and the database is configured,
                the job tables may need to be created. Check the <code>job_schema.sql</code> file
                in the project root and run it in your Supabase database.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Posting</DialogTitle>
            <DialogDescription>
              Update the job posting details.
            </DialogDescription>
          </DialogHeader>

          {/* Same form as create dialog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Job Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div>
                <Label htmlFor="edit-company">Company *</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="e.g. Google"
                />
              </div>

              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Bangalore, Karnataka"
                />
              </div>

              <div>
                <Label htmlFor="edit-job_type">Job Type</Label>
                <Select value={formData.job_type} onValueChange={(value) => setFormData(prev => ({ ...prev, job_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-experience_level">Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-salary_min">Min Salary</Label>
                  <Input
                    id="edit-salary_min"
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-salary_max">Max Salary</Label>
                  <Input
                    id="edit-salary_max"
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-salary_currency">Currency</Label>
                <Select value={formData.salary_currency} onValueChange={(value) => setFormData(prev => ({ ...prev, salary_currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-application_deadline">Application Deadline</Label>
                <Input
                  id="edit-application_deadline"
                  type="date"
                  value={formData.application_deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-minimum_cgpa">Minimum CGPA</Label>
                <Input
                  id="edit-minimum_cgpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.minimum_cgpa}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_cgpa: e.target.value }))}
                  placeholder="e.g. 7.0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-description">Job Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the role, responsibilities, and what the candidate will do..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="edit-requirements">Requirements</Label>
                <Textarea
                  id="edit-requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="List the qualifications, experience, and skills required..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-responsibilities">Responsibilities</Label>
                <Textarea
                  id="edit-responsibilities"
                  value={formData.responsibilities}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                  placeholder="List the key responsibilities and duties..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Eligible Branches *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {branches.map(branch => (
                    <div key={branch} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-branch-${branch}`}
                        checked={formData.eligible_branches.includes(branch)}
                        onCheckedChange={(checked) => {
                          const newBranches = checked
                            ? [...formData.eligible_branches, branch]
                            : formData.eligible_branches.filter(b => b !== branch);
                          setFormData(prev => ({ ...prev, eligible_branches: newBranches }));
                        }}
                      />
                      <Label htmlFor={`edit-branch-${branch}`} className="text-sm">{branch}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Eligible Semesters *</Label>
                <div className="grid grid-cols-2 gap-2 border rounded p-2">
                  {semesters.map(semester => (
                    <div key={semester} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-semester-${semester}`}
                        checked={formData.eligible_semesters.includes(semester)}
                        onCheckedChange={(checked) => {
                          const newSemesters = checked
                            ? [...formData.eligible_semesters, semester]
                            : formData.eligible_semesters.filter(s => s !== semester);
                          setFormData(prev => ({ ...prev, eligible_semesters: newSemesters }));
                        }}
                      />
                      <Label htmlFor={`edit-semester-${semester}`} className="text-sm">{semester}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-application_instructions">Application Instructions *</Label>
                <Textarea
                  id="edit-application_instructions"
                  value={formData.application_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_instructions: e.target.value }))}
                  placeholder="How should students apply? e.g., Send resume to email, Apply via company website, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-application_url">Application URL</Label>
                <Input
                  id="edit-application_url"
                  type="url"
                  value={formData.application_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_url: e.target.value }))}
                  placeholder="https://company.com/careers/apply"
                />
              </div>

              <div>
                <Label htmlFor="edit-application_email">Application Email</Label>
                <Input
                  id="edit-application_email"
                  type="email"
                  value={formData.application_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_email: e.target.value }))}
                  placeholder="applications@company.com"
                />
              </div>

              <div>
                <Label>Required Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add required skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput, 'required'))}
                  />
                  <Button type="button" onClick={() => addSkill(skillInput, 'required')} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.required_skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer" onClick={() => removeSkill(skill, 'required')}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Preferred Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value=""
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add preferred skill"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput, 'preferred'))}
                  />
                  <Button type="button" onClick={() => addSkill(skillInput, 'preferred')} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.preferred_skills.map(skill => (
                    <Badge key={skill} variant="outline" className="cursor-pointer" onClick={() => removeSkill(skill, 'preferred')}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditJob} disabled={submitting}>
              {submitting ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
