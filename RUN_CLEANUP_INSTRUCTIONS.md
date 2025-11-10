# 🧹 How to Run Cleanup

## ⚠️ IMPORTANT: Follow These Steps in Order!

### **Step 1: Create Backup** (REQUIRED!)

Right-click on `CLEANUP_BACKUP.ps1` → **Run with PowerShell**

This creates a ZIP backup in the parent folder (`Downloads/`).

**Wait for**: "✅ Backup created successfully!"

---

### **Step 2: Delete Unwanted Files**

Right-click on `CLEANUP_DELETE.ps1` → **Run with PowerShell**

The script will:
1. ✅ Check if backup exists (safety check)
2. 📋 Show you what will be deleted
3. ❓ Ask for confirmation (type `DELETE` to proceed)
4. 🗑️ Delete unnecessary files

**What gets deleted**:
- ❌ `aps/`, `clgtest/`, `usr/` folders (test modules)
- ❌ 10 redundant CERA documentation files
- ❌ 100+ SQL debugging files in root
- ❌ `.firebase/`, `.next/` cache folders

**What is kept** ✅:
- ✅ `src/` - All source code
- ✅ `public/` - All assets
- ✅ `migrations/` - Official migrations
- ✅ `scripts/` - Utility scripts
- ✅ All config files
- ✅ New documentation files

---

### **Step 3: Test Project**

```powershell
npm install
npm run dev
```

Open http://localhost:3000 and verify everything works.

---

### **Step 4: Delete Backup** (Optional)

If everything works fine, you can delete the backup ZIP from `Downloads/` folder.

---

## 🔧 Alternative: Manual Cleanup

If you prefer manual control, delete these folders/files yourself:

### **Folders to Delete:**
- `aps/`
- `clgtest/`
- `usr/`
- `.firebase/`
- `.next/`

### **Files to Delete:**
- `CERA_AI_README.md`
- `CERA_COMPLETE_IMPLEMENTATION.md`
- `CERA_CRITICAL_FIX.md`
- `CERA_DEBUGGING_GUIDE.md`
- `CERA_FINAL_FIX.md`
- `CERA_FIXES_SUMMARY.md`
- `CERA_HTML_TEMPLATES.md`
- `CERA_INTEGRATION_README.md`
- `CERA_SETUP.md`
- `CERA_TEST_README.md`
- All `*.sql` files in root (but NOT in `migrations/` folder)

---

## ❓ Troubleshooting

### "Cannot run script - execution policy"

Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then try again.

### "Backup failed"

Manually create backup:
```powershell
Compress-Archive -Path ".\*" -DestinationPath "..\aps-backup.zip"
```

---

## 📊 Expected Results

**Before Cleanup:**
- ~250 files in project
- 100+ SQL files cluttering root directory
- Multiple redundant documentation files

**After Cleanup:**
- ~100 essential files
- Clean root directory
- Single comprehensive documentation

---

**Created**: November 4, 2025  
**Safe to run**: Yes (backup is created first)
