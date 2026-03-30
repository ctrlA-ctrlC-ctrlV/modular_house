/**
 * Bespoke Enquiry Internal (Team) Email Template
 * =============================================================================
 *
 * PURPOSE:
 * Generates the HTML and plain-text notification email sent to the
 * internal Modular House sales team when a customer submits a bespoke
 * enquiry via the BespokeHint component on the product configurator
 * page. The email provides the full configurator context -- the product
 * the customer was viewing, their selected finishes, add-ons, and the
 * estimated total -- alongside the free-text bespoke message describing
 * any modifications or custom requirements the customer has in mind.
 *
 * DISTINCTION FROM OTHER TEMPLATES:
 * - configurator-internal: Standard configurator quote with all config
 *   details and scheduling preferences. Customer intends to proceed
 *   with the configured product as-is.
 * - enquiry (generic): General enquiry from the contact page or landing
 *   page with no configurator context.
 * - bespoke-internal (this template): Customer used the configurator but
 *   the existing product options did not fully meet their needs. The
 *   configurator state at the time of submission is preserved so the
 *   team can see what the customer was exploring before deciding to
 *   request a custom solution.
 *
 * DESIGN DECISIONS:
 * - All CSS is inlined for email client compatibility (Gmail, Outlook,
 *   Apple Mail strip <style> blocks).
 * - Table-based layout ensures rendering in Outlook's Word engine.
 * - Colours and typography align with the Modular House brand palette.
 * - A plain-text fallback is always generated alongside HTML.
 * - The data contract extends the configurator context with a required
 *   bespoke message field to capture the customer's custom request.
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
   Defines the data required to render the internal bespoke enquiry
   notification email. Combines customer contact details, the
   configurator state at the time of submission, and the free-text
   bespoke modification request.
   ============================================================================= */

/**
 * Complete data payload required to build the internal bespoke enquiry
 * notification email. All string fields are expected to be pre-sanitised
 * before being passed to the template builder.
 */
export interface BespokeInternalEmailData {
  /** Generated quote reference (e.g. "Q2610005"). */
  readonly quoteNumber: string;
  /** ISO-8601 date string of the submission timestamp. */
  readonly submittedAt: string;

  /* -- Customer contact details ------------------------------------------- */
  readonly firstName: string;
  readonly email: string;
  readonly phone: string;
  /** Customer's address, if provided during the bespoke enquiry form. */
  readonly address: string;

  /* -- Configurator context at time of submission ------------------------- */
  /** Display name of the product the customer was configuring. */
  readonly productName: string;
  /** Product dimensions as a formatted string (e.g. "5m x 5m"). */
  readonly productDimensions: string;
  /** Product floor area in square metres (e.g. "25"). */
  readonly productArea: string;
  /** Name of the selected exterior cladding finish, if any. */
  readonly exteriorFinish: string;
  /** Name of the selected interior wall finish, if any. */
  readonly interiorFinish: string;
  /** List of selected add-ons with individual prices at time of enquiry. */
  readonly addons: ReadonlyArray<ConfiguratorAddonItem>;
  /** Estimated total in euro cents from the configurator at time of enquiry. */
  readonly totalCents: number;

  /* -- Bespoke request ---------------------------------------------------- */
  /** Free-text message describing the customer's bespoke requirements. */
  readonly bespokeMessage: string;
}


/* =============================================================================
   SECTION 2: UTILITY HELPERS
   -----------------------------------------------------------------------------
   Pure helper functions for formatting and escaping values within the
   template. Extracted here to keep the main builder function focused
   on structure and layout.
   ============================================================================= */

/**
 * Formats a value in euro cents as a human-readable EUR string using
 * the Irish English locale.
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
 * Escapes HTML-special characters to prevent rendering issues or
 * injection in email client HTML engines.
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
   Assembles the complete internal bespoke enquiry notification email.
   The layout mirrors the existing configurator-internal template for
   visual consistency, but adds a prominent "Bespoke Request" section
   that highlights the customer's custom requirements and positions this
   email as a modification enquiry rather than a standard quote.

   Structure:
   1. Header with "Bespoke Enquiry" label and quote/date reference
   2. Customer contact details
   3. Bespoke request message (most important section for the team)
   4. Configurator context (product, finishes, add-ons, estimated total)
   5. Footer with automated-notification disclaimer
   ============================================================================= */

/**
 * Builds the internal team notification email for a bespoke enquiry
 * submitted via the BespokeHint component on the product configurator
 * page. Provides the sales team with the customer's bespoke request
 * alongside the configurator context they were viewing.
 *
 * @param data - The bespoke enquiry data payload.
 * @returns An object containing the email subject, HTML body, and
 *          plain-text fallback.
 */
export function buildBespokeInternalEmail(
  data: BespokeInternalEmailData
): EmailTemplateResult {
  const {
    quoteNumber,
    submittedAt,
    firstName,
    email,
    phone,
    address,
    productName,
    productDimensions,
    productArea,
    exteriorFinish,
    interiorFinish,
    addons,
    totalCents,
    bespokeMessage,
  } = data;

  /* -- Subject line (clearly labelled as bespoke for inbox scanning) ------ */
  const subject = `Bespoke Enquiry ${quoteNumber} from ${firstName} (via ${productName})`;

  /* -- Formatted values for display --------------------------------------- */
  const formattedTotal = formatEurCents(totalCents);
  const submissionDate = new Date(submittedAt).toLocaleString('en-IE', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  /* -- Add-ons HTML rows -------------------------------------------------- */
  const addonsHtmlRows = addons.length > 0
    ? addons
        .map(
          (addon) =>
            `<tr>
              <td style="padding: 6px 12px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6;">${escapeHtml(addon.name)}</td>
              <td style="padding: 6px 12px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatEurCents(addon.priceCents)}</td>
            </tr>`
        )
        .join('\n')
    : `<tr><td colspan="2" style="padding: 6px 12px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #9ca3af; border-bottom: 1px solid #f3f4f6;">No add-ons selected</td></tr>`;

  /* -- Add-ons plain-text lines ------------------------------------------- */
  const addonsTextLines = addons.length > 0
    ? addons.map((addon) => `  - ${addon.name}: ${formatEurCents(addon.priceCents)}`).join('\n')
    : '  None';

  /* -- HTML body ---------------------------------------------------------- */
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">

  <!-- Outer wrapper table for centering -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Main content container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header with amber accent to distinguish from standard configurator quotes -->
          <tr>
            <td style="background-color: #92400e; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">Bespoke Enquiry</h1>
              <p style="margin: 8px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #fde68a;">${escapeHtml(quoteNumber)} | ${escapeHtml(submissionDate)}</p>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding: 20px 24px 0 24px;">
              <h3 style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; width: 120px;">Name</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; font-weight: 600;">${escapeHtml(firstName)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Email</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;"><a href="mailto:${escapeHtml(email)}" style="color: #2c5282; text-decoration: none;">${escapeHtml(email)}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Phone</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;"><a href="tel:${escapeHtml(phone)}" style="color: #2c5282; text-decoration: none;">${escapeHtml(phone)}</a></td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Address</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;">${escapeHtml(address || 'Not provided')}</td>
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

          <!-- Bespoke Request (primary section -- positioned before config
               context so the team sees the customer's custom requirements
               immediately without scrolling past standard config details) -->
          <tr>
            <td style="padding: 20px 24px 0 24px;">
              <h3 style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Bespoke Request</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <div style="padding: 12px 16px; background-color: #fffbeb; border-left: 3px solid #92400e; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">${escapeHtml(bespokeMessage).replace(/\n/g, '<br>')}</div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 24px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Configurator Context -- shows the product configuration the
               customer was viewing when they decided to request a bespoke.
               Provides the team with a baseline understanding of the
               customer's general preferences and budget range. -->
          <tr>
            <td style="padding: 20px 24px 0 24px;">
              <h3 style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Configurator Context</h3>
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280;">Configuration the customer was viewing at time of bespoke enquiry</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; width: 120px;">Product</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; font-weight: 600;">${escapeHtml(productName)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Dimensions</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;">${escapeHtml(productDimensions)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Area</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;">${escapeHtml(productArea)} m&sup2;</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Exterior</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;">${escapeHtml(exteriorFinish)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Interior</td>
                  <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827;">${escapeHtml(interiorFinish)}</td>
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

          <!-- Add-ons from the configurator context -->
          <tr>
            <td style="padding: 20px 24px 0 24px;">
              <h3 style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Selected Add-ons</h3>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 12px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${addonsHtmlRows}
              </table>
            </td>
          </tr>

          <!-- Estimated Total from configurator context -->
          <tr>
            <td style="padding: 8px 24px 20px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 6px;">
                <tr>
                  <td style="padding: 12px 16px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #111827;">Configurator Estimate</td>
                  <td style="padding: 12px 16px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 700; color: #6b7280; text-align: right;">${formattedTotal}</td>
                </tr>
              </table>
              <p style="margin: 8px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; text-align: center;">Note: This total reflects the standard configuration. Bespoke pricing will differ.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; text-align: center;">This is an automated notification from the Modular House configurator.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  /* -- Plain-text fallback ------------------------------------------------ */
  const text = `${subject}
${'='.repeat(60)}

QUOTE: ${quoteNumber}
DATE:  ${submissionDate}

CUSTOMER DETAILS
${'-'.repeat(40)}
Name:    ${firstName}
Email:   ${email}
Phone:   ${phone}
Address: ${address || 'Not provided'}

BESPOKE REQUEST
${'-'.repeat(40)}
${bespokeMessage}

CONFIGURATOR CONTEXT
(Configuration the customer was viewing at time of bespoke enquiry)
${'-'.repeat(40)}
Product:    ${productName}
Dimensions: ${productDimensions}
Area:       ${productArea} m2
Exterior:   ${exteriorFinish}
Interior:   ${interiorFinish}

SELECTED ADD-ONS
${'-'.repeat(40)}
${addonsTextLines}

CONFIGURATOR ESTIMATE: ${formattedTotal}
(Note: This total reflects the standard configuration. Bespoke pricing will differ.)

${'='.repeat(60)}
This is an automated notification from the Modular House configurator.`;

  return { subject, html, text };
}
