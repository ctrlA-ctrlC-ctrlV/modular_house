export {};

declare global {
  interface Window {
    /**
     * Google Analytics dataLayer array.
     * Used to push events and configuration to Google Tag Manager and Google Analytics.
     * We use unknown[] to comply with strict typing (no 'any') while acknowledging 
     * the dynamic nature of the data layer.
     */
    dataLayer: (IArguments | unknown[])[];

    /**
     * Google Analytics gtag function.
     * Used to configure and send events to Google Analytics.
     */
    gtag: (...args: unknown[]) => void;
  }
}
