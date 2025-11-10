# 🧹 Project Cleanup Guide

This document identifies **unnecessary files** that can be safely deleted to clean up the project.

---

## ✅ Files to KEEP (Essential)

### **Source Code (DO NOT DELETE)**
- `src/` - Entire directory (all application code)
- `public/` - Entire directory (static assets, icons, manifest)
- `migrations/` - Official database migrations (4 files)

### **Configuration Files (DO NOT DELETE)**
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `components.json` - shadcn/ui configuration
- `.env.local` - Environment variables (if exists)
- `.gitignore` - Git ignore rules
- `firebase.json` - Firebase configuration
- `.firebaserc` - Firebase projects

### **Documentation (KEEP THESE ONLY)**
- `PROJECT_COMPLETE_GUIDE.md` - **Main documentation (newly created)**
- `SYSTEM_ARCHITECTURE.md` - System architecture details
- `DATABASE_SCHEMA.md` - Database schema reference
- `GROUPS_SETUP.md` - Groups system documentation

---

## ❌ Files to DELETE (Unnecessary/Redundant)

### **1. Test/Legacy Modules (SAFE TO DELETE)**
```
aps/ - Legacy test module
clgtest/ - Test module
usr/ - Unused directory
```

### **2. Redundant Documentation (DELETE - Info in PROJECT_COMPLETE_GUIDE.md)**
```
README.md - Minimal info, replaced by PROJECT_COMPLETE_GUIDE.md
CERA_AI_README.md - CERA info now in main guide
CERA_COMPLETE_IMPLEMENTATION.md - Duplicate info
CERA_CRITICAL_FIX.md - Outdated fix notes
CERA_DEBUGGING_GUIDE.md - Duplicate info
CERA_FINAL_FIX.md - Outdated fix notes
CERA_FIXES_SUMMARY.md - Duplicate info
CERA_HTML_TEMPLATES.md - Duplicate info
CERA_INTEGRATION_README.md - Duplicate info
CERA_SETUP.md - Duplicate info
CERA_TEST_README.md - Duplicate info
```

### **3. Debugging/Temporary SQL Files (DELETE - Over 100 files!)**

All these SQL files in root directory are debugging/testing scripts that are NOT needed:

```
add_college_name.sql
add_missing_semesters.sql
apply-timetable-rls.js
assign_correct_admin_to_all_groups.sql
automatic_group_assignment.sql
automatic_group_assignment_fixed.sql
cera_database_schema.sql
cera_migration.sql
check-env-vars.js
check-user-preferences-table.js
check_all_settings.js
check_assignments.sql
check_auth_users.sql
check_avatars.js
check_branch_rls.sql
check_data_types.sql
check_group_permissions.js
check_groups_rls.sql
check_logo.js
check_profiles.sql
check_rls.js
check_site_settings.js
check_urls.js
check_user_profiles.sql
clean_dump.sql
complete_cera_migration.sql
complete_data_migration.sql
complete_migration_with_data.sql
complete_setup.sql
comprehensive_debug.sql
create_chat_attachments_bucket.sql
create_chat_attachments_policies.sql
create_fundraising_tables.sql
create_groups_for_new_branch.sql
create_notifications_table.sql
create_policies_sql.sql
create_storage_buckets.sql
create_test_student.sql
create_user_preferences_table.sql
debug_admin_profiles.sql
debug_avatars.js
debug_club_avatars.js
debug_eee_branch.sql
debug_fundraising.sql
debug_getmygroups.sql
debug_group_creation_error.sql
debug_groups.sql
debug_groups_comprehensive.sql
debug_groups_detailed.sql
debug_groups_visibility.sql
debug_rls.sql
debug_rls_groups_final.sql
debug_student_login.sql
debug_user_profiles.sql
direct_admin_assignment.sql
emergency_site_settings_fix.sql
extract_data.py
extract_data.sql
extract_from_current_db.sql
fee_records_setup.sql
final_group_assignment.sql
final_rls_fix.sql
final_setup.sql
final_setup_fixed.sql
find_alumni_users.sql
fix_admin_account.sql
fix_avatars.js
fix_branches_rls.sql
fix_groups_rls.sql
fix_groups_visibility.sql
fix_rls.sql
fix_user_profiles.sql
inspect_groups.sql
inspect_rls_policies.sql
last_dump.sql - **This file (complete DB dump, not needed)**
list_all_tables.sql
migrate_to_supabase.sql
populate_groups.sql
quick_fix_groups.sql
recreate_groups.sql
reset_groups.sql
setup_groups.sql
test_auth.sql
test_group_access.sql
test_rls.sql
update_groups.sql
verify_groups.sql
... (and many more similar debugging SQL files)
```

**Recommendation**: Keep ONLY the 4 files in `migrations/` folder. Delete all other SQL files in root.

### **4. Temporary/Cache Directories (SAFE TO DELETE)**
```
.firebase/ - Hosting cache (regenerated on deploy)
.idx/ - IDE configuration (optional)
.vscode/ - VS Code settings (optional, user-specific)
```

### **5. Build Artifacts (DELETE - Regenerated on build)**
```
.next/ - Next.js build cache (regenerated)
node_modules/ - Dependencies (reinstall with npm install)
```

---

## 🔧 Cleanup Commands

### **Manual Cleanup (Recommended)**

Review and delete files individually to ensure you understand what's being removed.

### **Automated Cleanup (Advanced)**

**⚠️ WARNING**: This will permanently delete files. Create a backup first!

```bash
# Backup project first
cp -r sip sip-backup

# Delete test modules
rm -rf aps/
rm -rf clgtest/
rm -rf usr/

# Delete redundant documentation
rm README.md
rm CERA_*.md

# Delete all root SQL files except migrations
find . -maxdepth 1 -name "*.sql" -type f -delete

# Delete cache directories
rm -rf .next/
rm -rf .firebase/
```

**For Windows (PowerShell)**:
```powershell
# Backup first!
Copy-Item -Path "sip" -Destination "sip-backup" -Recurse

# Delete test modules
Remove-Item -Path "aps" -Recurse -Force
Remove-Item -Path "clgtest" -Recurse -Force
Remove-Item -Path "usr" -Recurse -Force

# Delete redundant docs
Remove-Item -Path "README.md" -Force
Remove-Item -Path "CERA_*.md" -Force

# Delete root SQL files
Get-ChildItem -Path "." -Filter "*.sql" -File | Remove-Item -Force

# Delete cache
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path ".firebase" -Recurse -Force
```

---

## 📊 Expected Results

### **Before Cleanup**
- Total files: ~250+ files
- Root directory: Cluttered with 100+ SQL files
- Multiple redundant README files
- Test modules taking space

### **After Cleanup**
- Total files: ~100 essential files
- Root directory: Clean with only necessary config files
- Single comprehensive documentation file
- Only production-ready code

---

## ✅ Post-Cleanup Verification

After cleanup, verify the project still works:

```bash
# Reinstall dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

If everything works correctly, the cleanup is successful!

---

## 🔄 What to Do with Deleted Files

### **Option 1: Archive (Recommended)**
Create a `_archive` folder and move files there instead of deleting:
```bash
mkdir _archive
mv *.sql _archive/
mv CERA_*.md _archive/
mv aps/ _archive/
mv clgtest/ _archive/
```

### **Option 2: Git Commit Before Delete**
```bash
git add .
git commit -m "Archive before cleanup"
# Now delete files
```

### **Option 3: Full Backup**
```bash
zip -r aps-connect-backup-$(date +%Y%m%d).zip sip/
```

---

## 📝 Summary

**Safe to Delete**: ~150+ files (redundant SQL, docs, test modules)  
**Must Keep**: All files in `src/`, `public/`, `migrations/`, and config files  
**Main Documentation**: `PROJECT_COMPLETE_GUIDE.md` (newly created)  

---

**Created**: November 2025  
**Purpose**: Clean up project for handoff to new developer/account
