/**
 * OptimizedImage Component
 * =============================================================================
 *
 * PURPOSE:
 * A reusable, performance-first image component that implements industry best
 * practices for web image delivery.  It wraps a standard HTML <picture> element
 * and exposes a typed props interface that guides consumers towards correct usage.
 *
 * KEY OPTIMISATIONS IMPLEMENTED:
 *
 * 1. Modern format delivery via <picture> + <source>
 *    The component renders AVIF and WebP <source> elements before the fallback
 *    <img>.  Browsers that support AVIF (Chrome 85+, Firefox 93+) will download
 *    the smallest format; browsers that do not fall back automatically to WebP
 *    (all modern browsers), and legacy browsers receive the original format.
 *    Typical savings: AVIF is 50 % smaller than JPEG; WebP is 30 % smaller.
 *
 * 2. Responsive srcset
 *    When `srcSet` strings are provided for each format, the browser selects the
 *    most appropriate resolution for the user's viewport and device pixel ratio
 *    without any JavaScript overhead.
 *
 * 3. Cumulative Layout Shift (CLS) prevention
 *    Explicit `width` and `height` attributes allow the browser to calculate the
 *    aspect ratio before the image has downloaded, reserving the correct amount
 *    of space in the layout.  This is the primary fix for Core Web Vitals CLS.
 *
 * 4. Priority vs lazy loading
 *    The `priority` prop sets loading="eager" and fetchpriority="high" for
 *    above-the-fold images (e.g. the LCP hero).  All other images default to
 *    loading="lazy" and decoding="async", which defers off-screen downloads
 *    and frees the main thread.
 *
 * 5. Accessibility
 *    The `alt` prop is required (not optional) to enforce descriptive text for
 *    screen readers.  Decorative images should pass an empty string explicitly.
 *
 * ARCHITECTURE:
 * This component follows the Open-Closed Principle: the public interface
 * (OptimizedImageProps) is stable and additive-only, while internal rendering
 * logic is isolated from callers.  No "any" types are used.
 *
 * USAGE EXAMPLE:
 * ```tsx
 * <OptimizedImage
 *   src="/resource/landing_hero2.png"
 *   alt="Premium steel frame garden room exterior"
 *   width={1440}
 *   height={900}
 *   priority            // above-the-fold LCP image — eager + high priority
 *   className="hero-image"
 * />
 *
 * // With srcset for responsive images:
 * <OptimizedImage
 *   src="/resource/garden-room/garden-room2.png"
 *   alt="Garden room interior"
 *   width={800}
 *   height={600}
 *   srcSetWebP="/resource/garden-room/garden-room2.webp 800w, /resource/garden-room/garden-room2-400.webp 400w"
 *   sizes="(max-width: 768px) 100vw, 50vw"
 * />
 * ```
 *
 * =============================================================================
 */

import React from 'react';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Strict TypeScript interfaces with no implicit "any" types.
   All optional props include JSDoc descriptions for IDE tooling support.
   ============================================================================= */

/**
 * Props for the OptimizedImage component.
 *
 * The interface intentionally mirrors the subset of native <img> attributes
 * that callers are expected to control, while adding the image-optimisation
 * concerns (format sources, srcset strings, priority flag).
 */
export interface OptimizedImageProps {
  /**
   * Path or URL of the fallback image.
   * Should point to the original PNG/JPEG so legacy browsers always receive
   * a valid image even if they do not support modern formats.
   */
  src: string;

  /**
   * Descriptive alternative text for screen readers.
   * Required (not optional) to enforce accessibility compliance.
   * Pass an empty string "" for purely decorative images.
   */
  alt: string;

  /**
   * Intrinsic pixel width of the image.
   * Used by the browser to calculate the aspect ratio before the image loads,
   * preventing Cumulative Layout Shift (CLS).
   */
  width?: number;

  /**
   * Intrinsic pixel height of the image.
   * Used alongside `width` for CLS prevention.
   */
  height?: number;

  /**
   * srcset string for the AVIF format source.
   * Example: "/hero.avif 1440w, /hero-720.avif 720w"
   * When omitted, the AVIF <source> element is not rendered.
   */
  srcSetAvif?: string;

  /**
   * srcset string for the WebP format source.
   * Example: "/hero.webp 1440w, /hero-720.webp 720w"
   * When omitted, the WebP <source> element is not rendered.
   */
  srcSetWebP?: string;

  /**
   * The HTML `sizes` attribute shared across all <source> and <img> elements.
   * Tells the browser how wide the image will be rendered at each breakpoint
   * so it can select the most appropriate candidate from the srcset.
   * Example: "(max-width: 768px) 100vw, 50vw"
   */
  sizes?: string;

  /**
   * When true, marks this image as high-priority (above-the-fold / LCP).
   * Effect: sets loading="eager" and fetchpriority="high" on the <img>.
   * Use this for the hero image and any other image visible on first paint.
   * All other images default to loading="lazy" and fetchpriority="auto".
   */
  priority?: boolean;

  /**
   * Optional CSS class name applied to the outer <picture> element.
   * Use to apply layout or sizing styles from the parent context.
   */
  className?: string;

  /**
   * Optional CSS class name applied to the inner <img> element.
   * Use when img-specific styles (e.g. object-fit) are needed independently
   * of the <picture> wrapper.
   */
  imgClassName?: string;

  /**
   * Optional inline styles applied to the inner <img> element.
   */
  style?: React.CSSProperties;

  /**
   * Standard DOM click handler for interactive images.
   * Using React.MouseEvent<HTMLImageElement> instead of a custom type
   * ensures interoperability with native DOM events.
   */
  onClick?: (event: React.MouseEvent<HTMLImageElement>) => void;

  /**
   * Accessible label for the surrounding <picture> element.
   * Only required when the <picture> element itself needs a label for
   * assistive technologies (rare — normally the img alt text is sufficient).
   */
  ariaLabel?: string;
}


/* =============================================================================
   SECTION 2: COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * OptimizedImage
 *
 * Renders a <picture> element with optional AVIF and WebP <source> elements
 * ahead of the fallback <img>.  Handles loading priority, CLS prevention via
 * explicit dimensions, and responsive srcset delivery.
 *
 * @param props - Component configuration conforming to OptimizedImageProps
 * @returns JSX element representing the optimised picture / image markup
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  srcSetAvif,
  srcSetWebP,
  sizes,
  priority = false,
  className,
  imgClassName,
  style,
  onClick,
  ariaLabel,
}) => {
  /**
   * Derive the loading strategy from the priority flag.
   *
   * - "eager"  → browser fetches the image immediately, even if off-screen.
   *              Use for the LCP element (hero image, above-the-fold banner).
   *
   * - "lazy"   → browser defers the fetch until the image is near the viewport.
   *              This is the correct default for all below-the-fold images.
   */
  const loadingStrategy: 'eager' | 'lazy' = priority ? 'eager' : 'lazy';

  /**
   * fetchpriority hints to the browser how to order this request relative to
   * others.  "high" ensures the LCP image is not deprioritised behind scripts
   * or other assets that appear earlier in the document.
   *
   * Note: fetchpriority is a string-typed HTML attribute.  React 18 accepts it
   * directly on <img> elements as a non-standard prop; it is intentionally cast
   * to string to avoid TypeScript friction with older @types/react versions.
   */
  const fetchPriority: string = priority ? 'high' : 'auto';

  return (
    /*
     * The <picture> element acts as a format negotiation wrapper.
     * The browser evaluates <source> elements in document order and selects the
     * first whose `type` it supports.  The <img> at the end is always the
     * final fallback — it is also the element that triggers the actual download.
     */
    <picture
      className={className}
      aria-label={ariaLabel}
    >
      {/*
       * AVIF source — smallest file size, best compression.
       * Browser support: Chrome 85+, Firefox 93+, Safari 16.4+.
       * Only rendered when the caller provides a srcset for this format.
       */}
      {srcSetAvif && (
        <source
          type="image/avif"
          srcSet={srcSetAvif}
          sizes={sizes}
        />
      )}

      {/*
       * WebP source — excellent compression with near-universal modern support.
       * Browser support: all modern browsers.
       * Only rendered when the caller provides a srcset for this format.
       */}
      {srcSetWebP && (
        <source
          type="image/webp"
          srcSet={srcSetWebP}
          sizes={sizes}
        />
      )}

      {/*
       * Fallback <img> element.
       *
       * This element fulfils two roles:
       *   1. Provides the image for browsers that do not support AVIF or WebP.
       *   2. Acts as the actual download trigger selected by the <picture> logic.
       *
       * Attributes:
       * - width / height  → Reserve layout space before download (CLS fix).
       * - loading         → "eager" for LCP images, "lazy" for all others.
       * - decoding        → "async" always; offloads image decode from the main
       *                     thread, preventing jank during page interaction.
       * - fetchpriority   → "high" for LCP, "auto" for deferred images.
       */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loadingStrategy}
        decoding="async"
        // eslint-disable-next-line react/no-unknown-property
        fetchPriority={fetchPriority as 'high' | 'low' | 'auto'}
        className={imgClassName}
        style={style}
        onClick={onClick}
      />
    </picture>
  );
};
