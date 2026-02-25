import { useEffect } from 'react';

/**
 * Environment variable for the Google Analytics Tracking ID.
 * Defaults to an empty string if not configured, which disables tracking.
 * This constant enables centralized configuration and environment-specific deployments.
 */
export const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';

/**
 * Props for the GoogleTag component.
 */
interface GoogleTagProps {
  /**
   * The Google Analytics Tracking ID (e.g., G-XXXXXXXXXX).
   * When empty or undefined, the component will not inject any scripts.
   */
  trackingId: string;
}

/**
 * Google Analytics Tag Component.
 * 
 * Injects the Google Tag (gtag.js) script into the document head and initializes
 * the global window.dataLayer and window.gtag function.
 * 
 * This component follows the Open-Closed Principle by encapsulating the 
 * analytics implementation details, allowing it to be easily added or 
 * removed from layouts without modifying their internal logic extensively.
 * 
 * @param {GoogleTagProps} props - The component props.
 * @returns {null} This component does not render any visible UI.
 */
export const GoogleTag = ({ trackingId }: GoogleTagProps): null => {
  useEffect(() => {
    /**
     * Server-Side Rendering (SSR) Guard.
     * The 'document' object is not available during server-side rendering.
     * This check ensures the script injection only occurs in browser environments.
     */
    if (typeof document === 'undefined') {
      return;
    }

    /**
     * Early exit if no tracking ID is provided.
     * This allows the component to be safely included in layouts without
     * injecting tracking scripts when analytics is disabled or not configured.
     */
    if (!trackingId) {
      return;
    }

    // Unique identifier for the script element to prevent duplicate injections
    const scriptId = 'google-tag-script';

    // Prevent re-injection if the script already exists in the document
    if (document.getElementById(scriptId)) {
      return;
    }

    // Create the script element for the external Google Tag source
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;

    // Append the script to the document head
    document.head.appendChild(script);

    // Initialize the dataLayer array if it does not already exist
    window.dataLayer = window.dataLayer || [];

    // Define the gtag function to push arguments to the dataLayer
    window.gtag = function gtag(...args: unknown[]) {
      // Pushing the spread arguments ensures they are added as parameters to the dataLayer.
      // We rely on the fact that dataLayer supports Arrays in modern implementations.
      window.dataLayer.push(args);
    };

    // Initialize the tag with the current date
    window.gtag('js', new Date());

    // Configure the specific tracking ID
    window.gtag('config', trackingId);
  }, [trackingId]);

  return null;
};
