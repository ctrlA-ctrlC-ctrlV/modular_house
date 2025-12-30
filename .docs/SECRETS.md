# GitHub Secrets Configuration

This document lists all required GitHub Actions secrets for the CD pipeline.

## Infrastructure Secrets

### `SERVER_HOST`
- **Description:** IP address or hostname of the production server
- **Example:** `123.45.67.89`

### `SERVER_USER`
- **Description:** SSH username for server access
- **Example:** `deploy` or `root`

### `SERVER_SSH_KEY`
- **Description:** Private SSH key for server authentication
- **Format:** Multi-line string starting with `-----BEGIN OPENSSH PRIVATE KEY-----`

### `DOMAIN_NAME`
- **Description:** Production domain name (without protocol)
- **Example:** `modularhouse.ie`
- **Note:** Used to generate `VITE_API_BASE_URL` and `CORS_ORIGIN` automatically

### `ACME_EMAIL`
- **Description:** Email for Let's Encrypt certificate notifications
- **Example:** `admin@modularhouse.ie`

## Database Secrets

### `DATABASE_URL`
- **Description:** PostgreSQL connection string for production database
- **Format:** `postgresql://username:password@host:port/database?schema=public`
- **Example:** `postgresql://user:pass@db.example.com:5432/modular_house?schema=public`

## Mail Configuration Secrets

### `MAIL_HOST`
- **Description:** SMTP server hostname
- **Example:** `smtp.gmail.com` or `mail.privateemail.com`

### `MAIL_PORT`
- **Description:** SMTP server port
- **Default:** `587` (TLS) or `465` (SSL)

### `MAIL_SECURE`
- **Description:** Use SSL/TLS connection
- **Values:** `true` or `false`

### `MAIL_USER`
- **Description:** SMTP authentication username
- **Example:** `notifications@modularhouse.ie`

### `MAIL_PASS`
- **Description:** SMTP authentication password
- **Example:** Your email account password or app-specific password

### `MAIL_FROM_NAME`
- **Description:** Display name for outgoing emails
- **Example:** `Modular House`

### `MAIL_FROM_EMAIL`
- **Description:** Email address for outgoing emails
- **Example:** `noreply@modularhouse.ie`

### `MAIL_INTERNAL_TO`
- **Description:** Internal email address to receive enquiry notifications
- **Example:** `enquiries@modularhouse.ie`

## Security Secrets

### `JWT_SECRET`
- **Description:** Secret key for JWT token generation/validation
- **Requirements:** Strong random string, minimum 32 characters
- **Generate:** `openssl rand -base64 32`
- **Example:** `xK9mP2vQ8wR5tY7uI3oP6aS1dF4gH8jK`

### `IP_SALT`
- **Description:** Salt for hashing IP addresses in rate limiting
- **Requirements:** Strong random string
- **Generate:** `openssl rand -base64 32`

## Admin Configuration Secrets

### `ADMIN_LOGIN_EMAIL`
- **Description:** Admin user email for initial login
- **Example:** `admin@modularhouse.ie`
- **Note:** Must be different from default `testadmin@modular.house` in production

### `ADMIN_LOGIN_PASSWORD`
- **Description:** Admin user password for initial login
- **Requirements:** Strong password, different from default `admin123!`
- **Example:** Strong password with uppercase, lowercase, numbers, and symbols

## Setting Up Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the name and value for each secret above
5. Click **Add secret**

## Validation

After setting all secrets, the next push to `main` branch will:
1. Build Docker images with correct `VITE_API_BASE_URL`
2. Generate `.env` file with all required variables
3. Deploy to production server via SSH
4. Start services with proper configuration

## Troubleshooting

### API Returns 502 Bad Gateway
- **Cause:** Missing required environment variables
- **Check:** All secrets listed above are configured
- **Verify:** SSH into server and run `docker logs <api-container-name>`

### Certificate Generation Fails
- **Check:** `ACME_EMAIL` is a valid email address
- **Check:** Domain DNS points to server IP
- **Check:** Ports 80 and 443 are accessible

### Email Notifications Not Sent
- **Check:** All `MAIL_*` secrets are configured correctly
- **Verify:** SMTP credentials work by testing with an email client
- **Note:** Some providers require app-specific passwords (Gmail, etc.)
