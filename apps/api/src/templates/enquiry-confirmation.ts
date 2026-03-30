/**
 * Enquiry Confirmation (Customer) Email Template
 * =============================================================================
 *
 * PURPOSE:
 * Generates the HTML and plain-text confirmation email sent to a customer
 * after they submit an enquiry via the EnquiryFormModal component on any
 * page across the Modular House website. The email confirms receipt of
 * their enquiry, reflects which page the form was submitted from, and
 * sets expectations for the follow-up timeline.
 *
 * ORIGIN TRACKING:
 * Unlike the generic contact page template, this template explicitly
 * includes the source page in both the subject line and body content.
 * This allows the customer to recall which page prompted their enquiry
 * and enables the sales team to tailor their follow-up accordingly.
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
   Defines the data required to render the customer-facing enquiry
   confirmation email. Each field maps to a value collected during the
   enquiry submission flow or derived by the backend from the submission
   record.
   ============================================================================= */

/**
 * Data payload required to build the customer-facing enquiry confirmation
 * email. Fields are intentionally minimal — only values relevant to the
 * customer's immediate confirmation needs are included.
 */
export interface EnquiryConfirmationEmailData {
  /** Customer's first name, used in the greeting line. */
  readonly firstName: string;

  /**
   * Human-readable label identifying the page where the enquiry form
   * was submitted (e.g. "Garden Room", "Product Configurator", "Landing").
   * Displayed in the email body so the customer can recall the context.
   */
  readonly sourcePageLabel: string;

  /**
   * The product the customer expressed interest in, if specified.
   * When present, it is displayed in the enquiry summary section.
   * May be undefined for general enquiries without a specific product.
   */
  readonly preferredProduct?: string;

  /**
   * The customer's address, if provided.
   * When present, it is displayed in the enquiry summary section.
   */
  readonly address?: string;

  /**
   * The generated quote reference number for the enquiry.
   * Displayed prominently so the customer can reference it in follow-ups.
   */
  readonly quoteNumber: string;
}


/* =============================================================================
   SECTION 2: SOURCE PAGE LABEL MAPPING
   -----------------------------------------------------------------------------
   Maps the internal sourcePageSlug values stored in the database to
   human-readable labels suitable for customer-facing email content.
   Unknown slugs fall back to a generic "Our Website" label.
   ============================================================================= */

/** Lookup table mapping source page slugs to customer-friendly labels. */
const SOURCE_PAGE_LABELS: Readonly<Record<string, string>> = {
  'contact': 'Contact Page',
  'landing': 'Home Page',
  'garden-room': 'Garden Room Page',
  'configurator': 'Product Configurator',
};

/**
 * Resolves a source page slug to a human-readable label for display
 * in customer-facing email content.
 *
 * @param slug - The internal source page slug (e.g. "garden-room").
 * @returns A customer-friendly label (e.g. "Garden Room Page").
 */
export function resolveSourcePageLabel(slug: string): string {
  return SOURCE_PAGE_LABELS[slug] ?? 'Our Website';
}


/* =============================================================================
   SECTION 3: UTILITY HELPERS
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
   SECTION 4: TEMPLATE BUILDER
   -----------------------------------------------------------------------------
   Assembles the complete customer enquiry confirmation email. The layout
   mirrors the existing configurator-external template's brand styling
   but uses a simplified structure appropriate for general enquiries
   rather than product configuration summaries.

   Structure:
   1. Brand header with company name
   2. Greeting with customer's first name
   3. Quote reference badge
   4. Enquiry summary (source page, product if specified, address if provided)
   5. Next-steps message (24-hour follow-up commitment)
   6. Contact information for urgent queries
   7. Company footer with automated-email disclaimer
   ============================================================================= */

/**
 * Builds the customer-facing confirmation email for an enquiry
 * submitted through the EnquiryFormModal. The email thanks the
 * customer, displays their quote reference, summarises the enquiry
 * origin, and informs them of the follow-up timeline.
 *
 * @param data - The enquiry confirmation data payload.
 * @returns An object containing the email subject, HTML body, and
 *          plain-text fallback.
 */
export function buildEnquiryConfirmationEmail(
  data: EnquiryConfirmationEmailData
): EmailTemplateResult {
  const {
    firstName,
    sourcePageLabel,
    preferredProduct,
    address,
    quoteNumber,
  } = data;

  /* -- Subject line ------------------------------------------------------- */
  const subject = `Thank you for your enquiry - Modular House (${quoteNumber})`;

  /* -- Optional summary rows (only rendered when values are present) ------- */
  const productRow = preferredProduct
    ? `
              <tr>
                <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Interested In</td>
                <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; text-align: right;">${escapeHtml(preferredProduct)}</td>
              </tr>`
    : '';

  const addressRow = address
    ? `
              <tr>
                <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Address</td>
                <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; text-align: right;">${escapeHtml(address)}</td>
              </tr>`
    : '';

  /* -- Plain-text body ---------------------------------------------------- */
  const text = `
Dear ${firstName},

Thank you for your enquiry with Modular House.

Your Reference: ${quoteNumber}
Enquiry Source: ${sourcePageLabel}${preferredProduct ? `\nInterested In: ${preferredProduct}` : ''}${address ? `\nAddress: ${address}` : ''}

I have received your enquiry and I will be in touch with you within 24 hours to discuss your requirements.

If you have any urgent questions in the meantime, please feel free to contact me via:
  Phone: 0830280000
  Email: colin@modularhouse.ie

Best regards,
Colin O'Sullivan

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
            <td style="padding: 32px 24px 16px 24px;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #111827;">Dear ${escapeHtml(firstName)},</p>
            </td>
          </tr>

          <!-- Confirmation message -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; line-height: 1.6;">
                Thank you for your enquiry about our modular house solutions. We have received your details and one of our team members will be in touch with you within 24 hours.
              </p>
            </td>
          </tr>

          <!-- Quote reference badge -->
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

          <!-- Enquiry summary section -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Enquiry Details</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Submitted From</td>
                  <td style="padding: 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #111827; border-bottom: 1px solid #f3f4f6; text-align: right;">${escapeHtml(sourcePageLabel)}</td>
                </tr>${productRow}${addressRow}
              </table>
            </td>
          </tr>

          <!-- Next steps -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <p style="margin: 0 0 12px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">What Happens Next</p>
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151; line-height: 1.6;">
               I have received your enquiry and I will be in touch with you within 24 hours to discuss your requirements. If you have any urgent questions in the meantime, please feel free to contact me directly.
              </p>
            </td>
          </tr>

          <!-- Contact details -->
          <tr>
            <td style="padding: 0 24px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151;">
                      <strong>Phone:</strong> <a href="tel:0830280000" style="color: #2c5282; text-decoration: none;">0830280000</a>
                    </p>
                    <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #374151;">
                      <strong>Email:</strong> <a href="mailto:colin@modularhouse.ie" style="color: #2c5282; text-decoration: none;">colin@modularhouse.ie</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af;">
                Reference: ${escapeHtml(quoteNumber)}
              </p>
              <p style="margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af;">
                This is an automated confirmation. Please do not reply to this email.
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
