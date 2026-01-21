# Admin Page Design Document

**Project:** Modular House Web Application  
**Version:** 1.0  
**Author:** Senior Web Architect  
**Date:** January 20, 2026  
**Status:** Draft

---

## Executive Summary

After reviewing the current admin implementation, I've identified several critical gaps and opportunities for improvement. The existing admin panel functions but lacks a cohesive design system, proper UX patterns, accessibility considerations, and scalability for future features. This document outlines a comprehensive redesign that will transform the admin experience into a professional-grade content management system.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Design System](#3-design-system)
4. [Component Specifications](#4-component-specifications)
5. [Page Layouts](#5-page-layouts)
6. [Security & Authentication](#6-security--authentication)
7. [Performance Considerations](#7-performance-considerations)
8. [Accessibility (WCAG 2.1 AA)](#8-accessibility-wcag-21-aa)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Technical Specifications](#10-technical-specifications)

---

## 1. Current State Analysis

### 1.1 Tech Stack

| Layer    | Technology                                                 |
| -------- | ---------------------------------------------------------- |
| Frontend | React 18 + TypeScript + Vite                               |
| Routing  | react-router-dom v6                                        |
| Styling  | Bootstrap 5 + inline Tailwind-style classes (inconsistent) |
| Forms    | react-hook-form + Zod validation                           |
| State    | Local component state (useState)                           |
| API      | Custom apiClient with JWT authentication                   |
| Package  | Monorepo with pnpm workspaces                              |

### 1.2 Existing Features

| Feature | Status | Issues Identified |
|---------|--------|-------------------|
| Login | ✅ Functional | No password recovery, no session timeout, basic styling |
| Dashboard | ⚠️ Partial | Only links to other pages, no metrics or quick actions |
| Pages Management | ⚠️ Partial | Inline editing only, no preview, no version history |
| Gallery Management | ✅ Functional | Lacks bulk operations, no drag-drop reordering |
| Submissions | ✅ Functional | Basic table view, limited filtering |
| Redirects | ✅ Functional | Adequate for current needs |

### 1.3 Critical Gaps
- **No unified navigation system** - Each page implements its own header
- **No responsive design** - Admin unusable on tablets/mobile
- **No loading states/skeletons** - Jarring user experience
- **No error boundaries** - Uncaught errors crash the entire admin
- **No audit logging** - Who changed what and when is unknown
- **No role-based access control** (RBAC) - Single admin role only
- **No dark mode** - Missing modern UX expectation
- **No keyboard navigation** - Accessibility concern

---

## 2. Architecture Overview

### 2.1 Admin Module Structure

```
apps/web/src/
├── routes/admin/
│   ├── _layout.tsx           # Shared admin layout (NEW)
│   ├── index.tsx             # Dashboard
│   ├── login.tsx             # Authentication
│   ├── guard.tsx             # Route protection
│   ├── pages/
│   │   ├── index.tsx         # Pages list
│   │   ├── [id]/edit.tsx     # Page editor
│   │   └── sections/         # Section editors
│   ├── gallery/
│   │   ├── index.tsx         # Gallery list
│   │   └── [id]/edit.tsx     # Item editor
│   ├── submissions/
│   │   ├── index.tsx         # Submissions list
│   │   └── [id]/detail.tsx   # Submission detail
│   ├── redirects/
│   │   └── index.tsx         # Redirects CRUD
│   ├── faqs/                  # (NEW)
│   │   ├── index.tsx         # FAQ management
│   │   └── [id]/edit.tsx     # FAQ editor
│   ├── users/                 # (NEW)
│   │   ├── index.tsx         # User management
│   │   └── [id]/edit.tsx     # User editor
│   └── settings/              # (NEW)
│       ├── index.tsx         # General settings
│       └── profile.tsx       # User profile
├── components/admin/          # (NEW) Admin-specific components
│   ├── AdminLayout/
│   ├── Sidebar/
│   ├── TopBar/
│   ├── DataTable/
│   ├── FormBuilder/
│   ├── ImageManager/
│   ├── RichTextEditor/
│   └── Charts/
└── hooks/admin/               # (NEW) Admin-specific hooks
    ├── useAdminAuth.ts
    ├── useDataTable.ts
    └── useAutoSave.ts
```

### 2.2 State Management

```
┌─────────────────────────────────────────────────────┐
│                   Admin Context                      │
├──────────────┬──────────────┬───────────────────────┤
│ Auth State   │ UI State     │ Cache State           │
│ - user       │ - sidebar    │ - pages[]             │
│ - token      │ - theme      │ - gallery[]           │
│ - roles      │ - alerts     │ - submissions[]       │
│ - expiry     │ - modals     │ - invalidation        │
└──────────────┴──────────────┴───────────────────────┘
```

---

## 3. Design System

### 3.1 Color Palette

#### Light Theme
```css
:root {
  /* Primary */
  --admin-primary-50: #EEF2FF;
  --admin-primary-100: #E0E7FF;
  --admin-primary-500: #6366F1;  /* Main interactive */
  --admin-primary-600: #4F46E5;  /* Hover state */
  --admin-primary-700: #4338CA;  /* Active state */

  /* Neutral */
  --admin-gray-50: #F9FAFB;
  --admin-gray-100: #F3F4F6;
  --admin-gray-200: #E5E7EB;
  --admin-gray-300: #D1D5DB;
  --admin-gray-500: #6B7280;
  --admin-gray-700: #374151;
  --admin-gray-900: #111827;

  /* Semantic */
  --admin-success: #10B981;
  --admin-warning: #F59E0B;
  --admin-error: #EF4444;
  --admin-info: #3B82F6;

  /* Surface */
  --admin-surface: #FEFEFE;
  --admin-background: #F3F4F6;
  --admin-border: #E5E7EB;
}
```

#### Dark Theme
```css
[data-theme="dark"] {
  --admin-primary-500: #818CF8;
  --admin-gray-50: #18181B;
  --admin-gray-100: #27272A;
  --admin-gray-700: #D4D4D8;
  --admin-gray-900: #FAFAFA;
  --admin-surface: #27272A;
  --admin-background: #18181B;
  --admin-border: #3F3F46;
}
```

### 3.2 Typography Scale

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Page Title | 30px | 700 | 1.2 |
| Section Title | 24px | 600 | 1.3 |
| Card Title | 18px | 600 | 1.4 |
| Body | 14px | 400 | 1.5 |
| Small | 12px | 400 | 1.5 |
| Caption | 11px | 500 | 1.4 |

### 3.3 Spacing System

```
4px  → xs
8px  → sm
12px → md
16px → lg
24px → xl
32px → 2xl
48px → 3xl
64px → 4xl
```

### 3.4 Shadow System

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
```

### 3.5 Border Radius

```
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-full: 9999px;
```

---

## 4. Component Specifications

### 4.1 Admin Layout Shell

```
┌────────────────────────────────────────────────────────────────┐
│ ┌──────────┐  Top Bar                                🔔 👤     │
│ │  Logo    │  ─────────────────────────────────────────────────│
│ └──────────┘  Breadcrumbs: Dashboard > Pages > Edit            │
├─────────────┬──────────────────────────────────────────────────┤
│             │                                                  │
│ Sidebar     │  Main Content Area                               │
│             │  ┌────────────────────────────────────────────┐  │
│ Dashboard	  │  │  Page Title              [Actions]         │  │
│ Pages		  │  │                                            │  │
│ Gallery     │  │  Content                                   │  │
│ Submissions │  │                                            │  │
│ Redirects   │  │                                            │  │
│ FAQs        │  │                                            │  │
│             │  │                                            │  │
│ ──────────  │  └────────────────────────────────────────────┘  │
│ Settings    │                                                  │
│ Users       │                                                  │
│             │                                                  │
└─────────────┴──────────────────────────────────────────────────┘
```

**Specifications:**

- Sidebar width: `256px` (collapsed: `64px`)
- Top bar height: `64px`
- Sidebar collapsible with hamburger icon
- Persistent across all admin routes
- Smooth transition animations (200ms ease)

### 4.2 Data Table Component

```tsx
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    column: string;
    direction: 'asc' | 'desc';
    onSort: (column: string) => void;
  };
  selection?: {
    selected: string[];
    onSelect: (ids: string[]) => void;
  };
  filters?: FilterConfig[];
  bulkActions?: BulkAction[];
  emptyState?: React.ReactNode;
  rowActions?: (row: T) => Action[];
}
```

**Features:**
- Column sorting (click header)
- Multi-row selection with checkbox
- Bulk actions toolbar (delete, export, status change)
- Inline search/filter
- Pagination with page size selector
- Loading skeleton state
- Empty state with illustration
- Responsive: horizontal scroll on mobile

### 4.3 Form Components

#### TextField
```tsx
<TextField
  label="Page Title"
  name="title"
  required
  maxLength={100}
  helpText="Used as the main heading on the page"
  error={errors.title?.message}
/>
```

#### Select
```tsx
<Select
  label="Status"
  options={[
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
  ]}
  value={status}
  onChange={setStatus}
/>
```

#### Rich Text Editor
```tsx
<RichTextEditor
  label="Content"
  value={content}
  onChange={setContent}
  toolbar={['bold', 'italic', 'link', 'list', 'heading']}
  maxLength={5000}
/>
```

### 4.4 Image Manager

```
┌─────────────────────────────────────────────────────┐
│  Select Image                              [Upload] │
├─────────────────────────────────────────────────────┤
│   Search images...                                  │
├─────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │     │ │     │ │     │ │     │                    │
│  │ img │ │ img │ │ img │ │ img │                    │
│  │     │ │     │ │     │ │     │                    │
│  └─────┘ └─────┘ └─────┘ └─────┘                    │
│                                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│  │     │ │     │ │     │ │     │                    │
│  │ img │ │ img │ │ img │ │ img │                    │
│  │     │ │     │ │     │ │     │                    │
│  └─────┘ └─────┘ └─────┘ └─────┘                    │
├─────────────────────────────────────────────────────┤
│                          [Cancel]  [Select Image]   │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Grid view of existing images
- Drag-and-drop upload zone
- Image preview with metadata
- Alt text editing
- Lazy loading with blur placeholders
- Selection highlight

### 4.5 Toast Notifications

```tsx
toast.success('Page saved successfully');
toast.error('Failed to delete item', { action: { label: 'Retry', onClick: retry } });
toast.info('Auto-saved 2 minutes ago');
```

**Positioning:** Bottom-right, stacked vertically  
**Duration:** 5 seconds (configurable)  
**Max visible:** 3

---

## 5. Page Layouts

### 5.1 Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  Dashboard                                        [Refresh]      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐  │
│  │   Pages     │ │   Gallery   │ │ Submissions │ │  Redirects │  │
│  │     8       │ │    24       │ │    156      │ │     12     │  │
│  │  +2 draft   │ │  +5 draft   │ │  +12 today  │ │ 2 inactive │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────┐ ┌──────────────────────────┐│
│  │  Submissions This Week          │ │  Recent Activity         ││
│  │  📊 [Bar Chart]                 │ │  • Page "About" edited   ││
│  │                                 │ │    2 hours ago           ││
│  │                                 │ │  • New submission        ││
│  │                                 │ │    3 hours ago           ││
│  │                                 │ │  • Image uploaded        ││
│  │                                 │ │    Yesterday             ││
│  └─────────────────────────────────┘ └──────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Quick Actions                                              │ │
│  │  [+ New Page] [+ Add Gallery Item] [Export Submissions]     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Widgets:**
1. **Stat Cards** - Key metrics with trend indicators
2. **Submissions Chart** - 7-day bar chart using lightweight chart library
3. **Recent Activity** - Last 5 system activities
4. **Quick Actions** - Common tasks

### 5.2 Pages List

```
┌─────────────────────────────────────────────────────────────┐
│  Pages                                        [+ New Page]  │
├─────────────────────────────────────────────────────────────┤
│  🔍 Search pages...              [Filter ▼]  [Sort ▼]      │
├─────────────────────────────────────────────────────────────┤
│  ☐ │ Title          │ Slug        │ Last Modified │ Actions│
│  ──┼────────────────┼─────────────┼───────────────┼────────│
│  ☐ │ Home           │ /           │ Jan 15, 2026  │ ⋯      │
│  ☐ │ Garden Room    │ /garden-room│ Jan 14, 2026  │ ⋯      │
│  ☐ │ House Extension│ /house-ext..│ Jan 10, 2026  │ ⋯      │
│  ☐ │ Gallery        │ /gallery    │ Jan 8, 2026   │ ⋯      │
│  ☐ │ About Us       │ /about      │ Jan 5, 2026   │ ⋯      │
├─────────────────────────────────────────────────────────────┤
│  ◀ Prev                   Page 1 of 2              Next ▶  │
└─────────────────────────────────────────────────────────────┘
```

**Row Actions (⋯ menu):**
- Edit
- Preview (opens in new tab)
- Duplicate
- Delete

### 5.3 Page Editor

```
┌─────────────────────────────────────────────────────────────┐
│  ◀ Back to Pages    Edit: Garden Room     [Preview] [Save] │
├───────────────────────────────────┬─────────────────────────┤
│                                   │  SEO & Settings         │
│  Page Content                     │                         │
│  ┌─────────────────────────────┐  │  SEO Title              │
│  │ Title                       │  │  [Garden Rooms | ... ]  │
│  │ [Garden Room              ] │  │                         │
│  └─────────────────────────────┘  │  Meta Description       │
│                                   │  [Transform your ...  ] │
│  ┌─────────────────────────────┐  │  [0/160 chars]          │
│  │ Hero Headline               │  │                         │
│  │ [Transform Your Garden    ] │  │  ───────────────────    │
│  └─────────────────────────────┘  │                         │
│                                   │  Hero Image             │
│  ┌─────────────────────────────┐  │  ┌────────────────────┐ │
│  │ Hero Subhead                │  │  │                    │ │
│  │ [Premium quality modular..] │  │  │   [Selected        │ │
│  └─────────────────────────────┘  │  │    Image]          │ │
│                                   │  │                    │ │
│  ── Sections ───────────────────  │  └────────────────────┘ │
│  ┌───────────────────────────┐    │  [Change Image]         │
│  │ § Feature Grid     [≡] [🗑]│    │                         │
│  └───────────────────────────┘    │                         │
│  ┌───────────────────────────┐    │                         │
│  │ § Testimonials     [≡] [🗑]│    │                         │
│  └───────────────────────────┘    │                         │
│  [+ Add Section]                  │                         │
│                                   │                         │
├───────────────────────────────────┴─────────────────────────┤
│  Last saved: Jan 15, 2026 at 2:34 PM        Auto-save: On   │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Two-column layout (content | sidebar)
- Collapsible sidebar on smaller screens
- Drag-and-drop section reordering
- Auto-save with debounce (3 seconds)
- Unsaved changes warning on navigation
- Preview opens current state in new tab

### 5.4 Gallery Management

```
┌─────────────────────────────────────────────────────────────┐
│  Gallery                              [Upload] [+ Add Item] │
├─────────────────────────────────────────────────────────────┤
│  [All] [Garden Room] [House Extension]   🔍 Search...       │
├─────────────────────────────────────────────────────────────┤
│  View: [Grid ▣] [List ☰]           Show: [All ▼] [Draft ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ ☐       │ │ ☐       │ │ ☐       │ │ ☐       │           │
│  │  [img]  │ │  [img]  │ │  [img]  │ │  [img]  │           │
│  │         │ │         │ │         │ │ DRAFT   │           │
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤           │
│  │ Title 1 │ │ Title 2 │ │ Title 3 │ │ Title 4 │           │
│  │ Garden  │ │ Garden  │ │ House   │ │ House   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ ☐       │ │ ☐       │ │ ☐       │ │ ☐       │           │
│  │  [img]  │ │  [img]  │ │  [img]  │ │  [img]  │           │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│  ☐ 2 selected   [Publish] [Delete] [Change Category]       │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Toggle between grid and list view
- Category filtering tabs
- Status filter (Published/Draft)
- Bulk selection with action bar
- Drag-and-drop reordering
- Click to edit modal

### 5.5 Submissions

```
┌─────────────────────────────────────────────────────────────┐
│  Submissions                                 [Export CSV]   │
├─────────────────────────────────────────────────────────────┤
│  Date Range: [Last 30 days ▼]  Source: [All pages ▼]       │
├─────────────────────────────────────────────────────────────┤
│  │ Date          │ Source       │ Name        │ Email      │
│  ├───────────────┼──────────────┼─────────────┼────────────│
│  │ Jan 15, 10:30 │ /contact     │ John Doe    │ john@...   │
│  │ Jan 14, 15:22 │ /garden-room │ Jane Smith  │ jane@...   │
│  │ Jan 14, 09:11 │ /contact     │ Mike Brown  │ mike@...   │
│  │ Jan 13, 18:45 │ /house-ext   │ Sarah Lee   │ sarah@...  │
│  │ Jan 12, 11:00 │ /contact     │ Tom Wilson  │ tom@...    │
├─────────────────────────────────────────────────────────────┤
│  Showing 1-10 of 156                      ◀ 1 2 3 ... 16 ▶ │
└─────────────────────────────────────────────────────────────┘
```

**Click row to expand details:**
```
┌─────────────────────────────────────────────────────────────┐
│  Submission Details                              [✕ Close]  │
├─────────────────────────────────────────────────────────────┤
│  Submitted: January 15, 2026 at 10:30 AM                    │
│  Source Page: /contact                                      │
│  IP Hash: a3b2c1...                                         │
│                                                             │
│  ── Form Data ────────────────────────────────────────────  │
│  Name: John Doe                                             │
│  Email: john@example.com                                    │
│  Phone: +44 123 456 7890                                    │
│  Message: I'm interested in a 5m x 4m garden room for       │
│           my home office. Could you provide a quote?        │
│                                                             │
│  ── Consent ──────────────────────────────────────────────  │
│  ✓ Agreed to privacy policy at submission time              │
│                                                             │
│                                            [Reply via Email]│
└─────────────────────────────────────────────────────────────┘
```

### 5.6 Settings Page (New)

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  General                                                ││
│  │  ────────────────────────────────────────────────────   ││
│  │  Site Name        [Modular House                     ]  ││
│  │  Contact Email    [info@modularhouse.co.uk           ]  ││
│  │  Default SEO Title[Modular House | Premium Garden ...]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Appearance                                             ││
│  │  ────────────────────────────────────────────────────   ││
│  │  Admin Theme      [Light ▼]                             ││
│  │  Sidebar          [Expanded ▼]                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Notifications                                          ││
│  │  ────────────────────────────────────────────────────   ││
│  │  Email on new submission    [✓]                         ││
│  │  Daily digest               [ ]                         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                                              [Save Changes] │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Security & Authentication

### 6.1 Enhanced Authentication Flow

```
┌──────────────┐     ┌───────────────┐      ┌──────────────┐
│   Login      │────▶│ Verify Creds  │────▶│ Issue JWT    │
│   Form       │     │ + Rate Limit  │      │ + Refresh    │
└──────────────┘     └───────────────┘      └──────────────┘
                            │
                            ▼ (on failure)
                     ┌───────────────┐
                     │ Lockout after │
                     │ 5 attempts    │
                     └───────────────┘
```

### 6.2 JWT Structure

```typescript
interface AdminJWT {
  userId: string;
  email: string;
  roles: ('admin' | 'editor' | 'viewer')[];
  permissions: string[];
  iat: number;
  exp: number;  // 1 hour
}

interface RefreshToken {
  userId: string;
  tokenFamily: string;
  exp: number;  // 7 days
}
```

### 6.3 Role-Based Access Control (RBAC)

| Role | Pages | Gallery | Submissions | Redirects | Users | Settings |
|------|-------|---------|-------------|-----------|-------|----------|
| **Admin** | CRUD | CRUD | Read/Export | CRUD | CRUD | CRUD |
| **Editor** | CRUD | CRUD | Read | Read | - | Read |
| **Viewer** | Read | Read | Read | Read | - | - |

### 6.4 Security Headers

```typescript
// Required headers for admin routes
const adminSecurityHeaders = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; script-src 'self'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};
```

### 6.5 Session Management

- **Access Token**: 1 hour expiry, stored in memory
- **Refresh Token**: 7 days expiry, httpOnly cookie
- **Idle Timeout**: 30 minutes - show warning at 25 min
- **Token Rotation**: Refresh token rotated on each use

---

## 7. Performance Considerations

### 7.1 Loading Strategy

| Component | Strategy |
|-----------|----------|
| Admin Shell | Eagerly loaded |
| Dashboard | Eagerly loaded |
| Other pages | Lazy loaded with `React.lazy()` |
| Data tables | Virtualized for >100 rows |
| Images | Lazy loaded with blur placeholder |

### 7.2 Caching Strategy

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

### 7.3 Bundle Size Targets

| Chunk | Max Size |
|-------|----------|
| Admin core | 100KB gzipped |
| Per-page chunk | 30KB gzipped |
| Rich text editor | 50KB gzipped (deferred) |
| Chart library | 25KB gzipped (deferred) |

### 7.4 API Optimization

- **Pagination**: Default 20 items, max 100
- **Partial responses**: `?fields=id,title,slug`
- **ETag support**: For list endpoints
- **Debounced search**: 300ms delay

---

## 8. Accessibility (WCAG 2.1 AA)

### 8.1 Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus forward |
| `Shift+Tab` | Move focus backward |
| `Enter/Space` | Activate button/link |
| `Escape` | Close modal/dropdown |
| `Arrow keys` | Navigate within component |
| `Ctrl+S` | Save (in editors) |

### 8.2 ARIA Requirements

```tsx
// Sidebar navigation
<nav aria-label="Admin navigation">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" aria-current={isActive ? 'page' : undefined}>
        Dashboard
      </a>
    </li>
  </ul>
</nav>

// Data table
<table role="grid" aria-label="Pages list" aria-describedby="pages-caption">
  <caption id="pages-caption" className="sr-only">
    List of content pages with title, slug, and last modified date
  </caption>
</table>

// Loading states
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

### 8.3 Color Contrast

- **Text on background**: Minimum 4.5:1
- **Large text (18px+)**: Minimum 3:1
- **UI components**: Minimum 3:1
- **Focus indicators**: 3:1 against adjacent colors

### 8.4 Focus Management

```tsx
// Modal focus trap
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector('button, input');
    firstFocusable?.focus();
  }
}, [isOpen]);

// After form submission
useEffect(() => {
  if (submitSuccess) {
    successMessageRef.current?.focus();
  }
}, [submitSuccess]);
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation
- [ ] Create `AdminLayout` component with sidebar
- [ ] Implement theme system (light/dark)
- [ ] Build core form components
- [ ] Set up admin-specific routing
- [ ] Add loading skeletons

### Phase 2: Dashboard & Navigation
- [ ] Build dashboard with stat widgets
- [ ] Implement activity feed
- [ ] Add quick actions
- [ ] Create breadcrumb component
- [ ] Add global search

### Phase 3: Data Tables
- [ ] Build generic `DataTable` component
- [ ] Add sorting, filtering, pagination
- [ ] Implement bulk selection
- [ ] Add export functionality
- [ ] Build empty states

### Phase 4: Enhanced Editors
- [ ] Rich text editor integration
- [ ] Image manager modal
- [ ] Section builder for pages
- [ ] Auto-save functionality
- [ ] Preview system

### Phase 5: Security & Polish
- [ ] Implement refresh token flow
- [ ] Add role-based UI rendering
- [ ] Session timeout warning
- [ ] Audit logging
- [ ] Error boundaries

### Phase 6: Testing & Documentation
- [ ] Unit tests for components
- [ ] Integration tests for flows
- [ ] Accessibility audit
- [ ] Performance audit
- [ ] User documentation

---

## 10. Technical Specifications

### 10.1 Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5..90.19",
    "@tanstack/react-table": "^8.21.3",
    "react-hot-toast": "^2.6.0",
    "@tiptap/react": "^2.11.5",
    "recharts": "^3.6.0",
    "date-fns": "^4.1.0",
    "@dnd-kit/core": "^6.3.1"
  }
}
```

### 10.2 API Endpoints Required

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/auth/refresh` | POST | Refresh access token |
| `/api/admin/auth/me` | GET | Get current user info |
| `/api/admin/dashboard/stats` | GET | Dashboard metrics |
| `/api/admin/activity` | GET | Recent activity log |
| `/api/admin/users` | GET/POST | User management |
| `/api/admin/users/:id` | GET/PUT/DELETE | User CRUD |
| `/api/admin/settings` | GET/PUT | Site settings |

### 10.3 Database Schema Additions

```prisma
model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  action    String   @db.VarChar(50)
  entity    String   @db.VarChar(50)
  entityId  String?  @map("entity_id") @db.Uuid
  changes   Json?
  ipAddress String   @map("ip_address") @db.VarChar(45)
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt(sort: Desc)])
  @@index([entity, entityId])
  @@map("audit_logs")
}

model Setting {
  key       String   @id @db.VarChar(100)
  value     Json
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  updatedBy String?  @map("updated_by") @db.Uuid

  @@map("settings")
}

model RefreshToken {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  tokenFamily String   @map("token_family") @db.Uuid
  expiresAt   DateTime @map("expires_at") @db.Timestamptz(6)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  revokedAt   DateTime? @map("revoked_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@index([userId, tokenFamily])
  @@map("refresh_tokens")
}
```

### 10.4 Environment Variables

```env
# Admin Configuration
ADMIN_SESSION_TIMEOUT_MINUTES=30
ADMIN_MAX_LOGIN_ATTEMPTS=5
ADMIN_LOCKOUT_DURATION_MINUTES=15
ADMIN_REFRESH_TOKEN_DAYS=7
ADMIN_ACCESS_TOKEN_HOURS=1
```

---

## Appendix A: Figma/Design File Structure

```
Admin Design System/
├── 🎨 Foundations/
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Icons
├── 🧩 Components/
│   ├── Buttons
│   ├── Forms
│   ├── Tables
│   ├── Cards
│   ├── Navigation
│   └── Feedback
├── 📐 Layouts/
│   ├── Shell
│   ├── Dashboard
│   ├── List View
│   └── Detail View
└── 📱 Responsive/
    ├── Desktop (1440px)
    ├── Tablet (768px)
    └── Mobile (375px)
```

---

## Appendix B: Component Library Reference

Recommended: Build on top of existing `@modular-house/ui` package, extending with admin-specific components. Consider using Radix UI primitives for accessibility.

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Project Manager | B. Shao | 21/01/2026 | B. Shao |
| Lead Developer | Z. Qiu | 21/01/2026 | Z. Qiu |

---

*This document is version-controlled. All changes must go through the design review process.*
