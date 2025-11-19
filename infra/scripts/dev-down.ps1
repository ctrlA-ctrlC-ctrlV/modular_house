#!/usr/bin/env pwsh
# Development environment shutdown script
# Stops all development services

Param(
    [switch]$Volumes
)

Write-Host "Stopping Modular House development environment..." -ForegroundColor Yellow

# Change to infra directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    if ($Volumes) {
        Write-Host "Stopping services and removing volumes..." -ForegroundColor Red
        docker-compose down -v
        Write-Host "All services stopped and volumes removed." -ForegroundColor Green
    } else {
        Write-Host "Stopping services..." -ForegroundColor Yellow
        docker-compose down
        Write-Host "All services stopped." -ForegroundColor Green
    }
} catch {
    Write-Error "Failed to stop development environment: $($_.Exception.Message)"
} finally {
    Pop-Location
}