#!/usr/bin/env pwsh
# Development environment startup script
# Starts all development services using Docker Compose

Param(
    [switch]$Build,
    [switch]$Logs
)

Write-Host "Starting Modular House development environment..." -ForegroundColor Green

# Change to infra directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    if ($Build) {
        Write-Host "Building and starting services..." -ForegroundColor Yellow
        docker-compose up --build -d
    } else {
        Write-Host "Starting services..." -ForegroundColor Yellow
        docker-compose up -d
    }
    
    # Wait for services to be ready
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check service status
    Write-Host "\nService Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host "\nServices started successfully!" -ForegroundColor Green
    Write-Host "PostgreSQL: localhost:5432 (postgres/postgres)" -ForegroundColor White
    Write-Host "MailHog UI: http://localhost:8025" -ForegroundColor White
    Write-Host "MailHog SMTP: localhost:1025" -ForegroundColor White
    
    if ($Logs) {
        Write-Host "\nShowing logs (Ctrl+C to exit):" -ForegroundColor Yellow
        docker-compose logs -f
    }
} catch {
    Write-Error "Failed to start development environment: $($_.Exception.Message)"
} finally {
    Pop-Location
}