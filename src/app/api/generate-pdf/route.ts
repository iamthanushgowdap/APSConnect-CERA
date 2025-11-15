import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // IMPORTANT: Disable Edge Runtime

export async function POST(req: NextRequest) {
  let browser = null;

  try {
    console.log("📄 Resume PDF Generation API Called");

    // ----------------------------
    // ✅ AUTH VALIDATION
    // ----------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    await supabase.auth.setSession({
      access_token: token,
      refresh_token: "",
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ----------------------------
    // 🔎 VALIDATE ROLE = STUDENT
    // ----------------------------
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "student") {
      return NextResponse.json(
        { error: "Resume generation allowed only for students" },
        { status: 403 }
      );
    }

    // ----------------------------
    // 📥 Get HTML + File Name
    // ----------------------------
    const { html, fileName } = await req.json();

    if (!html || !fileName) {
      return NextResponse.json(
        { error: "Missing HTML or File Name" },
        { status: 400 }
      );
    }

    // ----------------------------
    // 🌍 ENVIRONMENT DETECTION
    // ----------------------------
    const isVercel = (process.env.VERCEL === '1' || !!process.env.VERCEL_ENV || !!process.env.VERCEL_URL) && process.env.NODE_ENV === 'production';
    console.log("📄 Environment detection:", { VERCEL: process.env.VERCEL, VERCEL_ENV: process.env.VERCEL_ENV, VERCEL_URL: process.env.VERCEL_URL, NODE_ENV: process.env.NODE_ENV, isVercel });
    console.log("📄 Environment:", isVercel ? "Vercel" : "Local Development");

    if (!isVercel) {
      // LOCAL DEVELOPMENT - Use regular Puppeteer
      console.log("🏠 Using local Puppeteer for development");
      const puppeteer = (await import('puppeteer')).default;

      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      console.log("✅ PDF Generated (Local):", pdf.length, "bytes");

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    } else {
      // VERCEL DEPLOYMENT - Use @sparticuz/chromium
      console.log("🚀 Launching serverless Chromium...");

      try {
        console.log("📦 Importing @sparticuz/chromium...");
        const chromium = (await import('@sparticuz/chromium')).default;
        console.log("✅ @sparticuz/chromium imported successfully");

        console.log("🔧 Getting Chromium executable path...");
        const executablePath = await chromium.executablePath();
        console.log("✅ Executable path:", executablePath);

        console.log("⚙️ Chromium args:", chromium.args);

        browser = await puppeteer.launch({
          args: chromium.args,
          executablePath: executablePath,
          headless: true,
          userDataDir: "/tmp/chromium",
        });
        console.log("✅ Browser launched successfully");

        const page = await browser.newPage();
        console.log("✅ New page created");

        console.log("📄 Setting page content...");
        await page.setContent(html, { waitUntil: "networkidle0" });
        console.log("✅ Page content set");

        // ----------------------------
        // 📄 Generate the PDF
        // ----------------------------
        console.log("📄 Generating PDF...");
        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
        });

        console.log("✅ PDF Generated (Vercel):", pdf.length, "bytes");

        return new NextResponse(Buffer.from(pdf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}"`,
          },
        });
      } catch (vercelError: any) {
        console.error("❌ Vercel-specific error:", vercelError);
        console.error("Error name:", vercelError.name);
        console.error("Error message:", vercelError.message);
        console.error("Error stack:", vercelError.stack);

        // Try fallback to local puppeteer
        console.log("🔄 Trying fallback to local Puppeteer...");
        try {
          const puppeteer = (await import('puppeteer')).default;

          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });

          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: "networkidle0" });

          const pdf = await page.pdf({
            format: "A4",
            printBackground: true,
          });

          console.log("✅ PDF Generated (Fallback):", pdf.length, "bytes");

          return new NextResponse(Buffer.from(pdf), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${fileName}"`,
            },
          });
        } catch (fallbackError: any) {
          console.error("❌ Fallback also failed:", fallbackError);
          throw vercelError; // Throw original error
        }
      }
    }

  } catch (err: any) {
    console.error("❌ PDF Generation Error:", err);
    return NextResponse.json(
      { error: "PDF generation failed", details: err.message },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
