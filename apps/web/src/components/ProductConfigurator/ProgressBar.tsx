/**
 * ProgressBar -- Configurator Step Indicator
 * =============================================================================
 *
 * PURPOSE:
 * Renders a horizontal progress bar with numbered step nodes connected by
 * lines. Each step displays its index number (or a checkmark when completed),
 * a text label, and a connecting line to the next step.
 *
 * BEHAVIOUR:
 * - The currently active step is highlighted with a border and shadow.
 * - Completed steps show a filled circle with a checkmark SVG icon.
 * - Completed steps are clickable, allowing the user to navigate back.
 * - Upcoming steps are visually dimmed and not interactive.
 *
 * ACCESSIBILITY:
 * - Uses aria-current="step" on the active step for screen readers.
 * - Uses aria-disabled on non-clickable steps.
 *
 * =============================================================================
 */

import React from 'react';
import type { ConfiguratorStep } from './types';


/* =============================================================================
   Component Props
   ============================================================================= */

interface ProgressBarProps {
  /** The ordered step definitions for the current product. */
  steps: ReadonlyArray<ConfiguratorStep>;
  /** Zero-based index of the currently active step. */
  currentStepIndex: number;
  /**
   * The highest step index the user has reached during this session.
   * Steps at or below this index display a completed checkmark and remain
   * clickable even when the user navigates to an earlier step.
   */
  highestCompletedStepIndex: number;
  /**
   * Callback invoked when the user clicks a completed step to navigate to it.
   * Receives the zero-based index of the target step.
   */
  onStepClick: (stepIndex: number) => void;
}


/* =============================================================================
   Checkmark Icon
   -----------------------------------------------------------------------------
   Small SVG checkmark rendered inside completed step circles. Separated as
   a named constant to avoid re-creating the JSX element on every render.
   ============================================================================= */

const CheckmarkIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M3 7L6 10L11 4"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


/* =============================================================================
   Step Node Sub-Component
   -----------------------------------------------------------------------------
   Renders a single step indicator: the numbered/checkmark circle and the
   text label below it. Extracted as a named inner component for readability.
   ============================================================================= */

interface StepNodeProps {
  /** Zero-based step index (used for display number and key). */
  index: number;
  /** Display label for this step. */
  label: string;
  /** Whether this step is currently active. */
  isActive: boolean;
  /** Whether this step has been completed. */
  isCompleted: boolean;
  /** Click handler; only invoked when isCompleted is true. */
  onClick: () => void;
}

const StepNode: React.FC<StepNodeProps> = ({
  index,
  label,
  isActive,
  isCompleted,
  onClick,
}) => {
  const isClickable = isCompleted;

  /* Determine the CSS modifier classes for the circle and label */
  const circleClass = [
    'configurator__step-circle',
    isActive && 'configurator__step-circle--active',
    isCompleted && 'configurator__step-circle--completed',
  ]
    .filter(Boolean)
    .join(' ');

  const labelClass = [
    'configurator__step-label',
    isActive && 'configurator__step-label--active',
    isCompleted && 'configurator__step-label--completed',
  ]
    .filter(Boolean)
    .join(' ');

  const nodeClass = [
    'configurator__step-node',
    isClickable && 'configurator__step-node--clickable',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={nodeClass}
      onClick={isClickable ? onClick : undefined}
      aria-current={isActive ? 'step' : undefined}
      aria-disabled={!isClickable}
      aria-label={`Step ${index + 1}: ${label}${isCompleted ? ' (completed)' : ''}${isActive ? ' (current)' : ''}`}
    >
      <div className={circleClass}>
        {isCompleted ? <CheckmarkIcon /> : index + 1}
      </div>
      <span className={labelClass}>{label}</span>
    </button>
  );
};


/* =============================================================================
   Connector Sub-Component
   -----------------------------------------------------------------------------
   Horizontal line between two step nodes. Highlighted when the step to its
   right has been reached (i.e., the connector index <= currentStepIndex).
   ============================================================================= */

interface ConnectorProps {
  /** Whether this connector segment should be highlighted. */
  isHighlighted: boolean;
}

const Connector: React.FC<ConnectorProps> = ({ isHighlighted }) => {
  const className = [
    'configurator__connector',
    isHighlighted && 'configurator__connector--active',
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={className} aria-hidden="true" />;
};


/* =============================================================================
   ProgressBar Component
   ============================================================================= */

export const ProgressBar: React.FC<ProgressBarProps> = ({
  steps,
  currentStepIndex,
  highestCompletedStepIndex,
  onStepClick,
}) => {
  return (
    <div className="configurator__progress" role="navigation" aria-label="Configuration steps">
      <div className="configurator__progress-bar">
        {steps.map((step, index) => {
          /*
           * A step is "completed" if the user has previously visited it
           * (index <= highestCompletedStepIndex) and it is not the step
           * currently being viewed. This ensures all previously reached
           * steps retain their checkmark and remain clickable even when
           * the user navigates backward.
           */
          const isCompleted = index <= highestCompletedStepIndex && index !== currentStepIndex;
          const isActive = index === currentStepIndex;

          return (
            <div key={step.id} className="configurator__progress-step-group">
              {/* Connector line before every step except the first.
                 Highlighted when the step to the right has been visited
                 at any point during the session, not just when it is
                 at or below the current step position. */}
              {index > 0 && (
                <Connector isHighlighted={index <= highestCompletedStepIndex || index <= currentStepIndex} />
              )}
              <StepNode
                index={index}
                label={step.label}
                isActive={isActive}
                isCompleted={isCompleted}
                onClick={() => onStepClick(index)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
