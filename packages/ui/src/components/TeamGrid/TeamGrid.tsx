/**
 * TeamGrid Component
 * =============================================================================
 *
 * PURPOSE:
 * A dark-themed section that displays team members in a responsive grid layout.
 * Each member is rendered with a circular avatar photograph, full name, job
 * title, and a short biography. The component sits on a near-black background
 * (`--brand-bg-dark`) to create strong visual contrast against surrounding
 * light sections and draw the viewer's focus to the people behind the brand.
 *
 * USE CASES:
 * - "Our Team" section on the About page.
 * - Leadership or advisory board pages.
 * - Contributor credits on community or open-source pages.
 *
 * ARCHITECTURE:
 * - Follows BEM naming convention for CSS class generation.
 * - A co-located internal component (`TeamMemberCard`) handles the rendering
 *   of a single team member. It is intentionally not exported — consumers
 *   interact only with the grid-level props.
 * - Strictly typed with no "any" usage; all props have explicit interfaces.
 * - Follows the Open-Closed Principle: the public interface is stable and
 *   additive-only, while internal rendering logic is isolated from callers.
 *
 * ACCESSIBILITY:
 * - Root `<section>` uses `aria-labelledby` pointing at the heading id.
 * - `<ul role="list">` is explicitly set because some CSS resets (notably
 *   Safari's VoiceOver) strip the implicit list role from styled lists.
 * - Heading hierarchy: `<h2>` for the section heading, `<h3>` for member names.
 * - Avatar images require descriptive `imageAlt` text (typically
 *   "Portrait of {name}, {role}").
 * - The grayscale filter applied to avatars is purely decorative and does not
 *   affect semantic content.
 * - All text against the `#1A1714` dark background meets WCAG AA contrast.
 *
 * =============================================================================
 */

import React, { useId } from 'react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import './TeamGrid.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   -----------------------------------------------------------------------------
   Publicly exported types form the stable contract for this component.
   ============================================================================= */

/**
 * Data shape for a single team member displayed within the grid.
 * The `id` field provides a stable React key and should be unique per member.
 */
export interface TeamMember {
  /** Stable unique identifier used as the React list key (e.g., slug of the name). */
  id: string;

  /** Full name of the team member. */
  name: string;

  /** Job title or role within the organisation. */
  role: string;

  /** Short biography — one or two sentences describing the member's expertise. */
  bio: string;

  /** Avatar image source URL (fallback format, typically JPEG or PNG). */
  imageSrc: string;

  /** Optional WebP variant URL for optimised loading. */
  imageWebP?: string;

  /** Optional AVIF variant URL for optimised loading. */
  imageAvif?: string;

  /**
   * Alt text for the avatar image.
   * Recommended pattern: "Portrait of {name}, {role}".
   */
  imageAlt: string;
}

/**
 * Props contract for the TeamGrid component.
 *
 * Required props enforce the minimum data needed for a valid render.
 * Optional props carry sensible defaults documented via JSDoc tags.
 */
export interface TeamGridProps {
  /** Uppercase eyebrow label displayed above the section heading. */
  eyebrow: string;

  /** Main section heading rendered as an `<h2>` element. */
  heading: string;

  /**
   * Array of team member data objects to display in the grid.
   * The component supports any number of members; layout behaviour for
   * 1-4 members is optimised in the responsive CSS grid.
   */
  members: TeamMember[];

  /** Optional CSS class name appended to the root `<section>` element. */
  className?: string;

  /** Optional id attribute for anchor linking and `aria-labelledby` binding. */
  id?: string;
}

/* =============================================================================
   SECTION 2: INTERNAL CARD COMPONENT
   -----------------------------------------------------------------------------
   Co-located, non-exported component responsible for rendering a single
   team member card. Extracted to keep the grid's render method focused
   on layout concerns.
   ============================================================================= */

/**
 * Props for the internal TeamMemberCard component.
 * Receives only the fields required to render one member's card.
 */
interface TeamMemberCardProps {
  /** Full name of the team member. */
  name: string;
  /** Job title or role. */
  role: string;
  /** Short biography text. */
  bio: string;
  /** Avatar image source URL (fallback format). */
  imageSrc: string;
  /** Optional WebP variant URL. */
  imageWebP?: string;
  /** Optional AVIF variant URL. */
  imageAvif?: string;
  /** Alt text for the avatar image. */
  imageAlt: string;
}

/**
 * TeamMemberCard (internal)
 *
 * Renders a single team member's card containing a circular avatar photograph,
 * name, role, and biography. The avatar uses the shared `OptimizedImage`
 * component with lazy loading enabled.
 *
 * The avatar container includes a subtle ring border derived from the brand
 * accent colour at reduced opacity. The image starts in grayscale and
 * transitions to full colour on hover (handled via CSS).
 */
const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  name,
  role,
  bio,
  imageSrc,
  imageWebP,
  imageAvif,
  imageAlt,
}) => (
  <article className="team-member">
    {/* Avatar container: circular with an accent-coloured ring border */}
    <div className="team-member__avatar">
      <OptimizedImage
        src={imageSrc}
        srcSetWebP={imageWebP}
        srcSetAvif={imageAvif}
        alt={imageAlt}
        imgClassName="team-member__image"
        width={192}
        height={192}
      />
    </div>

    {/* Member name: rendered as <h3> to maintain proper heading hierarchy */}
    <h3 className="team-member__name">{name}</h3>

    {/* Role label: uppercase styled to match brand eyebrow pattern */}
    <p className="team-member__role">{role}</p>

    {/* Biography: concise description of the member's background */}
    <p className="team-member__bio">{bio}</p>
  </article>
);

/* =============================================================================
   SECTION 3: MAIN COMPONENT IMPLEMENTATION
   ============================================================================= */

/**
 * TeamGrid
 *
 * Renders a dark-themed section with a header block (eyebrow + heading) above
 * a responsive grid of team member cards. The grid reflows from 4 columns on
 * desktop to 2 on tablet and 1 on mobile with centered alignment.
 *
 * @param props - Configuration conforming to TeamGridProps
 * @returns A `<section>` element containing the header and team member grid
 */
export const TeamGrid: React.FC<TeamGridProps> = ({
  eyebrow,
  heading,
  members,
  className,
  id,
}) => {
  /**
   * Generate a stable, unique id for the heading element.
   * If the consumer provides an explicit `id` prop, derive the heading id
   * from it. Otherwise, React's `useId` hook produces a collision-free id.
   */
  const reactId = useId();
  const headingId = id ? `${id}-heading` : `team-grid-heading-${reactId}`;

  /**
   * Assemble the root element's CSS class list using BEM methodology:
   * - Block: `team-grid`
   * - Consumer-provided className appended last for override specificity.
   */
  const rootClassName = [
    'team-grid',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      className={rootClassName}
      id={id}
      aria-labelledby={headingId}
    >
      <div className="team-grid__inner">

        {/* Section header: eyebrow label and heading */}
        <header className="team-grid__header">
          <span className="team-grid__eyebrow">
            {eyebrow}
          </span>
          <h2 className="team-grid__heading" id={headingId}>
            {heading}
          </h2>
        </header>

        {/* Team member grid rendered as a semantic list */}
        <ul className="team-grid__list" role="list">
          {members.map((member) => (
            <li className="team-grid__item" key={member.id}>
              <TeamMemberCard
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageSrc={member.imageSrc}
                imageWebP={member.imageWebP}
                imageAvif={member.imageAvif}
                imageAlt={member.imageAlt}
              />
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
};
