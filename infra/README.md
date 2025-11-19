# Infrastructure Scripts

This directory contains scripts for managing the local development environment.

## Prerequisites

- Docker and Docker Compose
- PowerShell (for Windows scripts)

## Scripts

### `dev-up.ps1`
Start the development environment (PostgreSQL + MailHog).

```powershell
# Start services
.\dev-up.ps1

# Start with build (rebuild containers)
.\dev-up.ps1 -Build

# Start and follow logs
.\dev-up.ps1 -Logs
```

### `dev-down.ps1`
Stop the development environment.

```powershell
# Stop services
.\dev-down.ps1

# Stop services and remove volumes (deletes all data)
.\dev-down.ps1 -Volumes
```

### `reset-db.ps1`
Reset the PostgreSQL database to a clean state.

```powershell
# Reset database (with confirmation)
.\reset-db.ps1

# Force reset without confirmation
.\reset-db.ps1 -Force
```

### `status.ps1`
Check the status of all development services.

```powershell
.\status.ps1
```

### `logs.ps1`
View logs from development services.

```powershell
# View all logs
.\logs.ps1

# View logs for specific service
.\logs.ps1 -Service postgres

# Follow logs in real-time
.\logs.ps1 -Follow

# Show last 50 lines
.\logs.ps1 -Tail 50
```

## Services

### PostgreSQL
- **Host**: localhost
- **Port**: 5432
- **Database**: modular_house_dev
- **Username**: postgres
- **Password**: postgres
- **Connection String**: `postgres://postgres:postgres@localhost:5432/modular_house_dev`

### MailHog
- **SMTP**: localhost:1025
- **Web UI**: http://localhost:8025

## Usage

1. Start the development environment:
   ```powershell
   .\scripts\dev-up.ps1
   ```

2. Check that services are running:
   ```powershell
   .\scripts\status.ps1
   ```

3. When done, stop the services:
   ```powershell
   .\scripts\dev-down.ps1
   ```

## Database Management

The PostgreSQL database includes:
- UUID and crypto extensions
- Health check function
- Proper timezone settings (UTC)

To reset the database to a clean state:
```powershell
.\scripts\reset-db.ps1
```

## Email Testing

MailHog captures all emails sent by the application during development:
- SMTP server runs on port 1025
- Web interface available at http://localhost:8025
- All emails are captured and can be viewed in the web UI