"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { getAttendance } from '@/lib/supabase-utils';
import type { AttendanceRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { ShieldCheck, UserCheck, Info, AlertTriangle, Search, ArrowLeft, Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SimpleRotatingSpinner } from '@/components/ui/loading-spinners';
import { ScreenTimeCard } from "@/components/screen-time-card";
import { format } from 'date-fns';
import ParticleBackground from "@/components/ui/particle-background";

interface SubjectAttendance {
  subject: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  lastAttendance?: string;
  status: 'excellent' | 'good' | 'average' | 'poor';
}

interface AttendanceStats {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  overallPercentage: number;
  thisMonthAttendance: number;
  trend: 'up' | 'down' | 'stable';
}

const STATUS_COLORS = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f59e0b'
};

const CHART_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function StudentAttendancePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'this_month' | 'last_month'>('all');

  const goToDashboard = () => {
    if (!user) return;
    
    // Navigate to role-specific dashboard
    switch (user.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'faculty':
        router.push('/faculty');
        break;
      case 'student':
      case 'alumni':
      default:
        router.push('/student');
        break;
    }
  };

  const fetchAttendanceData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const records = await getAttendance({ student_uid: user.uid });
      console.log('📈 Retrieved', records.length, 'attendance records');

      // Sort by date descending
      const sortedRecords = records.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAttendanceRecords(sortedRecords);
    } catch (error) {
      console.error('❌ Error fetching attendance data:', error);
      setAttendanceRecords([]);
    }
  }, [user?.usn]);

  useEffect(() => {
  }, [user, authLoading]);

  useEffect(() => {
    const loadData = async () => {
      if (!authLoading) {
        if (user && (user.role === 'student' || user.role === 'pending')) {
          if (user.uid) {
            await fetchAttendanceData();
          }
          setPageLoading(false);
        } else {
          router.push(user ? '/dashboard' : '/login');
        }
      }
    };

    loadData();
  }, [user, authLoading, router, fetchAttendanceData]);

  // Filter records based on search and period
  const filteredRecords = useMemo(() => {
    let records = [...attendanceRecords];

    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      records = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordMonth = recordDate.getMonth();
        const recordYear = recordDate.getFullYear();

        if (selectedPeriod === 'this_month') {
          return recordMonth === currentMonth && recordYear === currentYear;
        } else if (selectedPeriod === 'last_month') {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return recordMonth === lastMonth && recordYear === lastMonthYear;
        }
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      records = records.filter(record =>
        record.subject.toLowerCase().includes(term) ||
        record.status.toLowerCase().includes(term)
      );
    }

    return records;
  }, [attendanceRecords, searchTerm, selectedPeriod]);

  // Calculate attendance statistics
  const attendanceStats: AttendanceStats = useMemo(() => {
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    const absentCount = totalClasses - presentCount;

    const thisMonthRecords = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });

    const thisMonthPresent = thisMonthRecords.filter(r => r.status === 'present').length;
    const thisMonthAttendance = thisMonthRecords.length > 0 ? (thisMonthPresent / thisMonthRecords.length) * 100 : 0;

    return {
      totalClasses,
      presentCount,
      absentCount,
      overallPercentage: totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0,
      thisMonthAttendance,
      trend: 'stable' // Could be calculated based on recent performance
    };
  }, [attendanceRecords]);

  // Calculate subject-wise attendance
  const subjectWiseAttendance: SubjectAttendance[] = useMemo(() => {
    const subjectMap = new Map<string, AttendanceRecord[]>();

    filteredRecords.forEach(record => {
      if (!subjectMap.has(record.subject)) {
        subjectMap.set(record.subject, []);
      }
      subjectMap.get(record.subject)!.push(record);
    });

    return Array.from(subjectMap.entries()).map(([subject, records]) => {
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const total = records.length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      // Determine status based on percentage
      let status: SubjectAttendance['status'] = 'poor';
      if (percentage >= 85) status = 'excellent';
      else if (percentage >= 75) status = 'good';
      else if (percentage >= 60) status = 'average';

      // Get last attendance date for this subject
      const lastRecord = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const lastAttendance = lastRecord ? format(new Date(lastRecord.date), 'MMM dd') : undefined;

      return {
        subject,
        present,
        absent,
        total,
        percentage: Math.round(percentage * 10) / 10,
        lastAttendance,
        status
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [filteredRecords]);

  // Prepare data for charts
  const chartData = useMemo(() => {
    return subjectWiseAttendance.map(subject => ({
      subject: subject.subject.length > 15 ? subject.subject.substring(0, 15) + '...' : subject.subject,
      attendance: subject.percentage,
      present: subject.present,
      absent: subject.absent
    }));
  }, [subjectWiseAttendance]);

  const statusData = useMemo(() => {
    const present = attendanceStats.presentCount;
    const absent = attendanceStats.absentCount;
    return [
      { name: 'Present', value: present, color: STATUS_COLORS.present },
      { name: 'Absent', value: absent, color: STATUS_COLORS.absent }
    ].filter(item => item.value > 0);
  }, [attendanceStats]);

  // Prepare data for attendance trend chart
  const attendanceTrendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayRecords = attendanceRecords.filter(record => record.date === date);
      const present = dayRecords.filter(r => r.status === 'present').length;
      const total = dayRecords.length;
      const percentage = total > 0 ? (present / total) * 100 : 0; // Default to 0 instead of null

      return {
        date: format(new Date(date), 'MMM dd'),
        attendance: percentage, // Now always a number
        classes: total,
        present: present
      };
    }).filter(item => item.classes > 0); // Only show days with classes
  }, [attendanceRecords]);

  // Prepare data for monthly attendance comparison
  const monthlyAttendanceData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthRecords = attendanceRecords.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === index && recordDate.getFullYear() === currentYear;
      });

      const present = monthRecords.filter(r => r.status === 'present').length;
      const total = monthRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        month: month,
        attendance: percentage,
        classes: total,
        present: present
      };
    }).filter(item => item.classes > 0); // Only show months with data
  }, [attendanceRecords]);

  // Prepare data for subject performance donut chart (top 5 subjects)
  const subjectPerformanceData = useMemo(() => {
    return subjectWiseAttendance
      .slice(0, 5) // Top 5 subjects
      .map((subject, index) => ({
        name: subject.subject.length > 15 ? subject.subject.substring(0, 15) + '...' : subject.subject,
        value: subject.percentage,
        present: subject.present,
        total: subject.total,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }));
  }, [subjectWiseAttendance]);

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSubjectStatusColor = (status: SubjectAttendance['status']) => {
    // Return only glass effect styling, no status-specific colors
    return 'text-foreground';
  };

  if (pageLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <div className="text-center">
          <SimpleRotatingSpinner className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your attendance data...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'student' && user.role !== 'pending')) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center justify-center">
              <ShieldCheck className="mr-2 h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-6">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role === 'pending' && !user.rejectionReason) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg border-yellow-400">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center justify-center">
              <AlertTriangle className="mr-2 h-6 w-6" />
              Account Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account is pending approval. Attendance data will be available once approved.
            </p>
            <Link href="/student">
              <Button variant="outline" className="mt-6">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user.uid) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto shadow-lg border-orange-400">
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center justify-center">
              <Info className="mr-2 h-6 w-6" />
              Profile Incomplete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your profile is not fully configured. Please contact administration to complete your profile.
            </p>
            <Link href="/student">
              <Button variant="outline" className="mt-6">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative overflow-hidden">
      {/* Particle background animation */}
      <ParticleBackground />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center">
            <UserCheck className="mr-3 h-7 w-7" />
            My Attendance
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Track your attendance across all subjects and periods
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={goToDashboard} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10">
        <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-bold">{attendanceStats.totalClasses}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.presentCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Screen Time Card */}
      <div className="mb-8 relative z-10 flex justify-center">
        <ScreenTimeCard
          totalHours={Math.floor(attendanceStats.overallPercentage)} // Main percentage number (e.g., 81)
          totalMinutes={Math.round((attendanceStats.overallPercentage % 1) * 100)} // Decimal part (e.g., 82 for 81.82%)
          barData={attendanceTrendData.slice(-7).map(item => item.attendance / 100)} // 7-day attendance trend
          timeLabels={attendanceTrendData.slice(-7).map(item => item.date)}
          topApps={[
            {
              icon: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-xs font-bold text-white">
                📊
              </div>,
              name: "Overall",
              duration: `${Math.round(attendanceStats.overallPercentage)}%`,
              color: '#22c55e'
            },
            {
              icon: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                📅
              </div>,
              name: "This Month",
              duration: `${Math.round(attendanceStats.thisMonthAttendance)}%`,
              color: '#3b82f6'
            },
            {
              icon: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                📚
              </div>,
              name: "Best Subject",
              duration: subjectWiseAttendance.length > 0 ? `${Math.round(subjectWiseAttendance[0].percentage)}%` : "N/A",
              color: '#10b981'
            },
            {
              icon: <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                🎯
              </div>,
              name: "Weekly Avg",
              duration: attendanceTrendData.length > 0 ? `${Math.round(attendanceTrendData.slice(-7).reduce((sum, item) => sum + item.attendance, 0) / Math.min(7, attendanceTrendData.length))}%` : "N/A",
              color: '#f97316'
            }
          ]}
        />
      </div>

      {/* Subject-wise Breakdown */}
      <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl mb-8 relative z-10">
        <CardHeader>
          <CardTitle>Subject-wise Breakdown</CardTitle>
          <CardDescription>Detailed attendance for each subject</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectWiseAttendance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectWiseAttendance.map((subject) => (
                <div
                  key={subject.subject}
                  className={`p-4 rounded-lg border border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-sm shadow-lg ${getSubjectStatusColor(subject.status)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm">{subject.subject}</h4>
                    <Badge variant="outline" className="text-xs">
                      {subject.percentage}%
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Progress value={subject.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{subject.present}P / {subject.absent}A</span>
                      {subject.lastAttendance && (
                        <span>Last: {subject.lastAttendance}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No subject-wise attendance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl mb-8 relative z-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search by subject or status..."
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'this_month', label: 'This Month' },
                { value: 'last_month', label: 'Last Month' }
              ].map((period) => (
                <Button
                  key={period.value}
                  variant={selectedPeriod === period.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period.value as typeof selectedPeriod)}
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Records Table */}
      <Card className="shadow-2xl border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl relative z-10">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Detailed view of all your attendance records
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marked By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>{record.period}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.marked_by_name || 'System'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {record.notes || 'No notes'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchTerm || selectedPeriod !== 'all'
                  ? 'No attendance records match your filters.'
                  : 'No attendance records found.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
