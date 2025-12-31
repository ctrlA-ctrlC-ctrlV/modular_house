/**
 * HeaderContext.tsx
 * 
 * This module provides a React Context-based solution for managing header
 * configuration across the application. It allows individual page components
 * to customize the header's appearance (variant and positioning) without
 * tightly coupling the header component to specific routes.
 * 
 * Architecture Overview:
 * - HeaderProvider: Wraps the application layout and maintains header state
 * - useHeaderConfig: Hook for pages to read and update header configuration
 * - HeaderConfig: Interface defining available configuration options
 * 
 * This approach follows the Open-Closed Principle: new configuration options
 * can be added to HeaderConfig without modifying existing page components.
 */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { HeaderVariant } from '@modular-house/ui';

// ===========================================================================
// Types and Interfaces
// ===========================================================================

/**
 * HeaderConfig Interface
 * 
 * Defines the configuration options available for customizing the header
 * component's visual appearance and behavior. Each page can specify these
 * properties to adapt the header to its content requirements.
 */
export interface HeaderConfig {
  /**
   * Visual variant controlling the header's color scheme.
   * 
   * - 'dark': Renders white text on a dark or transparent background.
   *           Suitable for pages with hero images or dark backgrounds.
   * 
   * - 'light': Renders black text on a light or white background.
   *            Suitable for standard content pages with light backgrounds.
   */
  variant: HeaderVariant;

  /**
   * Controls whether the header overlays page content or occupies its own space.
   * 
   * - true: Header is absolutely positioned over the content below it.
   *         The background becomes transparent, allowing hero images to
   *         extend beneath the header. Common for landing pages.
   * 
   * - false: Header occupies its own vertical space in the document flow.
   *          The background color is solid. Common for standard pages.
   */
  positionOver: boolean;
}

/**
 * HeaderContextValue Interface
 * 
 * Defines the shape of the context value provided to consuming components.
 * Includes both the current configuration state and a method to update it.
 */
interface HeaderContextValue {
  /** Current header configuration state. */
  config: HeaderConfig;

  /**
   * Updates the header configuration with the provided partial values.
   * Only the specified properties will be updated; others remain unchanged.
   * 
   * @param config - Partial configuration object with properties to update
   */
  setHeaderConfig: (config: Partial<HeaderConfig>) => void;
}

// ===========================================================================
// Default Configuration
// ===========================================================================

/**
 * Default header configuration applied when no page-specific
 * configuration is set. These values represent the most common
 * header appearance for pages with hero sections.
 */
const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  variant: 'dark',
  positionOver: true,
};

// ===========================================================================
// Context Definition
// ===========================================================================

/**
 * HeaderContext
 * 
 * React Context instance for header configuration. Initialized as undefined
 * to enforce that consumers must be wrapped in a HeaderProvider.
 */
const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

// ===========================================================================
// Provider Component
// ===========================================================================

/**
 * Props for the HeaderProvider component.
 */
interface HeaderProviderProps {
  /** Child components that will have access to the header context. */
  children: ReactNode;
}

/**
 * HeaderProvider Component
 * 
 * Provides header configuration state and update functionality to all
 * descendant components. This component should wrap the application's
 * main layout component to enable page-level header customization.
 * 
 * Usage:
 * Place HeaderProvider at the layout level, typically in TemplateLayout.tsx,
 * to ensure all routed pages have access to header configuration.
 * 
 * @example
 * <HeaderProvider>
 *   <Header variant={config.variant} positionOver={config.positionOver} />
 *   <Outlet />
 * </HeaderProvider>
 */
export function HeaderProvider({ children }: HeaderProviderProps) {
  // State to hold the current header configuration
  const [config, setConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);

  /**
   * Memoized callback for updating header configuration.
   * Merges the new partial configuration with the existing state,
   * allowing pages to update only the properties they need to change.
   */
  const setHeaderConfig = useCallback((newConfig: Partial<HeaderConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
    }));
  }, []);

  return (
    <HeaderContext.Provider value={{ config, setHeaderConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}

// ===========================================================================
// Consumer Hook
// ===========================================================================

/**
 * useHeaderConfig Hook
 * 
 * Provides access to the header configuration context. Returns the current
 * configuration state and a function to update it.
 * 
 * This hook must be called within a component that is a descendant of
 * HeaderProvider. Calling it outside this context will throw an error.
 * 
 * @returns HeaderContextValue containing config state and setHeaderConfig function
 * @throws Error if called outside of HeaderProvider
 * 
 * @example
 * function ContactPage() {
 *   const { setHeaderConfig } = useHeaderConfig();
 *   
 *   useEffect(() => {
 *     // Apply light variant for this page
 *     setHeaderConfig({ variant: 'light', positionOver: false });
 *     
 *     // Reset to defaults when navigating away
 *     return () => {
 *       setHeaderConfig({ variant: 'dark', positionOver: true });
 *     };
 *   }, [setHeaderConfig]);
 *   
 *   return <div>Contact Page Content</div>;
 * }
 */
export function useHeaderConfig(): HeaderContextValue {
  const context = useContext(HeaderContext);
  
  if (context === undefined) {
    throw new Error(
      'useHeaderConfig must be used within a HeaderProvider. ' +
      'Ensure the component is wrapped in <HeaderProvider> in the layout.'
    );
  }
  
  return context;
}

// ===========================================================================
// Utility Hook (Optional)
// ===========================================================================

/**
 * usePageHeader Hook
 * 
 * A convenience hook for declaratively setting header configuration.
 * Intended for pages that have static header requirements.
 * 
 * Note: This hook applies configuration on initial render. For dynamic
 * requirements or cleanup behavior, use useHeaderConfig with useEffect directly.
 * 
 * @param pageConfig - Partial configuration to apply for this page
 * 
 * @example
 * function AboutPage() {
 *   usePageHeader({ variant: 'light', positionOver: false });
 *   return <div>About Page Content</div>;
 * }
 */
export function usePageHeader(pageConfig: Partial<HeaderConfig>): void {
  const { setHeaderConfig } = useHeaderConfig();
  
  // Apply page-specific configuration on component mount.
  // Note: useState with an initializer function runs only on first render.
  useState(() => {
    setHeaderConfig(pageConfig);
  });
}
