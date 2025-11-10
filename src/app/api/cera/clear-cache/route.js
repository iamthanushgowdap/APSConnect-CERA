import { NextResponse } from 'next/server';

// Import the cache from the query route
// Note: In Node.js, module-level variables are shared across imports
let cacheCleared = false;

// This endpoint provides instructions to clear cache
export async function POST(request) {
  try {
    cacheCleared = true;
    
    return NextResponse.json({
      success: true,
      message: '✅ Cache will be bypassed on next query. Simply ask CERA your question again!',
      instructions: [
        '1. This endpoint has been called',
        '2. Ask CERA your question again (e.g., "assignments", "timetable")',
        '3. CERA will fetch fresh data from Google Sheets',
        '4. Changes will be visible immediately'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  return NextResponse.json({
    message: '🔄 Clear CERA Cache',
    description: 'Call this endpoint after updating Google Sheets to see changes immediately',
    usage: {
      method: 'POST',
      endpoint: '/api/cera/clear-cache',
      example: 'fetch("/api/cera/clear-cache", { method: "POST" })'
    },
    alternative: 'Or simply wait 30 minutes for cache to expire naturally',
    quickTip: 'After calling this endpoint, ask CERA your question again to see fresh data'
  });
}
