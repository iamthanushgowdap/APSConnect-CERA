# 🔄 CERA Cache Management Guide

## Why You're Seeing Old Data

CERA caches Google Sheets data for **30 minutes** to improve performance and reduce API calls. When you update your Google Sheets, the changes won't appear immediately because CERA is serving cached data.

## 🚀 Quick Solutions

### **Option 1: Restart Dev Server (Recommended)**

```bash
# Stop and restart
npm run dev
```

This clears ALL cache instantly.

### **Option 2: Wait 30 Minutes**

Cache automatically expires after 30 minutes. Your changes will appear automatically.

### **Option 3: Use Browser Console**

Open browser console (F12) and run:

```javascript
// Clear cache via API
fetch('/api/cera/clear-cache', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log(data));

// Then ask CERA your question again
```

### **Option 4: Reduce Cache Duration (Development)**

Edit `c:\Users\choco\Downloads\sip\src\app\api\cera\query\route.js`:

```javascript
// Change from 30 minutes to 1 minute for testing
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute (was 30)
```

**Remember to change it back to 30 minutes for production!**

## 📊 Cache Behavior

| Action | Cache Status | Data Source |
|--------|-------------|-------------|
| First query | MISS | Fetches from Google Sheets |
| Within 30 min | HIT | Returns cached data |
| After 30 min | MISS | Fetches fresh data |
| Server restart | CLEARED | Fetches fresh data |

## 🔍 How to Check Cache Status

Look at your server console logs:

```
📊 Using cached sheet data for assignments    ← Cache HIT
📊 Fetching fresh data from Google Sheets: assignments ← Cache MISS
✅ Fetched 1 rows from assignments            ← Fresh data loaded
```

## 🎯 Best Practices

### **During Development:**
- Use **1-minute cache** for quick testing
- Restart server after major sheet changes
- Check console logs to verify data source

### **In Production:**
- Use **30-minute cache** for performance
- Set up webhooks to auto-update sheets
- Monitor cache hit rates

## 🛠️ Advanced: Webhook-Based Cache Invalidation

For production, implement webhook-based cache clearing:

```javascript
// Supabase webhook → Your endpoint
export async function POST(request) {
  const { table, record } = await request.json();
  
  // Update Google Sheet
  await updateSheet(table, record);
  
  // Clear specific cache
  cache.delete(`sheet_${table}`);
  
  return NextResponse.json({ success: true });
}
```

## 📝 Current Cache Settings

- **Duration**: 30 minutes (1800 seconds)
- **Storage**: In-memory Map (cleared on restart)
- **Scope**: Per-table (fee_records, assignments, etc.)
- **Size**: Unlimited (clears on expiry)

## 🚨 Troubleshooting

**Problem**: "I updated sheets but still see old data"
- **Solution**: Restart dev server or wait 30 minutes

**Problem**: "Cache clears too often"
- **Solution**: Increase CACHE_DURATION value

**Problem**: "Different users see different data"
- **Solution**: Cache is server-wide, not user-specific. This is expected.

**Problem**: "Memory usage increasing"
- **Solution**: Cache auto-expires. In production, use Redis for distributed cache.
