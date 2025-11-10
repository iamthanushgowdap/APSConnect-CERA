import type { User } from '@/components/auth-provider';
import type { Notification, UserProfile, Assignment, FeeRecord, AttendanceRecord } from '@/types';
import { NOTIFICATION_STORAGE_KEY, ASSIGNMENT_STORAGE_KEY, FEE_STORAGE_KEY, ATTENDANCE_STORAGE_KEY } from '@/types';
import { differenceInDays, isAfter } from 'date-fns';
import { supabase } from '@/lib/supabase'; // Import supabase instance

const LOW_ATTENDANCE_THRESHOLD = 75; // Percentage
const DEADLINE_WARNING_DAYS = 3;

const defaultPrefs = {
  approval: true,
  assignment_deadline: true,
  fee_due: true,
  low_attendance: true,
};

export const getNotificationPrefs = async (userId: string) => {
  // First try Supabase
  const { data } = await supabase
    .from('user_preferences')
    .select('notification_settings')
    .eq('user_id', userId)
    .single();
    
  if (data?.notification_settings) {
    return data.notification_settings;
  }
  
  // Fallback to localStorage during transition
  const localPrefs = localStorage.getItem('notification-prefs');
  if (localPrefs) {
    const prefs = JSON.parse(localPrefs);
    // Migrate to Supabase
    await supabase
      .from('user_preferences')
      .upsert({ 
        user_id: userId, 
        notification_settings: prefs 
      }, { onConflict: 'user_id' });
    return prefs;
  }
  
  return defaultPrefs;
};

export const saveNotificationPrefs = async (userId: string, prefs: any) => {
  // Save to Supabase
  await supabase
    .from('user_preferences')
    .upsert({ 
      user_id: userId, 
      notification_settings: prefs 
    }, { onConflict: 'user_id' });
    
  // Remove from localStorage
  localStorage.removeItem('notification-prefs');
};

function getStoredNotifications(): Notification[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveNotifications(notifications: Notification[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
}

function createNotification(
    user: User, 
    allNotifications: Notification[], 
    type: Notification['type'], 
    relatedId: string, 
    title: string, 
    message: string, 
    href: string
): Notification | null {
    const uniqueId = `${user.uid}-${type}-${relatedId}`;
    if (allNotifications.some(n => n.id === uniqueId)) {
        return null; // Notification already exists
    }
    return {
        id: uniqueId,
        userId: user.uid,
        type,
        title,
        message,
        href,
        createdAt: new Date().toISOString(),
        isRead: false,
    };
}

// 1. Registration Approval Notifications
async function checkApprovalStatus(user: User, profile: UserProfile, allNotifications: Notification[]): Promise<Notification | null> {
    // Check preferences for approval notifications
    const prefs = await getNotificationPrefs(user.uid);
    if (profile.is_approved && profile.role === 'student' && !allNotifications.some(n => n.id === `${user.uid}-approval-approved`) && prefs.approval) {
        return createNotification(user, allNotifications, 'approval', 'approved', 'Registration Approved!', 'Your account has been approved. You now have full access.', '/student');
    }
    return null;
}

// 2. Assignment Deadline Notifications
async function checkAssignmentDeadlines(user: User, allNotifications: Notification[]): Promise<Notification[]> {
    const prefs = await getNotificationPrefs(user.uid);
    if (user.role !== 'student' || !prefs.assignment_deadline) return [];
    
    const assignmentsStr = localStorage.getItem(ASSIGNMENT_STORAGE_KEY);
    if (!assignmentsStr) return [];
    
    const allAssignments: Assignment[] = JSON.parse(assignmentsStr);
    const relevantAssignments = allAssignments.filter(a => a.branch === user.branch && a.semester === user.semester && a.due_date);

    const newNotifications: Notification[] = [];
    relevantAssignments.forEach(assignment => {
        const daysUntilDue = differenceInDays(new Date(assignment.due_date!), new Date());
        if (daysUntilDue >= 0 && daysUntilDue <= DEADLINE_WARNING_DAYS) {
            const notif = createNotification(user, allNotifications, 'assignment_deadline', assignment.id, `Assignment Due Soon: ${assignment.title}`, `This assignment is due in ${daysUntilDue + 1} day(s).`, '/student/assignments');
            if (notif) newNotifications.push(notif);
        }
    });
    return newNotifications;
}

// 3. Fee Due Date Notifications
async function checkFeeDueDates(user: User, allNotifications: Notification[]): Promise<Notification[]> {
    const prefs = await getNotificationPrefs(user.uid);
    if (user.role !== 'student' || !prefs.fee_due) return [];

    const feesStr = localStorage.getItem(FEE_STORAGE_KEY);
    if (!feesStr) return [];

    const allFees: FeeRecord[] = JSON.parse(feesStr);
    const studentFees = allFees.filter(f => f.student_id === user.uid && f.payment_status !== 'paid');

    const newNotifications: Notification[] = [];
    studentFees.forEach(fee => {
        const dueDate = new Date(fee.due_date);
        const daysUntilDue = differenceInDays(dueDate, new Date());
        const amount = fee.total_amount - fee.paid_amount;

        if (isAfter(new Date(), dueDate)) { // Overdue
             const notif = createNotification(user, allNotifications, 'fee_due', `overdue-${fee.id}`, `Fee Overdue: ${fee.semester} ${fee.year}`, `Your fee of ₹${amount} was due on ${fee.due_date}. Please pay it as soon as possible.`, '/student/fee-details');
             if (notif) newNotifications.push(notif);
        } else if (daysUntilDue >= 0 && daysUntilDue <= DEADLINE_WARNING_DAYS) {
            const notif = createNotification(user, allNotifications, 'fee_due', fee.id, `Fee Reminder: ${fee.semester} ${fee.year}`, `Your fee of ₹${amount} is due in ${daysUntilDue + 1} day(s).`, '/student/fee-details');
            if (notif) newNotifications.push(notif);
        }
    });
    return newNotifications;
}

// 4. Low Attendance Notifications
async function checkLowAttendance(user: User, allNotifications: Notification[]): Promise<Notification | null> {
    const prefs = await getNotificationPrefs(user.uid);
    if (user.role !== 'student' || !prefs.low_attendance) return null;
    
    const attendanceStr = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!attendanceStr) return null;
    
    const allRecords: AttendanceRecord[] = JSON.parse(attendanceStr);
    const studentRecords = allRecords.filter(rec => rec.studentUid === user.uid);
    if (studentRecords.length === 0) return null;

    const presentCount = studentRecords.filter(r => r.status === 'present').length;
    const totalCount = studentRecords.length;
    const percentage = (presentCount / totalCount) * 100;
    
    if (percentage < LOW_ATTENDANCE_THRESHOLD) {
        return createNotification(user, allNotifications, 'low_attendance', 'overall-attendance-warning', 'Low Attendance Warning', `Your overall attendance is ${percentage.toFixed(1)}%, which is below the required ${LOW_ATTENDANCE_THRESHOLD}%.`, '/student/attendance');
    }
    return null;
}


// Main function to be called from AuthProvider
export async function checkAndGenerateNotifications(user: User) {
    if (typeof window === 'undefined' || !user) return;
    
    const allNotifications = getStoredNotifications();
    const newNotifications: Notification[] = [];
    
    const profileStr = localStorage.getItem(`apsconnect_user_${user.uid}`);
    if (!profileStr) return;
    const profile: UserProfile = JSON.parse(profileStr);

    // Run all checks
    const approvalNotif = await checkApprovalStatus(user, profile, allNotifications);
    if (approvalNotif) newNotifications.push(approvalNotif);

    // Add a test notification for all users to verify the system works
    const testNotif = createNotification(user, allNotifications, 'approval', 'system-welcome', 'Welcome to APSConnect!', 'Your notification system is working correctly. This is a test notification.', '/student');
    if (testNotif) newNotifications.push(testNotif);

    const deadlineNotifs = await checkAssignmentDeadlines(user, allNotifications);
    newNotifications.push(...deadlineNotifs);
    
    const feeNotifs = await checkFeeDueDates(user, allNotifications);
    newNotifications.push(...feeNotifs);

    const attendanceNotif = await checkLowAttendance(user, allNotifications);
    if (attendanceNotif) newNotifications.push(attendanceNotif);
    
    if (newNotifications.length > 0) {
        saveNotifications([...allNotifications, ...newNotifications]);
        // Dispatch custom event for navbar to update its count
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
}
