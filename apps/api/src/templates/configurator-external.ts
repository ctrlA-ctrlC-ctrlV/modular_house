/**
 * Configurator External (Customer) Email Template
 * =============================================================================
 *
 * PURPOSE:
 * Generates the HTML and plain-text confirmation email sent to a customer
 * after they submit a configurator quote request on modularhouse.ie. The
 * email confirms their configuration choices, displays the generated quote
 * number, and sets expectations for the next step (team follow-up within
 * 24 hours).
 *
 * DESIGN DECISIONS:
 * - The visual design follows an Apple-inspired clean aesthetic to match
 *   the configurator confirmation screen (Task B5).
 * - All CSS is applied inline because major email clients (Outlook, Gmail,
 *   Yahoo) strip or ignore <style> blocks in the <head>.
 * - The layout uses table-based markup for broad email client compatibility,
 *   including Microsoft Outlook which renders HTML via the Word engine.
 * - Colours and typography align with the Modular House brand palette
 *   (#2c5282 primary blue, #111827 body text, #f9fafb subtle backgrounds).
 * - A plain-text fallback is always generated for clients that do not
 *   render HTML emails.
 *
 * =============================================================================
 */

import type {
  ConfiguratorAddonItem,
  EmailTemplateResult,
} from './configurator-internal.js';


/* =============================================================================
   SECTION 1: DATA CONTRACT
   -----------------------------------------------------------------------------
   Defines the data required to render the customer-facing confirmation
   email. Re-uses the ConfiguratorAddonItem interface from the internal
   template to maintain a single definition for add-on line items.
   ============================================================================= */

/**
 * Data payload required to build the customer-facing configurator
 * confirmation email. Fields closely mirror the internal template but
 * are scoped to what is appropriate to share with the customer.
 */
export interface ConfiguratorExternalEmailData {
  /** Generated quote reference displayed prominently in the email. */
  readonly quoteNumber: string;

  /* -- Customer ----------------------------------------------------------- */
  /** Customer's first name, used in the greeting. */
  readonly firstName: string;

  /* -- Product configuration ---------------------------------------------- */
  /** Display name of the configured product (e.g. "The Studio"). */
  readonly productName: string;
  /** Formatted dimension string (e.g. "5m x 5m"). */
  readonly productDimensions: string;
  /** Name of the selected exterior cladding finish. */
  readonly exteriorFinish: string;
  /** Name of the selected interior wall finish. */
  readonly interiorFinish: string;
  /** Selected add-ons with names and individual prices. */
  readonly addons: ReadonlyArray<ConfiguratorAddonItem>;
  /** Total configured price in euro cents (base + add-ons). */
  readonly totalCents: number;
}


/* =============================================================================
   SECTION 2: UTILITY HELPERS
   -----------------------------------------------------------------------------
   Pure helper functions for formatting values within the template.
   ============================================================================= */

/**
 * Formats a value in euro cents as a human-readable EUR currency string
 * using the Irish English locale.
 *
 * @param cents - Price in euro cents (e.g. 150000 for EUR 1,500.00).
 * @returns Formatted currency string (e.g. "EUR 1,500.00").
 */
function formatEurCents(cents: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

/**
 * Escapes HTML-special characters to prevent rendering issues in
 * email client HTML engines.
 *
 * @param text - Raw string potentially containing HTML-special characters.
 * @returns Escaped string safe for insertion into HTML content.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


/* =============================================================================
   SECTION 3: TEMPLATE BUILDER
   -----------------------------------------------------------------------------
   Assembles the complete customer confirmation email. The layout is
   structured as a centred single-column card with clearly separated
   sections for the greeting, quote badge, configuration summary,
   follow-up message, and company footer.
   ============================================================================= */

/**
 * Builds the customer-facing confirmation email for a configurator
 * submission. The email thanks the customer by name, displays their
 * quote number prominently, summarises their configuration, and
 * informs them that the team will follow up within 24 hours.
 *
 * @param data - The customer-facing configurator submission data.
 * @returns An object containing the email subject, HTML body, and
 *          plain-text fallback.
 */
export function buildConfiguratorExternalEmail(
  data: ConfiguratorExternalEmailData
): EmailTemplateResult {
  const {
    quoteNumber,
    firstName,
    productName,
    productDimensions,
    exteriorFinish,
    interiorFinish,
    addons,
    totalCents,
  } = data;

  /* -- Subject line ------------------------------------------------------- */
  const subject = `Your Modular House Estimate -- ${quoteNumber}`;

  /* -- Formatted values --------------------------------------------------- */
  const formattedTotal = formatEurCents(totalCents);

  /* -- Add-ons HTML rows -------------------------------------------------- */
  const addonsHtmlRows = addons.length > 0
    ? addons
        .map(
          (addon) =>
            `<tr>
              <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">${escapeHtml(addon.name)}</td>
              <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatEurCents(addon.priceCents)}</td>
            </tr>`
        )
        .join('\n')
    : '';

  /* -- Add-ons section (only rendered when add-ons are present) ----------- */
  const addonsHtmlSection = addons.length > 0
    ? `
          <!-- Add-ons sub-section -->
          <tr>
            <td style="padding: 16px 24px 0 24px;">
              <p style="margin: 0 0 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Add-ons</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${addonsHtmlRows}
              </table>
            </td>
          </tr>`
    : '';

  /* -- Add-ons plain text ------------------------------------------------- */
  const addonsTextLines = addons.length > 0
    ? '\nAdd-ons:\n' + addons.map((a) => `  - ${a.name}: ${formatEurCents(a.priceCents)}`).join('\n')
    : '';

  /* -- HTML body ---------------------------------------------------------- */
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">

  <!-- Outer wrapper for centering -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Main card container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

          <!-- Brand header -->
          <tr>
            <td style="background-color: #2c5282; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">Modular House</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 24px 16px 24px; text-align: center;">
              <h2 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 400; color: #111827; line-height: 1.4;">Thank you for chosing Modular House, ${escapeHtml(firstName)}</h2>
            </td>
          </tr>

          <!-- Quote number badge -->
          <tr>
            <td align="center" style="padding: 8px 24px 24px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #f0f4f8; border-radius: 8px; padding: 12px 24px; text-align: center;">
                    <p style="margin: 0 0 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Quote Number</p>
                    <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #2c5282; letter-spacing: 1px;">${escapeHtml(quoteNumber)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 24px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Product summary card -->
          <tr>
            <td style="padding: 24px 24px 0 24px;">
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your Configuration</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                <!-- Product name and dimensions -->
                <tr>
                  <td style="padding: 16px 20px 8px 20px;">
                    <h3 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 18px; font-weight: 600; color: #111827;">${escapeHtml(productName)}</h3>
                    <p style="margin: 4px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">${escapeHtml(productDimensions)}</p>
                  </td>
                </tr>
                <!-- Finishes -->
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280; width: 100px;">Exterior</td>
                        <td style="padding: 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; font-weight: 500;">${escapeHtml(exteriorFinish)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280;">Interior</td>
                        <td style="padding: 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; font-weight: 500;">${escapeHtml(interiorFinish)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Total -->
                <tr>
                  <td style="padding: 12px 20px 16px 20px; border-top: 1px solid #e5e7eb;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827;">Estimated Total</td>
                        <td style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 700; color: #166534; text-align: right;">${formattedTotal}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${addonsHtmlSection}

          <!-- Follow-up message -->
          <tr>
            <td style="padding: 28px 24px 8px 24px; text-align: center;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.6;">Our team will contact you within <strong>24 hours</strong> to discuss your project and arrange a site visit.</p>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding: 20px 24px 32px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #2c5282; border-radius: 24px;">
                    <a href="https://modularhouse.ie" style="display: inline-block; padding: 12px 32px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; letter-spacing: 0.3px;">Visit Our Website</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 24px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Footer with company contact details -->
          <tr>
            <td style="padding: 24px; background-color: #f9fafb; text-align: center;">
              <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #374151;">Modular House</p>
              <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280;">Premium Steel Frame Garden Rooms & House Extensions</p>
              <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280;">Dublin, Ireland</p>
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280;">
                <a href="https://modularhouse.ie" style="color: #2c5282; text-decoration: none;">modularhouse.ie</a>
              </p>
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #9ca3af;">This is an automated confirmation. Please do not reply to this email.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  /* -- Plain-text fallback ------------------------------------------------ */
  const text = `Your Garden Room Estimate -- ${quoteNumber}
${'='.repeat(50)}

Hi ${firstName},

Thank you for your estimate request. Here is a summary of your configuration:

Quote Number: ${quoteNumber}

YOUR CONFIGURATION
${'-'.repeat(40)}
Product:  ${productName}
Size:     ${productDimensions}
Exterior: ${exteriorFinish}
Interior: ${interiorFinish}
${addonsTextLines}

Estimated Total: ${formattedTotal}

I will contact you within 24 hours (Mon-Fri) to discuss your project and arrange a site visit.

${'='.repeat(50)}
Colin O'Sullivan
Business Development Manager
email: colin@modularhouse.ie
Mobile: 083 0280000
Address: Modular House, 
         Unit 8, Finches Business Park,
         Long Mile road
         Dublin 12, D12 N9YV

This is an automated confirmation. Please do not reply to this email.`;

  return { subject, html, text };
}
