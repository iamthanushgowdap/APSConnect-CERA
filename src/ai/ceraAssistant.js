/**
 * CERA AI Assistant Core Module (ceraAssistant.js)
 * * This module provides the logic for the Centralized Education Response Assistant (CERA).
 * It uses the Google Gemini API to translate natural language queries into secure SQL,
 * executes the SQL against a database (via a placeholder you must replace), and formats the final response.
 * * IMPORTANT: You MUST replace the 'executeSqlQuery' function with your actual
 * PostgreSQL/Supabase database client integration.
 */

// --- 1. Configuration & Constants ---

// The Gemini API key will be provided by the runtime environment.
// Leave this empty string as required by the execution environment.
const API_KEY = "";
const MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// Define the database schema relevant to the AI assistant.
// This guides the LLM to generate correct SQL using the right table and column names.
const DB_SCHEMA_CONTEXT = `
-- Core Tables for CERA:
-- 1. user_profiles: All users (student, faculty, admin) with branch/semester details.
CREATE TABLE public.user_profiles (
  id text PRIMARY KEY,
  full_name text,
  role text CHECK (role = ANY ('{student, faculty, admin}')),
  branch text,
  semester text,
  usn text UNIQUE
);

-- 2. assignments: Assignments for a specific branch/semester.
CREATE TABLE public.assignments (
  id text PRIMARY KEY,
  title text NOT NULL,
  due_date timestamp with time zone NOT NULL,
  branch text,
  semester text,
  instructor_id text REFERENCES public.user_profiles(id)
);

-- 3. attendance_records: Student attendance.
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY,
  student_uid text NOT NULL REFERENCES public.user_profiles(id),
  subject text NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status = ANY ('{present, absent}')),
  branch text NOT NULL,
  semester text NOT NULL
);

-- 4. fee_records: Fee status for students.
CREATE TABLE public.fee_records (
  id text PRIMARY KEY,
  student_id text REFERENCES public.user_profiles(id),
  semester text NOT NULL,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  payment_status text DEFAULT 'pending' CHECK (payment_status = ANY ('{pending, partial, paid, overdue}'))
);

-- 5. timetables: Timetables for a specific branch/semester.
CREATE TABLE public.timetables (
  id text PRIMARY KEY,
  branch text NOT NULL,
  semester text NOT NULL,
  schedule jsonb NOT NULL
);
`;

// --- 2. Database Stub (MUST BE REPLACED) ---

/**
 * Safe query execution using Supabase table access methods.
 * This avoids arbitrary SQL execution while maintaining security.
 * @param {string} queryType - Type of query (fees, assignments, attendance, timetable)
 * @param {object} userContext - User context for filtering
 * @param {string} userRole - User role for access control
 * @returns {Promise<any>} - Query results
 */
async function executeSqlQuery(queryType, userContext, userRole) {
    console.log("--- 💾 EXECUTING SAFE QUERY ---");
    console.log(`Type: ${queryType}, Role: ${userRole}, Context:`, userContext);
    console.log("--------------------------------------");

    // Import Supabase client dynamically
    let supabase;
    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase environment variables not configured');
        }

        supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        throw new Error('Database connection failed');
    }

    try {
        let result = { data: [], error: null };

        switch (queryType) {
            case 'fee_records':
                if (userRole === 'student') {
                    result = await supabase
                        .from('fee_records')
                        .select('*')
                        .eq('student_id', userContext.user_id);
                } else if (userRole === 'admin') {
                    result = await supabase
                        .from('fee_records')
                        .select('*');
                }
                break;

            case 'assignments':
                if (userRole === 'student' || userRole === 'faculty') {
                    result = await supabase
                        .from('assignments')
                        .select('*')
                        .eq('branch', userContext.branch)
                        .eq('semester', userContext.semester);
                } else if (userRole === 'admin') {
                    result = await supabase
                        .from('assignments')
                        .select('*');
                }
                break;

            case 'attendance_records':
                if (userRole === 'student') {
                    result = await supabase
                        .from('attendance_records')
                        .select('*')
                        .eq('student_uid', userContext.user_id);
                } else if (userRole === 'faculty') {
                    result = await supabase
                        .from('attendance_records')
                        .select('*')
                        .eq('branch', userContext.branch)
                        .eq('semester', userContext.semester);
                } else if (userRole === 'admin') {
                    result = await supabase
                        .from('attendance_records')
                        .select('*');
                }
                break;

            case 'timetables':
                if (userRole === 'student' || userRole === 'faculty') {
                    result = await supabase
                        .from('timetables')
                        .select('*')
                        .eq('branch', userContext.branch)
                        .eq('semester', userContext.semester);
                } else if (userRole === 'admin') {
                    result = await supabase
                        .from('timetables')
                        .select('*');
                }
                break;

            default:
                throw new Error(`Unsupported query type: ${queryType}`);
        }

        if (result.error) {
            throw result.error;
        }

        return result.data || [];

    } catch (error) {
        console.error('Database execution error:', error);
        throw new Error(`Database query failed: ${error.message}`);
    }
}

// --- 3. CERA Assistant Class ---

class CERA {
    constructor() {
        this.systemPrompt = this._buildSystemPrompt();
        this.sqlTool = {
            functionDeclarations: [{
                name: "execute_sql_query",
                description: "Executes a secure SELECT SQL query against the PostgreSQL database to retrieve data.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        sql_query: {
                            type: "STRING",
                            description: "The PostgreSQL SELECT query to execute. DO NOT include security filters (WHERE clauses), as the security layer handles that."
                        }
                    },
                    required: ["sql_query"],
                },
            }]
        };
    }

    /**
     * Constructs the detailed system prompt for the LLM.
     * @returns {string}
     */
    _buildSystemPrompt() {
        return `
        You are CERA (Centralized Education Response Assistant AI), an expert SQL generator and data analyst for a college management system.
        Your primary role is to convert natural language queries into secure, efficient PostgreSQL SELECT statements.

        --- Database Schema ---
        ${DB_SCHEMA_CONTEXT}

        --- Instructions ---
        - ONLY use the 'execute_sql_query' tool when a query requires database access (e.g., 'What are my fees?', 'When is the next assignment due?').
        - If the user asks a general question (e.g., definitions, system info), answer without using the tool.
        - The user will provide their role and security context with the query.
        - **STRICTLY DO NOT** include any 'WHERE' clauses related to security (branch, semester, user_id) in your generated SQL. The backend code will inject these for security purposes.
        - If the query is about a student's personal records (fees, attendance), generate the query that *would* use student_id (or student_uid) if the security layer allowed it, but omit the WHERE clause.

        Example SQL (for 'What are my assignments?'):
        SELECT title, due_date FROM assignments; -- The security layer will add the WHERE clause.
        `;
    }

    /**
     * Fetches results from the Gemini API using the standard fetch mechanism.
     * @param {Array<Object>} contents - The contents array for the API request.
     * @param {Array<Object>} tools - The tools to enable (e.g., SQL execution).
     * @returns {Promise<Object>} The API response JSON.
     */
    async _callGemini(contents, tools) {
        let attempts = 0;
        const maxAttempts = 5;
        let delay = 1000; // Start with 1 second delay

        while (attempts < maxAttempts) {
            try {
                const payload = {
                    contents: contents,
                    config: {
                        systemInstruction: { parts: [{ text: this.systemPrompt }] },
                        tools: tools,
                    },
                };

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    // Treat non-OK status codes (like 429) for retries
                    if (response.status === 429 && attempts < maxAttempts - 1) {
                        throw new Error("Rate limit exceeded, attempting retry.");
                    }
                    // For other errors (4xx, 5xx), throw to exit loop
                    const errorBody = await response.json();
                    throw new Error(`API Error ${response.status}: ${JSON.stringify(errorBody)}`);
                }

                return await response.json();

            } catch (error) {
                if (attempts < maxAttempts - 1) {
                    // Exponential backoff
                    console.warn(`Attempt ${attempts + 1} failed. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                } else {
                    console.error("Gemini API call failed after multiple retries.", error);
                    throw new Error(`Failed to communicate with Gemini API: ${error.message}`);
                }
                attempts++;
            }
        }
    }

    /**
     * Main function to process the user query and generate a secure response.
     * @param {string} userQuery - The user's question.
     * @param {string} userRole - The role (student, faculty, admin).
     * @param {object} userContext - Context (user_id, branch, semester, etc.).
     * @returns {Promise<string>} The final, formatted AI response.
     */
    async processQuery(userQuery, userRole, userContext) {
        if (!userRole || !userContext.user_id) {
            return "Error: User role and ID are required for secure access.";
        }

        const prompt = `User Role: ${userRole}\nUser Context: ${JSON.stringify(userContext)}\n\nQuery: ${userQuery}`;

        // 1. First LLM Call: Determine if this is a database query and what type
        let response;
        try {
            response = await this._callGemini([{ parts: [{ text: prompt }] }], [this.sqlTool]);
        } catch (e) {
            return `Sorry, CERA encountered an error generating the query: ${e.message}`;
        }

        const candidate = response.candidates?.[0];

        // Check if the LLM decided to use the SQL tool
        if (candidate?.functionCalls?.[0]?.name === "execute_sql_query") {
            const sqlQuery = candidate.functionCalls[0].args.sql_query;

            // Determine query type from the SQL (simplified approach)
            let queryType = null;
            if (sqlQuery.includes('fee_records')) queryType = 'fee_records';
            else if (sqlQuery.includes('assignments')) queryType = 'assignments';
            else if (sqlQuery.includes('attendance_records')) queryType = 'attendance_records';
            else if (sqlQuery.includes('timetables')) queryType = 'timetables';

            if (!queryType) {
                return "Sorry, CERA can only answer questions about fees, assignments, attendance, and timetables at this time.";
            }

            // Execute the safe query with role-based access control
            let dbResult;
            try {
                dbResult = await executeSqlQuery(queryType, userContext, userRole.toLowerCase());
            } catch (e) {
                console.error("Database execution failed:", e);
                return `Sorry, CERA could not access the required database records. Error: ${e.message}`;
            }

            // 2. Second LLM Call: Format the database result into a human-readable answer
            const followUpContents = [
                { parts: [{ text: prompt }] },
                {
                    role: "function",
                    parts: [{
                        functionResponse: {
                            name: "execute_sql_query",
                            response: dbResult
                        }
                    }]
                }
            ];

            try {
                const finalResponse = await this._callGemini(followUpContents, []);
                return finalResponse.candidates?.[0]?.content?.parts?.[0]?.text || "CERA received data but could not format a response.";
            } catch (e) {
                return "CERA received database results but failed to generate the final response text.";
            }

        }

        // If no tool call, return the direct LLM response (e.g., for general knowledge)
        return candidate?.content?.parts?.[0]?.text || "CERA is unable to process this request right now.";
    }
}

// Export the class for use in your Express routes
module.exports = CERA;

// --- Example Usage Block (for testing in Node.js) ---

// (async () => {
//     if (require.main === module) {
//         console.log("--- CERA Test Harness ---");
//         const cera = new CERA();

//         // Example Student Context
//         const studentContext = {
//             user_id: "S_UID_12345",
//             branch: "CS",
//             semester: "S5",
//             full_name: "John Doe"
//         };

//         // 1. Student Query (Personal Data - Fees)
//         const q1 = "What is the current status of my fees?";
//         console.log(`\n\n--- Testing Student Query (Fees): ${q1} ---`);
//         const r1 = await cera.processQuery(q1, "student", studentContext);
//         console.log(`\nCERA Response (Student): \n${r1}`);
//         // Expected: SQL should be filtered by student_id

//         // 2. Faculty Query (Scoped Data - Assignments)
//         const facultyContext = {
//             user_id: "F_UID_67890",
//             branch: "EC",
//             semester: "S7",
//             full_name: "Dr. Smith"
//         };
//         const q2 = "When is the due date for the next assignment for EC S7?";
//         console.log(`\n\n--- Testing Faculty Query (Assignments): ${q2} ---`);
//         const r2 = await cera.processQuery(q2, "faculty", facultyContext);
//         console.log(`\nCERA Response (Faculty): \n${r2}`);
//         // Expected: SQL should be filtered by branch='EC' AND semester='S7'

//         // 3. Admin Query (Unscoped Data)
//         const adminContext = {
//             user_id: "A_UID_001",
//             branch: "ALL",
//             semester: "ALL",
//             full_name: "Super Admin"
//         };
//         const q3 = "How many total students have overdue fees?";
//         console.log(`\n\n--- Testing Admin Query: ${q3} ---`);
//         const r3 = await cera.processQuery(q3, "admin", adminContext);
//         console.log(`\nCERA Response (Admin): \n${r3}`);
//         // Expected: SQL should NOT be filtered by branch/semester.
//     }
// })();
