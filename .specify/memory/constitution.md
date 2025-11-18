<!--
Sync Impact Report
Version change: UNSET → 1.0.0
Modified principles: (placeholders replaced)
	PRINCIPLE_1 → Security & Privacy First
	PRINCIPLE_2 → Reliability & Observability
	PRINCIPLE_3 → Test Discipline
	PRINCIPLE_4 → Performance & Efficiency
	PRINCIPLE_5 → Accessibility & Inclusive UX
Added sections: Additional Constraints; Development Workflow (content instantiated)
Removed sections: None
Templates updates:
	.specify/templates/plan-template.md ✅ (Constitution gates inserted)
	.specify/templates/spec-template.md ✅ (No conflicting references; generic)
	.specify/templates/tasks-template.md ✅ (Generic; integration tests align with Test Discipline)
Deferred TODOs: None
-->

# Modular House Constitution

## Core Principles

### I. Security & Privacy First (NON-NEGOTIABLE)
All handling of user data MUST follow least privilege and data minimization. Secrets MUST be stored only in approved secure configuration (never committed). All network traffic MUST use TLS. No personally identifiable information beyond explicit business need is persisted. Every change touching authentication, authorization or data access MUST include at least one security-focused test. 
Rationale: Early, enforced security reduces remediation cost and prevents systemic risk.

### II. Reliability & Observability
Each deployable component MUST expose a health/readiness endpoint, emit structured JSON logs (timestamp, level, correlation id), and publish baseline metrics (request count, p95 latency, error rate). Failures MUST be traceable end-to-end via correlation id. Logging/metrics configuration MUST be documented in the plan before implementation.
Rationale: Instrumentation enables rapid detection and recovery, protecting user experience.

### III. Test Discipline
All new code MUST include automated unit coverage; critical paths and public contracts MUST have integration or contract tests. Minimum overall line coverage target: 70%; critical modules (security, data integrity) MUST reach 100% branch coverage. Tests MUST be deterministic (no reliance on system time without control, external network, or shared mutable global state). A feature MAY NOT merge if introduced tests are flaky.
Rationale: Reliable tests provide confidence, facilitate safe iteration, and prevent regressions.

### IV. Performance & Efficiency
Core API endpoints MUST maintain p95 latency <300ms under expected load; frontend Largest Contentful Paint MUST be <2.5s on a standard 4G profile; avoid premature optimization but MUST document any exception. Performance budgets MUST be listed in the feature plan and validated post-implementation.
Rationale: Defined budgets prevent uncontrolled degradation and anchor optimization priorities.

### V. Accessibility & Inclusive UX
UI components MUST meet WCAG 2.1 AA: semantic HTML, keyboard navigation, focus indicators, aria attributes for interactive elements, sufficient color contrast. Visual-only states MUST have text or programmatic equivalents. Any newly added component failing these MUST include an accessibility remediation task before release.
Rationale: Inclusive design broadens user reach and reduces future retrofit effort.

## Additional Constraints
Semantic versioning (MAJOR.MINOR.PATCH) MUST be used for all public API or schema changes. Backward-incompatible API changes REQUIRE a migration plan and minor/major version increment accordingly. Dependencies MUST be pinned (no floating wildcards). Secrets MUST NOT appear in logs. Error messages MUST avoid leaking internal implementation details.

## Development Workflow
Every Pull Request MUST: (1) Link a specification or task reference, (2) Pass CI (lint, tests, security scan), (3) Show updated or confirmed performance/accessibility budgets if touching relevant areas, (4) Include observability additions for new behaviors (logs/metrics). Reviewer MUST verify alignment with each principle gate. Merge is blocked until all gates pass.

## Governance
This constitution supersedes informal practices. Amendments REQUIRE: written proposal, principle impact analysis, version increment per semantic rules (MAJOR for redefinition/removal, MINOR for additions, PATCH for clarifications), and explicit ratification via approved Pull Request. Compliance reviews occur at least quarterly; violations MUST be remediated with tracked tasks. Any emergency deviation MUST be time-boxed with a rollback or follow-up plan.

**Version**: 1.0.0 | **Ratified**: 2025-11-18 | **Last Amended**: 2025-11-18
