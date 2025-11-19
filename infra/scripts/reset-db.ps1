#!/usr/bin/env pwsh
# Database reset script
# Resets the development database to a clean state

Param(
    [switch]$Force
)

if (-not $Force) {
    $confirm = Read-Host "This will delete all data in the development database. Continue? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Database reset cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Resetting development database..." -ForegroundColor Yellow

# Change to infra directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    # Stop and remove the postgres container and its volume
    Write-Host "Stopping PostgreSQL container..." -ForegroundColor Yellow
    docker-compose stop postgres
    docker-compose rm -f postgres
    
    # Remove the postgres volume
    Write-Host "Removing database volume..." -ForegroundColor Yellow
    docker volume rm modular-house_postgres_data -f 2>$null
    
    # Start postgres again
    Write-Host "Starting fresh PostgreSQL container..." -ForegroundColor Yellow
    docker-compose up -d postgres
    
    # Wait for postgres to be ready
    Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Test connection
    $maxAttempts = 30
    $attempt = 0
    do {
        $attempt++
        Write-Host "Testing database connection (attempt $attempt/$maxAttempts)..." -ForegroundColor Cyan
        $result = docker-compose exec -T postgres pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database is ready!" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 2
    } while ($attempt -lt $maxAttempts)
    
    if ($attempt -ge $maxAttempts) {
        Write-Error "Database did not become ready within expected time"
        exit 1
    }
    
    Write-Host "Database reset completed successfully!" -ForegroundColor Green
    Write-Host "Connection: postgres://postgres:postgres@localhost:5432/modular_house_dev" -ForegroundColor White
    
} catch {
    Write-Error "Failed to reset database: $($_.Exception.Message)"
} finally {
    Pop-Location
}