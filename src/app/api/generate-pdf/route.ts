import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import puppeteer from "puppeteer";

export const runtime = "nodejs"; // IMPORTANT: Disable Edge Runtime
export const maxDuration = 30; // Increase timeout for PDF generation

export async function POST(req: NextRequest) {
  try {
    console.log("🔥 FUNCTION ENTRY: PDF generation API called at", new Date().toISOString());
    console.log("🔥 REQUEST METHOD:", req.method);
    console.log("🔥 REQUEST URL:", req.url);
    console.log("🔥 NODE_ENV:", process.env.NODE_ENV);
    console.log("🔥 VERCEL:", process.env.VERCEL);
    console.log("🔥 VERCEL_ENV:", process.env.VERCEL_ENV);
    console.log("🔥 VERCEL_URL:", process.env.VERCEL_URL);

    return await generatePDF(req);
  } catch (error: any) {
    console.error("💥 TOP LEVEL ERROR:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      { error: "PDF generation failed at module level", details: error.message },
      { status: 500 }
    );
  }
}

async function generatePDF(req: NextRequest) {
  let browser = null;

  try {
    console.log("🚀 Starting PDF generation...");

    // ----------------------------
    // ✅ AUTH VALIDATION
    // ----------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Check role
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
      return NextResponse.json({ error: "Missing HTML or File Name" }, { status: 400 });
    }

    console.log("📄 Launching browser...");

    // ----------------------------
    // 🌍 PUPPETEER PDF GENERATION
    // ----------------------------
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    console.log("✅ Browser launched");

    const page = await browser.newPage();
    console.log("✅ Page created");

    await page.setContent(html, { waitUntil: "networkidle0" });
    console.log("✅ Content set");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("✅ PDF generated:", pdf.length, "bytes");

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });

  } catch (err: any) {
    console.error("❌ PDF Generation Error:", err);
    return NextResponse.json(
      { error: "PDF generation failed", details: err.message },
      { status: 500 }
    );
  } finally {
    if (browser) {
      console.log("🧹 Closing browser...");
      await browser.close().catch(() => {});
    }
  }
}
