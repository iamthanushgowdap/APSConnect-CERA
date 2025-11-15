import { NextRequest } from 'next/server';

// Simple test route that returns a hardcoded PDF
export async function POST(request: NextRequest) {
  console.log('🧪 TEST PDF API called');

  try {
    // Create a minimal PDF buffer (this is just a test)
    const testPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello World) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000373 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
459
%%EOF`;

    const buffer = Buffer.from(testPdfContent);

    console.log('📤 Returning test PDF response');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-resume.pdf"',
      },
    });

  } catch (error) {
    console.error('❌ Test PDF error:', error);
    return new Response(JSON.stringify({ error: 'Test PDF failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
