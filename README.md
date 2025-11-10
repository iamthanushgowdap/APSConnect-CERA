# 🎓 APS Connect - Student Information Portal

> **Complete Project Documentation**: See [PROJECT_COMPLETE_GUIDE.md](./PROJECT_COMPLETE_GUIDE.md)  
> **Latest Update**: Database schema updated with actual Supabase export (23 tables) ✅

## 📖 Quick Start

```bash
# Install dependencies
npm install

# Create .env.local file (see PROJECT_COMPLETE_GUIDE.md for details)
cp .env.example .env.local

# Run development server
npm run dev
```

Open http://localhost:3000

## 📚 Documentation

- **[📘 Complete Project Guide](./PROJECT_COMPLETE_GUIDE.md)** - Full setup, architecture, and usage (⭐ Schema Updated!)
- **[🏗️ System Architecture](./SYSTEM_ARCHITECTURE.md)** - Technical architecture details
- **[🗄️ Database Schema](./DATABASE_SCHEMA.md)** - Database tables and relationships
- **[🧹 Cleanup Guide](./CLEANUP_GUIDE.md)** - Remove unnecessary files
- **[📝 Changelog](./CHANGELOG.md)** - Documentation version history

## 🚀 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase
- **Database**: PostgreSQL (Supabase)
- **AI**: Google Gemini 2.5 Flash
- **Auth**: Supabase Auth

## 👥 User Roles

- **Students** - View assignments, attendance, fees, timetable
- **Faculty** - Mark attendance, create assignments, upload materials
- **Admin** - User management, system configuration
- **Alumni** - Alumni portal, job postings

## 🤖 CERA AI Assistant

AI-powered chatbot that answers queries about:
- Assignments and due dates
- Fee payment status
- Attendance records
- Class timetables
- Subject information

## 📄 License

Proprietary - APS (Academy of Professional Studies)
