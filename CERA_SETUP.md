# 🚨 FIXING CLIENT-SIDE EXCEPTION ERROR

**If you're getting "Application error: a client-side exception has occurred", you need to add these environment variables:**

## ⚡ Quick Fix - Add to .env.local:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key
```

## 🔑 Get Your Keys:

**Gemini API Key:**
- Visit: https://aistudio.google.com/app/apikey
- Create API key → Copy it

**Supabase Service Role Key:**
- Supabase Dashboard → Settings → API
- Copy the "service_role" key

## ✅ Test After Adding Keys:
1. Restart your dev server: `npm run dev`
2. Visit any dashboard → Click "AI Assistant (Cera.Ai)"
3. Should work without errors! 🤖

---

# Cera.Ai Environment Variables Setup

## Required Environment Variables for Cera.Ai

Add these to your `.env.local` file:

```env
# Gemini AI API Key (for Cera.Ai)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Service Role Key (for Cera.Ai database access)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Existing Supabase variables (should already be there)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## How to Get These Keys:

### 1. Gemini API Key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key and add it to your `.env.local`

### 2. Supabase Service Role Key:
1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the anon key)
4. Add it to your `.env.local`

## Security Note:
- The service role key has full database access
- Never commit these keys to version control
- The `.env.local` file is already in `.gitignore`

## Testing Cera.Ai:
Once you add these keys, restart your development server:
```bash
npm run dev
```

Then visit: http://localhost:3000/cera-assistant

Cera.Ai will initialize and connect to your database with full access to provide intelligent responses!
