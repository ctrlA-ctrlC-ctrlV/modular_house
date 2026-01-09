# Component Navigation & Link Guidelines

## Overview

This document outlines the architectural standards for implementing navigation within shared UI components. By following these guidelines, strict separation of concerns between the **UI Library** (`packages/ui`) and the **Consumer Application** (`apps/web`) is maintained, ensuring components remain framework-agnostic, testable, and compliant with the Open-Closed Principle.

## Core Principles

1.  **Framework Agnosticism**: UI components must **never** import `react-router-dom`, `next/link`, or other application-level routing libraries.
2.  **Inversion of Control**: Navigation behavior is injected by the consumer via a `renderLink` prop.
3.  **Semantic HTML Default**: In the absence of an injected renderer, components must fallback to standard semantic `<a>` tags.
4.  **Strict Typing**: All link renderers must adhere to the shared `LinkRenderer` interface.

## Implementation Pattern

### 1. Defining the Type

Use the shared `LinkRenderer` type definition. This ensures consistent method signatures across all components.

```typescript
// packages/ui/src/types.ts

import React from 'react';

export type LinkRenderer = (props: { 
  href: string; 
  children: React.ReactNode; 
  className?: string; 
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  target?: string;
  rel?: string;
  'aria-label'?: string;
}) => React.ReactNode;
```

### 2. Component Implementation

Components accepting navigation props should expose the `renderLink` prop and use a helper component to determine the rendering output.

```tsx
// packages/ui/src/components/MyComponent/MyComponent.tsx

import React from 'react';
import { LinkRenderer } from '../../types';

export interface MyComponentProps {
  /** Destination URL */
  url: string;
  /** Link text or content */
  label: string;
  /** Optional custom link renderer for SPA navigation */
  renderLink?: LinkRenderer;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  url, 
  label, 
  renderLink 
}) => {
  
  /**
   * Internal helper to abstract the switching logic.
   * Renders the injected component if present, otherwise an native anchor.
   */
  const LinkItem: React.FC<{
    href: string;
    children: React.ReactNode;
  }> = ({ href, children }) => {
    if (renderLink) {
      // Return the result of the injected renderer
      // Note: We wrap in fragment to return a valid ReactNode
      return <>{renderLink({ href, children })}</>;
    }
    
    // Default fallback: Standard accessible anchor tag
    return (
      <a href={href}>
        {children}
      </a>
    );
  };

  return (
    <div className="component-wrapper">
      <LinkItem href={url}>
        <span className="label">{label}</span>
      </LinkItem>
    </div>
  );
};
```

### 3. Consumer Integration

The consuming application (e.g., `apps/web`) defines the specific implementation of `renderLink`, bridging the UI library with the Application's router.

```tsx
// apps/web/src/routes/Landing.tsx

import { Link } from 'react-router-dom';
import { MyComponent, type LinkRenderer } from '@modular-house/ui';

const LandingPage = () => {
    
  /**
   * Application-specific link renderer.
   * Maps the UI library's agnostic props to React Router's <Link>.
   */
  const renderLink: LinkRenderer = ({ href, children, className, onClick, ...rest }) => {
    return (
      <Link to={href} className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    );
  };

  return (
    <MyComponent 
      url="/about" 
      label="Learn More" 
      renderLink={renderLink} 
    />
  );
};
```

## Anti-Patterns

### ❌ Do Not Import Router in UI Package
```typescript
// BAD: Tightly couples UI package to a specific router version
import { Link } from 'react-router-dom'; 
```

### ❌ Do Not Use Imperative Navigation for Links
```typescript
// BAD: Hides navigation from crawlers and breaks command-click
const handleClick = () => navigate('/path');
<button onClick={handleClick}>Go</button>
```

### ❌ Do Not Use `any` for Props
```typescript
// BAD: Violates strict typing requirements
const renderLink = (props: any) => { ... }
```

## Accessibility Checklist

- [ ] Interactive elements that navigate **must** be rendered as `<a>` tags (or components that render to `<a>`).
- [ ] Links must have `href` attributes, even when handled by JavaScript interceptors.
- [ ] Images inside links must have `alt` text.
- [ ] Links opening in new tabs must have `rel="noopener noreferrer"`.
