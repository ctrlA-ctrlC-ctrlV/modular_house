#!/usr/bin/env pwsh
# Check status of development services

# Change to infra directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    Write-Host "Modular House Development Environment Status" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    
    # Check if Docker is running
    try {
        docker version >$null 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Docker is not running" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker is not available" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "\nService Status:" -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host "\nService Health:" -ForegroundColor Yellow
    
    # Check PostgreSQL
    $pgHealth = docker-compose exec -T postgres pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL: Healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL: Unhealthy" -ForegroundColor Red
    }
    
    # Check MailHog
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8025/api/v1/messages" -TimeoutSec 5 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ MailHog: Healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ MailHog: Unhealthy" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ MailHog: Unreachable" -ForegroundColor Red
    }
    
    Write-Host "\nService URLs:" -ForegroundColor Yellow
    Write-Host "PostgreSQL: postgres://postgres:postgres@localhost:5432/modular_house_dev" -ForegroundColor White
    Write-Host "MailHog UI: http://localhost:8025" -ForegroundColor White
    Write-Host "MailHog SMTP: localhost:1025" -ForegroundColor White
    
} catch {
    Write-Error "Failed to check status: $($_.Exception.Message)"
} finally {
    Pop-Location
}