'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';

// Helper: create timetable table HTML
function createTimetableTable(timetableData) {
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = [
    { period: 0, time: '09:00–09:50', sortOrder: 0 },
    { period: 1, time: '09:50–10:40', sortOrder: 1 },
    { period: 2, time: '10:40–11:00', sortOrder: 2 }, // Short Break
    { period: 3, time: '11:00–11:50', sortOrder: 3 },
    { period: 4, time: '11:50–12:40', sortOrder: 4 },
    { period: 5, time: '12:40–01:20', sortOrder: 5 }, // Lunch Break
    { period: 6, time: '01:20–02:10', sortOrder: 6 },
    { period: 7, time: '02:10–03:50', sortOrder: 7 },
    { period: 8, time: '03:00–03:50', sortOrder: 8 }
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  // Create a map of day -> period -> class info
  const scheduleMap = {};
  dayOrder.forEach(day => {
    scheduleMap[day] = {};
    periods.forEach(p => {
      scheduleMap[day][p.period] = '';
    });
  });

  // Fill in the schedule data
  if (Array.isArray(timetableData)) {
    timetableData.forEach(dayData => {
      const day = dayData.day;
      if (dayOrder.includes(day) && dayData.entries) {
        dayData.entries.forEach(entry => {
          // Show both classes and breaks
          if ((entry.type === 'class' || entry.type === 'break') && entry.subject) {
            let classInfo = entry.subject;
            if (entry.subject_code && entry.subject_code.trim()) {
              classInfo += `<br><small>${entry.subject_code}`;
              if (entry.room_number && entry.room_number.trim()) {
                classInfo += ` • ${entry.room_number}`;
              }
              classInfo += '</small>';
            } else if (entry.room_number && entry.room_number.trim()) {
              classInfo += `<br><small>${entry.room_number}</small>`;
            }
            scheduleMap[day][entry.period] = classInfo;
          }
        });
      }
    });
  }

  // Generate simple HTML table
  let tableHTML = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;border:1px solid #e0e0e0;font-size:12px;"><thead><tr style="background:#f8f9fa;"><th style="border:1px solid #e0e0e0;padding:6px;text-align:left;font-weight:bold;width:120px;font-size:11px;">Day / Time</th>' + periods.map(p => `<th style="border:1px solid #e0e0e0;padding:6px;text-align:center;font-weight:bold;font-size:11px;min-width:80px;">${p.time}</th>`).join('') + '</tr></thead><tbody>';

  dayOrder.forEach(day => {
    tableHTML += `<tr><th style="border:1px solid #e0e0e0;padding:6px;text-align:left;font-weight:bold;background:#f8f9fa;font-size:11px;width:120px;">${day}</th>`;
    periods.forEach(p => {
      const cellContent = scheduleMap[day][p.period];
      if (cellContent) {
        tableHTML += `<td style="border:1px solid #e0e0e0;padding:6px;text-align:left;background:#f0f9ff;font-size:11px;">${cellContent}</td>`;
      } else {
        tableHTML += `<td style="border:1px solid #e0e0e0;padding:6px;text-align:center;color:#9aa4b2;font-size:11px;">—</td>`;
      }
    });
    tableHTML += '</tr>';
  });

  tableHTML += '</tbody></table></div>';

  return tableHTML;
}

export default function TimetablePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      const fetchTimetable = async () => {
        try {
          const { data, error } = await supabase
            .from('timetable')
            .select('*')
            .eq('branch', user.branch || 'CSE')
            .eq('semester', user.semester || '3rd Sem')
            .order('day', { ascending: true });

          if (error) throw error;

          setTimetableData(data);
        } catch (err) {
          console.error('Error fetching timetable:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchTimetable();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to view the timetable.</p>
          <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Login
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Timetable Not Available</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <span className="text-4xl">📅</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Class Timetable</h1>
          <p className="text-gray-600">Your complete weekly schedule</p>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-xl shadow-xl p-6 overflow-x-auto">
          <div dangerouslySetInnerHTML={{ __html: createTimetableTable(timetableData) }} />
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ← Back to CERA
          </button>
        </div>
      </div>
    </div>
  );
}
