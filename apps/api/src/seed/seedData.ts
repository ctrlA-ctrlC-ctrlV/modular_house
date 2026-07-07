// ============================================================================
// Shared RBAC seed data (roles, permissions, role→permission mapping).
// ============================================================================
// Single source of truth for the RBAC rows consumed by BOTH the production
// seed (`prisma/seed.ts`, run via `pnpm db:seed`) and the Vitest globalSetup
// (`src/test/globalSetup.ts`) that makes DB-dependent integration tests
// self-sufficient on a clean database. Keep the data here so the two paths
// can never drift.
// ============================================================================

/** Describes a system role to be seeded into the roles table. */
export interface RoleSeedEntry {
  name: string;
  description: string;
  isSystem: boolean;
}

/** Describes a granular permission to be seeded into the permissions table. */
export interface PermissionSeedEntry {
  resource: string;
  action: string;
  description: string;
}

// Four system roles with descending privilege levels. System roles
// (isSystem = true) cannot be deleted through the admin UI.
export const ROLES: ReadonlyArray<RoleSeedEntry> = [
  {
    name: 'super_admin',
    description: 'Full system access including user and role management',
    isSystem: true,
  },
  {
    name: 'admin',
    description: 'Full content management access',
    isSystem: true,
  },
  {
    name: 'editor',
    description: 'Content creation and editing, read-only submissions and redirects',
    isSystem: true,
  },
  {
    name: 'viewer',
    description: 'Read-only access to all content',
    isSystem: true,
  },
] as const;

// Each permission is a unique (resource, action) pair derived from
// data-model.md. Resources are admin-panel sections; actions are operations.
export const PERMISSIONS: ReadonlyArray<PermissionSeedEntry> = [
  // Pages — full CRUD
  { resource: 'pages', action: 'view', description: 'View pages list and details' },
  { resource: 'pages', action: 'create', description: 'Create new pages' },
  { resource: 'pages', action: 'edit', description: 'Edit existing pages' },
  { resource: 'pages', action: 'delete', description: 'Delete pages' },

  // Gallery — full CRUD
  { resource: 'gallery', action: 'view', description: 'View gallery items' },
  { resource: 'gallery', action: 'create', description: 'Upload gallery images' },
  { resource: 'gallery', action: 'edit', description: 'Edit gallery item metadata' },
  { resource: 'gallery', action: 'delete', description: 'Delete gallery items' },

  // FAQs — full CRUD
  { resource: 'faqs', action: 'view', description: 'View FAQ entries' },
  { resource: 'faqs', action: 'create', description: 'Create FAQ entries' },
  { resource: 'faqs', action: 'edit', description: 'Edit FAQ entries and reorder' },
  { resource: 'faqs', action: 'delete', description: 'Delete FAQ entries' },

  // Submissions — view and export only (no mutation)
  { resource: 'submissions', action: 'view', description: 'View form submissions' },
  { resource: 'submissions', action: 'export', description: 'Export submissions to CSV' },

  // Redirects — full CRUD
  { resource: 'redirects', action: 'view', description: 'View URL redirects' },
  { resource: 'redirects', action: 'create', description: 'Create URL redirects' },
  { resource: 'redirects', action: 'edit', description: 'Edit URL redirects' },
  { resource: 'redirects', action: 'delete', description: 'Delete URL redirects' },

  // Users — full CRUD (restricted to super_admin)
  { resource: 'users', action: 'view', description: 'View user accounts' },
  { resource: 'users', action: 'create', description: 'Create user accounts' },
  { resource: 'users', action: 'edit', description: 'Edit user accounts and assign roles' },
  { resource: 'users', action: 'delete', description: 'Deactivate or delete user accounts' },

  // Roles — full CRUD (restricted to super_admin)
  { resource: 'roles', action: 'view', description: 'View role definitions' },
  { resource: 'roles', action: 'create', description: 'Create custom roles' },
  { resource: 'roles', action: 'edit', description: 'Edit role permissions' },
  { resource: 'roles', action: 'delete', description: 'Delete non-system roles' },

  // Settings — view and edit only
  { resource: 'settings', action: 'view', description: 'View site settings' },
  { resource: 'settings', action: 'edit', description: 'Modify site settings' },

  // Audit Log — view only (immutable)
  { resource: 'audit_log', action: 'view', description: 'View audit log entries' },

  // Dashboard — view only
  { resource: 'dashboard', action: 'view', description: 'View admin dashboard' },
] as const;

/** Returns all permission keys as "resource:action" for the given role. */
export function getPermissionsForRole(roleName: string): ReadonlyArray<string> {
  switch (roleName) {
    // super_admin receives every permission in the system.
    case 'super_admin':
      return PERMISSIONS.map((p) => `${p.resource}:${p.action}`);

    // admin receives all content-management, settings, audit-log, and
    // dashboard permissions but not user or role management.
    case 'admin':
      return PERMISSIONS
        .filter((p) => !['users', 'roles'].includes(p.resource))
        .map((p) => `${p.resource}:${p.action}`);

    // editor receives full CRUD on content resources (pages, gallery, faqs),
    // read + export on submissions, and read-only on redirects and dashboard.
    case 'editor':
      return PERMISSIONS
        .filter((p) => {
          if (['pages', 'gallery', 'faqs'].includes(p.resource)) return true;
          if (p.resource === 'submissions') return true;
          if (p.resource === 'redirects' && p.action === 'view') return true;
          if (p.resource === 'dashboard' && p.action === 'view') return true;
          return false;
        })
        .map((p) => `${p.resource}:${p.action}`);

    // viewer receives only "view" actions on all viewable resources.
    case 'viewer':
      return PERMISSIONS
        .filter((p) => p.action === 'view')
        .map((p) => `${p.resource}:${p.action}`);

    default:
      return [];
  }
}
