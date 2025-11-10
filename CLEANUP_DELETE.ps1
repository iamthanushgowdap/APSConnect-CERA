# ===============================================
# APS Connect - Safe Cleanup Script
# ===============================================
# ⚠️ WARNING: This will DELETE files!
# ⚠️ Run CLEANUP_BACKUP.ps1 first!

Write-Host "========================================" -ForegroundColor Red
Write-Host "APS Connect - File Cleanup" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This will permanently delete files!" -ForegroundColor Yellow
Write-Host ""

# Check if backup exists
$backupExists = Test-Path "..\aps-connect-backup-*.zip"
if (-not $backupExists) {
    Write-Host "❌ ERROR: No backup found!" -ForegroundColor Red
    Write-Host "   Please run CLEANUP_BACKUP.ps1 first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Backup found" -ForegroundColor Green
Write-Host ""

# List what will be deleted
Write-Host "The following will be DELETED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "📁 Test Modules:" -ForegroundColor Cyan
Write-Host "   - aps/" -ForegroundColor White
Write-Host "   - clgtest/" -ForegroundColor White
Write-Host "   - usr/" -ForegroundColor White
Write-Host ""
Write-Host "📄 Redundant Documentation:" -ForegroundColor Cyan
Write-Host "   - CERA_AI_README.md" -ForegroundColor White
Write-Host "   - CERA_COMPLETE_IMPLEMENTATION.md" -ForegroundColor White
Write-Host "   - CERA_CRITICAL_FIX.md" -ForegroundColor White
Write-Host "   - CERA_DEBUGGING_GUIDE.md" -ForegroundColor White
Write-Host "   - CERA_FINAL_FIX.md" -ForegroundColor White
Write-Host "   - CERA_FIXES_SUMMARY.md" -ForegroundColor White
Write-Host "   - CERA_HTML_TEMPLATES.md" -ForegroundColor White
Write-Host "   - CERA_INTEGRATION_README.md" -ForegroundColor White
Write-Host "   - CERA_SETUP.md" -ForegroundColor White
Write-Host "   - CERA_TEST_README.md" -ForegroundColor White
Write-Host ""
Write-Host "🗄️  SQL Debugging Files (100+ files):" -ForegroundColor Cyan
Write-Host "   - All *.sql files in root directory" -ForegroundColor White
Write-Host "   - EXCEPT migrations/*.sql (these are kept)" -ForegroundColor Green
Write-Host ""
Write-Host "🗑️  Cache/Build Folders:" -ForegroundColor Cyan
Write-Host "   - .firebase/" -ForegroundColor White
Write-Host "   - .next/ (if exists)" -ForegroundColor White
Write-Host ""

# Ask for confirmation
Write-Host ""
$confirmation = Read-Host "Type 'DELETE' to proceed, or press Enter to cancel"

if ($confirmation -ne "DELETE") {
    Write-Host ""
    Write-Host "❌ Cleanup cancelled. No files were deleted." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Yellow
Write-Host ""

$deletedCount = 0
$errors = @()

# Function to safely delete
function Safe-Delete {
    param($Path, $Description)
    if (Test-Path $Path) {
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Write-Host "✅ Deleted: $Description" -ForegroundColor Green
            return 1
        } catch {
            Write-Host "❌ Failed to delete: $Description - $_" -ForegroundColor Red
            $script:errors += "Failed to delete $Description`: $_"
            return 0
        }
    } else {
        Write-Host "⏭️  Skipped: $Description (not found)" -ForegroundColor Gray
        return 0
    }
}

# Delete test modules
Write-Host "Deleting test modules..." -ForegroundColor Cyan
$deletedCount += Safe-Delete "aps" "aps/ folder"
$deletedCount += Safe-Delete "clgtest" "clgtest/ folder"
$deletedCount += Safe-Delete "usr" "usr/ folder"
Write-Host ""

# Delete redundant CERA documentation
Write-Host "Deleting redundant CERA documentation..." -ForegroundColor Cyan
$deletedCount += Safe-Delete "CERA_AI_README.md" "CERA_AI_README.md"
$deletedCount += Safe-Delete "CERA_COMPLETE_IMPLEMENTATION.md" "CERA_COMPLETE_IMPLEMENTATION.md"
$deletedCount += Safe-Delete "CERA_CRITICAL_FIX.md" "CERA_CRITICAL_FIX.md"
$deletedCount += Safe-Delete "CERA_DEBUGGING_GUIDE.md" "CERA_DEBUGGING_GUIDE.md"
$deletedCount += Safe-Delete "CERA_FINAL_FIX.md" "CERA_FINAL_FIX.md"
$deletedCount += Safe-Delete "CERA_FIXES_SUMMARY.md" "CERA_FIXES_SUMMARY.md"
$deletedCount += Safe-Delete "CERA_HTML_TEMPLATES.md" "CERA_HTML_TEMPLATES.md"
$deletedCount += Safe-Delete "CERA_INTEGRATION_README.md" "CERA_INTEGRATION_README.md"
$deletedCount += Safe-Delete "CERA_SETUP.md" "CERA_SETUP.md"
$deletedCount += Safe-Delete "CERA_TEST_README.md" "CERA_TEST_README.md"
Write-Host ""

# Delete SQL debugging files (but keep migrations/)
Write-Host "Deleting SQL debugging files..." -ForegroundColor Cyan
$sqlFiles = Get-ChildItem -Path "." -Filter "*.sql" -File | Where-Object { $_.DirectoryName -notmatch "migrations" }
$sqlCount = 0
foreach ($file in $sqlFiles) {
    try {
        Remove-Item -Path $file.FullName -Force -ErrorAction Stop
        $sqlCount++
    } catch {
        Write-Host "❌ Failed to delete: $($file.Name)" -ForegroundColor Red
        $errors += "Failed to delete $($file.Name): $_"
    }
}
Write-Host "✅ Deleted $sqlCount SQL files" -ForegroundColor Green
$deletedCount += $sqlCount
Write-Host ""

# Delete cache folders
Write-Host "Deleting cache/build folders..." -ForegroundColor Cyan
$deletedCount += Safe-Delete ".firebase" ".firebase/ folder"
$deletedCount += Safe-Delete ".next" ".next/ folder"
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Deleted $deletedCount items" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  $($errors.Count) errors occurred:" -ForegroundColor Yellow
    foreach ($error in $errors) {
        Write-Host "   - $error" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install (to ensure dependencies are ok)" -ForegroundColor White
Write-Host "2. Run: npm run dev (to test the project)" -ForegroundColor White
Write-Host "3. If everything works, you can delete the backup" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
