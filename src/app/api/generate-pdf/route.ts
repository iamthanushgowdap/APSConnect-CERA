import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  let browser;

  try {
    console.log('📄 PDF Generation API called');

    // Check authentication using Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase configuration missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Set the session with the token
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for verification
    });

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ Authentication failed:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check user role - only students can generate resumes
    const userId = user.id;
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ Failed to get user profile:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      );
    }

    if (userProfile.role !== 'student') {
      console.error('❌ Access denied - only students can generate resumes. User role:', userProfile.role);
      return NextResponse.json(
        { error: 'Resume generation is only available for students' },
        { status: 403 }
      );
    }

    console.log('✅ User authenticated and authorized for resume generation');

    const { html, fileName } = await request.json();
    console.log('📄 Request data:', { htmlLength: html?.length, fileName });

    if (!html || !fileName) {
      console.error('❌ Missing required fields:', { html: !!html, fileName: !!fileName });
      return NextResponse.json(
        { error: 'HTML content and filename are required' },
        { status: 400 }
      );
    }

    console.log('🚀 Finding Chrome executable...');
    // Find Chrome executable - multiple fallback methods
    let executablePath;

    // Method 1: Check common installation paths
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
      'C:\\Program Files\\Chromium\\Application\\chrome.exe'
    ];

    for (const path of possiblePaths) {
      try {
        fs.accessSync(path);
        executablePath = path;
        console.log('✅ Found Chrome at:', executablePath);
        break;
      } catch {
        // Path doesn't exist, try next one
      }
    }

    // Method 2: Try system PATH
    if (!executablePath) {
      try {
        const result = execSync('where chrome 2>nul || where chromium 2>nul', { encoding: 'utf8' });
        executablePath = result.trim().split('\n')[0];
        console.log('✅ Found Chrome in PATH at:', executablePath);
      } catch {
        // Not found in PATH either
      }
    }

    if (!executablePath) {
      console.error('❌ Chrome not found in any location');
      return NextResponse.json(
        { error: 'Chrome browser not found. Please install Google Chrome from https://www.google.com/chrome/' },
        { status: 500 }
      );
    }

    console.log('🚀 Launching Puppeteer browser...');
    // Try to launch browser with detected executable, fallback to default
    try {
      browser = await puppeteer.launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows'
        ]
      });
      console.log('✅ Browser launched successfully with executable path');
    } catch (launchError) {
      console.warn('⚠️ Failed to launch with executable path, trying default browser...', launchError);
      try {
        // Fallback: try launching without executablePath (uses system default browser)
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        });
        console.log('✅ Browser launched successfully with system default');
      } catch (fallbackError) {
        console.error('❌ Failed to launch browser with any method:', fallbackError);
        return NextResponse.json(
          { error: 'Could not launch browser for PDF generation. Please ensure Chrome or Chromium is installed.' },
          { status: 500 }
        );
      }
    }

    console.log('📄 Creating new page...');
    const page = await browser.newPage();

    // Set viewport for better rendering
    await page.setViewport({ width: 794, height: 1123 }); // A4 dimensions

    console.log('📄 Setting HTML content...');
    // Set HTML content
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait a bit for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📄 Generating PDF...');
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
      preferCSSPageSize: true
    });

    console.log('📄 Closing browser...');

    console.log('✅ PDF generated successfully, size:', pdfBuffer.length);

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('📄 Browser closed successfully');
      } catch (closeError) {
        console.error('❌ Error closing browser:', closeError);
      }
    }
  }
}
