export {};

declare global {
  interface Window {
    /**
     * Google Analytics dataLayer array.
     * Used to push events and configuration to Google Tag Manager and Google Analytics.
     * Accepts the three shapes emitted by the application:
     *   - `IArguments` from legacy `gtag(...)` calls.
     *   - `unknown[]` tuples pushed by bespoke integrations.
     *   - `Record<string, unknown>` objects for named GTM events
     *     (e.g. `{ event: 'promo_banner_view', ... }`).
     * We avoid `any` while acknowledging the intentionally dynamic nature of
     * the GTM data-layer contract.
     */
    dataLayer: (IArguments | unknown[] | Record<string, unknown>)[];

    /**
     * Google Analytics gtag function.
     * Used to configure and send events to Google Analytics.
     */
    gtag: (...args: unknown[]) => void;
  }
}
