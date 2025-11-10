"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Briefcase, MessageSquare, Search, Filter, MapPin, GraduationCap, Sparkles, Crown, Award, Calendar, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import AlumniCard from "@/components/ui/AlumniCard";

interface AlumniProfile {
  id: string;
  full_name: string;
  email: string;
  usn?: string;
  branch?: string;
  semester?: string;
  year_of_study?: number;
  graduation_year?: number;
  current_position?: string;
  current_company?: string;
  location?: string;
  address?: string;
  linkedin_url?: string;
  avatar_url?: string;
  skills?: string[];
  achievements?: string[];
  is_available_for_mentoring?: boolean;
  bio?: string;
  placement_company?: string;
  placement_job_title?: string;
  referral_info?: string;
}

export default function AlumniBrowsePage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedGraduationYear, setSelectedGraduationYear] = useState("all");

  useEffect(() => {
    if (!authUser) return;

    // Check if user is alumni
    const checkAlumniStatus = async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authUser.uid)
        .single();

      if (profile?.role !== 'alumni') {
        router.push('/dashboard');
        return;
      }

      fetchAlumniDirectory();
    };

    checkAlumniStatus();
  }, [authUser, router]);

  const fetchAlumniDirectory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'alumni')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching alumni:', error);
        return;
      }

      setAlumni(data || []);
    } catch (error) {
      console.error('Error fetching alumni directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumni = alumni.filter(person => {
    const matchesSearch = !searchQuery ||
      person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.current_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.current_position?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranch === "all" || person.branch === selectedBranch;
    const matchesYear = selectedGraduationYear === "all" ||
      person.graduation_year?.toString() === selectedGraduationYear;

    return matchesSearch && matchesBranch && matchesYear;
  });

  const branches = [...new Set(alumni.map(person => person.branch).filter(Boolean))];
  const graduationYears = [...new Set(alumni.map(person => person.graduation_year).filter(Boolean))]
    .sort((a, b) => (b || 0) - (a || 0));

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/alumni')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Alumni Portal
        </Button>
      </div>

      {/* Alumni Directory */}
      <Card className="relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Alumni Directory
          </CardTitle>
          <CardDescription>
            Browse and view profiles of {filteredAlumni.length} alumni members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, company, or position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map(branch => (
                  <SelectItem key={branch} value={branch!}>{branch}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGraduationYear} onValueChange={setSelectedGraduationYear}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {graduationYears.map(year => (
                  <SelectItem key={year} value={year!.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alumni Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlumni.map((person, index) => (
                <div key={person.id} className="flex justify-center">
                  <div className="w-full max-w-sm">
                    <AlumniCard
                      name={person.full_name || 'Unknown'}
                      jobTitle={person.current_position && person.current_company
                        ? `${person.current_position} at ${person.current_company}`
                        : person.current_position || person.current_company || 'Professional'
                      }
                      branch={person.branch}
                      avatarUrl={person.avatar_url || '/api/placeholder/400/600'}
                      coverUrl={person.avatar_url || '/api/placeholder/800/400'}
                      about={person.bio || `${person.full_name || 'This alumni'} graduated in ${person.graduation_year || 'recent years'} from ${person.branch || 'our institution'}. They are currently working as a ${person.current_position || 'professional'} ${person.current_company ? `at ${person.current_company}` : ''}.`}
                      placementJobTitle={person.placement_job_title}
                      placementCompany={person.placement_company}
                      referralInfo={person.referral_info}
                      skills={person.skills}
                      contact={{
                        address: person.address || 'Not specified',
                        phone: '', // Don't show phone number
                        email: person.email || 'email@example.com'
                      }}
                      socialLinks={{
                        linkedin: person.linkedin_url || undefined
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredAlumni.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No alumni found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
