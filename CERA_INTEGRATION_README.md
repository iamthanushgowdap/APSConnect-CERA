# CERA AI Assistant Integration

## Overview
CERA (Centralized Education Response Assistant) is an AI-powered assistant that allows students, faculty, and administrators to query educational data using natural language.

## Features
- **Natural Language Queries**: Ask questions in plain English
- **Role-Based Security**: Automatic filtering based on user permissions
- **Multi-Table Support**: Queries across fees, assignments, attendance, and timetables
- **Secure Database Access**: Uses predefined queries instead of arbitrary SQL execution

## Database Tables
CERA works with these tables:
- `user_profiles` - User information and roles
- `assignments` - Course assignments and due dates
- `attendance_records` - Student attendance data
- `fee_records` - Fee payment information
- `timetables` - Class schedules

## Setup Instructions

### 1. Database Setup
Run the CERA database schema:
```bash
# Execute in Supabase SQL Editor
cera_database_schema.sql
```

### 2. Environment Variables
Add to your `.env.local`:
```env
# Google Gemini API Key (required)
GEMINI_API_KEY=your_api_key_here

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install Dependencies
The required dependencies should already be installed in your project.

### 4. Test the Integration
```bash
# Run the test script
node test_cera.js
```

## Usage Examples

### Student Queries
- "What is the status of my fees?"
- "When is my next assignment due?"
- "What is my attendance record?"
- "What are my classes today?"

### Faculty Queries
- "When are assignments due for CSE S5?"
- "What is the attendance for my classes?"
- "What assignments have I created?"

### Admin Queries
- "How many students have overdue fees?"
- "What is the total outstanding fees?"
- "How many assignments are due this week?"

## API Endpoint

### POST `/api/cera/query`
```json
{
  "userQuery": "What is the status of my fees?"
}
```

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "answer": "Your current fee status shows total fees of ₹50,000 with ₹30,000 paid...",
  "user": {
    "id": "user_id",
    "role": "student",
    "name": "John Doe"
  }
}
```

## Security Features

1. **JWT Authentication**: All requests require valid JWT tokens
2. **Role-Based Access**: Queries are filtered based on user role
3. **Predefined Queries**: Only allows specific, safe database operations
4. **Row Level Security**: Leverages Supabase RLS policies

## Architecture

```
User Query → API Route → CERA Class → Gemini API → SQL Generation → Safe Query Execution → Response Formatting
```

## File Structure
```
src/
├── ai/
│   └── ceraAssistant.js      # Core CERA logic
├── app/
│   ├── api/cera/query/
│   │   └── route.js          # API endpoint
│   └── cera/
│       └── page.tsx          # CERA chat interface
└── components/
    └── CERAChat.tsx          # React chat component

cera_database_schema.sql       # Database setup
test_cera.js                  # Integration tests
```

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Ensure `GEMINI_API_KEY` is set in environment variables

2. **"Database connection failed"**
   - Check Supabase environment variables
   - Verify database schema is applied

3. **"Unauthorized access"**
   - Ensure user is logged in with valid JWT
   - Check user role permissions

4. **"Unsupported query type"**
   - CERA currently supports: fees, assignments, attendance, timetables
   - Rephrase query to match supported topics

### Debug Mode
Set environment variable for detailed logging:
```env
DEBUG_CERA=true
```

## Future Enhancements

- Support for additional query types (grades, announcements, etc.)
- Multi-language support
- Voice input/output
- Integration with calendar systems
- Advanced analytics and reporting

## Support

For issues or questions about CERA integration:
1. Check the test script output
2. Verify database schema is applied
3. Ensure environment variables are set
4. Review API response errors

CERA is designed to be secure, scalable, and user-friendly. It leverages modern AI capabilities while maintaining strict security boundaries for educational data access.
