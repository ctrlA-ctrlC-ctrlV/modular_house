# Admin Panel Redesign — API Contract Extensions

**Spec**: `006-admin-panel-redesign`  
**Date**: 2026-02-23  
**Base**: `apps/api/openapi.yaml` (v0.1.0)  
**Target version**: `0.2.0`

This document defines all new and modified API endpoints for the admin panel redesign. Contracts are expressed as OpenAPI 3.1.0 fragments that will be merged into the existing spec.

---

## Shared Pagination Pattern

All list endpoints adopt a consistent paginated response envelope:

```yaml
# Reusable query parameters for all paginated list endpoints
PaginationParams:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
  - name: pageSize
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
  - name: sortBy
    in: query
    schema:
      type: string
    description: Column to sort by (endpoint-specific allowed values)
  - name: sortOrder
    in: query
    schema:
      type: string
      enum: [asc, desc]
      default: desc
  - name: search
    in: query
    schema:
      type: string
    description: Free-text search (300ms debounce on frontend)

# Reusable paginated response envelope
PaginatedResponse:
  type: object
  required: [items, total, page, pageSize, totalPages]
  properties:
    items:
      type: array
      items: {}  # replaced by endpoint-specific schema
    total:
      type: integer
      description: Total matching records
    page:
      type: integer
      description: Current page number
    pageSize:
      type: integer
      description: Items per page
    totalPages:
      type: integer
      description: Total number of pages
```

---

## Authentication Endpoints (Modified)

### POST /admin/auth/login (Modified)

Added: refresh token in httpOnly cookie, account lockout handling.

```yaml
/admin/auth/login:
  post:
    summary: Admin login
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [email, password]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                minLength: 8
    responses:
      '200':
        description: Authenticated
        headers:
          Set-Cookie:
            description: httpOnly refresh token cookie
            schema:
              type: string
        content:
          application/json:
            schema:
              type: object
              properties:
                accessToken:
                  type: string
                  description: JWT access token (1h expiry, store in memory)
                user:
                  $ref: '#/components/schemas/AuthUser'
      '401':
        description: Invalid credentials
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
                message:
                  type: string
                  example: "Invalid credentials"
      '423':
        description: Account locked
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
                  example: "Account locked"
                message:
                  type: string
                  example: "Account locked due to too many failed attempts. Try again in 15 minutes."
                lockedUntil:
                  type: string
                  format: date-time
```

### POST /admin/auth/refresh (New)

```yaml
/admin/auth/refresh:
  post:
    summary: Refresh access token using httpOnly cookie
    description: Uses the refresh token from the httpOnly cookie to issue a new access token and rotate the refresh token.
    responses:
      '200':
        description: Token refreshed
        headers:
          Set-Cookie:
            description: New rotated httpOnly refresh token cookie
            schema:
              type: string
        content:
          application/json:
            schema:
              type: object
              properties:
                accessToken:
                  type: string
                user:
                  $ref: '#/components/schemas/AuthUser'
      '401':
        description: Invalid or expired refresh token
```

### POST /admin/auth/logout (Modified)

```yaml
/admin/auth/logout:
  post:
    security:
      - bearerAuth: []
    summary: Admin logout — revokes refresh token family
    responses:
      '204':
        description: Logged out, refresh token cookie cleared
        headers:
          Set-Cookie:
            description: Cleared refresh token cookie
            schema:
              type: string
```

### POST /admin/auth/change-password (New)

```yaml
/admin/auth/change-password:
  post:
    security:
      - bearerAuth: []
    summary: Change own password
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [currentPassword, newPassword]
            properties:
              currentPassword:
                type: string
              newPassword:
                type: string
                minLength: 8
    responses:
      '200':
        description: Password changed
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Password changed successfully"
      '400':
        description: Invalid current password or weak new password
      '401':
        description: Not authenticated
```

---

## Dashboard Endpoints (New)

### GET /admin/dashboard/stats (New)

```yaml
/admin/dashboard/stats:
  get:
    security:
      - bearerAuth: []
    summary: Dashboard statistics — all stat card data
    description: Returns counts for pages, gallery items, submissions, and redirects. Each metric is fetched independently; partial failure returns null for failed metrics.
    responses:
      '200':
        description: Dashboard statistics
        content:
          application/json:
            schema:
              type: object
              properties:
                pages:
                  type: object
                  nullable: true
                  properties:
                    total:
                      type: integer
                    published:
                      type: integer
                    draft:
                      type: integer
                gallery:
                  type: object
                  nullable: true
                  properties:
                    total:
                      type: integer
                    published:
                      type: integer
                    draft:
                      type: integer
                submissions:
                  type: object
                  nullable: true
                  properties:
                    total:
                      type: integer
                    today:
                      type: integer
                redirects:
                  type: object
                  nullable: true
                  properties:
                    total:
                      type: integer
                    active:
                      type: integer
                    inactive:
                      type: integer
```

### GET /admin/dashboard/submissions-chart (New)

```yaml
/admin/dashboard/submissions-chart:
  get:
    security:
      - bearerAuth: []
    summary: 7-day submission volume for bar chart
    responses:
      '200':
        description: Daily submission counts
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  date:
                    type: string
                    format: date
                    description: ISO date string (YYYY-MM-DD)
                  count:
                    type: integer
              minItems: 7
              maxItems: 7
```

### GET /admin/dashboard/activity (New)

```yaml
/admin/dashboard/activity:
  get:
    security:
      - bearerAuth: []
    summary: Recent activity feed (latest 5 audit log entries)
    responses:
      '200':
        description: Activity feed
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/AuditLogEntry'
              maxItems: 5
```

---

## Pages Endpoints (Modified)

### GET /admin/pages (Modified — paginated)

```yaml
/admin/pages:
  get:
    security:
      - bearerAuth: []
    summary: List pages with pagination, search, sorting
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - $ref: '#/components/parameters/sortOrder'
      - name: sortBy
        in: query
        schema:
          type: string
          enum: [title, slug, publishStatus, lastModifiedAt, createdAt]
          default: lastModifiedAt
      - name: search
        in: query
        schema:
          type: string
        description: Search by title or slug
      - name: publishStatus
        in: query
        schema:
          type: string
          enum: [DRAFT, PUBLISHED]
    responses:
      '200':
        description: Paginated list of pages
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/Page'
```

### POST /admin/pages/{id}/duplicate (New)

```yaml
/admin/pages/{id}/duplicate:
  post:
    security:
      - bearerAuth: []
    summary: Duplicate a page with "-copy" slug suffix
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    responses:
      '201':
        description: Duplicated page
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Page'
      '404':
        description: Source page not found
      '409':
        description: Duplicate slug already exists
```

### PUT /admin/pages/{id} (Modified — optimistic locking)

```yaml
/admin/pages/{id}:
  put:
    security:
      - bearerAuth: []
    summary: Update page (with optimistic locking via version field)
    requestBody:
      required: true
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/PageWrite'
              - type: object
                required: [version]
                properties:
                  version:
                    type: integer
                    description: Current version for optimistic locking
    responses:
      '200':
        description: Updated page (version incremented)
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Page'
      '404':
        description: Page not found
      '409':
        description: Version conflict — content has changed externally
        content:
          application/json:
            schema:
              type: object
              properties:
                error:
                  type: string
                  example: "Version conflict"
                message:
                  type: string
                currentVersion:
                  type: integer
```

---

## Gallery Endpoints (Modified)

### GET /admin/gallery (Modified — paginated + filters)

```yaml
/admin/gallery:
  get:
    security:
      - bearerAuth: []
    summary: List gallery items with pagination, filtering, sorting
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - $ref: '#/components/parameters/sortOrder'
      - name: sortBy
        in: query
        schema:
          type: string
          enum: [title, category, publishStatus, projectDate, createdAt]
          default: createdAt
      - name: search
        in: query
        schema:
          type: string
        description: Search by title or caption
      - name: category
        in: query
        schema:
          type: string
          enum: [garden-room, house-extension]
      - name: publishStatus
        in: query
        schema:
          type: string
          enum: [DRAFT, PUBLISHED]
    responses:
      '200':
        description: Paginated list of gallery items
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/GalleryItem'
```

### POST /admin/gallery/bulk (New)

```yaml
/admin/gallery/bulk:
  post:
    security:
      - bearerAuth: []
    summary: Bulk operations on gallery items
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [ids, action]
            properties:
              ids:
                type: array
                items:
                  type: string
                minItems: 1
              action:
                type: string
                enum: [publish, delete, changeCategory]
              category:
                type: string
                enum: [garden-room, house-extension]
                description: Required when action is changeCategory
    responses:
      '200':
        description: Bulk operation result
        content:
          application/json:
            schema:
              type: object
              properties:
                affected:
                  type: integer
                  description: Number of items affected
      '400':
        description: Invalid request (e.g., missing category for changeCategory)
```

---

## Submissions Endpoints (Modified)

### GET /admin/submissions (Modified — paginated + filters)

```yaml
/admin/submissions:
  get:
    security:
      - bearerAuth: []
    summary: List submissions with pagination, date/source filtering
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - $ref: '#/components/parameters/sortOrder'
      - name: sortBy
        in: query
        schema:
          type: string
          enum: [createdAt, sourcePageSlug]
          default: createdAt
      - name: search
        in: query
        schema:
          type: string
        description: Search in form data payload
      - name: sourcePageSlug
        in: query
        schema:
          type: string
        description: Filter by source page slug
      - name: dateFrom
        in: query
        schema:
          type: string
          format: date
        description: Start date filter (inclusive)
      - name: dateTo
        in: query
        schema:
          type: string
          format: date
        description: End date filter (inclusive)
    responses:
      '200':
        description: Paginated list of submissions
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/Submission'
```

### GET /admin/submissions/export.csv (Modified — filter-aware)

```yaml
/admin/submissions/export.csv:
  get:
    security:
      - bearerAuth: []
    summary: Export filtered submissions as CSV
    parameters:
      - name: search
        in: query
        schema:
          type: string
      - name: sourcePageSlug
        in: query
        schema:
          type: string
      - name: dateFrom
        in: query
        schema:
          type: string
          format: date
      - name: dateTo
        in: query
        schema:
          type: string
          format: date
    responses:
      '200':
        description: CSV stream of filtered submissions
        content:
          text/csv:
            schema:
              type: string
              format: binary
```

---

## Redirects Endpoints (Modified)

### GET /admin/redirects (Modified — paginated)

```yaml
/admin/redirects:
  get:
    security:
      - bearerAuth: []
    summary: List redirects with pagination, search, sorting
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - $ref: '#/components/parameters/sortOrder'
      - name: sortBy
        in: query
        schema:
          type: string
          enum: [sourceSlug, destinationUrl, active, createdAt]
          default: createdAt
      - name: search
        in: query
        schema:
          type: string
        description: Search by source slug or destination URL
      - name: active
        in: query
        schema:
          type: boolean
        description: Filter by active status
    responses:
      '200':
        description: Paginated list of redirects
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/Redirect'
```

---

## FAQ Endpoints (Modified)

### GET /admin/faqs (Modified — paginated)

```yaml
/admin/faqs:
  get:
    security:
      - bearerAuth: []
    summary: List FAQs with pagination, sorted by displayOrder
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - name: search
        in: query
        schema:
          type: string
        description: Search by question text
    responses:
      '200':
        description: Paginated list of FAQs
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/FAQ'
```

### PUT /admin/faqs/reorder (New)

```yaml
/admin/faqs/reorder:
  put:
    security:
      - bearerAuth: []
    summary: Reorder FAQs by providing ordered IDs
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [orderedIds]
            properties:
              orderedIds:
                type: array
                items:
                  type: string
                description: FAQ IDs in desired display order
    responses:
      '200':
        description: Reorder complete
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "FAQ order updated"
      '400':
        description: Invalid ID list
```

---

## User Management Endpoints (New)

### GET /admin/users

```yaml
/admin/users:
  get:
    security:
      - bearerAuth: []
    summary: List admin users
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - name: search
        in: query
        schema:
          type: string
        description: Search by email
      - name: isActive
        in: query
        schema:
          type: boolean
    responses:
      '200':
        description: Paginated list of users
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/AdminUser'
```

### POST /admin/users

```yaml
  post:
    security:
      - bearerAuth: []
    summary: Create admin user
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [email, password, roleId]
            properties:
              email:
                type: string
                format: email
              password:
                type: string
                minLength: 8
              roleId:
                type: string
    responses:
      '201':
        description: User created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AdminUser'
      '400':
        description: Validation error
      '409':
        description: Email already exists
```

### PUT /admin/users/{id}

```yaml
/admin/users/{id}:
  put:
    security:
      - bearerAuth: []
    summary: Update admin user (role, active status)
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                format: email
              roleId:
                type: string
              isActive:
                type: boolean
              password:
                type: string
                minLength: 8
                description: Optional — only set if changing password
    responses:
      '200':
        description: User updated
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AdminUser'
      '400':
        description: Validation error (e.g., cannot deactivate last super_admin)
      '404':
        description: User not found
```

---

## Role Management Endpoints (New)

### GET /admin/roles

```yaml
/admin/roles:
  get:
    security:
      - bearerAuth: []
    summary: List roles with permissions
    responses:
      '200':
        description: List of roles
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/RoleWithPermissions'
```

### POST /admin/roles

```yaml
  post:
    security:
      - bearerAuth: []
    summary: Create a custom role
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name, permissionIds]
            properties:
              name:
                type: string
              description:
                type: string
              permissionIds:
                type: array
                items:
                  type: string
    responses:
      '201':
        description: Role created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RoleWithPermissions'
      '409':
        description: Role name already exists
```

### PUT /admin/roles/{id}

```yaml
/admin/roles/{id}:
  put:
    security:
      - bearerAuth: []
    summary: Update role permissions
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              description:
                type: string
              permissionIds:
                type: array
                items:
                  type: string
    responses:
      '200':
        description: Role updated
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RoleWithPermissions'
      '400':
        description: Cannot modify system role name
      '404':
        description: Role not found
```

### DELETE /admin/roles/{id}

```yaml
  delete:
    security:
      - bearerAuth: []
    summary: Delete a custom role
    responses:
      '204':
        description: Role deleted
      '400':
        description: Cannot delete system role or role with assigned users
      '404':
        description: Role not found
```

### GET /admin/permissions

```yaml
/admin/permissions:
  get:
    security:
      - bearerAuth: []
    summary: List all available permissions
    responses:
      '200':
        description: List of permissions
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Permission'
```

---

## Settings Endpoints (New)

### GET /admin/settings

```yaml
/admin/settings:
  get:
    security:
      - bearerAuth: []
    summary: List all settings, optionally filtered by group
    parameters:
      - name: group
        in: query
        schema:
          type: string
          enum: [general, appearance, notifications]
    responses:
      '200':
        description: List of settings
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Setting'
```

### PUT /admin/settings

```yaml
  put:
    security:
      - bearerAuth: []
    summary: Batch update settings
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [settings]
            properties:
              settings:
                type: array
                items:
                  type: object
                  required: [key, value]
                  properties:
                    key:
                      type: string
                    value:
                      type: string
    responses:
      '200':
        description: Settings updated
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Setting'
      '400':
        description: Invalid setting key or value
```

---

## Audit Log Endpoints (New)

### GET /admin/audit-log

```yaml
/admin/audit-log:
  get:
    security:
      - bearerAuth: []
    summary: List audit log entries
    parameters:
      - $ref: '#/components/parameters/page'
      - $ref: '#/components/parameters/pageSize'
      - name: userId
        in: query
        schema:
          type: string
      - name: entity
        in: query
        schema:
          type: string
      - name: action
        in: query
        schema:
          type: string
      - name: dateFrom
        in: query
        schema:
          type: string
          format: date
      - name: dateTo
        in: query
        schema:
          type: string
          format: date
    responses:
      '200':
        description: Paginated audit log
        content:
          application/json:
            schema:
              allOf:
                - $ref: '#/components/schemas/PaginatedResponse'
                - type: object
                  properties:
                    items:
                      type: array
                      items:
                        $ref: '#/components/schemas/AuditLogEntry'
```

---

## New Component Schemas

```yaml
components:
  schemas:
    AuthUser:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        role:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
        permissions:
          type: array
          items:
            type: string
          description: Flat list of "resource:action" strings (e.g., "pages:edit")

    AdminUser:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        role:
          type: object
          properties:
            id:
              type: string
            name:
              type: string
        isActive:
          type: boolean
        lastLoginAt:
          type: string
          format: date-time
          nullable: true
        createdAt:
          type: string
          format: date-time

    RoleWithPermissions:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
          nullable: true
        isSystem:
          type: boolean
        permissions:
          type: array
          items:
            $ref: '#/components/schemas/Permission'

    Permission:
      type: object
      properties:
        id:
          type: string
        resource:
          type: string
        action:
          type: string
        description:
          type: string
          nullable: true

    AuditLogEntry:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        userEmail:
          type: string
        action:
          type: string
        entity:
          type: string
        entityId:
          type: string
          nullable: true
        changes:
          type: object
          nullable: true
        ipAddress:
          type: string
        createdAt:
          type: string
          format: date-time

    Setting:
      type: object
      properties:
        id:
          type: string
        key:
          type: string
        value:
          type: string
        group:
          type: string
        description:
          type: string
          nullable: true

    # Extended existing schemas
    Page:
      # Added fields to existing Page schema:
      type: object
      properties:
        # ... existing fields ...
        publishStatus:
          type: string
          enum: [DRAFT, PUBLISHED]
        version:
          type: integer

    PageWrite:
      # Added fields to existing PageWrite schema:
      type: object
      properties:
        # ... existing fields ...
        publishStatus:
          type: string
          enum: [DRAFT, PUBLISHED]
        version:
          type: integer
          description: Required for updates (optimistic locking)
```
