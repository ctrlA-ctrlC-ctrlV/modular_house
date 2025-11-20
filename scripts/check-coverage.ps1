<#
.SYNOPSIS
    Check test coverage across all packages
.DESCRIPTION
    Runs tests with coverage for all packages and validates against thresholds
.PARAMETER FailOnThreshold
    Exit with error code if coverage thresholds are not met (default: true)
#>

param(
    [switch]$FailOnThreshold = $true
)

$ErrorActionPreference = "Stop"

Write-Host "Running tests with coverage across all packages..." -ForegroundColor Cyan

# Change to repository root
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# Run coverage for all packages
Write-Host "`nRunning test coverage..." -ForegroundColor Yellow
pnpm test:coverage

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nCoverage check failed!" -ForegroundColor Red
    if ($FailOnThreshold) {
        exit 1
    }
    exit 0
}

Write-Host "`nCoverage thresholds met successfully!" -ForegroundColor Green
Write-Host "Coverage reports available in:" -ForegroundColor Cyan
Write-Host "  - apps/api/coverage/" -ForegroundColor Gray
Write-Host "  - apps/web/coverage/" -ForegroundColor Gray

exit 0
