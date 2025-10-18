// Test page to check environment variable loading
export default function EnvTestPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
          {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
            <span className="text-green-600">✅ SET</span>
          ) : (
            <span className="text-red-600">❌ NOT SET</span>
          )}
        </div>
        <div>
          <strong>SUPABASE_SERVICE_ROLE_KEY:</strong>{' '}
          {process.env.SUPABASE_SERVICE_ROLE_KEY ? (
            <span className="text-green-600">✅ SET</span>
          ) : (
            <span className="text-red-600">❌ NOT SET</span>
          )}
        </div>
        <div>
          <strong>NEXT_PUBLIC_GEMINI_API_KEY:</strong>{' '}
          {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
            <span className="text-green-600">✅ SET</span>
          ) : (
            <span className="text-red-600">❌ NOT SET</span>
          )}
        </div>
      </div>
    </div>
  );
}
