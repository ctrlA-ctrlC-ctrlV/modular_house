/**
 * ComparisonSection Component
 * =============================================================================
 *
 * PURPOSE:
 * A marketing-focused comparison component that lets users evaluate three
 * construction methods side by side: LGS Steel Frame (the company's method),
 * Timber Frame, and Traditional Brick. Designed to transparently surface the
 * pros and cons of each approach while highlighting the advantages of light
 * gauge steel framing.
 *
 * ARCHITECTURE:
 * The component is data-driven: comparison categories and materials are
 * defined as typed arrays and passed as props. The two view modes ("Side by
 * Side" table view and "Deep Dive" card view) operate on the same data set,
 * giving users two complementary ways to explore the information.
 *
 * Internal sub-components (ScoreBar, CircleScore) handle animated visual
 * indicators and are not exported — they exist solely to serve this section.
 *
 * LAYOUT STRUCTURE:
 * - Header: Eyebrow, serif heading, intro paragraph (centred)
 * - View Toggle: Two buttons switching between table and card layouts
 * - Table View: CSS Grid comparison table with expandable note rows
 * - Card View: Material selector tabs + per-material detail card
 * - Bottom CTA: Closing statement with call-to-action button
 * - Disclaimer: Fine-print methodology note
 *
 * ACCESSIBILITY:
 * - The outer <section> uses aria-labelledby on the heading.
 * - Toggle buttons use aria-pressed to indicate active state.
 * - Expandable rows use aria-expanded and aria-controls.
 * - Score SVGs include accessible text via <title> elements.
 * - Focus-visible outlines are applied via CSS on interactive elements.
 *
 * BEM CLASS NAMING:
 * Block:    .comparison-section
 * Elements: __header, __eyebrow, __title, __subtitle, __description,
 *           __toggle, __toggle-btn, __table, __col-headers, __col-header,
 *           __featured-badge, __col-name, __row, __row-label, __row-arrow,
 *           __row-cell, __row-value, __score-bar, __score-bar-track,
 *           __score-bar-fill, __notes, __note-cell, __totals, __total-cell,
 *           __circle, __circle-track, __circle-fill, __circle-label,
 *           __circle-pct, __cards-nav, __card-btn, __card, __card-header,
 *           __card-title, __card-desc, __card-grid, __card-tile,
 *           __tile-header, __tile-label, __tile-score, __tile-value,
 *           __tile-note, __cta, __cta-eyebrow, __cta-heading, __cta-text,
 *           __cta-btn, __disclaimer
 * Modifiers: --active, --featured, --expanded, --strong
 *
 * =============================================================================
 */

import { useState, useEffect, useId } from 'react';
import './ComparisonSection.css';

/* =============================================================================
   SECTION 1: TYPE DEFINITIONS
   ============================================================================= */

/** Score data for a single material in one comparison category. */
export interface MaterialScore {
  /** Human-readable value label, e.g. "100+ years" */
  value: string;
  /** Numeric score from 1–5 */
  score: number;
  /** Short explanatory note revealed on expand */
  note: string;
}

/** A single comparison row (one category across all three materials). */
export interface ComparisonCategory {
  /** Category display name, e.g. "Lifespan" */
  label: string;
  /** Score data for the LGS steel frame method */
  lgs: MaterialScore;
  /** Score data for timber frame */
  wood: MaterialScore;
  /** Score data for traditional brick */
  brick: MaterialScore;
}

/** Colour and label metadata for a material column. */
export interface MaterialMeta {
  /** Data key matching ComparisonCategory fields */
  key: 'lgs' | 'wood' | 'brick';
  /** Display name, e.g. "LGS Steel Frame" */
  name: string;
  /** Brand colour hex string */
  color: string;
  /** Whether this is the company's featured method */
  featured?: boolean;
}

/** Props for the ComparisonSection component. */
export interface ComparisonSectionProps {
  /** Eyebrow text above the heading */
  eyebrow?: string;
  /** Main heading text */
  title?: string;
  /** Italic-styled heading accent (rendered after line break) */
  titleAccent?: string;
  /** Introductory paragraph below the heading */
  description?: string;
  /** Array of comparison categories (rows) */
  categories: ComparisonCategory[];
  /** Material column definitions (order determines column order) */
  materials?: MaterialMeta[];
  /** CTA section eyebrow */
  ctaEyebrow?: string;
  /** CTA section heading (HTML string with <em> allowed) */
  ctaHeading?: string;
  /** CTA section body text */
  ctaText?: string;
  /** CTA button label */
  ctaButtonLabel?: string;
  /** CTA button click handler */
  onCtaClick?: () => void;
  /** CTA button href (renders <a> instead of <button> when provided) */
  ctaHref?: string;
  /** Disclaimer text below the section */
  disclaimer?: string;
}

/* =============================================================================
   SECTION 2: DEFAULT DATA
   ============================================================================= */

const DEFAULT_MATERIALS: MaterialMeta[] = [
  { key: 'wood', name: 'Timber Frame', color: '#8B7355' },
  { key: 'lgs', name: 'LGS Steel Frame', color: '#B55329', featured: true },
  { key: 'brick', name: 'Traditional Brick', color: '#9B8579' },
];

/* =============================================================================
   SECTION 3: INTERNAL SUB-COMPONENTS
   ============================================================================= */

interface ScoreBarProps {
  score: number;
  color: string;
  delay: number;
}

/** Thin animated horizontal bar representing a score out of 5. */
function ScoreBar({ score, color, delay }: ScoreBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth((score / 5) * 100), delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="comparison-section__score-bar">
      <div
        className="comparison-section__score-bar-track"
        aria-hidden="true"
      >
        <div
          className="comparison-section__score-bar-fill"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="sr-only">{score} out of 5</span>
    </div>
  );
}

interface CircleScoreProps {
  score: number;
  max: number;
  color: string;
  label: string;
}

/** Animated SVG donut chart showing a total percentage score. */
function CircleScore({ score, max, color, label }: CircleScoreProps) {
  const pct = Math.round((score / max) * 100);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const t = setTimeout(() => setOffset(circ - (pct / 100) * circ), 500);
    return () => clearTimeout(t);
  }, [pct, circ]);

  return (
    <svg
      className="comparison-section__circle"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      role="img"
      aria-label={`${label}: ${pct}%`}
    >
      <title>{label}: {pct}%</title>
      <circle
        className="comparison-section__circle-track"
        cx="50" cy="50" r={r}
        fill="none" strokeWidth="5"
      />
      <circle
        className="comparison-section__circle-fill"
        cx="50" cy="50" r={r}
        fill="none" stroke={color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
      />
      <text
        className="comparison-section__circle-label"
        x="50" y="50"
        textAnchor="middle" dominantBaseline="central"
      >
        {pct}<tspan className="comparison-section__circle-pct">%</tspan>
      </text>
    </svg>
  );
}

/* =============================================================================
   SECTION 4: MAIN COMPONENT
   ============================================================================= */

export function ComparisonSection({
  eyebrow = 'Compare Construction Methods',
  title = 'Which Structure Is Right',
  titleAccent = 'for Your Home?',
  description = 'We believe in transparency. Here\u2019s how the three most popular construction methods compare across the metrics that matter most.',
  categories,
  materials = DEFAULT_MATERIALS,
  ctaEyebrow = 'The Bottom Line',
  ctaHeading = 'Every method has its place. But when you weigh the full picture \u2014 <em>one method consistently leads.</em>',
  ctaText = 'Our LGS frames are precision-manufactured right here in Dublin, delivering factory-level quality with none of the on-site guesswork.',
  ctaButtonLabel = 'Get a Free Quote',
  onCtaClick,
  ctaHref,
  disclaimer = 'Scores based on industry data, Irish building regulations, and 15+ years of construction experience.',
}: ComparisonSectionProps) {
  /**
   * State: tracks which category row is currently expanded to show detailed notes.
   * Only one row may be expanded at a time (accordion pattern).
   */
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  /** State: toggles between "table" (side-by-side) and "cards" (deep-dive) view modes. */
  const [activeView, setActiveView] = useState<'table' | 'cards'>('table');

  /**
   * State: tracks which material card is displayed in the card view.
   * Defaults to the featured material (typically LGS Steel Frame) or the first material.
   */
  const [activeCard, setActiveCard] = useState<string>(
    materials.find((m) => m.featured)?.key ?? materials[0].key,
  );

  /** Unique identifier for the section heading, used by aria-labelledby for accessibility. */
  const headingId = useId();

  /** Maximum possible score: number of categories multiplied by max score per category (5). */
  const maxScore = categories.length * 5;

  /**
   * Computes aggregate scores per material by summing individual category scores.
   * Used to display overall percentage scores in the CircleScore visualizations.
   */
  const totals: Record<string, number> = {};
  for (const m of materials) {
    totals[m.key] = categories.reduce((sum, cat) => sum + cat[m.key].score, 0);
  }

  /** Column order: wood, lgs, brick (matches materials array). */
  const columnKeys = materials.map((m) => m.key);

  /**
   * Pre-computed lookup map for O(1) material retrieval by key.
   * Eliminates the need for repeated find() calls and non-null assertions.
   */
  const materialsByKey = new Map(materials.map((m) => [m.key, m]));

  return (
    <section
      className="comparison-section"
      aria-labelledby={headingId}
    >
      <div className="comparison-section__inner">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="comparison-section__header">
          <span className="comparison-section__eyebrow">{eyebrow}</span>
          <h2 className="comparison-section__title" id={headingId}>
            {title}
            <br />
            <em className="comparison-section__subtitle">{titleAccent}</em>
          </h2>
          <p className="comparison-section__description">{description}</p>
        </header>

        {/* ── View Toggle ────────────────────────────────────────── */}
        <div className="comparison-section__toggle" role="group" aria-label="View mode">
          <button
            className={`comparison-section__toggle-btn${activeView === 'table' ? ' comparison-section__toggle-btn--active' : ''}`}
            aria-pressed={activeView === 'table'}
            onClick={() => setActiveView('table')}
          >
            Side by Side
          </button>
          <button
            className={`comparison-section__toggle-btn${activeView === 'cards' ? ' comparison-section__toggle-btn--active' : ''}`}
            aria-pressed={activeView === 'cards'}
            onClick={() => setActiveView('cards')}
          >
            Deep Dive
          </button>
        </div>

        {/* ── Table View ─────────────────────────────────────────── */}
        {activeView === 'table' && (
          <div className="comparison-section__table" role="table" aria-label="Construction method comparison">
            {/* Column headers */}
            <div className="comparison-section__col-headers" role="row">
              <div className="comparison-section__col-header comparison-section__col-header--label" role="columnheader">
                <span className="comparison-section__col-header-text">Category</span>
              </div>
              {materials.map((m) => (
                <div
                  key={m.key}
                  className={`comparison-section__col-header${m.featured ? ' comparison-section__col-header--featured' : ''}`}
                  role="columnheader"
                >
                  {m.featured && (
                    <span className="comparison-section__featured-badge">Our Method</span>
                  )}
                  <span
                    className="comparison-section__col-name"
                    style={{ color: m.color }}
                  >
                    {m.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {categories.map((cat, i) => {
              const isExpanded = expandedRow === i;
              const notesId = `comparison-notes-${i}`;

              return (
                <div className="comparison-section__row-group" key={i}>
                  <div
                    className="comparison-section__row"
                    role="row"
                    aria-expanded={isExpanded}
                    aria-controls={notesId}
                    tabIndex={0}
                    onClick={() => setExpandedRow(isExpanded ? null : i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedRow(isExpanded ? null : i);
                      }
                    }}
                  >
                    <div className="comparison-section__row-label" role="rowheader">
                      <span>{cat.label}</span>
                      <span
                        className={`comparison-section__row-arrow${isExpanded ? ' comparison-section__row-arrow--expanded' : ''}`}
                        aria-hidden="true"
                      >
                        ▼
                      </span>
                    </div>
                    {columnKeys.map((mk) => {
                      const data = cat[mk];
                      const mat = materialsByKey.get(mk);
                      if (!mat) return null;
                      return (
                        <div
                          key={mk}
                          className={`comparison-section__row-cell${mk === (materials.find((m) => m.featured)?.key) ? ' comparison-section__row-cell--featured' : ''}`}
                          role="cell"
                        >
                          <span
                            className={`comparison-section__row-value${data.score >= 4 ? ' comparison-section__row-value--strong' : ''}`}
                          >
                            {data.value}
                          </span>
                          <ScoreBar score={data.score} color={mat.color} delay={i * 80 + 200} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded notes */}
                  <div
                    id={notesId}
                    className={`comparison-section__notes${isExpanded ? ' comparison-section__notes--expanded' : ''}`}
                    role="row"
                    aria-hidden={!isExpanded}
                  >
                    <div className="comparison-section__note-cell comparison-section__note-cell--spacer" role="cell" />
                    {columnKeys.map((mk) => (
                      <div key={mk} className="comparison-section__note-cell" role="cell">
                        {cat[mk].note}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Totals row */}
            <div className="comparison-section__totals" role="row">
              <div className="comparison-section__total-cell comparison-section__total-cell--label" role="rowheader">
                <span className="comparison-section__col-header-text">Overall</span>
              </div>
              {materials.map((m) => (
                <div
                  key={m.key}
                  className={`comparison-section__total-cell${m.featured ? ' comparison-section__total-cell--featured' : ''}`}
                  role="cell"
                >
                  <CircleScore
                    score={totals[m.key]}
                    max={maxScore}
                    color={m.color}
                    label={`${m.name} overall score`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Card View ──────────────────────────────────────────── */}
        {activeView === 'cards' && (
          <>
            <nav className="comparison-section__cards-nav" aria-label="Select material">
              {materials.map((m) => (
                <button
                  key={m.key}
                  className={`comparison-section__card-btn${activeCard === m.key ? ' comparison-section__card-btn--active' : ''}`}
                  style={
                    activeCard === m.key
                      ? { backgroundColor: m.color, borderColor: m.color, color: 'var(--cs-color-white, #FEFEFE)' }
                      : { color: m.color, borderColor: 'var(--cs-color-border, #E5E7DE)' }
                  }
                  aria-pressed={activeCard === m.key}
                  onClick={() => setActiveCard(m.key)}
                >
                  {m.name}
                </button>
              ))}
            </nav>

            {materials
              .filter((m) => m.key === activeCard)
              .map((m) => (
                <div key={m.key} className="comparison-section__card">
                  <div className="comparison-section__card-header">
                    <div>
                      <h3
                        className="comparison-section__card-title"
                        style={{ color: m.color }}
                      >
                        {m.name}
                      </h3>
                      <p className="comparison-section__card-desc">
                        {m.key === 'lgs' &&
                          'Precision-engineered light gauge steel, manufactured in our Dublin factory. The modern standard for garden rooms and extensions.'}
                        {m.key === 'wood' &&
                          'Traditional timber construction \u2014 a familiar and well-understood approach, though one with known trade-offs in the Irish climate.'}
                        {m.key === 'brick' &&
                          'Masonry construction \u2014 time-tested and trusted, but increasingly outpaced on efficiency and cost by modern building methods.'}
                      </p>
                    </div>
                    <CircleScore
                      score={totals[m.key]}
                      max={maxScore}
                      color={m.color}
                      label={`${m.name} overall score`}
                    />
                  </div>

                  <div className="comparison-section__card-grid">
                    {categories.map((cat, i) => {
                      const data = cat[m.key];
                      return (
                        <article key={i} className="comparison-section__card-tile">
                          <div className="comparison-section__tile-header">
                            <span className="comparison-section__tile-label">
                              {cat.label}
                            </span>
                            <span
                              className="comparison-section__tile-score"
                              style={{ color: data.score >= 4 ? m.color : undefined }}
                            >
                              {data.score}/5
                            </span>
                          </div>
                          <div
                            className={`comparison-section__tile-value${data.score >= 4 ? ' comparison-section__tile-value--strong' : ''}`}
                          >
                            {data.value}
                          </div>
                          <ScoreBar score={data.score} color={m.color} delay={i * 60} />
                          <p className="comparison-section__tile-note">
                            {data.note}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
          </>
        )}

        {/* ── Bottom CTA ─────────────────────────────────────────── */}
        <div className="comparison-section__cta">
          <span className="comparison-section__cta-eyebrow">{ctaEyebrow}</span>
          {/*
            SECURITY NOTE: dangerouslySetInnerHTML is used here to render
            rich text formatting (e.g., <em> tags) in the CTA heading.
            This is safe because ctaHeading content is controlled by developers
            via props, not user-submitted input. Do not use this pattern for
            user-generated content without proper sanitization.
          */}
          <h3
            className="comparison-section__cta-heading"
            dangerouslySetInnerHTML={{ __html: ctaHeading }}
          />
          <p className="comparison-section__cta-text">{ctaText}</p>
          {ctaHref ? (
            <a className="comparison-section__cta-btn" href={ctaHref}>
              {ctaButtonLabel} &rarr;
            </a>
          ) : (
            <button
              className="comparison-section__cta-btn"
              onClick={onCtaClick}
            >
              {ctaButtonLabel} &rarr;
            </button>
          )}
        </div>

        {/* ── Disclaimer ─────────────────────────────────────────── */}
        {disclaimer && (
          <p className="comparison-section__disclaimer">{disclaimer}</p>
        )}
      </div>
    </section>
  );
}
