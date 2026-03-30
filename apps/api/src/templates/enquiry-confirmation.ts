/**
 * Enquiry Confirmation (Customer) Email Template
 * =============================================================================
 *
 * PURPOSE:
 * Generates the HTML and plain-text confirmation email sent to a customer
 * after they submit an enquiry via the EnquiryFormModal component on any
 * page across the Modular House website. The email confirms receipt of
 * their enquiry, displays their quote reference, and sets expectations
 * for the follow-up timeline.
 *
 * SCOPE:
 * This is the customer-facing (external) confirmation only. Source page
 * origin and customer address are intentionally omitted from this
 * template as they are internal tracking concerns handled separately
 * by the internal notification template.
 *
 * DESIGN DECISIONS:
 * - All CSS is applied inline because major email clients (Outlook, Gmail,
 *   Yahoo) strip or ignore <style> blocks in the <head>.
 * - The layout uses table-based markup for broad email client compatibility,
 *   including Microsoft Outlook which renders HTML via the Word engine.
 * - Colours and typography align with the Modular House brand palette
 *   (#2c5282 primary blue, #111827 body text, #f9fafb subtle backgrounds).
 * - A plain-text fallback is always generated for clients that do not
 *   render HTML emails.
 * - The data contract is defined via a dedicated interface rather than
 *   re-using the Prisma model, keeping the template decoupled from the
 *   persistence layer (Open-Closed Principle).
 *
 * =============================================================================
 */

import type { EmailTemplateResult } from './configurator-internal.js';


/* =============================================================================
   SECTION 1: DATA CONTRACT
   -----------------------------------------------------------------------------
   Defines the minimal data required to render the customer-facing enquiry
   confirmation email. Fields are scoped to what is relevant for the
   customer's immediate confirmation needs only. Internal tracking fields
   such as source page origin and customer address are excluded.
   ============================================================================= */

/**
 * Data payload required to build the customer-facing enquiry confirmation
 * email. Fields are intentionally minimal -- only the customer's name,
 * an optional product interest, and the generated quote reference are
 * included to keep the confirmation concise and focused.
 */
export interface EnquiryConfirmationEmailData {
  /** Customer's first name, used in the greeting line. */
  readonly firstName: string;

  /**
   * The product the customer expressed interest in, if specified.
   * When present, it is displayed in the confirmation body to
   * acknowledge the customer's specific interest.
   * May be undefined for general enquiries without a specific product.
   */
  readonly preferredProduct?: string;

  /**
   * The generated quote reference number for the enquiry.
   * Displayed prominently so the customer can reference it in
   * future communications with the sales team.
   */
  readonly quoteNumber: string;
}


/* =============================================================================
   SECTION 2: UTILITY HELPERS
   -----------------------------------------------------------------------------
   Pure helper functions for formatting and escaping values within the
   template. Extracted here to keep the main builder function focused
   on structure and layout.
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
   Assembles the complete customer enquiry confirmation email. The layout
   mirrors the existing configurator-external template's brand styling
   but uses a simplified structure appropriate for general enquiries
   rather than product configuration summaries.
   
   Structure:
   1. Brand header with company name
   2. Personalised greeting with customer's first name
   3. Confirmation message (with optional product interest acknowledgement)
   4. Quote reference badge
   5. Next-steps message (24-hour follow-up commitment)
   6. Contact information for urgent queries
   7. Company footer with automated-email disclaimer
   ============================================================================= */

/**
 * Builds the customer-facing confirmation email for an enquiry
 * submitted through the EnquiryFormModal. The email thanks the
 * customer, displays their quote reference prominently, and
 * informs them of the follow-up timeline.
 *
 * @param data - The enquiry confirmation data payload.
 * @returns An object containing the email subject, HTML body, and
 *          plain-text fallback.
 */
export function buildEnquiryConfirmationEmail(
  data: EnquiryConfirmationEmailData
): EmailTemplateResult {
  const { firstName, preferredProduct, quoteNumber } = data;

  /* -- Subject line ------------------------------------------------------- */
  const subject = `Thank you for your enquiry - Modular House (${quoteNumber})`;

  /* -- Contextual body copy based on whether a product was specified ------- */
  const confirmationMessage = preferredProduct
    ? `Thank you for your interest in our <strong>${escapeHtml(preferredProduct)}</strong>. I have received your enquiry and I will be in touch within <strong>24 hours</strong> to discuss your requirements.`
    : `Thank you for your enquiry about our modular house solutions. I have received your details and I will be in touch within <strong>24 hours</strong> to discuss your requirements.`;

  /* -- Plain-text variant of the confirmation message --------------------- */
  const confirmationMessageText = preferredProduct
    ? `Thank you for your interest in our ${preferredProduct}. I have received your enquiry and I will be in touch within 24 hours to discuss your requirements.`
    : `Thank you for your enquiry about our modular house solutions. I have received your details and I will be in touch within 24 hours to discuss your requirements.`;

  /* -- Plain-text body ---------------------------------------------------- */
  const text = `
Dear ${firstName},

${confirmationMessageText}

Your Reference: ${quoteNumber}

If you have any urgent questions in the meantime, please feel free to contact us:
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

          <!-- Confirmation message (dynamically includes product name when available) -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.6;">
                ${confirmationMessage}
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

          <!-- Next steps with direct contact details for urgent queries -->
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

          <!-- Personal signature from the business development manager -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.6;">Best regards,</p>
              <p style="margin: 4px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #111827;">Colin O'Sullivan</p>
              <p style="margin: 2px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #6b7280;">Business Development Manager</p>
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
