import { NextResponse } from 'next/server';

// ⚡ CERA NOW USES GOOGLE SHEETS ONLY - NO SUPABASE! ⚡
// Google Sheets configuration for zero-egress data fetching
const SHEET_ID = process.env.CERA_SHEET_ID || process.env.NEXT_PUBLIC_CERA_SHEET_ID || '';

// Debug logging
console.log('🔧 CERA Configuration (Google Sheets Only):');
console.log('  SHEET_ID:', SHEET_ID ? `${SHEET_ID.substring(0, 20)}...` : 'MISSING');
console.log('  => Data Source: 📊 GOOGLE SHEETS ONLY');

// Google Sheets fetch function - replaces Supabase queries
async function fetchSheetData(sheetName, forceRefresh = false) {
  try {
    if (!SHEET_ID) {
      console.error('🚨 Missing Google Sheet ID');
      return [];
    }

    const cacheKey = `sheet_${sheetName}`;
    const cachedData = cache.get(cacheKey);
    
    // Return cached data if available and fresh (unless force refresh)
    if (!forceRefresh && cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`📊 Using cached sheet data for ${sheetName}`);
      return cachedData.data;
    }

    console.log(`📊 Fetching fresh data from Google Sheets: ${sheetName}${forceRefresh ? ' (FORCE REFRESH)' : ''}`);
    // Add cache-busting timestamp to URL
    const cacheBuster = Date.now();
    // Add headers=1 to tell Google Sheets that row 1 contains headers
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&headers=1&sheet=${sheetName}&_=${cacheBuster}`;
    
    const res = await fetch(url, {
      cache: 'no-store', // Disable fetch cache
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch sheet ${sheetName}:`, res.status);
      return [];
    }

    const text = await res.text();
    // Parse Google Visualization API response (removes wrapper)
    const jsonString = text.substring(47).slice(0, -2);
    const json = JSON.parse(jsonString);

    // Convert to array of objects
    // Use col.label which now contains the actual header names from row 1
    const headers = json.table.cols.map(col => col.label || col.id);
    console.log(`  Headers found: ${headers.join(', ')}`);
    
    const rows = json.table.rows.map(row => {
      const obj = {};
      row.c.forEach((cell, i) => {
        obj[headers[i]] = cell ? (cell.v !== null ? cell.v : '') : '';
      });
      return obj;
    });

    // Cache the result
    cache.set(cacheKey, { data: rows, timestamp: Date.now() });
    
    console.log(`✅ Fetched ${rows.length} rows from ${sheetName}`);
    return rows;
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    return [];
  }
}

// Helper function to fetch data from Google Sheets (Supabase removed)
async function getDataFromSource(tableName, filters = {}) {
  console.log(`🔍 getDataFromSource called for: ${tableName}`);
  console.log(`  SHEET_ID: ${SHEET_ID ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ Using Google Sheets ONLY for ${tableName}`);
  
  // Fetch from Google Sheets
  const data = await fetchSheetData(tableName);
  
  // Apply filters manually
  let filtered = data;
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'eq') {
      // Handle equality filters
      Object.entries(value).forEach(([field, val]) => {
        filtered = filtered.filter(row => row[field] === val);
      });
    }
  });
  
  console.log(`  Filtered ${filtered.length} rows from ${data.length} total`);
  return filtered;
}

// Gemini API configuration - using the working setup
const MODEL = "gemini-2.5-flash";  // Exact model the user specified

// Function to call Gemini API
async function callGemini(contents, tools) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🤖 Gemini API Debug:', { 
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      model: MODEL
    });

    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY environment variable is not set!');
      throw new Error('Gemini API key not configured');
    }

    // Validate API key length (Google API keys are typically 39 characters)
    if (apiKey.length < 20) {
      console.error(`❌ GEMINI_API_KEY validation failed: Length ${apiKey.length} is too short (expected ~39 for Google API keys)`);
      throw new Error('Gemini API key appears to be invalid (too short)');
    }

    console.log(`✅ GEMINI_API_KEY validation passed: Length ${apiKey.length} characters`);

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    console.log('🤖 Calling Gemini API...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    console.log('🤖 Gemini API Response Status:', response.status);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('❌ Gemini API Error:', { status: response.status, error: errorBody });
      throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(errorBody)}`);
    }

    const result = await response.json();
    console.log('✅ Gemini API Success');
    return result;
  } catch (error) {
    console.error('❌ Gemini API call failed:', error);
    throw error;
  }
}

// Database query functions
async function getAssignmentsFromDB(branch = null, semester = null) {
    try {
        // Fetch from Google Sheets or Supabase based on configuration
        const filters = {};
        
        // Filter by branch and semester if provided
        if (branch && branch !== 'ALL') {
            filters.eq = { ...filters.eq, branch: branch };
        }
        if (semester && semester !== 'ALL') {
            filters.eq = { ...filters.eq, semester: semester };
        }

        const data = await getDataFromSource('assignments', filters);

        if (!data || data.length === 0) {
            return [];
        }

        // Sort by due_date ascending
        const sortedData = data
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .map(assignment => ({
                title: assignment.title,
                course_name: assignment.course_name,
                due_date: assignment.due_date,
                branch: assignment.branch,
                semester: assignment.semester
            }));

        return sortedData || [];

    } catch (error) {
        console.error('❌ Database connection error:', error);
        return []; // Return empty array on error
    }
}

async function getTimetableFromDB(branch = null, semester = null) {
    try {
        // Fetch from Google Sheets or Supabase based on configuration
        const filters = {};
        
        // Apply filters if provided
        if (branch && branch !== 'ALL') {
            filters.eq = { ...filters.eq, branch: branch };
        }
        if (semester && semester !== 'ALL') {
            filters.eq = { ...filters.eq, semester: semester };
        }

        const data = await getDataFromSource('timetables', filters);

        if (!data || data.length === 0) {
            console.log('No timetable data found, using mock data');
            return getMockTimetableData();
        }

        // Sort by created_at descending if the field exists
        const sortedData = data.sort((a, b) => {
            if (a.created_at && b.created_at) {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
        });

        // Process the data properly
        return processTimetableData(sortedData);

    } catch (error) {
        console.error('❌ Database connection error:', error);
        return getMockTimetableData();
    }
}

// Helper function to process timetable data
function processTimetableData(data) {
    if (data && Array.isArray(data) && data.length > 0) {
        const allSchedules = [];

        // Process each timetable record
        data.forEach(timetable => {
            if (timetable.schedule) {
                // Parse the JSON string from the database
                let schedule;
                try {
                    if (typeof timetable.schedule === 'string') {
                        schedule = JSON.parse(timetable.schedule);
                    } else {
                        schedule = timetable.schedule;
                    }

                    if (Array.isArray(schedule)) {
                        allSchedules.push(...schedule);
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse schedule JSON:', parseError);
                }
            }
        });

        // Combine all schedules and remove duplicates by day
        const combinedSchedule = [];
        const dayMap = new Map();

        allSchedules.forEach(item => {
            const day = item.day || 'Unknown';
            if (!dayMap.has(day)) {
                dayMap.set(day, {
                    day: day,
                    entries: item.entries || []
                });
            } else {
                // Merge entries for the same day
                const existing = dayMap.get(day);
                existing.entries = [...existing.entries, ...(item.entries || [])];
            }
        });

        // Convert map back to array
        const finalSchedule = Array.from(dayMap.values());

        if (finalSchedule.length > 0) {
            return finalSchedule;
        }
    }

    return getMockTimetableData(); // Return mock data when no data found
}

// Helper function to get mock timetable data
function getMockTimetableData() {
    return [
        {
            day: 'Monday',
            entries: [
                { period: 0, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' },
                { period: 1, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' },
                { period: 3, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' }
            ]
        },
        {
            day: 'Tuesday',
            entries: [
                { period: 0, type: 'class', subject: 'CN LAB', subject_code: 'BSC208', room_number: 'B1-205' },
                { period: 3, type: 'class', subject: 'CN LAB', subject_code: 'BSC208', room_number: 'B1-205' },
                { period: 6, type: 'class', subject: 'CN LAB', subject_code: 'BSC208', room_number: 'B1-205' },
                { period: 7, type: 'class', subject: 'CN LAB', subject_code: 'BSC208', room_number: 'B1-205' }
            ]
        },
        {
            day: 'Wednesday',
            entries: [
                { period: 0, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' },
                { period: 1, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' }
            ]
        },
        {
            day: 'Thursday',
            entries: [
                { period: 3, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' },
                { period: 6, type: 'class', subject: 'CN LAB', subject_code: 'BSC208', room_number: 'B1-205' },
                { period: 7, type: 'class', subject: 'CN LAB', subject_code: 'BSC208', room_number: 'B1-205' }
            ]
        },
        {
            day: 'Friday',
            entries: [
                { period: 0, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' },
                { period: 1, type: 'class', subject: 'TOC', subject_code: 'BCS205', room_number: '201' }
            ]
        },
        {
            day: 'Saturday',
            entries: [] // No classes on Saturday
        }
    ];
}

async function getFeeRecordsFromDB(authUserId) {
    try {
        // Fetch from Google Sheets or Supabase based on configuration
        const data = await getDataFromSource('fee_records', {
            eq: { student_id: authUserId }
        });

        // Sort by semester ascending
        const sortedData = data
            .sort((a, b) => (a.semester || 0) - (b.semester || 0))
            .map(fee => ({
                semester: fee.semester,
                year: fee.year,
                tuition_fee: fee.tuition_fee,
                hostel_fee: fee.hostel_fee,
                library_fee: fee.library_fee,
                lab_fee: fee.lab_fee,
                other_fees: fee.other_fees,
                total_amount: fee.total_amount,
                paid_amount: fee.paid_amount,
                due_date: fee.due_date,
                payment_status: fee.payment_status,
                transaction_id: fee.transaction_id,
                paid_at: fee.paid_at
            }));

        return sortedData || [];

    } catch (error) {
        console.error('❌ Database connection error:', error);
        return [];
    }
}

async function getAttendanceFromDB(authUserId) {
    try {
        // Fetch from Google Sheets or Supabase based on configuration
        const data = await getDataFromSource('attendance_records', {
            eq: { student_uid: authUserId }
        });

        // Sort by date descending and limit to 50 records
        const sortedData = data
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 50)
            .map(record => ({
                subject: record.subject,
                date: record.date,
                period: record.period,
                status: record.status,
                marked_by_name: record.marked_by_name,
                notes: record.notes
            }));

        return sortedData || [];

    } catch (error) {
        console.error('❌ Database connection error:', error);
        return [];
    }
}

async function getEventsFromDB() {
    try {
        // Fetch from Google Sheets events tab
        const data = await getDataFromSource('events', {});

        // Sort by event_date descending (most recent first)
        const sortedData = data
            .filter(event => event.is_active !== 'FALSE' && event.is_active !== false) // Only active events
            .sort((a, b) => {
                const dateA = new Date(a.event_date || a.created_at);
                const dateB = new Date(b.event_date || b.created_at);
                return dateB - dateA; // Most recent first
            })
            .slice(0, 10) // Limit to 10 recent events
            .map(event => ({
                title: event.title || 'Untitled Event',
                description: event.description || '',
                date: event.event_date || event.created_at,
                time: event.event_time || '',
                location: event.location || '',
                organizer: event.created_by_name || '',
                category: event.event_type || event.target_audience || '',
                targetAudience: event.target_audience,
                targetBranches: event.target_branches,
                targetSemesters: event.target_semesters,
                registrationLink: event.registration_link,
                registrationDeadline: event.registration_deadline,
                imageUrl: event.image_url,
                isActive: event.is_active
            }));

        return sortedData || [];

    } catch (error) {
        console.error('❌ Database connection error for events:', error);
        return [];
    }
}

// Helper: create timetable table HTML (clean and simple)
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

// Helper: create today's timetable card HTML (modern compact design)
function createTodayTimetableTable(todayData, isTomorrow = false) {
    const periods = [
        { period: 0, time: '09:00 - 09:50', sortOrder: 0 },
        { period: 1, time: '09:50 - 10:40', sortOrder: 1 },
        { period: 2, time: '10:40 - 11:00', sortOrder: 2 }, // Short Break
        { period: 3, time: '11:00 - 11:50', sortOrder: 3 },
        { period: 4, time: '11:50 - 12:40', sortOrder: 4 },
        { period: 5, time: '12:40 - 01:20', sortOrder: 5 }, // Lunch Break
        { period: 6, time: '01:20 - 02:10', sortOrder: 6 },
        { period: 7, time: '02:10 - 03:50', sortOrder: 7 },
        { period: 8, time: '03:00 - 03:50', sortOrder: 8 }
    ].sort((a, b) => a.sortOrder - b.sortOrder);

    // Get current day name (or tomorrow's if specified)
    const targetDate = isTomorrow ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[targetDate.getDay()];
    const titleText = isTomorrow ? "Tomorrow's Timetable" : "Today's Timetable";

    let slotsHTML = '';
    let hasClasses = false;
    let actualClassCount = 0;

    periods.forEach(p => {
        const entries = todayData.entries?.filter(entry => entry.period === p.period && (entry.type === 'class' || entry.type === 'break') && entry.subject) || [];

        if (entries.length > 0) {
            hasClasses = true;
            entries.forEach(entry => {
                const subject = entry.subject || 'Class';
                
                // Count actual classes (not breaks and not no-class)
                if (entry.type !== 'break' && !subject.toLowerCase().includes('break') && subject !== 'no-class') {
                    actualClassCount++;
                }
                
                let teacher, room;
                
                // Special handling for breaks
                if (entry.type === 'break' || subject.toLowerCase().includes('break')) {
                    if (subject.toLowerCase().includes('short') || subject.toLowerCase().includes('tea')) {
                        teacher = '☕🥪';
                        room = 'Tea Break';
                    } else if (subject.toLowerCase().includes('lunch')) {
                        teacher = '🍱🥘';
                        room = 'Lunch Time';
                    } else {
                        teacher = '⏰';
                        room = subject;
                    }
                } else {
                    teacher = entry.faculty_name || entry.teacher || 'TBA';
                    room = entry.room_number || entry.subject_code || 'TBA';
                }
                
                slotsHTML += `
                  <div class="timetable-class-card${entry.type === 'break' || subject.toLowerCase().includes('break') ? ' break-card' : ''}">
                    <div class="timetable-class-header">
                      <div class="timetable-class-time">${p.time}</div>
                      <div class="timetable-class-type">${entry.type === 'break' || subject.toLowerCase().includes('break') ? 'BREAK' : 'CLASS'}</div>
                    </div>
                    <div class="timetable-class-body">
                      <div class="timetable-class-title">${subject}</div>
                      <div class="timetable-class-details">${teacher} • ${room}</div>
                    </div>
                  </div>
                `;
            });
        }
    });

    if (!hasClasses) {
        slotsHTML = '<div style="text-align:center;padding:20px;font-size:13px;opacity:0.7;">No classes scheduled for today</div>';
    }

    const cardHTML = `
      <style>
        /* Light theme (default) */
        .timetable-card{max-width:none;width:100%;margin:0 auto;background:#ffffff;border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:16px 20px;box-shadow:0 6px 24px rgba(14,21,40,0.08);font-family:Inter,system-ui,sans-serif;transition:all 0.3s ease}
        .timetable-header{display:flex;gap:12px;align-items:center;margin-bottom:10px}
        .timetable-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid rgba(59,130,246,0.12)}
        .timetable-title{font-size:18px;font-weight:700;color:#2563eb}
        .timetable-subtitle{font-size:13px;color:#64748b;margin-top:2px}
        .timetable-stats{display:flex;gap:12px;align-items:center;margin-bottom:16px;overflow-x:auto;min-width:fit-content}
        .timetable-stat{flex:1;min-width:80px}
        .timetable-stat-label{font-size:12px;color:#64748b}
        .timetable-stat-value{font-size:18px;font-weight:700}
        .timetable-divider{border:none;border-top:1px solid rgba(0,0,0,0.05);margin:12px 0}
        .timetable-breakdown-title{font-size:14px;color:#64748b;margin-bottom:12px}
        .timetable-class-card{margin-bottom:12px;border-radius:8px;padding:12px;border:1px solid rgba(59,130,246,0.1);background:#ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.04);transition:all 0.2s ease}
        .timetable-class-card:hover{box-shadow:0 4px 12px rgba(0,0,0,0.08);transform:translateY(-1px)}
        .timetable-class-card.break-card{margin-left:8%;background:linear-gradient(135deg,#fef3c7,#fde68a);border:1px solid rgba(245,158,11,0.2)}
        .timetable-class-card.break-card:hover{box-shadow:0 4px 12px rgba(245,158,11,0.15)}
        .timetable-class-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .timetable-class-time{font-size:12px;font-weight:600;color:#3b82f6;background:#eff6ff;padding:4px 8px;border-radius:6px}
        .timetable-class-type{font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:0.5px}
        .timetable-class-card:not(.break-card) .timetable-class-type{background:#10b981;color:white}
        .timetable-class-card.break-card .timetable-class-type{background:#f59e0b;color:white}
        .timetable-class-body{}
        .timetable-class-title{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:4px}
        .timetable-class-details{font-size:13px;color:#64748b}
        .timetable-footer{margin-top:10px;font-size:12px;color:#64748b;text-align:center}
        
        /* Footer button styling */
        .timetable-card-footer{margin-top:14px;text-align:center}
        .timetable-redirect{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
        .timetable-redirect:hover{background:linear-gradient(135deg,#2563eb,#1d4ed8)}
        
        /* Dark theme */
        .dark .timetable-card, [data-theme="dark"] .timetable-card{background:#0f172a;border:1px solid rgba(96,165,250,0.2);box-shadow:0 6px 24px rgba(0,0,0,0.25)}
        .dark .timetable-title, [data-theme="dark"] .timetable-title{color:#60a5fa}
        .dark .timetable-subtitle, [data-theme="dark"] .timetable-subtitle{color:#94a3b8}
        .dark .timetable-stat-label, [data-theme="dark"] .timetable-stat-label{color:#94a3b8}
        .dark .timetable-divider, [data-theme="dark"] .timetable-divider{border-top:1px solid rgba(255,255,255,0.07)}
        .dark .timetable-breakdown-title, [data-theme="dark"] .timetable-breakdown-title{color:#94a3b8}
        .dark .timetable-slot, [data-theme="dark"] .timetable-slot{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.07)}
        .dark .timetable-slot:hover, [data-theme="dark"] .timetable-slot:hover{background:rgba(255,255,255,0.09)}
        .dark .timetable-slot.break, [data-theme="dark"] .timetable-slot.break{background:linear-gradient(135deg,#451a03,#78350f);border:1px solid rgba(245,158,11,0.3)}
        .dark .timetable-time, [data-theme="dark"] .timetable-time{color:#a5b4fc}
        .dark .timetable-class-card, [data-theme="dark"] .timetable-class-card{background:#1f2937;border:1px solid rgba(96,165,250,0.15)}
        .dark .timetable-class-card.break-card, [data-theme="dark"] .timetable-class-card.break-card{background:linear-gradient(135deg,#451a03,#78350f);border:1px solid rgba(245,158,11,0.3)}
        .dark .timetable-class-title, [data-theme="dark"] .timetable-class-title{color:#f9fafb}
        .dark .timetable-class-details, [data-theme="dark"] .timetable-class-details{color:#9ca3af}
        .dark .timetable-class-time, [data-theme="dark"] .timetable-class-time{background:#1e3a8a;color:#93c5fd}
        .dark .timetable-footer, [data-theme="dark"] .timetable-footer{color:#94a3b8}
        .dark .timetable-redirect, [data-theme="dark"] .timetable-redirect{background:linear-gradient(135deg,#60a5fa,#3b82f6)}
        .dark .timetable-redirect:hover, [data-theme="dark"] .timetable-redirect:hover{background:linear-gradient(135deg,#3b82f6,#2563eb)}
      </style>
      <div class="timetable-card">
        <div class="timetable-header">
          <div class="timetable-icon">📅</div>
          <div>
            <div class="timetable-title">${titleText.toUpperCase()}</div>
            <div class="timetable-subtitle">Your class schedule</div>
          </div>
        </div>
        
        <div class="timetable-stats">
          <div class="timetable-stat">
            <div class="timetable-stat-label">Classes Today</div>
            <div class="timetable-stat-value">${actualClassCount}</div>
          </div>
          <div class="timetable-stat">
            <div class="timetable-stat-label">Current Day</div>
            <div class="timetable-stat-value">${dayName}</div>
          </div>
          <div class="timetable-stat">
            <div class="timetable-stat-label">Time</div>
            <div class="timetable-stat-value">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
        
        <hr class="timetable-divider">
        
        <div class="timetable-breakdown-title">Today's schedule:</div>
        ${slotsHTML}
        
        <div class="timetable-footer">${isTomorrow ? '💡 Tip: Ask "Today\'s classes" for today\'s schedule.' : '💡 Tip: Ask "Tomorrow\'s classes" for the next schedule.'}</div>

        <div class="timetable-card-footer">
          <a href="/student/timetable" class="timetable-redirect" onclick="window.open('/student/timetable', '_blank')">📅 View Full Timetable</a>
        </div>
      </div>
    `;

    return cardHTML;
}

// Helper: create compact assignments card HTML (shows last 3 records with redirect)
function createCompactAssignmentsCard(assignments) {
  // Sort by due_date and take last 3
  const recentAssignments = assignments
    .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
    .slice(0, 3);

  let assignmentsHTML = '';
  recentAssignments.forEach(assignment => {
    const dueDate = new Date(assignment.due_date);
    const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
    
    assignmentsHTML += `
      <div class="assignment-item">
        <div class="assignment-header">
          <div class="assignment-title">${assignment.title}</div>
          <div class="assignment-due">${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
        <div class="assignment-details">${assignment.course_name} • ${assignment.description || 'No description'}</div>
        <div class="assignment-status ${daysUntilDue <= 0 ? 'overdue' : daysUntilDue <= 3 ? 'urgent' : 'normal'}">
          ${daysUntilDue <= 0 ? 'OVERDUE' : daysUntilDue === 1 ? 'Tomorrow' : `${daysUntilDue} days`}
        </div>
      </div>
    `;
  });

  if (recentAssignments.length === 0) {
    assignmentsHTML = '<div style="text-align:center;padding:20px;font-size:13px;opacity:0.7;">No recent assignments</div>';
  }

  const cardHTML = `
    <style>
      /* Light theme (default) */
      .assignments-card{max-width:none;width:100%;margin:0 auto;background:#ffffff;border:1px solid rgba(251,146,60,0.15);border-radius:12px;padding:16px 20px;box-shadow:0 6px 24px rgba(14,21,40,0.08);font-family:Inter,system-ui,sans-serif;color:#0f172a;transition:all 0.3s ease}
      .assignments-header{display:flex;gap:12px;align-items:center;margin-bottom:10px}
      .assignments-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid rgba(251,146,60,0.12)}
      .assignments-title{font-size:18px;font-weight:700;color:#ea580c}
      .assignments-subtitle{font-size:13px;color:#64748b;margin-top:2px}
      .assignments-stats{display:flex;gap:12px;align-items:center;margin-bottom:16px;overflow-x:auto;min-width:fit-content}
      .assignments-stat{flex:1;min-width:80px}
      .assignments-stat-label{font-size:12px;color:#64748b}
      .assignments-stat-value{font-size:18px;font-weight:700}
      .assignments-divider{border:none;border-top:1px solid rgba(0,0,0,0.05);margin:12px 0}
      .assignments-breakdown-title{font-size:14px;color:#64748b;margin-bottom:12px}
      .assignment-item{background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.05);border-radius:8px;padding:12px;margin-bottom:8px;transition:background 0.2s}
      .assignment-item:hover{background:rgba(0,0,0,0.04)}
      .assignment-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
      .assignment-title{font-size:14px;font-weight:600;color:#0f172a;line-height:1.3}
      .assignment-due{font-size:11px;color:#64748b;background:#f8fafc;padding:2px 6px;border-radius:4px;margin-left:8px;flex-shrink:0}
      .assignment-details{font-size:12px;color:#64748b;margin:4px 0}
      .assignment-status{font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;text-align:center;margin-top:6px;width:fit-content}
      .assignment-status.overdue{background:#fef2f2;color:#dc2626}
      .assignment-status.urgent{background:#fef3c7;color:#d97706}
      .assignment-status.normal{background:#f0fdf4;color:#16a34a}
      .assignments-footer{margin-top:14px;text-align:center}
      .assignments-redirect{background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
      .assignments-redirect:hover{background:linear-gradient(135deg,#ea580c,#dc2626)}
      
      /* Dark theme */
      .dark .assignments-card, [data-theme="dark"] .assignments-card{background:#0f172a;border:1px solid rgba(251,146,60,0.2);box-shadow:0 6px 24px rgba(0,0,0,0.25);color:#e2e8f0}
      .dark .assignments-title, [data-theme="dark"] .assignments-title{color:#fb923c}
      .dark .assignments-subtitle, [data-theme="dark"] .assignments-subtitle{color:#94a3b8}
      .dark .assignments-stat-label, [data-theme="dark"] .assignments-stat-label{color:#94a3b8}
      .dark .assignments-divider, [data-theme="dark"] .assignments-divider{border-top:1px solid rgba(255,255,255,0.07)}
      .dark .assignments-breakdown-title, [data-theme="dark"] .assignments-breakdown-title{color:#94a3b8}
      .dark .assignment-item, [data-theme="dark"] .assignment-item{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.07)}
      .dark .assignment-item:hover, [data-theme="dark"] .assignment-item:hover{background:rgba(255,255,255,0.09)}
      .dark .assignment-title, [data-theme="dark"] .assignment-title{color:#f8fafc}
      .dark .assignment-due, [data-theme="dark"] .assignment-due{background:#374151;color:#d1d5db}
      .dark .assignment-details, [data-theme="dark"] .assignment-details{color:#9ca3af}
      .dark .assignment-status.overdue, [data-theme="dark"] .assignment-status.overdue{background:#451a03;color:#fca5a5}
      .dark .assignment-status.urgent, [data-theme="dark"] .assignment-status.urgent{background:#451a03;color:#fcd34d}
      .dark .assignment-status.normal, [data-theme="dark"] .assignment-status.normal{background:#14532d;color:#86efac}
      .dark .assignments-redirect, [data-theme="dark"] .assignments-redirect{background:linear-gradient(135deg,#fb923c,#f97316)}
      .dark .assignments-redirect:hover, [data-theme="dark"] .assignments-redirect:hover{background:linear-gradient(135deg,#f97316,#ea580c)}
    </style>
    <div class="assignments-card">
      <div class="assignments-header">
        <div class="assignments-icon">📚</div>
        <div>
          <div class="assignments-title">RECENT ASSIGNMENTS</div>
          <div class="assignments-subtitle">Your assignment status</div>
        </div>
      </div>
      
      <div class="assignments-stats">
        <div class="assignments-stat">
          <div class="assignments-stat-label">Total</div>
          <div class="assignments-stat-value">${recentAssignments.length}</div>
        </div>
        <div class="assignments-stat">
          <div class="assignments-stat-label">Due Soon</div>
          <div class="assignments-stat-value" style="color:#d97706">${recentAssignments.filter(a => {
            const days = Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24));
            return days <= 3 && days >= 0;
          }).length}</div>
        </div>
        <div class="assignments-stat">
          <div class="assignments-stat-label">Overdue</div>
          <div class="assignments-stat-value" style="color:#dc2626">${recentAssignments.filter(a => new Date(a.due_date) < new Date()).length}</div>
        </div>
      </div>
      
      <hr class="assignments-divider">
      
      <div class="assignments-breakdown-title">Recent assignments:</div>
      ${assignmentsHTML}
      
      <div class="assignments-footer">
        <a href="/student/assignments" class="assignments-redirect" onclick="window.open('/student/assignments', '_blank')">📝 View All Assignments</a>
      </div>
    </div>
  `;

  return cardHTML;
}

// Helper: format an assignment into a readable string for HTML list
function formatAssignmentItem(assignment) {
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    const formattedDate = dueDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const daysText = daysUntilDue > 0 ? ` <div style="font-weight:600;color:#0b2546;margin-top:6px;">${daysUntilDue} days</div>` : '';

    return `<div>
                <strong>${escapeHtml(assignment.title)}</strong>
                <div class="sub" style="margin-top:6px;color:#6b7280;">${escapeHtml(assignment.course_name)}</div>
            </div>
            <div class="meta" style="color:#6b7280;font-size:13px;text-align:right;min-width:120px;">
                ${formattedDate}${daysText}
            </div>`;
}

// Simple HTML minifier to reduce response size
function minifyHTML(html) {
  return html
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/>\s+</g, '><')  // Remove spaces between tags
    .trim();
}

// Rate limiting to prevent excessive calls
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per user

function checkRateLimit(userId) {
    const now = Date.now();
    const userKey = `rate_${userId}`;
    const userRequests = rateLimitMap.get(userKey) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= RATE_LIMIT_MAX) {
        return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    rateLimitMap.set(userKey, validRequests);
    return true;
}

// Cache for performance optimization
const cache = new Map();
const CACHE_DURATION = 10 * 1000; // 10 seconds (for instant updates during development)

// Conversation context storage (in-memory for now, could be moved to database later)
const conversationContexts = new Map();

// User preferences storage (in-memory only - no Supabase)
const userPreferencesCache = new Map();

// Helper function to get user preferences (in-memory only)
async function getUserPreferences(userId) {
  // Check cache first
  if (userPreferencesCache.has(userId)) {
    return userPreferencesCache.get(userId);
  }
  
  // Return defaults
  return { language: 'en', theme: 'light', voiceEnabled: false };
}

// Helper function to save user preferences (in-memory only)
async function saveUserPreferences(userId, preferences) {
  // Save to in-memory cache
  userPreferencesCache.set(userId, preferences);
  console.log(`✅ Saved preferences for user ${userId} (in-memory)`);
}

// Helper function to get translated text with fallback
function getTranslatedText(language, key, replacements = {}) {
  try {
    const langData = translations[language] || translations.en;
    let text = langData[key] || translations.en[key] || key;

    // Replace placeholders like {branch}, {semester}, {day}
    Object.keys(replacements).forEach(replaceKey => {
      text = text.replace(new RegExp(`{${replaceKey}}`, 'g'), replacements[replaceKey] || '');
    });

    return text;
  } catch (error) {
    console.error('🚨 Translation function error:', error);
    return key; // Return the key as fallback
  }
}

// Multi-language support
const translations = {
  en: {
    greeting: "Hello! I'm CERA, your education assistant.",
    default_response: "I'm CERA, your education assistant. I can help you with information about your assignments, fees, attendance, timetable, and more. Try asking 'what's my name?', 'what's my branch?', or 'show my timetable'.",
    no_query: "Please provide a query.",
    language_changed: "Language changed to English. Hello! I'm CERA, your education assistant.",
    theme_dark: "Dark theme activated. All responses will now use the dark theme.",
    theme_light: "Light theme activated. All responses will now use the light theme.",
    notifications: "notifications",
    assignments: "assignments",
    attendance: "attendance",
    fees: "fees",
    timetable: "timetable",
    performance_good: "Good progress! Stay consistent.",
    performance_excellent: "Excellent work! Keep it up! 🌟",
    performance_needs_improvement: "Let's work on improving your performance.",
    performance_overview: "Here's your performance overview:\n• Attendance: {attendance_percentage}% ({attendance_present}/{attendance_total} classes)\n• Assignment Completion: {completion_rate}% ({total_assignments})\n• Overall Score: {overall_score}/100",
    assignments_due_soon: "Here are your upcoming and overdue assignments:",
    no_assignments_due: "You have no assignments due in the next 3 days or overdue assignments. Great job staying on top of things! 🎉",
    no_timetable_data: "No timetable data found for {branch} {semester} in the database. Please contact your administrator.",
    no_classes_today: "You have no classes scheduled for today ({day}). Enjoy your free time! 🎉",
    no_fee_data: "I could not find your fee records in the database. Please check with your administration.",
    no_attendance_data: "I could not find your attendance records in the database. Please check with your administration.",
    no_assignments_data: "You currently have no upcoming assignments in the database. Great job staying on top of things! 🎉",
    no_subjects_data: "I couldn't find your subjects in the timetable data. Please check with your department.",
    no_faculty_data: "I couldn't find faculty information in the current assignments. Please check with your department for faculty contact details.",
    error_generic: "Sorry, I encountered an error. Please try again.",
    error_timetable: "Sorry, I encountered an error fetching your timetable. Please try again later.",
    error_fees: "Sorry, I encountered an error fetching your fee records. Please try again later.",
    error_attendance: "Sorry, I encountered an error fetching your attendance records. Please try again later.",
    error_assignments: "Sorry, I encountered an error fetching your assignments. Please try again later.",
    error_subjects: "Sorry, I encountered an error fetching your subjects. Please try again later.",
    error_faculty: "Sorry, I encountered an error fetching faculty information. Please try again later.",
    your_branch: "Your branch is {branch}.",
    your_semester: "Your semester is {semester}."
  },
  hi: {
    greeting: "नमस्ते! मैं CERA हूं, आपका शिक्षा सहायक।",
    default_response: "मैं CERA हूं, आपका शिक्षा सहायक। मैं आपके असाइनमेंट, फीस, उपस्थिति, टाइमटेबल और अधिक के बारे में जानकारी देने में मदद कर सकता हूं। 'मेरा नाम क्या है?', 'मेरा ब्रांच क्या है?', या 'मेरा टाइमटेबल दिखाएं' पूछने का प्रयास करें।",
    no_query: "कृपया एक प्रश्न प्रदान करें।",
    language_changed: "भाषा हिंदी में बदली गई!",
    theme_dark: "डार्क थीम सक्रिय हुई। अब सभी प्रतिक्रियाएं डार्क थीम का उपयोग करेंगी।",
    theme_light: "लाइट थीम सक्रिय हुई। अब सभी प्रतिक्रियाएं लाइट थीम का उपयोग करेंगी।",
    notifications: "सूचनाएं",
    assignments: "असाइनमेंट",
    attendance: "उपस्थिति",
    fees: "फीस",
    timetable: "टाइमटेबल",
    performance_good: "अच्छी प्रगति! निरंतर बने रहें।",
    performance_excellent: "उत्कृष्ट काम! इसे जारी रखें! 🌟",
    performance_needs_improvement: "आइए अपनी प्रदर्शन में सुधार करने पर काम करें।",
    performance_overview: "यहां आपका प्रदर्शन अवलोकन है:\n• उपस्थिति: {attendance_percentage}% ({attendance_present}/{attendance_total} क्लासेस)\n• असाइनमेंट पूर्णता: {completion_rate}% ({total_assignments})\n• समग्र स्कोर: {overall_score}/100",
    assignments_due_soon: "यहां आपके आगामी और अतिदेय असाइनमेंट हैं:",
  },
  kn: {
    greeting: "ನಮಸ್ಕಾರ! ನಾನು CERA, ನಿಮ್ಮ ಶಿಕ್ಷಣ ಸಹಾಯಕ.",
    default_response: "ನಾನು CERA, ನಿಮ್ಮ ಶಿಕ್ಷಣ ಸಹಕಾರಿ. ನಾನು ನಿಮ್ಮ ಕಾರ್ಯಯೋಜನೆಗಳು, ಶುಲ್ಕಗಳು, ಹಾಜರಾತಿ, ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಹೆಚ್ಚಿನ ವಿಷಯಗಳ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಲು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. 'ನನ್ನ ಹೆಸರು ಏನು?', 'ನನ್ನ ಶಾಖೆ ಏನು?', ಅಥವಾ 'ನನ್ನ ವೇಳಾಪಟ್ಟಿ ತೋರಿಸಿ' ಕೇಳಲು ಪ್ರಯತ್ನಿಸಿ.",
    no_query: "ದಯವಿಟ್ಟು ಒಂದು ಪ್ರಶ್ನೆ ನೀಡಿ.",
    language_changed: "ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿತು!",
    theme_dark: "ಡಾರ್ಕ್ ಥೀಮ್ ಸಕ್ರಿಯಗೊಂಡಿದೆ. ಈಗ ಎಲ್ಲಾ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಡಾರ್ಕ್ ಥೀಮ್ ಬಳಸುತ್ತವೆ.",
    theme_light: "ಲೈಟ್ ಥೀಮ್ ಸಕ್ರಿಯಗೊಂಡಿದೆ. ಈಗ ಎಲ್ಲಾ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಲೈಟ್ ಥೀಮ್ ಬಳಸುತ್ತವೆ.",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    assignments: "ಕಾರ್ಯಯೋಜನೆಗಳು",
    attendance: "ಹಾಜರಾತಿ",
    fees: "ಶುಲ್ಕಗಳು",
    timetable: "ವೇಳಾಪಟ್ಟಿ",
    performance_good: "ಉತ್ತಮ ಪ್ರಗತಿ! ಮುಂದುವರಿಸಿ.",
    performance_excellent: "ಅತ್ಯುತ್ತಮ ಕೆಲಸ! ಇದನ್ನು ಮುಂದುವರಿಸಿ! 🌟",
    performance_needs_improvement: "ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷಮತೆಯನ್ನು ಸುಧಾರಿಸಲು ಕೆಲಸ ಮಾಡೋಣ.",
    performance_overview: "ಇಲ್ಲಿ ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷಮತೆಯ ಅವಲೋಕನವಿದೆ:\n• ಹಾಜರಾತಿ: {attendance_percentage}% ({attendance_present}/{attendance_total} ತರಗತಿಗಳು)\n• ಕಾರ್ಯಯೋಜನೆ ಪೂರ್ಣತೆ: {completion_rate}% ({total_assignments})\n• ಒಟ್ಟಾರೆ ಸ್ಕೋರ್: {overall_score}/100",
    assignments_due_soon: "ಇಲ್ಲಿ ನಿಮ್ಮ ಮುಂಬರುವ ಮತ್ತು ಮುಕ್ತಾಯದ ಕಾರ್ಯಯೋಜನೆಗಳಿವೆ:",
    no_assignments_due: "ನಿಮ್ಮಲ್ಲಿ ಮುಂದಿನ 3 ದಿನಗಳಲ್ಲಿ ಅಥವಾ ಮುಕ್ತಾಯದ ಯಾವುದೇ ಕಾರ್ಯಯೋಜನೆಗಳಿಲ್ಲ. ಇಷ್ಟು ಚೆನ್ನಾಗಿ ನಿಯಂತ್ರಣದಲ್ಲಿಡಲು ಅತ್ಯುತ್ತಮ! 🎉",
    no_timetable_data: "{branch} {semester} ನಿಮ್ಗಾಗಿ ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ಯಾವುದೇ ವೇಳಾಪಟ್ಟಿ ಡೇಟಾ ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    no_classes_today: "ಇಂದು ({day}) ನಿಮ್ಗಾಗಿ ಯಾವುದೇ ತರಗತಿಗಳು ನಿರ್ಧಾರಿಸಲಾಗಿಲ್ಲ. ನಿಮ್ಮ ಮುಕ್ತ ಸಮಯವನ್ನು ಆನಂದಿಸಿ! 🎉",
    no_fee_data: "ನಾನು ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ನಿಮ್ಮ ಶುಲ್ಕ ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿರ್ವಾಹಣೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    no_attendance_data: "ನಾನು ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ನಿಮ್ಮ ಹಾಜರಾತಿ ದಾಖಲೆಗಳನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿರ್ವಾಹಣೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    no_assignments_data: "ನಿಮ್ಗಾಗಿ ಪ್ರಸ್ತುತ ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ಯಾವುದೇ ಕಾರ್ಯಯೋಜನೆಗಳಿಲ್ಲ. ಇಷ್ಟು ಚೆನ್ನಾಗಿ ನಿಯಂತ್ರಣದಲ್ಲಿಡಲು ಅತ್ಯುತ್ತಮ! 🎉",
    no_subjects_data: "ನಾನು ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿ ಡೇಟಾದಲ್ಲಿ ನಿಮ್ಮ ವಿಷಯಗಳನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಲಾಖೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    no_faculty_data: "ನಾನು ಪ್ರಸ್ತುತ ಕಾರ್ಯಯೋಜನೆಗಳಲ್ಲಿ ಅಧ್ಯಾಪಕರ ಮಾಹಿತಿಯನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಅಧ್ಯಾಪಕರ ಸಂಪರ್ಕ ವಿವರಗಳಿಗಾಗಿ ನಿಮ್ಮ ಇಲಾಖೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    error_generic: "ಕ್ಷಮಿಸಿ, ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    error_timetable: "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿಯನ್ನು ತರಲು ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    error_fees: "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಶುಲ್ಕ ದಾಖಲೆಗಳನ್ನು ತರಲು ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    error_attendance: "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಹಾಜರಾತಿ ದಾಖಲೆಗಳನ್ನು ತರಲು ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    error_assignments: "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಕಾರ್ಯಯೋಜನೆಗಳನ್ನು ತರಲು ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    error_subjects: "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ವಿಷಯಗಳನ್ನು ತರಲು ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    error_faculty: "ಕ್ಷಮಿಸಿ, ಅಧ್ಯಾಪಕರ ಮಾಹಿತಿಯನ್ನು ತರಲು ನನಗೆ ಒಂದು ದೋಷ ಸಿಕ್ಕಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    your_branch: "ನಿಮ್ಮ ಶಾಖೆ {branch} ಆಗಿದೆ.",
    your_semester: "ನಿಮ್ಮ ಸೆಮೆಸ್ಟರ್ {semester} ಆಗಿದೆ."
  },
  te: {
    greeting: "నమస్కారం! నేను CERA, మీ విద్యా సహాయకుడిని.",
    default_response: "నేను CERA, మీ శిక్షాన సహాయకుడు. నేను మీ అసైన్‌మెంట్‌లు, ఫీజులు, హాజరు, టైమ్‌టేబుల్ మరియూ మరింత విషయాలలో సహాయం చేస్తున్నాను. 'నా పేరు ఏంటి?', 'నా బ్రాంచ్ ఏంటి?', లేడా 'నా టైమ్‌టేబుల్ చూపించి' అడుగు ప్రయత్నం చేయండి.",
    no_query: "దయవిట్టు ఒక ప్రశ్న నివేదించండి.",
    language_changed: "భాష తెలుగుకు మార్చబడింది!",
    theme_dark: "డార్క్ థీమ్ సక్రియమైంది. ఇప్పుడు అన్ని ప్రతిస్పందనలు డార్క్ థీమ్ వాడతాయి.",
    theme_light: "లైట్ థీమ్ సక్రియమైంది. ఇప్పుడు అన్ని ప్రతిస్పందనలు లైట్ థీమ్ వాడతాయి.",
    notifications: "నోటిఫికేషన్లు",
    assignments: "అసైన్‌మెంట్‌లు",
    attendance: "హాజరు",
    fees: "ఫీజులు",
    timetable: "టైమ్‌టేబుల్",
    performance_good: "మంచి ప్రగతి! కొనసాగించండి.",
    performance_excellent: "అత్యుత్తమ కెలస! దీన్ని కొనసాగించండి! 🌟",
    performance_needs_improvement: "మీ పనితీరును మెరుగుపరచుకోవడానికి పని చేద్దాం.",
    performance_overview: "ఇక్కడ మీ పనితీరు అవలోకనం ఉంది:\n• హాజరు: {attendance_percentage}% ({attendance_present}/{attendance_total} తరగతులు)\n• అసైన్‌మెంట్ పూర్తి: {completion_rate}% ({total_assignments})\n• మొత్తం స్కోర్: {overall_score}/100",
    assignments_due_soon: "ఇక్కడ మీ రాబోయే మరియు ముగిసిన అసైన్‌మెంట్‌లు ఉన్నాయి:",
    no_assignments_due: "మీరు ముందువైపు 3 రోజులలో లేదా ముగిసిన ఎటువంటి అసైన్‌మెంట్‌లు లేవు. ఇంత బాగా నియంత్రణలో ఉంచడం చాలా బాగుంది! 🎉",
    no_timetable_data: "{branch} {semester} మీ కోసం డేటాబేస్‌లో ఎటువంటి టైమ్‌టేబుల్ డేటా కనుగొనలేదు. దయవిట్టు మీ నిర్వాహకులను సంప్రదించండి.",
    no_classes_today: "ఈరోజు ({day}) మీ కోసం ఎటువంటి తరగతులు నిర్ధారించబడలేదు. మీ ముక్త సమయాన్ని ఆనందించండి! 🎉",
    no_fee_data: "నేను డేటాబేస్‌లో మీ ఫీజుల రికార్డులను కనుగొనలేకపోయాను. దయవిట్టు మీ నిర్వాహణతో తనిఖీ చేయండి.",
    no_attendance_data: "నేను డేటాబేస్‌లో మీ హాజరు రికార్డులను కనుగొనలేకపోయాను. దయవిట్టు మీ నిర్వాహణతో తనిఖీ చేయండి.",
    no_assignments_data: "ప్రస్తుతం మీ కోసం డేటాబేస్‌లో ఎటువంటి అసైన్‌మెంట్‌లు లేవు. ఇంత బాగా నియంత్రణలో ఉంచడం చాలా బాగుంది! 🎉",
    no_subjects_data: "నేను మీ టైమ్‌టేబుల్ డేటాలో మీ విషయాలను కనుగొనలేకపోయాను. దయవిట్టు మీ ఇలాఖాతో తనిఖీ చేయండి.",
    no_faculty_data: "నేను ప్రస్తుత అసైన్‌మెంట్‌లలో అధ్యాపకుల సమాచారాన్ని కనుగొనలేకపోయాను. దయవిట్టు అధ్యాపకుల సంప్రదింపు వివరాల కోసం మీ ఇలాఖాతో తనిఖీ చేయండి.",
    error_generic: "క్షమించండి, నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు మళ్లీ ప్రయత్నించండి.",
    error_timetable: "క్షమించండి, మీ టైమ్‌టేబుల్‌ను తెచ్చేందుకు నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు తర్వాత మళ్లీ ప్రయత్నించండి.",
    error_fees: "క్షమించండి, మీ ఫీజుల రికార్డులను తెచ్చేందుకు నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు తర్వాత మళ్లీ ప్రయత్నించండి.",
    error_attendance: "క్షమించండి, మీ హాజరు రికార్డులను తెచ్చేందుకు నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు తర్వాత మళ్లీ ప్రయత్నించండి.",
    error_assignments: "క్షమించండి, మీ అసైన్‌మెంట్‌లను తెచ్చేందుకు నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు తర్వాత మళ్లీ ప్రయత్నించండి.",
    error_subjects: "క్షమించండి, మీ విషయాలను తెచ్చేందుకు నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు తర్వాత మళ్లీ ప్రయత్నించండి.",
    error_faculty: "క్షమించండి, అధ్యాపకుల సమాచారాన్ని తెచ్చేందుకు నాకు ఒక దోషం ఏర్పడింది. దయవిట్టు తర్వాత మళ్లీ ప్రయత్నించండి.",
    your_branch: "మీ బ్రాంచ్ {branch} ఆగుతుంది.",
    your_semester: "మీ సెమెస్టర్ {semester} ఆగుతుంది."
  },
  ta: {
    greeting: "வணக்கம்! நான் CERA, உங்கள் கல்வி உதவியாளர்.",
    default_response: "நான் CERA, உங்கள் கல்வி உதவியாளர். நான் உங்கள் அசைன்மென்ட்கள், கட்டணம், வருகை, டைம்டேபுல் மற்றும் மேலும் விஷயங்களில் உதவி செய்கிறேன். 'என் பெயர் என்ன?', 'என் பிராஞ்ச் என்ன?', அல்லது 'என் டைம்டேபுல் காட்டு' என்று கேட்க முயற்சிக்கவும்.",
    no_query: "ஒரு கேள்வியை வழங்கவும்.",
    language_changed: "மொழி தமிழுக்கு மாற்றப்பட்டது!",
    theme_dark: "டார்க் தீம் செயல்படுத்தப்பட்டது. இப்போது எல்லா பதில்களும் டார்க் தீம் பயன்படுத்தும்.",
    theme_light: "லைட் தீம் செயல்படுத்தப்பட்டது. இப்போது எல்லா பதில்களும் லைட் தீம் பயன்படுத்தும்.",
    notifications: "அறிவிப்புகள்",
    assignments: "பணிகள்",
    attendance: "வருகை",
    fees: "கட்டணம்",
    timetable: "டைம்டேபுல்",
    performance_good: "நல்ல முன்னேற்றம்! தொடருங்கள்.",
    performance_excellent: "சிறப்பான வேலை! இதை தொடருங்கள்! 🌟",
    performance_needs_improvement: "உங்கள் செயல்திறனை மேம்படுத்துவதற்கு வேலை செய்வோம்.",
    performance_overview: "இங்கே உங்கள் செயல்திறன் கண்ணோட்டம் உள்ளது:\n• வருகை: {attendance_percentage}% ({attendance_present}/{attendance_total} வகுப்புகள்)\n• பணி நிறைவு: {completion_rate}% ({total_assignments})\n• மொத்த மதிப்பெண்: {overall_score}/100",
    assignments_due_soon: "இங்கே உங்கள் வரவிருக்கும் மற்றும் காலாவதியான பணிகள் உள்ளன:",
    no_assignments_due: "உங்களுக்கு அடுத்த 3 நாட்களில் அல்லது காலாவதியான எந்த பணிகளும் இல்லை. இவ்வளவு நன்றாக கட்டுப்பாட்டில் வைத்திருப்பது மிகவும் சிறப்பாகும்! 🎉",
    no_timetable_data: "{branch} {semester}க்கு தரவுத்தளத்தில் எந்த டைம்டேபுல் தரவும் கிடைக்கவில்லை. உங்கள் நிர்வாகியை தொடர்பு கொள்ளவும்.",
    no_classes_today: "இன்று ({day}) உங்களுக்கு எந்த வகுப்புகளும் திட்டமிடப்படவில்லை. உங்கள் முழு நேரத்தை ஆனந்தமாக செலவிடுங்கள்! 🎉",
    no_fee_data: "தரவுத்தளத்தில் உங்கள் கட்டண பதிவுகளை என்னால் கண்டுபிடிக்க முடியவில்லை. உங்கள் நிர்வாகத்துடன் சரிபார்க்கவும்.",
    no_attendance_data: "தரவுத்தளத்தில் உங்கள் வருகை பதிவுகளை என்னால் கண்டுபிடிக்க முடியவில்லை. உங்கள் நிர்வாகத்துடன் சரிபார்க்கவும்.",
    no_assignments_data: "தற்போது உங்களுக்கு தரவுத்தளத்தில் எந்த பணிகளும் இல்லை. இவ்வளவு நன்றாக கட்டுப்பாட்டில் வைத்திருப்பது மிகவும் சிறப்பாகும்! 🎉",
    no_subjects_data: "உங்கள் டைம்டேபுல் தரவில் உங்கள் பாடங்களை என்னால் கண்டுபிடிக்க முடியவில்லை. உங்கள் துறையுடன் சரிபார்க்கவும்.",
    no_faculty_data: "தற்போதைய பணிகளில் ஆசிரியர் தகவலை என்னால் கண்டுபிடிக்க முடியவில்லை. ஆசிரியர் தொடர்பு விவரங்களுக்கு உங்கள் துறையுடன் சரிபார்க்கவும்.",
    error_generic: "மன்னிக்கவும், எனக்கு ஒரு பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    error_timetable: "மன்னிக்கவும், உங்கள் டைம்டேபுல் கொண்டுவருவதில் எனக்கு ஒரு பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.",
    error_fees: "மன்னிக்கவும், உங்கள் கட்டண பதிவுகளை கொண்டுவருவதில் எனக்கு ஒரு பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.",
    error_attendance: "மன்னிக்கவும், உங்கள் வருகை பதிவுகளை கொண்டுவருவதில் எனக்கு ஒரு பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.",
    error_assignments: "மன்னிக்கவும், உங்கள் பணிகளை கொண்டுவருவதில் எனக்கு ஒரு பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.",
    error_subjects: "மன்னிக்கவும், உங்கள் பாடங்களை கொண்டுவருவதில் எனக்கு ஒரு பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.",
    error_faculty: "மன்னிக்கவும், ஆசிரியர் தகவலை கொண்டுவருவதில் எனக்கு ஒரு பிழை ஏற்பட்டது. பின்னர் மீண்டும் முயற்சிக்கவும்.",
    your_branch: "உங்கள் பிராஞ்ச் {branch} ஆகும்.",
    your_semester: "உங்கள் செமெஸ்டர் {semester} ஆகும்."
  },
  ml: {
    greeting: "നമസ്കാരം! ഞാൻ CERA, നിങ്ങളുടെ വിദ്യാഭ്യാസ സഹായി.",
    default_response: "ഞാൻ CERA, നിങ്ങളുടെ ശിക്ഷാന സഹായി. ഞാൻ നിങ്ങളുടെ അസൈൻമെൻ്റ്‌സ്, ഫീസ്, ഹാജർ, ടൈംടേബിൾ മരിയൂ കൂടുതൽ കാര്യങ്ങളിൽ സഹായം ചെയ്യുന്നു. 'നാ പേര് ഏന്തി?', 'നാ ബ്രാഞ്ച് ഏന്തി?', ലേഡ 'നാ ടൈംടേബിൾ കാണിച്ച്' അടി ശ്രമം ചെയ്യുക.",
    no_query: "ഒരു ചോദ്യം നൽകുക.",
    language_changed: "ഭാഷ മലയാളത്തിലേക്ക് മാറ്റപ്പെട്ടു!",
    theme_dark: "ഡാർക്ക് തീം സജ്ജമാക്കപ്പെട്ടു. ഇപ്പോൾ എല്ലാ മറുപടികളും ഡാർക്ക് തീം ഉപയോഗിക്കും.",
    theme_light: "ലൈറ്റ് തീം സജ്ജമാക്കപ്പെട്ടു. ഇപ്പോൾ എല്ലാ മറുപടികളും ലൈറ്റ് തീം ഉപയോഗിക്കും.",
    notifications: "അറിയിപ്പുകൾ",
    assignments: "അസൈൻമെൻ്റുകൾ",
    attendance: "ഹാജർ",
    fees: "ഫീസ്",
    timetable: "ടൈംടേബിൾ",
    performance_good: "നല്ല മുന്നേറ്റം! തുടരുക.",
    performance_excellent: "അത്യുക്തം! ഇത് തുടരുക! 🌟",
    performance_needs_improvement: "നിങ്ങളുടെ പ്രകടനം മെച്ചപ്പെടുത്താൻ നമുക്ക് പ്രവർത്തിക്കാം.",
    performance_overview: "ഇവിടെ നിങ്ങളുടെ പ്രകടന അവലോകനം:\n• ഹാജർ: {attendance_percentage}% ({attendance_present}/{attendance_total} ക്ലാസുകൾ)\n• അസൈൻമെൻ്റ് പൂർത്തീകരണം: {completion_rate}% ({total_assignments})\n• മൊത്തം സ്കോർ: {overall_score}/100",
    assignments_due_soon: "ഇവിടെ നിങ്ങളുടെ വരാനിരിക്കുന്നതും കാലഹരണപ്പെട്ടതുമായ അസൈൻമെൻ്റുകൾ:",
    no_assignments_due: "നിങ്ങൾക്ക് അടുത്ത 3 ദിവസങ്ങളിൽ അല്ലെങ്കിൽ കാലഹരണപ്പെട്ട ഒരു അസൈൻമെൻ്റും ഇല്ല. ഇത്രയും നന്നായി നിയന്ത്രിക്കുന്നത് മികച്ചതാണ്! 🎉",
    no_timetable_data: "{branch} {semester}ന് ഡാറ്റാബേസിൽ ടൈംടേബിൾ ഡാറ്റ ഇല്ല. നിങ്ങളുടെ അഡ്മിനിസ്ട്രേറ്ററുമായി ബന്ധപ്പെടുക.",
    no_classes_today: "ഇന്ന് ({day}) നിങ്ങൾക്ക് ക്ലാസുകളൊന്നും ഷെഡ്യൂൾ ചെയ്തിട്ടില്ല. നിങ്ങളുടെ മുഴുവൻ സമയവും ആസ്വദിക്കുക! 🎉",
    no_fee_data: "ഡാറ്റാബേസിൽ നിങ്ങളുടെ ഫീസ് റെക്കോർഡുകൾ എനിക്ക് കണ്ടെത്താൻ കഴിഞ്ഞില്ല. നിങ്ങളുടെ അഡ്മിനിസ്ട്രേഷനുമായി പരിശോധിക്കുക.",
    no_attendance_data: "ഡാറ്റാബേസിൽ നിങ്ങളുടെ ഹാജർ റെക്കോർഡുകൾ എനിക്ക് കണ്ടെത്താൻ കഴിഞ്ഞില്ല. നിങ്ങളുടെ അഡ്മിനിസ്ട്രേഷനുമായി പരിശോധിക്കുക.",
    no_assignments_data: "ഇപ്പോൾ നിങ്ങൾക്ക് ഡാറ്റാബേസിൽ അസൈൻമെൻ്റുകൾ ഇല്ല. ഇത്രയും നന്നായി നിയന്ത്രിക്കുന്നത് മികച്ചതാണ്! 🎉",
    no_subjects_data: "നിങ്ങളുടെ ടൈംടേബിൾ ഡാറ്റയിൽ നിങ്ങളുടെ സബ്ജക്ടുകൾ എനിക്ക് കണ്ടെത്താൻ കഴിഞ്ഞില്ല. നിങ്ങളുടെ ഡിപ്പാർട്ട്മെന്റുമായി പരിശോധിക്കുക.",
    no_faculty_data: "നിലവിലെ അസൈൻമെൻ്റുകളിൽ ഫാക്കൾട്ടി വിവരം എനിക്ക് കണ്ടെത്താൻ കഴിഞ്ഞില്ല. ഫാക്കൾട്ടി കോൺടാക്റ്റ് വിവരങ്ങൾക്കായി നിങ്ങളുടെ ഡിപ്പാർട്ട്മെന്റുമായി പരിശോധിക്കുക.",
    error_generic: "ക്ഷമിക്കണം, എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.",
    error_timetable: "ക്ഷമിക്കണം, നിങ്ങളുടെ ടൈംടേബിൾ എടുക്കുന്നതിൽ എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    error_fees: "ക്ഷമിക്കണം, നിങ്ങളുടെ ഫീസ് റെക്കോർഡുകൾ എടുക്കുന്നതിൽ എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    error_attendance: "ക്ഷമിക്കണം, നിങ്ങളുടെ ഹാജർ റെക്കോർഡുകൾ എടുക്കുന്നതിൽ എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    error_assignments: "ക്ഷമിക്കണം, നിങ്ങളുടെ അസൈൻമെൻ്റുകൾ എടുക്കുന്നതിൽ എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    error_subjects: "ക്ഷമിക്കണം, നിങ്ങളുടെ സബ്ജക്ടുകൾ എടുക്കുന്നതിൽ എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    error_faculty: "ക്ഷമിക്കണം, ഫാക്കൾട്ടി വിവരം എടുക്കുന്നതിൽ എനിക്ക് ഒരു പിശക് സംഭവിച്ചു. പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
    your_branch: "നിങ്ങളുടെ ബ്രാഞ്ച് {branch} ആണ്.",
    your_semester: "നിങ്ങളുടെ സെമസ്റ്റർ {semester} ആണ്.",
    no_fee_data: "നാനು ನಿಮ್ಮ ಶುಲ್ಕ ದಾಖಲೆಗಳನ್ನು ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿರ್ವಾಹಣೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    no_attendance_data: "ನಾನು ನಿಮ್ಮ ಹಾಜರಾತಿ ದಾಖಲೆಗಳನ್ನು ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ನಿರ್ವಾಹಣೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    no_assignments_data: "ನಿಮ್ಗಾಗಿ ಪ್ರಸ್ತುತ ಡೇಟಾಬೇಸ್ ನಲ್ಲಿ ಯಾವುದೇ ಕಾರ್ಯಯೋಜನೆಗಳಿಲ್ಲ. ಇಷ್ಟು ಚೆನ್ನಾಗಿ ನಿಯಂತ್ರಣದಲ್ಲಿಡಲು ಅತ್ಯುತ್ತಮ! 🎉",
    no_subjects_data: "ನಾನು ನಿಮ್ಮ ವೇಳಾಪಟ್ಟಿ ಡೇಟಾದಲ್ಲಿ ನಿಮ್ಮ ವಿಷಯಗಳನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಲಾಖೆಯಿಂದ ಪರಿಶೀಲಿಸಿ.",
    no_faculty_data: "ನಾನು ಪ್ರಸ್ತುತ ಕಾರ್ಯಯೋಜನೆಗಳಲ್ಲಿ ಅಧ್ಯಾಪಕರ ಮಾಹಿತಿಯನ್ನು ಹುಡುಕಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಅಧ್ಯಾಪಕರ ಸಂಪರ್ಕ ವಿವರಗಳಿಗಾಗಿ ನಿಮ್ಮ ಇಲಾಖೆಯಿಂದ ಪರಿಶೀಲಿಸಿ."
  },
};

// Theme configurations
const themes = {
  light: {
    bg: '#ffffff',
    text: '#374151',
    accent: '#3b82f6',
    cardBg: '#ffffff',
    border: 'rgba(15,23,42,0.03)',
    shadow: '0 10px 30px rgba(18,38,63,0.06)'
  },
  dark: {
    bg: '#1f2937',
    text: '#f9fafb',
    accent: '#60a5fa',
    cardBg: '#374151',
    border: 'rgba(75,85,99,0.2)',
    shadow: '0 10px 30px rgba(0,0,0,0.3)'
  }
};

// Notification system
async function checkNotifications(userId, userBranch, userSemester) {
  const notifications = [];

  try {
    // Check upcoming assignment deadlines (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: upcomingAssignments } = await supabase
      .from('assignments')
      .select('*')
      .eq('branch', userBranch)
      .eq('semester', userSemester)
      .lte('due_date', threeDaysFromNow.toISOString().split('T')[0])
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (upcomingAssignments?.length > 0) {
      const days = Math.ceil((new Date(upcomingAssignments[0].due_date) - new Date()) / (1000 * 60 * 60 * 24));
      notifications.push({
        type: 'assignment_deadline',
        priority: 'high',
        message: `${upcomingAssignments.length} assignment(s) due in ${days} day(s)`,
        data: upcomingAssignments
      });
    }

    // Check low attendance (< 75%)
    const { data: attendanceData } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_uid', userId);

    if (attendanceData?.length > 0) {
      const totalClasses = attendanceData.length;
      const presentCount = attendanceData.filter(record => record.status === 'present').length;
      const attendancePercentage = Math.round((presentCount / totalClasses) * 100);

      if (attendancePercentage < 75) {
        notifications.push({
          type: 'low_attendance',
          priority: 'high',
          message: `Your attendance is ${attendancePercentage}% (${presentCount}/${totalClasses} classes)`,
          data: { percentage: attendancePercentage, present: presentCount, total: totalClasses }
        });
      }
    }

    // Check overdue fees
    const { data: feeData } = await supabase
      .from('fee_records')
      .select('*')
      .eq('student_id', userId);

    if (feeData?.length > 0) {
      const overdueFees = feeData.filter(record => {
        const dueDate = new Date(record.due_date);
        const today = new Date();
        return dueDate < today && parseFloat(record.total_amount) > parseFloat(record.paid_amount);
      });

      if (overdueFees.length > 0) {
        const totalOverdue = overdueFees.reduce((sum, record) =>
          sum + (parseFloat(record.total_amount) - parseFloat(record.paid_amount)), 0);

        notifications.push({
          type: 'overdue_fees',
          priority: 'critical',
          message: `You have ₹${totalOverdue.toLocaleString()} in overdue fees`,
          data: overdueFees
        });
      }
    }

  } catch (error) {
    console.error('Notification check error:', error);
  }

  return notifications;
}

// Smart Intent Detection using Gemini AI
async function detectIntentWithGemini(userQuery, userContext) {
  try {
    console.log('🧠 Analyzing query intent with Gemini...');

    const intentPrompt = `
You are an AI assistant that analyzes student queries for an educational system called CERA.
Your task is to classify the user's intent from their query and return a structured JSON response.

Available intents and their descriptions:
- "greetings": Simple greetings, introductions, or identity questions
- "fees": Questions about fee payments, balances, dues, or financial matters
- "timetable": Questions about class schedules, timetables, today's classes, weekly schedules
- "attendance": Questions about attendance records, performance, grades, marks, or academic progress
- "assignments": Questions about assignments, homework, projects, submissions, deadlines
- "subjects": Questions about subjects, courses, curriculum, syllabus
- "faculty": Questions about teachers, professors, instructors, faculty contacts
- "events": Questions about campus events, activities, announcements, or upcoming happenings
- "resume": Questions about generating or creating resumes/CVs
- "language_change": Requests to change language (e.g., "change language to hindi", "switch to kannada")
- "theme": Questions about changing themes or appearance
- "academic_info": Questions about branch, semester, or general academic information
- "continue": Commands to continue a previous conversation or get more information (e.g., "continue", "go on", "tell me more")
- "upcoming": Questions about upcoming deadlines, assignments due soon
- "on_track": Questions about performance status, whether student is on track
- "about_me": Questions about user profile, personal information, or "tell me about me"
- "general": General conversation, jokes, casual talk, questions about life, opinions, fun topics, or questions not related to academic data
- "help": Questions asking for help or information about what CERA can do

User Query: "${userQuery}"
User Context: Branch=${userContext.branch || 'Unknown'}, Semester=${userContext.semester || 'Unknown'}

Return ONLY a valid JSON object with this exact structure:
{
  "intent": "primary_intent_here",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "fallback_intents": ["secondary_intent1", "secondary_intent2"]
}

Be precise and confident in your classification. If unsure, use "help" as intent.`;

    const contents = [{
      role: "user",
      parts: [{ text: intentPrompt }]
    }];

    const geminiResponse = await callGemini(contents, null);

    if (geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const responseText = geminiResponse.candidates[0].content.parts[0].text;

      // Extract JSON from response (Gemini might wrap it in markdown)
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const intentData = JSON.parse(jsonMatch[0]);

          // Validate the response structure
          if (intentData.intent && typeof intentData.confidence === 'number') {
            console.log(`🎯 Intent detected: ${intentData.intent} (confidence: ${intentData.confidence})`);
            return intentData;
          }
        } catch (parseError) {
          console.error('Failed to parse Gemini intent response:', parseError);
        }
      }
    }

    // Fallback to keyword-based detection if Gemini fails
    console.log('⚠️ Gemini intent detection failed, falling back to keyword analysis');
    return detectIntentByKeywords(userQuery);

  } catch (error) {
    console.error('Smart intent detection error:', error);
    return detectIntentByKeywords(userQuery);
  }
}

// Fallback keyword-based intent detection
function detectIntentByKeywords(userQuery) {
  const query = userQuery.toLowerCase().trim();

  // Greetings
  if (['hi', 'hello', 'hey', 'hiya', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo'].includes(query) ||
      query.includes('who are you') || query.includes('your name') || query.includes('you are')) {
    return { intent: 'greetings', confidence: 1.0, reasoning: 'Direct greeting or identity question' };
  }

  // Fees
  if (query.includes('fee')) {
    return { intent: 'fees', confidence: 0.95, reasoning: 'Contains fee-related keywords' };
  }

  // Timetable
  if (query.includes('timetable') || query.includes('schedule') || query.includes('timetabe') ||
      query.includes('time table') || query.includes('today\'s timetable') || query.includes('today schedule') ||
      query.includes('class schedule') || query.includes('today\'s classes') || query.includes('this week timetable') ||
      query.includes('weekly schedule') || query.includes('show full timetable') || query.includes('show my schedule') ||
      query.includes('display timetable') || query.includes('my timetable') || query.includes('subject timing') ||
      query.includes('period timings') || query.includes('lecture list') || query.includes('which class today') ||
      query.includes('what class now') || query.includes('class time') || query.includes('time table') ||
      query.includes('show all classes') || query.includes('next class') || query.includes('today subjects') ||
      query.includes('next lecture') || query.includes('classes') || query.includes('my classes') ||
      query.includes('today classes')) {
    return { intent: 'timetable', confidence: 0.95, reasoning: 'Contains timetable/schedule keywords' };
  }

  // Attendance/Performance
  if (query.includes('attendance') || query.includes('how am i doing') || query.includes('my performance') ||
      query.includes('performance') || query.includes('progress report') || query.includes('show performance') ||
      query.includes('academic performance') || query.includes('marks summary') || query.includes('result') ||
      query.includes('my result') || query.includes('grade') || query.includes('grades') ||
      query.includes('how did i perform') || query.includes('my marks') || query.includes('analytics') ||
      query.includes('score') || query.includes('scorecard') || query.includes('exam result') ||
      query.includes('test result') || query.includes('result analysis') || query.includes('how much i got') ||
      query.includes('marksheet')) {
    return { intent: 'attendance', confidence: 0.95, reasoning: 'Contains attendance/performance keywords' };
  }

  // Assignments
  if (query.includes('assignment') || query.includes('homework') || query.includes('project') ||
      query.includes('assignments') || query.includes('my assignments') || query.includes('show assignments') ||
      query.includes('pending assignments') || query.includes('today\'s assignment') || query.includes('submit assignment') ||
      query.includes('assignment list') || query.includes('assignment status') || query.includes('new assignments') ||
      query.includes('upcoming assignments') || query.includes('due assignments') || query.includes('due project') ||
      query.includes('pending homework') || query.includes('tasks') || query.includes('todo') ||
      query.includes('what should i submit') || query.includes('what to submit') || query.includes('submission date') ||
      query.includes('project deadline')) {
    return { intent: 'assignments', confidence: 0.95, reasoning: 'Contains assignment/homework keywords' };
  }

  // Subjects
  if (query.includes('subject') || query.includes('courses') || query.includes('subjects') ||
      query.includes('my subjects') || query.includes('course') || query.includes('my courses') ||
      query.includes('show subjects') || query.includes('subject list') || query.includes('which subjects') ||
      query.includes('course details') || query.includes('course list') || query.includes('subjects list') ||
      query.includes('syllabus') || query.includes('topics') || query.includes('learning subjects') ||
      query.includes('what are my subjects') || query.includes('enrolled subjects')) {
    return { intent: 'subjects', confidence: 0.95, reasoning: 'Contains subject/course keywords' };
  }

  // Faculty
  if (query.includes('faculty') || query.includes('faculties') || query.includes('teacher') ||
      query.includes('teachers') || query.includes('professor') || query.includes('instructor') ||
      query.includes('lecturer') || query.includes('staff') || query.includes('teaching staff') ||
      query.includes('faculty list') || query.includes('show faculty') || query.includes('faculty contacts') ||
      query.includes('contact teacher') || query.includes('teacher info') || query.includes('who teaches') ||
      query.includes('my professor') || query.includes('faculty details') ||
      query.includes('which teacher teaches this subject') || query.includes('who is my mentor') ||
      query.includes('advisor') || query.includes('mentor') || query.includes('guide')) {
    return { intent: 'faculty', confidence: 0.95, reasoning: 'Contains faculty/teacher keywords' };
  }

  // Events
  if (query.includes('event') || query.includes('events') || query.includes('activity') ||
      query.includes('activities') || query.includes('announcement') || query.includes('announcements') ||
      query.includes('happening') || query.includes('campus event') || query.includes('college event') ||
      query.includes('upcoming event') || query.includes('show events') || query.includes('event list') ||
      query.includes('what events') || query.includes('college activities') || query.includes('campus activities')) {
    return { intent: 'events', confidence: 0.95, reasoning: 'Contains event/activity keywords' };
  }

  // Resume
  if (query.includes('resume') || query.includes('cv') || query.includes('curriculum vitae') ||
      query.includes('generate resume') || query.includes('create resume') || query.includes('build resume') ||
      query.includes('make my resume') || query.includes('download resume') || query.includes('my resume') ||
      query.includes('resume builder') || query.includes('resume generator') || query.includes('get resume') ||
      query.includes('show resume') || query.includes('resume pdf') || query.includes('resume file') ||
      query.includes('share my resume') || query.includes('save resume') || query.includes('resume maker') ||
      query.includes('resume creation') || query.includes('update my resume')) {
    return { intent: 'resume', confidence: 0.95, reasoning: 'Contains resume/CV keywords' };
  }

  // Language Change
  if (query.includes('change language') || query.includes('switch language') ||
      query.includes('set language') || query.includes('language to') ||
      query.includes('switch to')) {
    return { intent: 'language_change', confidence: 0.95, reasoning: 'Contains language change keywords' };
  }

  // Theme
  if (query.includes('change theme') || query.includes('set theme') || query.includes('switch theme') ||
      query.includes('make theme') || query.includes('theme to') || query.includes('theme dark') ||
      query.includes('theme light')) {
    return { intent: 'theme', confidence: 0.95, reasoning: 'Contains theme change keywords' };
  }

  // Academic Info
  if ((query.includes('branch') && query.includes('semester')) || query.includes('what is my branch and semester') ||
      query.includes('my branch and semester') || query.includes('branch') || query.includes('semester')) {
    return { intent: 'academic_info', confidence: 0.95, reasoning: 'Contains academic info keywords' };
  }

  // Upcoming/Due Soon
  if (query.includes('due soon') || query.includes('upcoming') || query.includes('deadline')) {
    return { intent: 'upcoming', confidence: 0.9, reasoning: 'Contains upcoming/deadline keywords' };
  }

  // On Track
  if (query.includes('on track') || query.includes('track')) {
    return { intent: 'on_track', confidence: 0.9, reasoning: 'Contains track/status keywords' };
  }

  // Profile/About Me
  if (query.includes('about me') || query.includes('tell me about me') ||
      query.includes('my profile') || query.includes('show my profile') ||
      query.includes('who am i') || query.includes('my information') ||
      query.includes('my details') || query.includes('profile')) {
    return { intent: 'about_me', confidence: 0.95, reasoning: 'Contains profile/about me keywords' };
  }

  // Continue command (special handling)
  if (query.trim() === 'continue' || query.includes('continue') || query.includes('go on') || query.includes('more')) {
    return { intent: 'continue', confidence: 0.95, reasoning: 'Continue command detected' };
  }

  // Default to general conversation
}
// Performance analytics - FOCUS ONLY ON ATTENDANCE
async function getPerformanceAnalytics(userId, userBranch, userSemester) {
  try {
    // Fetch from Google Sheets or Supabase based on configuration
    const attendanceData = await getDataFromSource('attendance_records', {
      eq: { student_uid: userId }
    });

    // Calculate attendance metrics
    const attendance = attendanceData?.length > 0 ? {
      total: attendanceData.length,
      present: attendanceData.filter(r => r.status === 'present').length,
      absent: attendanceData.filter(r => r.status === 'absent').length,
      percentage: Math.round((attendanceData.filter(r => r.status === 'present').length / attendanceData.length) * 100)
    } : { total: 0, present: 0, absent: 0, percentage: 0 };

    // Calculate attendance trend (last 10 days if available)
    const recentAttendance = attendanceData?.slice(-10) || [];
    const recentStats = recentAttendance.length > 0 ? {
      total: recentAttendance.length,
      present: recentAttendance.filter(r => r.status === 'present').length,
      absent: recentAttendance.filter(r => r.status === 'absent').length,
      percentage: Math.round((recentAttendance.filter(r => r.status === 'present').length / recentAttendance.length) * 100)
    } : null;

    // Generate attendance graph data for visualization
    const graphData = attendanceData ? generateAttendanceGraph(attendanceData) : null;

    return {
      attendance,
      recentStats,
      graphData,
      overall: {
        score: attendance.percentage,
        status: attendance.percentage >= 85 ? 'excellent' :
               attendance.percentage >= 75 ? 'good' : 'needs_improvement'
      }
    };
  } catch (error) {
    console.error('Performance analytics error:', error);
    return null;
  }
}

const generateQuickActions = (type, data = null) => {
  const actions = [];

  switch (type) {
    case 'assignments':
      if (data && data.length > 0) {
        actions.push({
          label: 'View All Assignments',
          action: 'assignments'
        });
      }
      break;
    case 'attendance':
      actions.push({
        label: 'View Detailed Attendance',
        action: 'attendance'
      });
      break;
  }

  return actions;
};

// Function to handle general conversation using Gemini AI
async function handleGeneralConversation(userQuery, userContext, language) {
  try {
    console.log('🤖 Starting general conversation with Gemini AI...');
    console.log('🤖 Query:', userQuery);
    console.log('🤖 User context:', userContext);
    console.log('🤖 Language:', language);

    // Get language-specific instructions
    const languageInstructions = {
      'en': 'Respond in English.',
      'hi': 'Respond in Hindi (हिंदी) language.',
      'kn': 'Respond in Kannada (ಕನ್ನಡ) language.',
      'te': 'Respond in Telugu (తెలుగు) language.',
      'ta': 'Respond in Tamil (தமிழ்) language.',
      'ml': 'Respond in Malayalam (മലയാളം) language.'
    };

    const langInstruction = languageInstructions[language] || languageInstructions['en'];

    const systemPrompt = `You are CERA, a friendly and helpful education assistant for students. You can engage in general conversation while being helpful and engaging.

Key guidelines:
- Be friendly, conversational, and engaging
- Keep responses appropriate and educational when possible
- If asked about personal information, politely redirect to academic topics
- Answer questions directly and naturally
- Use emojis sparingly to keep responses professional
- Stay in character as an education assistant
- ${langInstruction}

User context: Student in ${userContext.branch || 'Unknown'} branch, ${userContext.semester || 'Unknown'} semester
User query: "${userQuery}"

Respond naturally to this general conversation query in the specified language.`;

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      }
    ];

    console.log('🤖 Calling Gemini API for general conversation...');
    const response = await callGemini(contents, null);
    console.log('🤖 Gemini API response received:', response ? 'SUCCESS' : 'FAILED');

    if (response && response.candidates && response.candidates[0] && response.candidates[0].content) {
      let answer = response.candidates[0].content.parts[0].text;

      console.log('🤖 Raw Gemini response:', JSON.stringify(response, null, 2));
      console.log('🤖 Extracted answer:', answer);

      // Clean up the response
      answer = answer.trim();

      // Check if answer is empty or too short
      if (!answer || answer.length < 5) {
        console.error('❌ Gemini response is empty or too short');
        throw new Error('Gemini response is empty or too short');
      }

      // Remove any system prompt leakage
      if (answer.includes('Key guidelines:') || answer.includes('systemPrompt')) {
        console.log('⚠️ Detected system prompt leakage, cleaning response');
        answer = answer.split('User query:')[1] || answer;
        answer = answer.replace(/^["\s]*/, '').replace(/["\s]*$/, '');
      }

      console.log('✅ General conversation response generated');
      return answer;
    } else {
      console.error('❌ Invalid Gemini response structure');
      console.error('❌ Full response object:', JSON.stringify(response, null, 2));
      throw new Error('Invalid response from Gemini AI');
    }

  } catch (error) {
    console.error('❌ General conversation error:', error);
    console.error('❌ Error stack:', error.stack);
    return "Sorry, I'm having trouble processing your message right now. Could you try rephrasing your question or ask about your academic information instead?";
  }
}

export async function POST(request) {
  console.log('🎯 CERA API CALLED - START');

  try {
    console.log('🚀 CERA API Request received');

    // Extract user info early for rate limiting
    const body = await request.json();
    const userContext = body.userContext || {};
    const userId = userContext.user_id || 'anonymous';

    // Check rate limit
    if (!checkRateLimit(userId)) {
      console.log('🚫 Rate limit exceeded for user:', userId);
      return NextResponse.json({
        success: false,
        answer: "Too many requests. Please wait a moment before trying again.",
        language: 'en',
        theme: 'light',
        voiceEnabled: false
      });
    }
    const userQuery = body.userQuery?.toLowerCase().trim();
    const language = body.language || 'en';
    const theme = body.theme || 'light';
    const voiceEnabled = body.voiceEnabled || false;

    if (!userQuery) {
      return NextResponse.json({
        success: false,
        answer: "Please provide a query.",
        language: 'en',
        theme: 'light',
        voiceEnabled: false
      });
    }

    // Extract user info
    const userName = userContext.full_name || userContext.displayName || "Student";
    const userBranch = userContext.branch || "Unknown";
    const userSemester = userContext.semester || "Unknown";

    // 🎯 SMART INTENT DETECTION - Use AI to classify user intent
    const intentAnalysis = await detectIntentWithGemini(userQuery, userContext);
    console.log(`🎯 Smart Intent Detection: ${intentAnalysis.intent} (confidence: ${intentAnalysis.confidence})`);

    // Route to appropriate handler based on detected intent
    let responseHandled = false;

    // Route based on detected intent
    switch (intentAnalysis.intent) {
      case 'greetings':
        responseHandled = true;
        // Handle greetings
        const greeting = getTranslatedText(language, 'greeting');
        return NextResponse.json({
          success: true,
          answer: greeting,
          language, theme, voiceEnabled,
          notifications: [],
          detectedIntent: intentAnalysis
        });
        break;

      case 'fees':
        responseHandled = true;
        // Handle student fees query
        try {
          console.log('💰 Processing student fees query...');

          const cacheKey = `fees_${userId}`;
          let feeData = cache.get(cacheKey);

          if (!feeData || (Date.now() - feeData.timestamp) > CACHE_DURATION) {
            // Fetch from Google Sheets or Supabase based on configuration
            const fees = await getDataFromSource('fee_records', {
              eq: { student_id: userId }
            });

            feeData = {
              data: fees || [],
              timestamp: Date.now()
            };
            cache.set(cacheKey, feeData);
          }

          const fees = feeData.data;

          if (!fees || fees.length === 0) {
            return NextResponse.json({
              success: true,
              answer: getTranslatedText(language, 'no_fee_data'),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }

          // Calculate total and paid amounts
          const totalAmount = fees.reduce((sum, fee) => sum + parseFloat(fee.total_amount || 0), 0);
          const paidAmount = fees.reduce((sum, fee) => sum + parseFloat(fee.paid_amount || 0), 0);
          const pendingAmount = totalAmount - paidAmount;

  const feeCards = fees.map(fee => `
    <div class="fee-detail-card">
      <div class="fee-detail-header">Fee Details</div>
      <div class="fee-detail-info">
        <div><span>Total:</span> ₹${parseFloat(fee.total_amount || 0).toLocaleString()}</div>
        <div><span>Paid:</span> ₹${parseFloat(fee.paid_amount || 0).toLocaleString()}</div>
        <div><span>Balance:</span> ₹${(parseFloat(fee.total_amount || 0) - parseFloat(fee.paid_amount || 0)).toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  const feeHtml = minifyHTML(`
    <style>
      /* Light theme (default) */
      .fee-card{max-width:none;width:100%;margin:0 auto;background:#ffffff;border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px 20px;box-shadow:0 6px 24px rgba(14,21,40,0.08);font-family:Inter,system-ui,sans-serif;color:#0f172a;transition:all 0.3s ease}
      .fee-header{display:flex;gap:12px;align-items:center;margin-bottom:10px}
      .fee-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid rgba(16,185,129,0.12)}
      .fee-title{font-size:18px;font-weight:700;color:#059669}
      .fee-subtitle{font-size:13px;color:#64748b;margin-top:2px}
      .fee-stats{display:flex;gap:12px;align-items:center;margin-bottom:16px;overflow-x:auto;min-width:fit-content}
      .fee-stat{flex:1;min-width:80px}
      .fee-stat-label{font-size:12px;color:#64748b}
      .fee-stat-value{font-size:18px;font-weight:700}
      .fee-divider{border:none;border-top:1px solid rgba(0,0,0,0.05);margin:12px 0}
      .fee-breakdown-title{font-size:14px;color:#64748b;margin-bottom:12px}
      .fee-detail-card{background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.05);border-radius:8px;padding:12px;margin-bottom:8px}
      .fee-detail-header{font-weight:600;color:#0f172a;margin-bottom:8px}
      .fee-detail-info{display:flex;gap:12px;font-size:13px}
      .fee-detail-info span{color:#64748b}
      .fee-footer{font-size:11px;color:#64748b;text-align:center;margin-top:12px}
      
      /* Footer button styling */
      .fee-card-footer{margin-top:14px;text-align:center}
      .fee-redirect{background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
      .fee-redirect:hover{background:linear-gradient(135deg,#059669,#047857)}
      
      /* Dark theme */
      .dark .fee-card, [data-theme="dark"] .fee-card{background:#0f172a;border:1px solid rgba(52,211,153,0.2);box-shadow:0 6px 24px rgba(0,0,0,0.25);color:#e2e8f0}
      .dark .fee-title, [data-theme="dark"] .fee-title{color:#34d399}
      .dark .fee-subtitle, [data-theme="dark"] .fee-subtitle{color:#94a3b8}
      .dark .fee-stat-label, [data-theme="dark"] .fee-stat-label{color:#94a3b8}
      .dark .fee-divider, [data-theme="dark"] .fee-divider{border-top:1px solid rgba(255,255,255,0.07)}
      .dark .fee-breakdown-title, [data-theme="dark"] .fee-breakdown-title{color:#94a3b8}
      .dark .fee-detail-card, [data-theme="dark"] .fee-detail-card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.07)}
      .dark .fee-detail-header, [data-theme="dark"] .fee-detail-header{color:#f8fafc}
      .dark .fee-detail-info span, [data-theme="dark"] .fee-detail-info span{color:#9ca3af}
      .dark .fee-footer, [data-theme="dark"] .fee-footer{color:#94a3b8}
    </style>
    <div class="fee-card">
      <div class="fee-header">
        <div class="fee-icon">💰</div>
        <div>
          <div class="fee-title">FEE PAYMENT SUMMARY</div>
          <div class="fee-subtitle">Your fee payment status</div>
        </div>
      </div>
      
      <div class="fee-stats">
        <div class="fee-stat">
          <div class="fee-stat-label">Total Fees</div>
          <div class="fee-stat-value">₹${totalAmount.toLocaleString()}</div>
        </div>
        <div class="fee-stat">
          <div class="fee-stat-label">Paid</div>
          <div class="fee-stat-value" style="color:#10b981">₹${paidAmount.toLocaleString()}</div>
        </div>
        <div class="fee-stat">
          <div class="fee-stat-label">Pending</div>
          <div class="fee-stat-value" style="color:${pendingAmount > 0 ? '#ef4444' : '#10b981'}">₹${pendingAmount.toLocaleString()}</div>
        </div>
      </div>
      
      <hr class="fee-divider">
      
      <div class="fee-breakdown-title">Fee breakdown details:</div>
      ${feeCards}
      
      <div class="fee-footer">Data retrieved from Google Sheets</div>

      <div class="fee-card-footer">
        <a href="/student/fees" class="fee-redirect" onclick="window.open('/student/fees', '_blank')">💰 View Fee History</a>
      </div>
    </div>
  `);

          return NextResponse.json({
            success: true,
            answer: feeHtml.replace('Data retrieved from Supabase database', 'Data retrieved from Google Sheets'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });

        } catch (error) {
          console.error('Student fees query error:', error);
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'error_fees'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'timetable':
        responseHandled = true;
        // Handle student timetable queries
        try {
          const cacheKey = `timetable_${userBranch}_${userSemester}`;
          let timetableData = cache.get(cacheKey);

          if (!timetableData || (Date.now() - timetableData.timestamp) > CACHE_DURATION) {
            timetableData = {
              data: await getTimetableFromDB(userBranch, userSemester),
              timestamp: Date.now()
            };
            cache.set(cacheKey, timetableData);
          }

          const data = timetableData.data;

          if (!data || data.length === 0) {
            return NextResponse.json({
              success: true,
              answer: getTranslatedText(language, 'no_timetable_data', { branch: userBranch, semester: userSemester }),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }

          // Prioritize today's schedule when 'today' is mentioned
          const wantsTodayOnly = userQuery.includes('today') || userQuery.includes('my schedule for today') ||
            userQuery.includes('today\'s') || userQuery.includes('todays');
          const wantsTomorrowOnly = userQuery.includes('tomorrow') || userQuery.includes('tomorrow\'s') ||
            userQuery.includes('next day') || userQuery.includes('tomorrow schedule') ||
            userQuery.includes('tomorrow\'s classes') || userQuery.includes('tomorrow timetable') ||
            userQuery.includes('tomorrow classes');
          const wantsFullWeek = userQuery.includes('week') || userQuery.includes('full') || userQuery.includes('all') ||
            userQuery.includes('complete') || userQuery.includes('entire') ||
            userQuery.includes('weekly') || userQuery.includes('entire week') ||
            userQuery.includes('full week') || userQuery.includes('complete timetable');

          if (wantsTomorrowOnly) {
            // Show tomorrow's timetable
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            const tomorrowData = data.filter(day => day.day.toLowerCase() === tomorrowStr.toLowerCase());

            if (tomorrowData.length === 0) {
              return NextResponse.json({
                success: true,
                answer: getTranslatedText(language, 'no_classes_today', { day: tomorrowStr.toUpperCase() }),
                language, theme, voiceEnabled,
                notifications: [],
                detectedIntent: intentAnalysis
              });
            }

            const tomorrowTableHTML = createTodayTimetableTable(tomorrowData[0], true);
            return NextResponse.json({
              success: true,
              answer: minifyHTML(tomorrowTableHTML),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          } else if (wantsTodayOnly) {
            // Show today's timetable
            const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            const todayData = data.filter(day => day.day.toLowerCase() === today.toLowerCase());

            if (todayData.length === 0) {
              return NextResponse.json({
                success: true,
                answer: getTranslatedText(language, 'no_classes_today', { day: today.toUpperCase() }),
                language, theme, voiceEnabled,
                notifications: [],
                detectedIntent: intentAnalysis
              });
            }

            const todayTableHTML = createTodayTimetableTable(todayData[0], false);
            return NextResponse.json({
              success: true,
              answer: minifyHTML(todayTableHTML),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          } else if (wantsFullWeek) {
            const timetableTableHTML = createTimetableTable(data);
            return NextResponse.json({
              success: true,
              answer: `<div style="margin:20px 0;"><div style="font-weight:600;font-size:16px;margin-bottom:10px;">📅 CLASS TIMETABLE</div><div style="font-size:12px;color:#666;margin-bottom:15px;">${userBranch} ${userSemester} schedule</div>${timetableTableHTML}<div style="font-size:11px;color:#666;margin-top:15px;">Data retrieved from Google Sheets. Scroll horizontally on small screens.</div></div>`,
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          } else {
            // Default: show today's timetable if no specific preference
            const today = new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            const todayData = data.filter(day => day.day.toLowerCase() === today.toLowerCase());

            if (todayData.length === 0) {
              return NextResponse.json({
                success: true,
                answer: getTranslatedText(language, 'no_classes_today', { day: today.toUpperCase() }),
                language, theme, voiceEnabled,
                notifications: [],
                detectedIntent: intentAnalysis
              });
            }

            const todayTableHTML = createTodayTimetableTable(todayData[0], false);
            return NextResponse.json({
              success: true,
              answer: minifyHTML(todayTableHTML),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }
        } catch (error) {
          console.error('Student timetable query error:', error);
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'error_timetable'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'attendance':
        responseHandled = true;
        // Handle student attendance query
        try {
          console.log('📊 Processing attendance/performance query...');

          const cacheKey = `attendance_${userId}`;
          let attendanceData = cache.get(cacheKey);

          if (!attendanceData || (Date.now() - attendanceData.timestamp) > CACHE_DURATION) {
            attendanceData = {
              data: await getAttendanceFromDB(userId),
              timestamp: Date.now()
            };
            cache.set(cacheKey, attendanceData);
          }

          const data = attendanceData.data;

          if (userQuery.includes('how am i doing') || userQuery.includes('my performance') || userQuery.includes('performance') ||
            userQuery.includes('progress report') || userQuery.includes('show performance') ||
            userQuery.includes('academic performance') || userQuery.includes('marks summary') ||
            userQuery.includes('result') || userQuery.includes('my result') ||
            userQuery.includes('grade') || userQuery.includes('grades') ||
            userQuery.includes('how did i perform') || userQuery.includes('my marks') ||
            userQuery.includes('analytics') || userQuery.includes('score') ||
            userQuery.includes('scorecard') || userQuery.includes('exam result') ||
            userQuery.includes('test result') || userQuery.includes('result analysis') ||
            userQuery.includes('how much i got') || userQuery.includes('marksheet')) {

            const analytics = await getPerformanceAnalytics(userId, userBranch, userSemester);
            if (analytics) {
              const statusEmoji = analytics.overall.status === 'excellent' ? '🎉' :
                analytics.overall.status === 'good' ? '👍' : '⚠️';
              const response = `${statusEmoji} **ATTENDANCE PERFORMANCE SUMMARY**\n\n📊 **Overall Attendance:** ${analytics.attendance.percentage}%\n• Total Classes: ${analytics.attendance.total}\n• Present: ${analytics.attendance.present}\n• Absent: ${analytics.attendance.absent}\n\n${analytics.recentStats ? `📅 **Recent Performance (Last 10 days):**\n• Attendance: ${analytics.recentStats.percentage}%\n• Present: ${analytics.recentStats.present}/${analytics.recentStats.total}\n\n` : ''}${getTranslatedText(language, `performance_${analytics.overall.status}`)}`;

              return NextResponse.json({
                success: true,
                answer: response,
                language, theme, voiceEnabled,
                notifications: [],
                analytics,
                graphData: analytics.graphData,
                quickActions: generateQuickActions('attendance'),
                detectedIntent: intentAnalysis
              });
            }
          }

          if (!data || data.length === 0) {
            return NextResponse.json({
              success: true,
              answer: getTranslatedText(language, 'no_attendance_data'),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }

          const totalClasses = data.length;
          const presentCount = data.filter(record => record.status === 'present').length;
          const absentCount = data.filter(record => record.status === 'absent').length;
          const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

          // Get last 7 days trend (1 = present, 0 = absent)
          const sortedByDate = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
          const last7Days = sortedByDate.slice(0, 7).reverse();
          const trendData = last7Days.map(record => record.status === 'present' ? 1 : 0);
          
          // Count excused vs unexcused absences
          const excusedAbsences = data.filter(record => 
            record.status === 'absent' && record.notes && record.notes.toLowerCase().includes('excused')
          ).length;
          const unexcusedAbsences = absentCount - excusedAbsences;

          // Generate sparkline bars HTML (equal width, flex-based)
          let sparkBars = '';
          trendData.forEach(value => {
            const barClass = value ? 'bar fill' : 'bar';
            sparkBars += `<div class="${barClass}"></div>`;
          });

          // Create compact attendance card with dynamic theme support using CSS classes
          const attendanceCard = `
            <style>
              /* Light theme (default) */
              .attendance-card{max-width:none;width:100%;margin:0 auto;background:#ffffff;border:1px solid rgba(16,185,129,0.15);border-radius:12px;padding:16px 20px;box-shadow:0 6px 24px rgba(14,21,40,0.08);font-family:Inter,system-ui,sans-serif;color:#0f172a;transition:all 0.3s ease}
              .attendance-header{display:flex;gap:12px;align-items:center;margin-bottom:10px}
              .attendance-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid rgba(16,185,129,0.12)}
              .attendance-title{font-size:18px;font-weight:700;color:#059669}
              .attendance-subtitle{font-size:13px;color:#64748b;margin-top:2px}
              .attendance-stats{display:flex;gap:12px;align-items:center;margin-bottom:16px;overflow-x:auto;min-width:fit-content}
              .attendance-stat{flex:1;min-width:80px}
              .attendance-stat-label{font-size:12px;color:#64748b}
              .attendance-stat-value{font-size:18px;font-weight:700}
              .attendance-divider{border:none;border-top:1px solid rgba(0,0,0,0.05);margin:12px 0}
              .attendance-sparkline{display:flex;gap:4px;margin-top:12px}
              .attendance-sparkline .bar{flex:1;height:8px;border-radius:6px;background:rgba(0,0,0,0.06);transition:background 0.3s ease}
              .attendance-sparkline .bar.fill{background:linear-gradient(90deg,#10b981,#059669)}
              .attendance-info{margin-top:14px;font-size:13px;color:#64748b}
              .attendance-footer{font-size:11px;color:#64748b;text-align:center;margin-top:12px}
              
              /* Footer button styling */
              .attendance-card-footer{margin-top:14px;text-align:center}
              .attendance-redirect{background:linear-gradient(135deg,#059669,#047857);color:white;border:none;padding:8px 16px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
              .attendance-redirect:hover{background:linear-gradient(135deg,#047857,#065f46)}
              
              /* Dark theme */
              .dark .attendance-card, [data-theme="dark"] .attendance-card{background:#0f172a;border:1px solid rgba(52,211,153,0.2);box-shadow:0 6px 24px rgba(0,0,0,0.25);color:#e2e8f0}
              .dark .attendance-title, [data-theme="dark"] .attendance-title{color:#34d399}
              .dark .attendance-subtitle, [data-theme="dark"] .attendance-subtitle{color:#94a3b8}
              .dark .attendance-stat-label, [data-theme="dark"] .attendance-stat-label{color:#94a3b8}
              .dark .attendance-divider, [data-theme="dark"] .attendance-divider{border-top:1px solid rgba(255,255,255,0.07)}
              .dark .attendance-sparkline .bar, [data-theme="dark"] .attendance-sparkline .bar{background:rgba(255,255,255,0.1)}
              .dark .attendance-sparkline .bar.fill, [data-theme="dark"] .attendance-sparkline .bar.fill{background:linear-gradient(90deg,#34d399,#10b981)}
              .dark .attendance-info, [data-theme="dark"] .attendance-info{color:#a1a1aa}
              .dark .attendance-footer, [data-theme="dark"] .attendance-footer{color:#94a3b8}
              .dark .attendance-redirect, [data-theme="dark"] .attendance-redirect{background:linear-gradient(135deg,#34d399,#10b981)}
              .dark .attendance-redirect:hover, [data-theme="dark"] .attendance-redirect:hover{background:linear-gradient(135deg,#10b981,#059669)}
            </style>
            <div class="attendance-card">
              <div class="attendance-header">
                <div class="attendance-icon">🎓</div>
                <div>
                  <div class="attendance-title">ATTENDANCE OVERVIEW</div>
                  <div class="attendance-subtitle">Your attendance status</div>
                </div>
              </div>
              
              <div class="attendance-stats">
                <div class="attendance-stat">
                  <div class="attendance-stat-label">Present</div>
                  <div class="attendance-stat-value" style="color:#10b981">${presentCount}</div>
                </div>
                <div class="attendance-stat">
                  <div class="attendance-stat-label">Absent</div>
                  <div class="attendance-stat-value" style="color:#ef4444">${absentCount}</div>
                </div>
                <div class="attendance-stat">
                  <div class="attendance-stat-label">Percentage</div>
                  <div class="attendance-stat-value">${attendancePercentage}%</div>
                </div>
              </div>
              
              <hr class="attendance-divider">
              
              <div class="attendance-sparkline">
                ${sparkBars || '<div style="font-size:12px;">No recent data</div>'}
              </div>

              <div class="attendance-info">
                Total Classes: <b>${totalClasses}</b>
              </div>
              
              <div class="attendance-footer">Data retrieved from Google Sheets</div>

              <div class="attendance-card-footer">
                <a href="/student/attendance" class="attendance-redirect" onclick="window.open('/student/attendance', '_blank')">📊 View Attendance History</a>
              </div>
            </div>
          `;

          return NextResponse.json({
            success: true,
            answer: minifyHTML(attendanceCard),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });

        } catch (error) {
          console.error('Attendance query error:', error);
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'error_attendance'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'assignments':
        responseHandled = true;
        // Handle student assignments query - show compact card with last 3 records
        try {
          console.log('📝 Processing student assignments query...');

          const cacheKey = `assignments_student_${userId}`;
          let assignmentData = cache.get(cacheKey);

          if (!assignmentData || (Date.now() - assignmentData.timestamp) > CACHE_DURATION) {
            // Fetch from Google Sheets or Supabase based on configuration
            const assignments = await getDataFromSource('assignments', {
              eq: { branch: userBranch, semester: userSemester }
            });

            // Sort by due_date ascending
            const sortedAssignments = assignments
              .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

            assignmentData = {
              data: sortedAssignments || [],
              timestamp: Date.now()
            };
            cache.set(cacheKey, assignmentData);
          }

          const assignments = assignmentData.data;

          if (!assignments || assignments.length === 0) {
            return NextResponse.json({
              success: true,
              answer: getTranslatedText(language, 'no_assignments_data'),
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }

          // Use compact card showing last 3 assignments
          const compactAssignmentsCard = createCompactAssignmentsCard(assignments);

          return NextResponse.json({
            success: true,
            answer: minifyHTML(compactAssignmentsCard),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });

        } catch (error) {
          console.error('Student assignments query error:', error);
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'error_assignments'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'events':
        responseHandled = true;
        // Handle events query
        try {
          console.log('🎉 Processing events query...');

          const cacheKey = `events`;
          let eventsData = cache.get(cacheKey);

          if (!eventsData || (Date.now() - eventsData.timestamp) > CACHE_DURATION) {
            eventsData = {
              data: await getEventsFromDB(),
              timestamp: Date.now()
            };
            cache.set(cacheKey, eventsData);
          }

          const events = eventsData.data;

          if (!events || events.length === 0) {
            return NextResponse.json({
              success: true,
              answer: "There are no upcoming events at this time.",
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }

          // Create events card HTML
          const eventsHTML = `
            <style>
              /* Light theme (default) */
              .events-card{max-width:none;width:100%;margin:0 auto;background:#ffffff;border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:16px 20px;box-shadow:0 6px 24px rgba(14,21,40,0.08);font-family:Inter,system-ui,sans-serif;color:#0f172a;transition:all 0.3s ease}
              .events-header{display:flex;gap:12px;align-items:center;margin-bottom:10px}
              .events-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid rgba(34,197,94,0.12)}
              .events-title{font-size:18px;font-weight:700;color:#16a34a}
              .events-subtitle{font-size:13px;color:#64748b;margin-top:2px}
              .events-divider{border:none;border-top:1px solid rgba(0,0,0,0.05);margin:12px 0}
              .event-item{background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.05);border-radius:8px;padding:12px;margin-bottom:8px;transition:background 0.2s}
              .event-item:hover{background:rgba(0,0,0,0.04)}
              .event-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
              .event-title{font-size:14px;font-weight:600;color:#0f172a;line-height:1.3}
              .event-date{font-size:11px;color:#64748b;background:#f8fafc;padding:2px 6px;border-radius:4px;margin-left:8px;flex-shrink:0}
              .event-details{font-size:12px;color:#64748b;margin:4px 0}
              .event-meta{font-size:11px;color:#6b7280}
              .event-registration{margin-top:8px;text-align:right}
              .registration-link{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;text-decoration:none;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:500;display:inline-block}
              .registration-link:hover{background:linear-gradient(135deg,#2563eb,#1d4ed8)}
              .events-footer{font-size:11px;color:#64748b;text-align:center;margin-top:12px}

              /* Dark theme */
              .dark .events-card, [data-theme="dark"] .events-card{background:#0f172a;border:1px solid rgba(74,222,128,0.2);box-shadow:0 6px 24px rgba(0,0,0,0.25);color:#e2e8f0}
              .dark .events-title, [data-theme="dark"] .events-title{color:#4ade80}
              .dark .events-subtitle, [data-theme="dark"] .events-subtitle{color:#94a3b8}
              .dark .events-divider, [data-theme="dark"] .events-divider{border-top:1px solid rgba(255,255,255,0.07)}
              .dark .event-item, [data-theme="dark"] .event-item{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.07)}
              .dark .event-item:hover, [data-theme="dark"] .event-item:hover{background:rgba(255,255,255,0.09)}
              .dark .event-title, [data-theme="dark"] .event-title{color:#f8fafc}
              .dark .event-date, [data-theme="dark"] .event-date{background:#374151;color:#d1d5db}
              .dark .event-details, [data-theme="dark"] .event-details{color:#9ca3af}
              .dark .event-meta, [data-theme="dark"] .event-meta{color:#94a3b8}
              .dark .events-footer, [data-theme="dark"] .events-footer{color:#94a3b8}
              .dark .registration-link, [data-theme="dark"] .registration-link{background:linear-gradient(135deg,#60a5fa,#3b82f6)}
              .dark .registration-link:hover, [data-theme="dark"] .registration-link:hover{background:linear-gradient(135deg,#3b82f6,#2563eb)}
            </style>
            <div class="events-card">
              <div class="events-header">
                <div class="events-icon">🎉</div>
                <div>
                  <div class="events-title">UPCOMING EVENTS</div>
                  <div class="events-subtitle">Campus activities and announcements</div>
                </div>
              </div>

              <hr class="events-divider">

              <div>
                ${events.map(event => {
                  // Parse date safely - use event_date directly
                  let formattedDate = 'TBD';
                  try {
                    console.log('Event date data:', { event_date: event.event_date, date: event.date, raw: event });
                    const dateStr = event.event_date || event.date;
                    if (dateStr) {
                      // Try different date formats
                      const eventDate = new Date(dateStr);
                      if (!isNaN(eventDate.getTime())) {
                        formattedDate = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        if (event.time) {
                          formattedDate += ` ${event.time}`;
                        }
                      } else {
                        // If standard parsing fails, show the raw date string
                        formattedDate = dateStr;
                      }
                    }
                  } catch (e) {
                    console.error('Date parsing error:', e, 'Raw value:', event.event_date || event.date);
                    // Fallback to showing raw date if parsing fails
                    const rawDate = event.event_date || event.date;
                    if (rawDate) {
                      formattedDate = rawDate;
                    }
                  }

                  return `
                  <div class="event-item">
                    <div class="event-header">
                      <div class="event-title">${event.title}</div>
                      <div class="event-date">${formattedDate}</div>
                    </div>
                    ${event.description ? `<div class="event-details">${event.description}</div>` : ''}
                    <div class="event-meta">
                      ${event.location ? `📍 ${event.location}` : ''}
                      ${event.organizer ? ` • 👤 ${event.organizer}` : ''}
                      ${event.category ? ` • 🏷️ ${event.category}` : ''}
                      ${event.targetAudience ? ` • 👥 ${event.targetAudience}` : ''}
                    </div>
                    ${event.registrationLink ? `<div class="event-registration"><a href="${event.registrationLink}" target="_blank" class="registration-link">Register Here</a>${event.registrationDeadline ? (() => {
                      try {
                        const deadlineDate = new Date(event.registrationDeadline);
                        if (!isNaN(deadlineDate.getTime())) {
                          return ` (Deadline: ${deadlineDate.toLocaleDateString()})`;
                        }
                        return '';
                      } catch (e) {
                        return '';
                      }
                    })() : ''}</div>` : ''}
                  </div>
                `}).join('')}
              </div>

              <div class="events-footer">Data retrieved from Google Sheets</div>
            </div>
          `;

          return NextResponse.json({
            success: true,
            answer: minifyHTML(eventsHTML),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });

        } catch (error) {
          console.error('Events query error:', error);
          return NextResponse.json({
            success: true,
            answer: "Sorry, I couldn't retrieve events information.",
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'profile':
      case 'about_me':
        responseHandled = true;
        // Handle profile/about me queries
        try {
          console.log('🚀 === PROFILE QUERY STARTED ===');
          console.log('👤 Processing profile/about me query...');
          
          console.log('🔧 CERA Configuration Check:');
          console.log('  SHEET_ID configured:', !!SHEET_ID);
          console.log('  SHEET_ID value:', SHEET_ID ? `${SHEET_ID.substring(0, 20)}...` : 'MISSING');

          console.log('👤 User Context:', {
            full_name: userContext.full_name,
            branch: userContext.branch,
            semester: userContext.semester
          });

          console.log('🔑 Auth User ID:', userId);

          console.log('📊 === GOOGLE SHEETS DEBUG ===');
          
          // First, let's fetch ALL records to see what's in the sheet
          console.log('📋 Fetching ALL user_profiles...');
          const allRecords = await getDataFromSource('user_profiles', {});
          console.log('📊 Total records in user_profiles:', allRecords?.length || 0);
          
          if (allRecords && allRecords.length > 0) {
            console.log('📋 Sample records from user_profiles:');
            allRecords.slice(0, 2).forEach((record, index) => {
              console.log(`  Record ${index + 1}:`, {
                id: record.id,
                email: record.email,
                full_name: record.full_name,
                usn: record.usn,
                branch: record.branch,
                semester: record.semester
              });
            });
            
            // Check if our userId exists in any record
            const matchingRecord = allRecords.find(record => record.id === userId);
            console.log('🎯 Found matching record for userId?', !!matchingRecord);
            if (matchingRecord) {
              console.log('✅ Matching record data:', matchingRecord);
            } else {
              console.log('❌ No record found with id =', userId);
            }
          } else {
            console.log('❌ No records found in user_profiles at all!');
          }
          
          console.log('🔍 === FILTERED QUERY ===');
          const studentRecords = await getDataFromSource('user_profiles', {
            eq: { id: userId }
          });
          
          console.log('📊 Filtered records result:', studentRecords);
          console.log('📊 Filtered records count:', studentRecords?.length || 0);
          
          let profileData = null;
          if (studentRecords && studentRecords.length > 0) {
            const studentRecord = studentRecords[0];
            profileData = {
              usn: studentRecord.usn,
              full_name: studentRecord.full_name,
              email: studentRecord.email,
              branch: studentRecord.branch,
              semester: studentRecord.semester
            };
            console.log('✅ Profile data extracted:', profileData);
          } else {
            console.log('❌ No profile data found from filtered query');
          }

          // Use Google Sheets data or fallbacks
          const fallbackProfile = {
            id: userId,
            full_name: profileData?.full_name || userContext.full_name || 'Student',
            usn: profileData?.usn || 'Not provided',
            branch: profileData?.branch || userContext.branch || 'Not specified',
            semester: profileData?.semester || userContext.semester || 'Not specified',
            email: profileData?.email || 'Not provided',
            role: 'student'
          };

          console.log('🎯 === FINAL PROFILE RESULT ===');
          console.log('📋 Data source:', profileData ? 'GOOGLE SHEETS' : 'FALLBACK');
          console.log('👤 Final profile:', {
            name: fallbackProfile.full_name,
            usn: fallbackProfile.usn,
            branch: fallbackProfile.branch,
            semester: fallbackProfile.semester,
            email: fallbackProfile.email
          });
          
          console.log('✅ === PROFILE QUERY COMPLETED ===');

            // Create profile card with fallback data
            const fallbackCssStyles = `
.profile-card{max-width:none;width:100%;margin:0 auto;background:#ffffff;border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:16px 20px;box-shadow:0 6px 24px rgba(14,21,40,0.08);font-family:Inter,system-ui,sans-serif;color:#0f172a;transition:all 0.3s ease}
.profile-header{display:flex;gap:12px;align-items:center;margin-bottom:16px}
.profile-avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:24px;color:white;font-weight:600}
.profile-info{}
.profile-name{font-size:20px;font-weight:700;color:#1e293b;margin-bottom:4px}
.profile-role{font-size:14px;color:#64748b;background:#f1f5f9;padding:4px 8px;border-radius:12px;display:inline-block;margin-bottom:8px}
.profile-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}
.detail-item{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
.detail-label{font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
.detail-value{font-size:16px;color:#1e293b;font-weight:600}
.profile-actions{margin-top:16px;text-align:center}
.resume-button{background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:0.2s ease}
.resume-button:hover{background:linear-gradient(135deg,#059669,#047857)}
.resume-button:disabled{background:#9ca3af;cursor:not-allowed}
.profile-note{font-size:12px;color:#64748b;text-align:center;margin-bottom:12px;font-style:italic}

/* Dark theme */
.dark .profile-card, [data-theme="dark"] .profile-card{background:#0f172a;border:1px solid rgba(96,165,250,0.2);box-shadow:0 6px 24px rgba(0,0,0,0.25);color:#e2e8f0}
.dark .profile-name, [data-theme="dark"] .profile-name{color:#f1f5f9}
.dark .profile-role, [data-theme="dark"] .profile-role{background:#1e293b;color:#cbd5e1}
.dark .detail-item, [data-theme="dark"] .detail-item{background:#1e293b;border:1px solid #334155}
.dark .detail-label, [data-theme="dark"] .detail-label{color:#94a3b8}
.dark .detail-value, [data-theme="dark"] .detail-value{color:#f1f5f9}
.dark .profile-note, [data-theme="dark"] .profile-note{color:#94a3b8}
`;

            const profileCardHTML =
              '<style>' + fallbackCssStyles + '</style>' +
              '<div class="profile-card">' +
                '<div class="profile-header">' +
                  '<div class="profile-avatar">' + (fallbackProfile.full_name || fallbackProfile.display_name || 'U').charAt(0).toUpperCase() + '</div>' +
                  '<div class="profile-info">' +
                    '<div class="profile-name">' + (fallbackProfile.full_name || fallbackProfile.display_name || 'Student') + '</div>' +
                    '<div class="profile-role">' + (fallbackProfile.role || 'student') + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="profile-note">Profile information from your account settings</div>' +
                '<div class="profile-details">' +
                  '<div class="detail-item">' +
                    '<div class="detail-label">USN</div>' +
                    '<div class="detail-value">' + (fallbackProfile.student_id || fallbackProfile.usn || 'Not provided') + '</div>' +
                  '</div>' +
                  '<div class="detail-item">' +
                    '<div class="detail-label">Branch</div>' +
                    '<div class="detail-value">' + (fallbackProfile.branch || fallbackProfile.department || 'Not specified') + '</div>' +
                  '</div>' +
                  '<div class="detail-item">' +
                    '<div class="detail-label">Semester</div>' +
                    '<div class="detail-value">' + (fallbackProfile.semester || fallbackProfile.year_of_study || 'Not specified') + '</div>' +
                  '</div>' +
                  '<div class="detail-item">' +
                    '<div class="detail-label">Email</div>' +
                    '<div class="detail-value">' + (fallbackProfile.email || 'Not provided') + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="profile-actions">' +
                  '<button class="resume-button" onclick="generateResume(\'' + userId + '\')">📄 Generate Resume</button>' +
                '</div>' +
              '</div>';

            const scriptContent =
              '<script>\n' +
              '(function() {\n' +
              '  window.generateResume = function(userId) {\n' +
              '    const button = event.target;\n' +
              '    const originalText = button.innerHTML;\n' +
              '    button.innerHTML = "⏳ Generating...";\n' +
              '    button.disabled = true;\n' +
              '\n' +
              '    fetch("/api/cera/resume", {\n' +
              '      method: "POST",\n' +
              '      headers: { "Content-Type": "application/json" },\n' +
              '      body: JSON.stringify({ userId: userId })\n' +
              '    })\n' +
              '    .then(response => response.json())\n' +
              '    .then(data => {\n' +
              '      if (data.success) {\n' +
              '        button.innerHTML = "✅ Downloaded!";\n' +
              '        setTimeout(() => {\n' +
              '          button.innerHTML = originalText;\n' +
              '          button.disabled = false;\n' +
              '        }, 3000);\n' +
              '      } else {\n' +
              '        throw new Error(data.error || "Resume generation failed");\n' +
              '      }\n' +
              '    })\n' +
              '    .catch(error => {\n' +
              '      console.error("Resume generation error:", error);\n' +
              '      button.innerHTML = "❌ Failed";\n' +
              '      setTimeout(() => {\n' +
              '        button.innerHTML = originalText;\n' +
              '        button.disabled = false;\n' +
              '      }, 3000);\n' +
              '    });\n' +
              '  };\n' +
              '})();\n' +
              '</script>';

          return NextResponse.json({
            success: true,
            answer: {
              type: 'profile_card',
              data: {
                id: userId,
                full_name: fallbackProfile.full_name,
                usn: fallbackProfile.usn,
                branch: fallbackProfile.branch,
                semester: fallbackProfile.semester,
                email: fallbackProfile.email,
                role: fallbackProfile.role
              }
            },
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });

        } catch (error) {
          console.error('Profile query error:', error);
          return NextResponse.json({
            success: true,
            answer: "Sorry, I couldn't retrieve your profile information.",
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'subjects':
        responseHandled = true;
        // Handle subjects query
        try {
          const cacheKey = `subjects_${userBranch}_${userSemester}`;
          let subjectData = cache.get(cacheKey);

          if (!subjectData || (Date.now() - subjectData.timestamp) > CACHE_DURATION) {
            const timetableData = await getTimetableFromDB(userBranch, userSemester);
            const subjects = new Set();

            if (timetableData && Array.isArray(timetableData)) {
              console.log('📚 Processing timetable data for subjects extraction:', timetableData.length, 'days');
              timetableData.forEach((day, dayIndex) => {
                if (day.entries && Array.isArray(day.entries)) {
                  console.log(`📅 Day ${dayIndex + 1} (${day.day}): ${day.entries.length} entries`);
                  day.entries.forEach((entry, entryIndex) => {
                    console.log(`  Entry ${entryIndex + 1}: type=${entry.type}, subject="${entry.subject}"`);
                    if (entry.subject && entry.subject.trim() && entry.type !== 'break') {
                      subjects.add(entry.subject.trim());
                      console.log(`    ✅ Added subject: "${entry.subject.trim()}"`);
                    } else {
                      console.log(`    ❌ Skipped entry: ${entry.subject ? 'has subject but wrong type' : 'no subject'} (type: ${entry.type})`);
                    }
                  });
                }
              });
              console.log('📚 Final subjects set:', Array.from(subjects));
            } else {
              console.log('📚 No timetable data found');
            }

            subjectData = {
              data: Array.from(subjects),
              timestamp: Date.now()
            };
            cache.set(cacheKey, subjectData);
          }

          const subjectList = subjectData.data;
          if (subjectList.length > 0) {
            const subjectItems = subjectList.map(subject => `<li style="margin-bottom:6px;padding:10px;background:linear-gradient(180deg,#fff,#fbfbff);border-radius:8px;border:1px solid ${themes[theme]?.border || '#e5e7eb'};text-align:center;"><strong style="font-size:16px;">${subject}</strong></li>`).join('');
            return NextResponse.json({
              success: true,
              answer: `<div style="font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:1100px;margin:0 auto;"><div class="grid" style="display:grid;grid-template-columns:repeat(12,1fr);gap:18px;align-items:start;"><section class="col-main" style="grid-column:span 12;"><article class="card" style="background:${themes[theme]?.cardBg || '#ffffff'};border-radius:12px;padding:16px;box-shadow:${themes[theme]?.shadow || '0 10px 30px rgba(18,38,63,0.06)'};border:1px solid ${themes[theme]?.border || '#e5e7eb'};overflow:hidden;"><div class="head" style="display:flex;gap:12px;align-items:center;margin-bottom:10px;"><div class="emoji" style="width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid ${themes[theme]?.accent || '#3b82f6'}20;">📖</div><div><div class="title" style="font-weight:600;font-size:15px;color:${themes[theme]?.text || '#374151'};">YOUR SUBJECTS</div><div class="sub" style="color:#6b7280;font-size:12px;">Current semester courses</div></div></div><div style="padding:16px;"><ul style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">${subjectItems}</ul><div class="small-note" style="font-size:13px;color:#6b7280;margin-top:12px;text-align:center;">Total subjects: ${subjectList.length}</div></div></article></section></div></div>`,
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          } else {
            return NextResponse.json({
              success: true,
              answer: "I couldn't find your subjects in the timetable data. Please check with your department.",
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }
        } catch (error) {
          console.error('Subject query error:', error);
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'error_subjects'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'faculty':
        responseHandled = true;
        // Handle faculty queries
        try {
          const cacheKey = `faculty_${userBranch}_${userSemester}`;
          let facultyData = cache.get(cacheKey);

          if (!facultyData || (Date.now() - facultyData.timestamp) > CACHE_DURATION) {
            const assignments = await getAssignmentsFromDB(userBranch, userSemester);
            const facultyMap = new Map();

            if (assignments && Array.isArray(assignments)) {
              assignments.forEach(assignment => {
                if (assignment.title && assignment.instructor_name) {
                  const subject = assignment.title.split(' - ')[0] || assignment.title;
                  facultyMap.set(subject, assignment.instructor_name);
                }
              });
            }

            facultyData = {
              data: Array.from(facultyMap.entries()),
              timestamp: Date.now()
            };
            cache.set(cacheKey, facultyData);
          }

          const facultyList = facultyData.data;

          if (facultyList.length > 0) {
            const facultyText = facultyList.map(([subject, faculty]) => `${subject}: ${faculty}`).join('\n');
            return NextResponse.json({
              success: true,
              answer: `<div style="font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;max-width:1100px;margin:0 auto;"><div class="grid" style="display:grid;grid-template-columns:repeat(12,1fr);gap:18px;align-items:start;"><section class="col-main" style="grid-column:span 12;"><article class="card" style="background:${themes[theme]?.cardBg || '#ffffff'};border-radius:12px;padding:16px;box-shadow:${themes[theme]?.shadow || '0 10px 30px rgba(18,38,63,0.06)'};border:1px solid ${themes[theme]?.border || '#e5e7eb'};overflow:hidden;"><div class="head" style="display:flex;gap:12px;align-items:center;margin-bottom:10px;"><div class="emoji" style="width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:18px;background:linear-gradient(90deg, rgba(255,255,255,0.6), #fff);border:1px solid ${themes[theme]?.accent || '#3b82f6'}20;">👨‍🏫</div><div><div class="title" style="font-weight:600;font-size:15px;color:${themes[theme]?.text || '#374151'};">YOUR FACULTY</div><div class="sub" style="color:#6b7280;font-size:12px;">Subject instructors</div></div></div><div style="padding:16px;"><div style="padding:20px;color:${themes[theme]?.text || '#374151'};font-size:16px;white-space:pre-line;">${facultyText.replace(/\n/g, '<br>')}</div></div></article></section></div></div>`,
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          } else {
            return NextResponse.json({
              success: true,
              answer: "I couldn't find faculty information in the current assignments. Please check with your department for faculty contact details.",
              language, theme, voiceEnabled,
              notifications: [],
              detectedIntent: intentAnalysis
            });
          }
        } catch (error) {
          console.error('Faculty query error:', error);
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'error_faculty'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'resume':
        responseHandled = true;
        // Handle resume/CV queries - Generate and download resume
        return NextResponse.json({
          success: true,
          answer: 'resume_trigger', // Special trigger for frontend resume generation
          language, theme, voiceEnabled,
          notifications: [],
          detectedIntent: intentAnalysis
        });

      case 'language_change':
        responseHandled = true;
        // Handle language change requests - parse target language from query
        let targetLanguage = language; // default to current

        // Extract target language from query
        const queryLower = userQuery.toLowerCase();
        if (queryLower.includes('hindi') || queryLower.includes('हिंदी')) {
          targetLanguage = 'hi';
        } else if (queryLower.includes('kannada') || queryLower.includes('ಕನ್ನಡ') || queryLower.includes('kn')) {
          targetLanguage = 'kn';
        } else if (queryLower.includes('telugu') || queryLower.includes('తెలుగు') || queryLower.includes('te')) {
          targetLanguage = 'te';
        } else if (queryLower.includes('tamil') || queryLower.includes('தமிழ்') || queryLower.includes('ta')) {
          targetLanguage = 'ta';
        } else if (queryLower.includes('malayalam') || queryLower.includes('മലയാളം') || queryLower.includes('ml')) {
          targetLanguage = 'ml';
        } else if (queryLower.includes('english') || queryLower.includes('en')) {
          targetLanguage = 'en';
        }

        // Use target language for translation
        const languageChangeMessage = getTranslatedText(targetLanguage, 'language_changed');
        return NextResponse.json({
          success: true,
          answer: languageChangeMessage,
          language: targetLanguage, // Return target language
          theme, voiceEnabled,
          notifications: [],
          detectedIntent: intentAnalysis
        });
        break;

      case 'theme':
        responseHandled = true;
        // Handle theme change requests - only when explicitly asking to change theme
        return NextResponse.json({
          success: true,
          answer: "I'm sorry, but I can no longer change themes. Please use the theme toggle button in the CERA interface to change my appearance.",
          language, theme, voiceEnabled,
          notifications: [],
          detectedIntent: intentAnalysis
        });

      case 'academic_info':
        responseHandled = true;
        // Handle academic info queries
        if ((userQuery.includes('branch') && userQuery.includes('semester')) ||
          userQuery.includes('what is my branch and semester') ||
          userQuery.includes('my branch and semester')) {
          const combinedResponse = `Your branch is ${userBranch} and your semester is ${userSemester}.`;
          return NextResponse.json({
            success: true,
            answer: combinedResponse,
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }

        if (userQuery.includes('branch')) {
          const branchResponse = getTranslatedText(language, 'your_branch', { branch: userBranch });
          return NextResponse.json({
            success: true,
            answer: branchResponse,
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }

        if (userQuery.includes('semester')) {
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'your_semester', { semester: userSemester }),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'upcoming':
        responseHandled = true;
        // Handle due soon queries
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Fetch from Google Sheets or Supabase based on configuration
        const allAssignments = await getDataFromSource('assignments', {
          eq: { branch: userBranch, semester: userSemester }
        });

        // Filter for assignments due within 3 days
        const upcomingItems = allAssignments
          .filter(item => new Date(item.due_date) <= threeDaysFromNow)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        if (upcomingItems?.length > 0) {
          const itemList = upcomingItems.map(item => {
            const days = Math.ceil((new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24));
            const status = days <= 0 ? 'OVERDUE' : `Due in ${days} day(s)`;
            return `• ${item.title} - ${status}`;
          }).join('\n');

          return NextResponse.json({
            success: true,
            answer: `${getTranslatedText(language, 'assignments_due_soon')}\n${itemList}`,
            language, theme, voiceEnabled,
            notifications: [],
            data: upcomingItems,
            quickActions: generateQuickActions('assignments', upcomingItems[0]),
            detectedIntent: intentAnalysis
          });
        } else {
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'no_assignments_due'),
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }

        break;

      case 'on_track':
        responseHandled = true;
        // Handle on track queries
        const analytics = await getPerformanceAnalytics(userId, userBranch, userSemester);
        if (analytics) {
          const requiredAttendance = 75;
          const isOnTrack = analytics.attendance.percentage >= requiredAttendance;

          const response = `📊 Performance Check:
• Current Attendance: ${analytics.attendance.percentage}%
• Required Attendance: ${requiredAttendance}%
• Status: ${isOnTrack ? '✅ On Track' : '⚠️ Needs Improvement'}

${isOnTrack ?
  getTranslatedText(language, 'performance_good') :
  getTranslatedText(language, 'performance_needs_improvement')}`;

          return NextResponse.json({
            success: true,
            answer: response,
            language, theme, voiceEnabled,
            notifications: [],
            analytics,
            detectedIntent: intentAnalysis
          });
        }
        break;

      case 'continue':
        responseHandled = true;
        // Handle continue requests - provide a helpful continuation prompt
        const continuePrompts = {
          'en': "I'd be happy to continue our conversation! What specific aspect would you like to explore further, or do you have another question?",
          'hi': "मैं हमारी बातचीत जारी रखने के लिए तैयार हूं! आप कौन से विशिष्ट पहलू पर और अधिक जानकारी चाहेंगे, या आपके पास कोई अन्य प्रश्न है?",
          'kn': "ನಾವು ನಮ್ಮ ಸಂಭಾಷಣೆಯನ್ನು ಮುಂದುವರಿಸಲು ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ! ನೀವು ಯಾವ ನಿರ್ದಿಷ್ಟ ಅಂಗದ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬಯಸುತ್ತೀರಿ, ಅಥವಾ ನಿಮಗೆ ಬೇರೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಇದೆಯೇ?",
          'te': "మనం మా సంభాషణను కొనసాగించడానికి నేను సిద్ధంగా ఉన్నాను! మీరు ఏ నిర్దిష్ట అంశం గురించి మరింత సమాచారం కోరుకుంటున్నారు, లేదా మీకు మరొక ప్రశ్న ఉందా?",
          'ta': "நாம் எங்கள் உரையாடலைத் தொடர்வதற்கு நான் தயாராக இருக்கிறேன்! எந்த குறிப்பிட்ட அம்சத்தைப் பற்றி மேலும் விவரங்களை விரும்புகிறீர்கள், அல்லது உங்களுக்கு வேறு ஏதேனும் கேள்வி இருக்கிறதா?",
          'ml': "നമ്മുടെ സംഭാഷണം തുടരാൻ ഞാൻ തയ്യാറാണ്! ഏത് പ്രത്യേക വശം കുറിച്ച് കൂടുതൽ വിവരങ്ങൾ നിങ്ങൾ ആഗ്രഹിക്കുന്നു, അല്ലെങ്കിൽ നിങ്ങൾക്ക് മറ്റൊരു ചോദ്യം ഉണ്ടോ?"
        };

        const continueResponse = continuePrompts[language] || continuePrompts['en'];
        return NextResponse.json({
          success: true,
          answer: continueResponse,
          language, theme, voiceEnabled,
          notifications: [],
          detectedIntent: intentAnalysis
        });
        break;

      case 'general':
        responseHandled = true;
        // Handle general conversation using Gemini AI
        try {
          console.log('🎯 Processing general conversation query...');
          
          const generalResponse = await handleGeneralConversation(userQuery, userContext, language);
          
          return NextResponse.json({
            success: true,
            answer: generalResponse,
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        } catch (error) {
          console.error('General conversation error:', error);
          return NextResponse.json({
            success: true,
            answer: "I'd love to chat, but I'm having trouble connecting right now. Try asking me about your academic information instead!",
            language, theme, voiceEnabled,
            notifications: [],
            detectedIntent: intentAnalysis
          });
        }
        break;
    }

    // If intent detection failed or no handler was triggered, fall back to legacy keyword-based routing
    if (!responseHandled) {
      try {
        console.log('⚠️ Intent detection did not handle query, falling back to legacy keyword routing');

      // Handle simple greetings first (legacy fallback)
      const greetings = ['hi', 'hello', 'hey', 'hiya', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo'];
      const userQueryLower = userQuery.toLowerCase().trim();

      if (greetings.includes(userQueryLower) || userQueryLower === 'hi' || userQueryLower === 'hello' || userQueryLower === 'hey') {
        const greeting = getTranslatedText(language, 'greeting');
        return NextResponse.json({
          success: true,
          answer: greeting,
          language, theme, voiceEnabled,
          notifications: []
        });
      }

      // Handle academic info queries (legacy)
      if ((userQuery.includes('branch') && userQuery.includes('semester')) ||
        userQuery.includes('what is my branch and semester') ||
        userQuery.includes('my branch and semester')) {
        const combinedResponse = `Your branch is ${userBranch} and your semester is ${userSemester}.`;
        return NextResponse.json({
          success: true,
          answer: combinedResponse,
          language, theme, voiceEnabled,
          notifications: []
        });
      }

      if (userQuery.includes('branch')) {
        const branchResponse = getTranslatedText(language, 'your_branch', { branch: userBranch });
        return NextResponse.json({
          success: true,
          answer: branchResponse,
          language, theme, voiceEnabled,
          notifications: []
        });
      }

      if (userQuery.includes('semester')) {
        return NextResponse.json({
          success: true,
          answer: getTranslatedText(language, 'your_semester', { semester: userSemester }),
          language, theme, voiceEnabled,
          notifications: []
        });
      }

      // Handle due soon queries (legacy)
      if (userQuery.includes('due soon') || userQuery.includes('upcoming') || userQuery.includes('deadline')) {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        // Fetch from Google Sheets or Supabase based on configuration
        const allAssignments = await getDataFromSource('assignments', {
          eq: { branch: userBranch, semester: userSemester }
        });

        // Filter for assignments due within 3 days
        const upcomingItems = allAssignments
          .filter(item => new Date(item.due_date) <= threeDaysFromNow)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        if (upcomingItems?.length > 0) {
          const itemList = upcomingItems.map(item => {
            const days = Math.ceil((new Date(item.due_date) - new Date()) / (1000 * 60 * 60 * 24));
            const status = days <= 0 ? 'OVERDUE' : `Due in ${days} day(s)`;
            return `• ${item.title} - ${status}`;
          }).join('\n');

          return NextResponse.json({
            success: true,
            answer: `${getTranslatedText(language, 'assignments_due_soon')}\n${itemList}`,
            language, theme, voiceEnabled,
            notifications: [],
            data: upcomingItems,
            quickActions: generateQuickActions('assignments', upcomingItems[0])
          });
        } else {
          return NextResponse.json({
            success: true,
            answer: getTranslatedText(language, 'no_assignments_due'),
            language, theme, voiceEnabled,
            notifications: []
          });
        }
      }

      // Handle on track queries (legacy)
      if (userQuery.includes('on track') || userQuery.includes('track')) {
        const analytics = await getPerformanceAnalytics(userId, userBranch, userSemester);
        if (analytics) {
          const requiredAttendance = 75;
          const isOnTrack = analytics.attendance.percentage >= requiredAttendance;

          const response = `📊 Performance Check:
• Current Attendance: ${analytics.attendance.percentage}%
• Required Attendance: ${requiredAttendance}%
• Status: ${isOnTrack ? '✅ On Track' : '⚠️ Needs Improvement'}

${isOnTrack ?
  getTranslatedText(language, 'performance_good') :
  getTranslatedText(language, 'performance_needs_improvement')}`;

          return NextResponse.json({
            success: true,
            answer: response,
            language, theme, voiceEnabled,
            notifications: [],
            analytics
          });
        }
      }

      // Handle theme queries (legacy)
      const themeKeywords = ['change theme', 'set theme', 'switch theme', 'make theme', 'theme to', 'theme dark', 'theme light'];
      const hasThemeChangeRequest = themeKeywords.some(keyword => userQuery.toLowerCase().includes(keyword)) ||
        (userQuery.toLowerCase().includes('theme') && (userQuery.toLowerCase().includes('dark') || userQuery.toLowerCase().includes('light')));

      if (hasThemeChangeRequest) {
        return NextResponse.json({
          success: true,
          answer: "I'm sorry, but I can no longer change themes. Please use the theme toggle button in the CERA interface to change my appearance.",
          language, theme, voiceEnabled,
          notifications: []
        });
      }

      // Handle resume queries (legacy)
      if (userQuery.includes('resume') || userQuery.includes('cv') ||
        userQuery.includes('curriculum vitae') || userQuery.includes('generate resume') ||
        userQuery.includes('create resume') || userQuery.includes('build resume') ||
        userQuery.includes('make my resume') || userQuery.includes('download resume') ||
        userQuery.includes('my resume') || userQuery.includes('resume builder') ||
        userQuery.includes('resume generator') || userQuery.includes('get resume') ||
        userQuery.includes('show resume') || userQuery.includes('resume pdf') ||
        userQuery.includes('resume file') || userQuery.includes('share my resume') ||
        userQuery.includes('save resume') || userQuery.includes('resume maker') ||
        userQuery.includes('resume creation') || userQuery.includes('update my resume')) {
        return NextResponse.json({
          success: true,
          answer: 'resume_trigger',
          language, theme, voiceEnabled,
          notifications: []
        });
      }

      // Default help response (legacy)
      const defaultAnswer = "I'm CERA, your comprehensive education assistant! I can help you with everything related to your academic life. Try asking me about:\n\n• 📚 **Your Subjects** - Ask 'what are my subjects?' or 'show subjects'\n• 💰 **Fee Information** - Ask 'fees' or 'fee status'\n• 📅 **Timetable** - Ask 'timetable', 'today's schedule', or 'weekly timetable'\n• 📊 **Attendance** - Ask 'attendance', 'how am I doing?', or 'my performance'\n• 📝 **Assignments** - Ask 'assignments', 'due assignments', or 'what should I submit'\n• 👨‍🏫 **Faculty Info** - Ask 'faculty', 'my professor', or 'who teaches'\n• 📈 **Performance Analytics** - Ask 'performance', 'marks summary', or 'exam results'\n\nI'm here to provide instant, detailed access to all your academic information! 🎓✨";

      return NextResponse.json({
        success: true,
        answer: defaultAnswer,
        language, theme, voiceEnabled,
        notifications: []
      });
    } catch (legacyError) {
      console.error('🚨 Legacy fallback error:', legacyError);
      return NextResponse.json({
        success: true,
        answer: "Sorry, I couldn't process your request. Please try again.",
        language, theme, voiceEnabled,
        notifications: []
      });
    }
  }

  } catch (error) {
    console.error('🚨 CERA API Error:', error);
    return NextResponse.json({
      success: false,
      answer: "Sorry, I encountered an error.⚠️ Something didn’t go as planned I ran into a small issue while processing your request. Don’t worry — nothing’s lost! You can try again in a few seconds. — CERA is still learning and improving for you💡",
      language: 'en',
      theme: 'light',
      voiceEnabled: false
    });
  }
}
