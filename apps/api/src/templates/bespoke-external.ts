/**
 * Bespoke Enquiry External (Customer) Email Template
 * =============================================================================
 *
 * PURPOSE:
 * Generates the HTML and plain-text confirmation email sent to a customer
 * after they submit a bespoke enquiry via the BespokeHint component on
 * the product configurator page. This is a simple, standard acknowledgement
 * that confirms receipt and provides the quote reference. Configurator
 * details and bespoke request specifics are intentionally excluded from
 * the customer-facing email to keep it concise and professional.
 *
 * DISTINCTION FROM OTHER EXTERNAL TEMPLATES:
 * - configurator-external: Rich email with full product configuration
 *   summary, finishes, add-ons, and estimated total.
 * - enquiry-confirmation: Generic enquiry confirmation with an optional
 *   product interest mention.
 * - bespoke-external (this template): Minimal acknowledgement without
 *   product or configuration details. The customer already knows what
 *   they requested; the email simply confirms receipt and sets the
 *   24-hour follow-up expectation.
 *
 * DESIGN DECISIONS:
 * - All CSS is applied inline for email client compatibility.
 * - Table-based layout for Outlook Word engine rendering.
 * - Brand palette alignment (#2c5282 primary blue, #111827 body text).
 * - Plain-text fallback for non-HTML email clients.
 *
 * =============================================================================
 */

import type { EmailTemplateResult } from './configurator-internal.js';


/* =============================================================================
   SECTION 1: DATA CONTRACT
   -----------------------------------------------------------------------------
   Defines the minimal data required to render the customer-facing bespoke
   enquiry confirmation email. Only the customer's first name and the
   generated quote reference are needed.
   ============================================================================= */

/**
 * Data payload required to build the customer-facing bespoke enquiry
 * confirmation email. Intentionally minimal -- the customer does not
 * need their configuration details echoed back in this context.
 */
export interface BespokeExternalEmailData {
  /** Customer's first name, used in the greeting line. */
  readonly firstName: string;

  /**
   * The generated quote reference number.
   * Displayed prominently so the customer can reference it in
   * future communications with the sales team.
   */
  readonly quoteNumber: string;
}


/* =============================================================================
   SECTION 2: UTILITY HELPERS
   -----------------------------------------------------------------------------
   Pure helper functions for escaping values within the template.
   ============================================================================= */

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
   Assembles the customer-facing bespoke enquiry confirmation email.
   The layout is deliberately simple -- a branded header, personal
   greeting, quote reference, follow-up timeline, and contact details.
   No configurator context is included to avoid information overload.

   Structure:
   1. Brand header with company name
   2. Personalised greeting
   3. Confirmation message with 24-hour follow-up commitment
   4. Quote reference badge
   5. Direct contact details for urgent queries
   6. Company footer with automated-email disclaimer
   ============================================================================= */

/**
 * Builds the customer-facing confirmation email for a bespoke enquiry
 * submitted via the BespokeHint component. Provides a simple receipt
 * acknowledgement with the quote reference and follow-up timeline.
 *
 * @param data - The bespoke external email data payload.
 * @returns An object containing the email subject, HTML body, and
 *          plain-text fallback.
 */
export function buildBespokeExternalEmail(
  data: BespokeExternalEmailData
): EmailTemplateResult {
  const { firstName, quoteNumber } = data;

  /* -- Subject line ------------------------------------------------------- */
  const subject = `Thank you for your enquiry - Modular House (${quoteNumber})`;

  /* -- Plain-text body ---------------------------------------------------- */
  const text = `
Dear ${firstName},

Thank you for your enquiry with Modular House.

Your Reference: ${quoteNumber}

I have received your enquiry and I will be in touch with you within 24 hours to discuss your requirements.

If you have any urgent questions in the meantime, please feel free to contact me via:
  Phone: 083 028 0000
  Email: colin@modularhouse.ie

Best regards,
Colin O'Sullivan
Modular House

---
Reference: ${quoteNumber}
This is an automated confirmation. Please do not reply to this email.
  `.trim();

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

        <!-- Main card container (max 600px for optimal email rendering) -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

          <!-- Brand header with primary blue background -->
          <tr>
            <td style="background-color: #2c5282; padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">Modular House</h1>
            </td>
          </tr>

          <!-- Personalised greeting -->
          <tr>
            <td style="padding: 32px 24px 16px 24px;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #111827;">Dear ${escapeHtml(firstName)},</p>
            </td>
          </tr>

          <!-- Confirmation message -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.6;">
                Thank you for your enquiry with Modular House. I have received your enquiry and I will be in touch with you within <strong>24 hours</strong> to discuss your requirements.
              </p>
            </td>
          </tr>

          <!-- Quote reference badge for easy identification in follow-ups -->
          <tr>
            <td style="padding: 0 24px 24px 24px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 16px 32px; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Your Reference</p>
                    <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #2c5282; letter-spacing: 1px;">${escapeHtml(quoteNumber)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Direct contact details for urgent queries -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Need to Reach Us Sooner?</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151;">
                      <strong>Phone:</strong> <a href="tel:+353830280000" style="color: #2c5282; text-decoration: none;">083 028 0000</a>
                    </p>
                    <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151;">
                      <strong>Email:</strong> <a href="mailto:colin@modularhouse.ie" style="color: #2c5282; text-decoration: none;">colin@modularhouse.ie</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer with reference and automated-email disclaimer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #374151;">Modular House</p>
              <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280;">Premium Steel Frame Garden Rooms &amp; House Extensions</p>
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #6b7280;">Dublin, Ireland</p>
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #9ca3af;">
                Ref: ${escapeHtml(quoteNumber)} | This is an automated confirmation. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html, text };
}
