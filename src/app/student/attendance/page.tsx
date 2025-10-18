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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

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

  const fetchAttendanceData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      console.log('📊 Fetching attendance data for UUID:', user.uid);
      const records = await getAttendance(user.uid);
      console.log('📈 Retrieved', records.length, 'attendance records');

      // Sort by date descending
      const sortedRecords = records.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAttendanceRecords(sortedRecords);
    } catch (error) {
      console.error('❌ Error fetching attendance data:', error);
      console.log('🎯 ATTENDANCE PAGE LOADED - Initial user object:', {
        userExists: !!user,
        authLoading,
        userUid: user?.uid,
        userRole: user?.role,
        userUsn: user?.usn,
        userBranch: user?.branch,
        userSemester: user?.semester,
        userEmail: user?.email
      });
      setAttendanceRecords([]);
    }
  }, [user?.usn]);

  useEffect(() => {
    console.log('👤 ATTENDANCE PAGE - User object changed:', {
      userExists: !!user,
      userUid: user?.uid,
      userUsn: user?.usn,
      userBranch: user?.branch,
      userSemester: user?.semester,
      authLoading
    });
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      if (user && (user.role === 'student' || user.role === 'pending')) {
        if (user.uid) {
          fetchAttendanceData();
        }
        setPageLoading(false);
      } else {
        router.push(user ? '/dashboard' : '/login');
      }
    }
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
    const colors = {
      excellent: 'text-green-600 bg-green-50 border-green-200',
      good: 'text-blue-600 bg-blue-50 border-blue-200',
      average: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      poor: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status];
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center">
            <UserCheck className="mr-3 h-7 w-7" />
            My Attendance
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Track your attendance across all subjects and periods
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-lg">
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

        <Card className="shadow-lg">
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

        <Card className="shadow-lg">
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

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall %</p>
                <p className={`text-2xl font-bold ${
                  attendanceStats.overallPercentage >= 75 ? 'text-green-600' :
                  attendanceStats.overallPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(attendanceStats.overallPercentage)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Attendance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Overall Attendance</CardTitle>
            <CardDescription>
              Your attendance percentage: <strong>{Math.round(attendanceStats.overallPercentage)}%</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress
                value={attendanceStats.overallPercentage}
                className="h-4"
                indicatorClassName={
                  attendanceStats.overallPercentage >= 75 ? "bg-green-500" :
                  attendanceStats.overallPercentage >= 60 ? "bg-yellow-500" : "bg-red-500"
                }
              />
            </div>
            {statusData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Subject-wise Performance</CardTitle>
            <CardDescription>Attendance breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subject"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'attendance' ? `${value}%` : value,
                        name === 'attendance' ? 'Attendance %' : name
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="attendance" fill="#3b82f6" name="Attendance %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attendance data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Breakdown */}
      <Card className="shadow-lg mb-8">
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
                  className={`p-4 rounded-lg border ${getSubjectStatusColor(subject.status)}`}
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
      <Card className="shadow-lg mb-8">
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
      <Card className="shadow-lg">
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
