# Data Model: Admin Panel Redesign

**Spec**: `006-admin-panel-redesign`  
**Date**: 2026-02-23  
**Source**: [spec.md](spec.md) — Key Entities section + Functional Requirements

---

## Entity Overview

| Entity | Status | Description |
|---|---|---|
| User | **Extended** | Add `isActive`, `failedLoginAttempts`, `lockedUntil` fields |
| Role | **New** | Named role definitions (Admin, Editor, Viewer, custom) |
| Permission | **New** | Resource + action permission grants |
| RolePermission | **New** | Join table: Role ↔ Permission |
| AuditLog | **New** | Admin action audit trail |
| Setting | **New** | Key-value site configuration |
| RefreshToken | **New** | JWT refresh token tracking with family rotation |
| Page | **Extended** | Add `publishStatus`, `version` fields for optimistic locking |
| GalleryItem | Existing | No schema changes; new bulk API operations |
| FAQ | Existing | No schema changes; new reorder API endpoint |
| Submission | Existing | No schema changes; new filtering/pagination API |
| Redirect | Existing | No schema changes; new pagination API |

---

## New Models

### AuditLog

Records every admin action for accountability and the dashboard activity feed (FR-051, FR-010).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, auto-generated | Unique identifier |
| userId | UUID | FK → User.id, required | Admin who performed the action |
| action | String | required | Action type: `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `BULK_UPDATE`, `EXPORT` |
| entity | String | required | Entity type: `page`, `gallery_item`, `faq`, `submission`, `redirect`, `user`, `role`, `setting` |
| entityId | String | nullable | ID of the affected entity (null for bulk/system actions) |
| changes | JSON | nullable | JSON diff of before/after for UPDATE actions |
| ipAddress | String | required | Request IP address |
| userAgent | String | nullable | Request User-Agent header |
| createdAt | DateTime | auto, indexed DESC | Timestamp of the action |

**Indexes**: `createdAt DESC` (activity feed query), composite `(entity, entityId)` (entity history lookup), `userId` (user activity lookup).

**Relationships**: `AuditLog.userId` → `User.id` (many-to-one).

**Validation**:
- `action` must be one of the allowed enum values
- `entity` must be one of the known entity types
- `ipAddress` must be a valid IP string

---

### Setting

Key-value store for site-wide configuration (FR-038–FR-041).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, auto-generated | Unique identifier |
| key | String | unique, required | Setting key (e.g., `site_name`, `contact_email`) |
| value | String | required | Setting value (stored as string; parsed by consumers) |
| group | String | required, default `'general'` | Grouping: `general`, `appearance`, `notifications` |
| description | String | nullable | Human-readable description for the settings UI |
| createdAt | DateTime | auto | Creation timestamp |
| updatedAt | DateTime | auto-update | Last modification timestamp |

**Indexes**: `key` (unique), `group` (listing by section).

**Seed Data**:
| Key | Default Value | Group |
|---|---|---|
| `site_name` | `"Modular House"` | general |
| `contact_email` | `""` | general |
| `default_seo_title` | `"Modular House"` | general |
| `admin_theme` | `"system"` | appearance |
| `sidebar_default_state` | `"expanded"` | appearance |
| `email_on_submission` | `"false"` | notifications |
| `daily_digest` | `"false"` | notifications |

---

### RefreshToken

Tracks refresh tokens for secure token rotation and revocation (FR-046, FR-047).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, auto-generated | Unique identifier |
| userId | UUID | FK → User.id, required | Owner of the token |
| tokenHash | String | required | Hashed refresh token (never store raw) |
| family | String | required, indexed | Token family ID for rotation detection |
| expiresAt | DateTime | required | Token expiration time (7 days from creation) |
| revokedAt | DateTime | nullable | When the token was revoked (null = active) |
| replacedByTokenId | UUID | nullable, FK → RefreshToken.id | Points to the replacement token in a rotation chain |
| createdAt | DateTime | auto | Creation timestamp |

**Indexes**: `tokenHash` (lookup), `family` (rotation detection), `userId` (user's active tokens), `expiresAt` (cleanup job).

**Relationships**: `RefreshToken.userId` → `User.id` (many-to-one). Self-referencing `replacedByTokenId` → `RefreshToken.id`.

**Token Rotation Logic**:
1. On refresh: current token is marked `revokedAt = now()`, `replacedByTokenId = newToken.id`
2. New token is created with same `family`
3. If a revoked token is reused: entire family is invalidated (theft detection)

---

### Role

Named role definitions with description (FR-050, US-7).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, auto-generated | Unique identifier |
| name | String | unique, required | Role name: `super_admin`, `admin`, `editor`, `viewer` |
| description | String | nullable | Human-readable role description |
| isSystem | Boolean | default `false` | System roles cannot be deleted |
| createdAt | DateTime | auto | Creation timestamp |
| updatedAt | DateTime | auto-update | Last modification timestamp |

**Relationships**: `Role` → `RolePermission` (one-to-many). `Role` → `User` (many-to-many via User.roleId).

**Seed Data**:
| Name | Description | isSystem |
|---|---|---|
| `super_admin` | Full system access including user and role management | true |
| `admin` | Full content management access | true |
| `editor` | Content creation and editing, read-only submissions/redirects | true |
| `viewer` | Read-only access to all content | true |

---

### Permission

Granular resource + action permission definitions (US-7).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, auto-generated | Unique identifier |
| resource | String | required | Resource name: `pages`, `gallery`, `faqs`, `submissions`, `redirects`, `users`, `roles`, `settings`, `audit_log` |
| action | String | required | Action type: `view`, `create`, `edit`, `delete`, `export` |
| description | String | nullable | Human-readable description |

**Indexes**: Unique composite on `(resource, action)`.

**Seed Data** (subset):
| Resource | Actions |
|---|---|
| `pages` | view, create, edit, delete |
| `gallery` | view, create, edit, delete |
| `faqs` | view, create, edit, delete |
| `submissions` | view, export |
| `redirects` | view, create, edit, delete |
| `users` | view, create, edit, delete |
| `roles` | view, create, edit, delete |
| `settings` | view, edit |
| `audit_log` | view |
| `dashboard` | view |

---

### RolePermission

Join table linking roles to permissions (US-7).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, auto-generated | Unique identifier |
| roleId | UUID | FK → Role.id, required | Associated role |
| permissionId | UUID | FK → Permission.id, required | Granted permission |

**Indexes**: Unique composite on `(roleId, permissionId)`. Individual indexes on `roleId` and `permissionId`.

**Relationships**: `RolePermission.roleId` → `Role.id`. `RolePermission.permissionId` → `Permission.id`. Both cascade on delete.

---

## Extended Models

### User (Extended)

| Field | Type | Constraints | Description |
|---|---|---|---|
| ~~roles~~ | ~~String[]~~ | ~~deprecated~~ | **Removed**: replaced by `roleId` FK |
| roleId | UUID | FK → Role.id, required | Assigned role |
| isActive | Boolean | default `true` | Account active status (FR-044 deactivation) |
| failedLoginAttempts | Int | default `0` | Consecutive failed login count (FR-049) |
| lockedUntil | DateTime | nullable | Account lockout expiry (FR-049) |

**Validation**:
- `failedLoginAttempts` resets to 0 on successful login
- `lockedUntil` is set to `now() + 15 minutes` when `failedLoginAttempts >= 5`
- `isActive = false` prevents login entirely (returns "Account deactivated")

**Migration Notes**:
- Existing `roles String[]` field is replaced by `roleId UUID` FK
- Migration must: (1) create Role/Permission/RolePermission tables, (2) seed default roles, (3) add `roleId` column, (4) map existing `roles` array values to role IDs, (5) drop `roles` column
- Existing seeded admin user gets `super_admin` role

### Page (Extended)

| Field | Type | Constraints | Description |
|---|---|---|---|
| publishStatus | PublishStatus | default `DRAFT` | Draft/Published status for page lifecycle |
| version | Int | default `1` | Optimistic locking version counter |

**Validation**:
- `version` increments on every save
- API rejects updates where provided `version` doesn't match current DB version (409 Conflict)

---

## State Transitions

### Page Lifecycle

```
  ┌─────────┐     publish     ┌───────────┐
  │  DRAFT  │ ──────────────► │ PUBLISHED │
  │         │ ◄────────────── │           │
  └─────────┘    unpublish    └───────────┘
       │                            │
       │         delete             │  delete
       └──────────┬─────────────────┘
                  ▼
            [Soft delete / Hard delete]
```

### Gallery Item Lifecycle

Same as Page (existing `publishStatus` enum). Bulk operations can transition multiple items.

### User Account Lifecycle

```
  ┌──────────┐     deactivate     ┌──────────────┐
  │  ACTIVE  │ ──────────────────► │  DEACTIVATED │
  │          │ ◄────────────────── │              │
  └──────────┘     reactivate     └──────────────┘
       │
       │  5 failed logins
       ▼
  ┌──────────┐     15min timeout or admin unlock
  │  LOCKED  │ ──────────────────────────────────► ACTIVE
  └──────────┘
```

### Refresh Token Lifecycle

```
  ┌────────┐     rotation     ┌─────────┐
  │ ACTIVE │ ───────────────► │ ROTATED │ (revokedAt set, replacedByTokenId set)
  └────────┘                  └─────────┘
       │                            │
       │  expired / logout          │  reused (theft!)
       ▼                            ▼
  ┌─────────┐               ┌──────────────────┐
  │ EXPIRED │               │ FAMILY REVOKED   │ (all tokens in family invalidated)
  └─────────┘               └──────────────────┘
```

---

## Prisma Schema Additions

```prisma
model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  action    String   @db.VarChar(50)
  entity    String   @db.VarChar(50)
  entityId  String?  @map("entity_id") @db.VarChar(255)
  changes   Json?
  ipAddress String   @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@index([createdAt(sort: Desc)])
  @@index([entity, entityId])
  @@index([userId])
  @@map("audit_logs")
}

model Setting {
  id          String   @id @default(uuid()) @db.Uuid
  key         String   @unique @db.VarChar(100)
  value       String
  group       String   @default("general") @db.VarChar(50)
  description String?
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([group])
  @@map("settings")
}

model RefreshToken {
  id                String       @id @default(uuid()) @db.Uuid
  userId            String       @map("user_id") @db.Uuid
  tokenHash         String       @map("token_hash")
  family            String       @db.VarChar(255)
  expiresAt         DateTime     @map("expires_at") @db.Timestamptz(6)
  revokedAt         DateTime?    @map("revoked_at") @db.Timestamptz(6)
  replacedByTokenId String?      @map("replaced_by_token_id") @db.Uuid
  createdAt         DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)

  user        User          @relation(fields: [userId], references: [id])
  replacedBy  RefreshToken? @relation("TokenRotation", fields: [replacedByTokenId], references: [id])
  replacedToken RefreshToken? @relation("TokenRotation")

  @@index([tokenHash])
  @@index([family])
  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

model Role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique @db.VarChar(50)
  description String?
  isSystem    Boolean  @default(false) @map("is_system")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  permissions RolePermission[]
  users       User[]

  @@map("roles")
}

model Permission {
  id          String   @id @default(uuid()) @db.Uuid
  resource    String   @db.VarChar(50)
  action      String   @db.VarChar(50)
  description String?

  roles RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model RolePermission {
  id           String @id @default(uuid()) @db.Uuid
  roleId       String @map("role_id") @db.Uuid
  permissionId String @map("permission_id") @db.Uuid

  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
}
```

### User Model Changes

```prisma
model User {
  id                  String    @id @default(uuid()) @db.Uuid
  email               String    @unique @db.VarChar(255)
  passwordHash        String    @map("password_hash")
  roleId              String    @map("role_id") @db.Uuid
  isActive            Boolean   @default(true) @map("is_active")
  failedLoginAttempts Int       @default(0) @map("failed_login_attempts")
  lockedUntil         DateTime? @map("locked_until") @db.Timestamptz(6)
  lastLoginAt         DateTime? @map("last_login_at") @db.Timestamptz(6)
  createdAt           DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  role          Role           @relation(fields: [roleId], references: [id])
  auditLogs     AuditLog[]
  refreshTokens RefreshToken[]

  @@map("users")
}
```

### Page Model Changes

```prisma
model Page {
  id             String        @id @default(uuid()) @db.Uuid
  title          String
  slug           String        @unique @db.VarChar(255)
  heroHeadline   String?       @map("hero_headline")
  heroSubhead    String?       @map("hero_subhead")
  heroImageId    String?       @map("hero_image_id") @db.Uuid
  sections       Json          @default("[]")
  seoTitle       String?       @map("seo_title")
  seoDescription String?       @map("seo_description")
  publishStatus  PublishStatus @default(DRAFT) @map("publish_status")
  version        Int           @default(1)
  lastModifiedAt DateTime      @default(now()) @map("last_modified_at") @db.Timestamptz(6)
  createdAt      DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt      DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)
  heroImage      GalleryItem?  @relation("PageHeroImage", fields: [heroImageId], references: [id])

  @@map("pages")
}
```

---

## Relationship Diagram

```
User ──────────── Role
 │                 │
 │ 1:N             │ 1:N
 ▼                 ▼
AuditLog      RolePermission ──── Permission
                   N:1              1:N

User ──── 1:N ──── RefreshToken (self-ref: replacedByTokenId)

Page ──── N:1 ──── GalleryItem (heroImageId)
```
