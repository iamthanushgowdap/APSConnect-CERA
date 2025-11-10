# ===============================================
# APS Connect - Backup Script (Run This First!)
# ===============================================
# This script creates a complete backup before cleanup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APS Connect - Creating Backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current date for backup name
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "aps-connect-backup-$timestamp.zip"
$backupPath = "..\$backupName"

Write-Host "Creating backup: $backupName" -ForegroundColor Yellow
Write-Host "Location: $backupPath" -ForegroundColor Yellow
Write-Host ""

# Create backup using Compress-Archive
try {
    Compress-Archive -Path ".\*" -DestinationPath $backupPath -Force
    Write-Host "✅ Backup created successfully!" -ForegroundColor Green
    Write-Host "   Location: $backupPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now safely run CLEANUP_DELETE.ps1" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    Write-Host "   DO NOT proceed with cleanup!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
