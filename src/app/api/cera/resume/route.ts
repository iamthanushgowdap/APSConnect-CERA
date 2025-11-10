import { NextRequest, NextResponse } from 'next/server';
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch your profile data. Please complete your profile first.'
      });
    }

    // Generate resume HTML
    const resumeHTML = generateResumeHTML(profileData);

    // Generate PDF
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: resumeHTML,
        fileName: `${profileData.full_name || profileData.display_name || 'Resume'}_CV.pdf`
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF');
    }

    const pdfBlob = await response.blob();

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${profileData.full_name || profileData.display_name || 'Resume'}_CV.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Resume generation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An error occurred while generating your resume.'
    });
  }
}

function generateResumeHTML(profile: any) {
  const formatDescription = (text: string) => {
    if (!text) return '';
    const items = text.split(/[\n\r]|•/).map(item => item.trim()).filter(item => item.length > 0);
    if (items.length === 0) return '';
    return `<ul style="padding-left: 20px; margin-top: 4px;">${items.map(item => `<li style="margin-bottom: 2px; font-size: 10pt;">${item}</li>`).join('')}</ul>`;
  };

  const isStudent = profile.role === 'student';
  const isAlumni = profile.role === 'alumni';

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale="1.0">
    <title>${profile.full_name || profile.display_name || 'Resume'} - CV</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Arial:wght@400;600&display=swap" rel="stylesheet">
    <style>
      body {
        max-width: 880px;
        margin: 0 auto;
        padding: 32px 80px;
        position: relative;
        box-sizing: border-box;
        font-family: 'Times New Roman', serif;
        font-size: 11pt;
        line-height: 1.4;
        color: #000;
        background: white;
      }

      .header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid #2c3e50;
        padding-bottom: 16px;
      }

      .header h1 {
        font-family: Arial, sans-serif;
        font-size: 20pt;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .contact-info {
        font-size: 10pt;
        margin: 8px 0;
        text-align: center;
      }

      .contact-info a {
        color: #2c3e50;
        text-decoration: none;
      }

      .section {
        margin-bottom: 20px;
      }

      .section h2 {
        font-family: Arial, sans-serif;
        font-size: 13pt;
        font-weight: 600;
        color: #2c3e50;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 16px 0 8px 0;
        border-bottom: 1px solid #34495e;
        padding-bottom: 2px;
      }

      .experience-item, .education-item {
        margin-bottom: 12px;
      }

      .position-title, .degree, .project-title {
        font-weight: 900;
        font-size: 11pt;
        margin-bottom: 2px;
        color: #000000;
      }

      .organization, .institution {
        font-style: italic;
        color: #34495e;
        margin-bottom: 4px;
        font-weight: 600;
      }

      .date {
        font-size: 10pt;
        color: #666;
        float: right;
        font-weight: normal;
      }

      .details {
        margin-left: 16px;
        margin-top: 4px;
      }

      .details ul {
        list-style: disc;
        padding-left: 20px;
        margin-top: 4px;
        font-size: 10pt;
      }

      .details li {
        margin-bottom: 2px;
      }

      li {
        margin-bottom: 1px;
      }

      .clearfix::after {
        content: '';
        display: table;
        clear: both;
      }

      .gpa {
        font-weight: 900;
        color: #000000;
      }

      @media print {
        body {
          margin: 0;
          padding: 20px;
          background: white !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }

        html, body {
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        body {
          padding: 20mm;
          box-sizing: border-box;
        }

        .header {
          margin-bottom: 20px;
          page-break-after: avoid;
        }

        .section {
          page-break-inside: avoid;
        }

        h2 {
          page-break-after: avoid;
        }

        .experience-item, .education-item {
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>${profile.full_name || profile.display_name || 'Name Not Provided'}</h1>
      <div class="contact-info">
        ${profile.email || ''} | ${profile.phone || ''} | ${profile.address || ''}<br>
        ${profile.linkedin_url ? `<a href="${profile.linkedin_url}">LinkedIn</a> | ` : ''}${profile.github_url ? `<a href="${profile.github_url}">GitHub</a> | ` : ''}${profile.portfolio_url ? `<a href="${profile.portfolio_url}">Portfolio</a>` : ''}
      </div>
    </div>

    ${(profile.bio || profile.summary) ? `
    <div class="section">
      <h2>Professional Summary</h2>
      <p style="font-size: 10pt; margin-top: 4px;">${profile.bio || profile.summary}</p>
    </div>
    ` : ''}

    ${profile.education && profile.education.length > 0 ? `
    <div class="section">
      <h2>Education</h2>
      ${profile.education.map((edu: any) => `
        <div class="clearfix" style="margin-bottom: 12px;">
          <span class="degree">${edu.degree || 'Degree Not Specified'}</span>
          <span class="date">${edu.graduationYear || 'Year Not Specified'}</span>
        </div>
        <div class="institution">${edu.institution || 'Institution Not Specified'}</div>
        <div><span class="gpa">CGPA: ${edu.score || 'N/A'}</span></div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.experience && profile.experience.length > 0 ? `
    <div class="section">
      <h2>Experience</h2>
      ${profile.experience.map((exp: any) => `
        <div style="margin-bottom: 12px;">
          <div class="clearfix">
            <span class="position-title">${exp.title || 'Position Not Specified'}</span>
            <span class="date">${exp.duration || 'Duration Not Specified'}</span>
          </div>
          <div class="organization">${exp.company || 'Company Not Specified'}</div>
          ${exp.description ? `<div style="margin-left: 16px; margin-top: 4px;">${formatDescription(exp.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.projects && profile.projects.length > 0 ? `
    <div class="section">
      <h2>Projects</h2>
      ${profile.projects.map((proj: any) => `
        <div style="margin-bottom: 12px;">
          <div class="clearfix">
            <span class="project-title">${proj.title || 'Project Title'}</span>
          </div>
          ${proj.description ? `<div style="margin-left: 16px; margin-top: 4px;">${formatDescription(proj.description)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.skills && profile.skills.length > 0 ? `
    <div class="section">
      <h2>Technical Skills</h2>
      <p style="font-size: 10pt; margin-top: 4px;"><strong>Skills:</strong> ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}</p>
    </div>
    ` : ''}

    ${profile.certifications && profile.certifications.length > 0 ? `
    <div class="section">
      <h2>Certifications</h2>
      <ul style="font-size: 10pt; padding-left: 20px;">
        ${profile.certifications.map((cert: any) => `
          <li style="margin-bottom: 2px;">
            <strong>${cert.name || 'Certification Name'}</strong>${cert.issuingBody ? `, ${cert.issuingBody}` : ''}${cert.year ? ` (${cert.year})` : ''}
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${profile.achievements && profile.achievements.length > 0 ? `
    <div class="section">
      <h2>Achievements & Honors</h2>
      <ul style="font-size: 10pt; padding-left: 20px;">
        ${profile.achievements.map((achievement: any) => `
          <li style="margin-bottom: 2px;">${achievement.description || achievement}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${isAlumni ? `
    <div class="section">
      <h2>Professional Information</h2>
      ${profile.placement_company ? `<p style="font-size: 10pt;"><strong>Company:</strong> ${profile.placement_company}</p>` : ''}
      ${profile.placement_job_title ? `<p style="font-size: 10pt;"><strong>Position:</strong> ${profile.placement_job_title}</p>` : ''}
      ${profile.referral_info ? `<p style="font-size: 10pt;"><strong>Referral Info:</strong> ${profile.referral_info}</p>` : ''}
    </div>
    ` : ''}

  </body>
</html>`;
}
