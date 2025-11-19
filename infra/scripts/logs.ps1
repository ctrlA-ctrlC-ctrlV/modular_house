#!/usr/bin/env pwsh
# View logs from development services

Param(
    [string]$Service = "",
    [switch]$Follow,
    [int]$Tail = 100
)

# Change to infra directory
Push-Location (Join-Path $PSScriptRoot "..")

try {
    if ($Service) {
        Write-Host "Viewing logs for service: $Service" -ForegroundColor Cyan
        if ($Follow) {
            docker-compose logs -f --tail $Tail $Service
        } else {
            docker-compose logs --tail $Tail $Service
        }
    } else {
        Write-Host "Viewing logs for all services" -ForegroundColor Cyan
        if ($Follow) {
            docker-compose logs -f --tail $Tail
        } else {
            docker-compose logs --tail $Tail
        }
    }
} catch {
    Write-Error "Failed to view logs: $($_.Exception.Message)"
} finally {
    Pop-Location
}