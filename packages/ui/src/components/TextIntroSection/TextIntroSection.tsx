/**
 * TextIntroSection Component
 * =============================================================================
 *
 * PURPOSE:
 * A centred editorial introduction section used to establish narrative context
 * at the top of service or product pages. Renders an uppercase eyebrow label
 * flanked by decorative horizontal rules, a display heading, one or more body
 * paragraphs, and a bottom decorative divider.
 *
 * VISUAL DESIGN:
 * - Content is constrained to a max-width of 768px and centred horizontally,
 *   producing a narrow, readable column optimised for long-form prose.
 * - The eyebrow row uses a flex layout with two thin horizontal rules flanking
 *   a small uppercase label in the brand accent colour.
 * - The heading is rendered in the project's serif display typeface at a fluid
 *   size defined by the --text-heading-l design token.
 * - Body paragraphs are rendered in the sans-serif body typeface with relaxed
 *   line-height and secondary text colour for comfortable reading.
 * - A short horizontal divider at the bottom provides a visual full stop.
 *
 * ARCHITECTURE:
 * - Pure presentational component with no internal state.
 * - All text content is provided via strictly-typed props.
 * - The component does not set its own background colour; the consuming page
 *   controls the section background via a wrapper or the className prop.
 * - Follows BEM naming conventions consistent with the @modular-house/ui
 *   component library.
 * - Satisfies the Open-Closed Principle: extensible via className and children
 *   props without requiring source modifications.
 *
 * ACCESSIBILITY:
 * - Decorative rules and the bottom divider use aria-hidden="true" to exclude
 *   them from the accessibility tree.
 * - The heading is rendered as an <h2>, fitting within the standard page
 *   hierarchy of <h1> (hero) followed by <h2> (section headings).
 * - No interactive elements are present; no keyboard or focus handling needed.
 *
 * =============================================================================
 */

import React from 'react';
import './TextIntroSection.css';


/* =============================================================================
   Type Definitions
   ============================================================================= */

/**
 * Props for the TextIntroSection component.
 *
 * @property eyebrow    - Uppercase label displayed between decorative horizontal
 *                        rules (e.g. "WHY HOUSE EXTENSIONS").
 * @property title      - Section heading rendered as an <h2> in the display/serif font.
 * @property paragraphs - Array of body paragraph strings. Each string is rendered as
 *                        its own <p> element within the body container.
 * @property className  - Optional CSS class appended to the root <section> element,
 *                        enabling layout or background overrides from the consumer.
 */
export interface TextIntroSectionProps {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  className?: string;
}


/* =============================================================================
   Main Component
   ============================================================================= */

/**
 * TextIntroSection renders a centred editorial block consisting of an eyebrow
 * label, a display heading, body paragraphs, and a decorative divider.
 *
 * The component is intentionally stateless and accepts all content through
 * props, making it reusable across any page that requires a centred prose
 * introduction (e.g. About, Materials, Process pages).
 */
export const TextIntroSection: React.FC<TextIntroSectionProps> = ({
  eyebrow,
  title,
  paragraphs,
  className = '',
}) => {
  return (
    <section className={`text-intro-section ${className}`.trim()}>

      {/* Centred container — constrains content to 768px max-width */}
      <div className="text-intro-section__container">

        {/* Eyebrow row — flex container with decorative rules flanking the label */}
        <div className="text-intro-section__eyebrow-row">
          <div className="text-intro-section__rule" aria-hidden="true" />
          <span className="text-intro-section__eyebrow">{eyebrow}</span>
          <div className="text-intro-section__rule" aria-hidden="true" />
        </div>

        {/* Section heading — rendered as h2 to maintain page heading hierarchy */}
        <h2 className="text-intro-section__title">{title}</h2>

        {/* Body paragraphs — only rendered when paragraphs array is non-empty */}
        {paragraphs.length > 0 && (
          <div className="text-intro-section__body">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-intro-section__paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {/* Bottom divider — decorative horizontal line to visually close the section */}
        <div className="text-intro-section__divider" aria-hidden="true" />
      </div>
    </section>
  );
};

export default TextIntroSection;
