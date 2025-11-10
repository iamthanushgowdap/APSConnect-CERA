# 📅 Timetables Sheet Template

## ⚠️ **CRITICAL: Your timetables sheet is corrupted!**

The sheet currently has wrong columns (A, B, C, D...) instead of proper headers.

## ✅ **How to Fix**

### Step 1: Clean the Sheet
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1016j-1SvZtSe5rE961yyB1HzPXUtmnpwjiL-Z6zEbX8
2. Go to the `timetables` tab
3. **Delete ALL rows** (select all and delete)

### Step 2: Add Headers (Row 1)
Copy these exact headers into row 1:

```
id | branch | semester | schedule | created_at | updated_at
```

### Step 3: Add Your Data (Row 2+)

**Example Row 2:**
```
Column A (id): cse-5th-sem-timetable
Column B (branch): CSE
Column C (semester): 5th Sem
Column D (schedule): [{"day":"Monday","entries":[{"period":0,"type":"class","subject":"Data Structures","subject_code":"CS201","room_number":"101"}]}]
Column E (created_at): 2025-11-10 04:30:00
Column F (updated_at): 2025-11-10 04:30:00
```

### Step 4: Schedule Format (Column D)

The `schedule` column must be valid JSON:

```json
[
  {
    "day": "Monday",
    "entries": [
      {
        "period": 0,
        "type": "class",
        "subject": "TOC",
        "subject_code": "BCS205",
        "room_number": "201"
      },
      {
        "period": 1,
        "type": "class",
        "subject": "TOC",
        "subject_code": "BCS205",
        "room_number": "201"
      }
    ]
  },
  {
    "day": "Tuesday",
    "entries": [
      {
        "period": 0,
        "type": "class",
        "subject": "CN LAB",
        "subject_code": "BSC208",
        "room_number": "B1-205"
      }
    ]
  }
]
```

**IMPORTANT:** The JSON must be on a single line in the cell!

## 🎯 **Quick Fix: Copy from Supabase**

Since your Supabase has working timetable data:

1. Go to Supabase dashboard
2. Open `timetables` table
3. Find the row for `CSE` + `5th Sem`
4. Copy the `schedule` column value
5. Paste it into your Google Sheet

## 📋 **Complete Example Row**

| id | branch | semester | schedule | created_at | updated_at |
|----|--------|----------|----------|------------|------------|
| cse-5th-sem | CSE | 5th Sem | [{"day":"Monday","entries":[...]}] | 2025-11-10 04:30:00 | 2025-11-10 04:30:00 |

## ✅ **After Fixing**

1. Save the sheet
2. Wait 30 seconds
3. Ask CERA: "show my timetable"
4. Should now show data from Google Sheets!

---

## 🔍 **Why This Happened**

Your timetables sheet got corrupted, probably from:
- Importing data incorrectly
- Pasting data without headers
- Mixing different data sources

**Solution:** Start fresh with the template above!
