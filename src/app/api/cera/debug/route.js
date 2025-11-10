// Debug endpoint to check server configuration and errors
export async function GET() {
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET'
    },
    supabase: {
      urlConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
      keyConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
      url: (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').substring(0, 30) + '...',
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) ? 'ANON' : 'NONE'
    },
    ceraErrors: global.ceraErrorLog || [],
    serverStatus: 'RUNNING'
  };

  return Response.json({
    success: true,
    message: 'CERA Debug Information',
    data: debug
  });
}
