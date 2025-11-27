All notable changes to **Modular House** will be documented in this file.  
Format: *Added, Changed, Fixed, Removed, Security*.

---

## [Unreleased]
### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

### Security
- 

---

## 0.3.4 - 3421cf3 - 27/11/2025

### Fixed
- Dependency Conflicts: Updated vite, vitest, and @vitest/coverage-v8 to compatible versions to resolve peer dependency warnings.
- Database Connectivity: Updated both .env and .env.test to connect via your SSH tunnel (localhost:5432) instead of the remote IP.
- Validation Logic: Fixed a mismatch in auth.ts where the API returned "Required" but tests expected "Password is required". I updated the Zod schema to provide the custom error message.
- Test Stability: Fixed auth.spec.ts to properly clean up all test users (service-test@test.com2, etc.), preventing "User already exists" errors on subsequent runs.
