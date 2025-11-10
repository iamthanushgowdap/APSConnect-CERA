// Simple test route to check if API is working
export async function GET() {
  return Response.json({
    success: true,
    message: "CERA API is working!",
    timestamp: new Date().toISOString()
  });
}
