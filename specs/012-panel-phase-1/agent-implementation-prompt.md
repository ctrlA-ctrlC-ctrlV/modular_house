# Coding-agent kickoff prompt (paste at the start of EVERY new chat)

> Fill in the one line below, then paste the whole thing. Keep sessions short: when the
> batch is done (or you hit a blocker), stop and hand off. Do not try to clear the whole
> list in one chat.

---

**SESSION GOAL:** Implement implement the next unchecked tasks in order up to a natural checkpoint
(4 tasks), then stop. A natural checkpoint is usually a coherent milestone: a route + its test (e.g., T032/T033), a throttle mechanism + its test (T034/T035), or a set of related endpoints that share a file (T036–T039). If the next task would leave a file half-implemented, extend the batch to finish the coherent unit; do not split a route handler across sessions.

You are implementing Phase 1 of the admin panel in this monorepo (`apps/web`, `apps/api`)
on branch `012-panel-phase-1`. The full plan already exists — your job is to execute it
faithfully, not to redesign it.

## Sources of truth (read, do not invent — precedence order)

1. `specs/012-panel-phase-1/tasks.md` — the ordered task list. **This is your worklist.**
2. `specs/012-panel-phase-1/plan.md` §2 — the pinned constants (A–I). Tests assert these
   exact values; never change a value without changing its task and test together.
3. `specs/012-panel-phase-1/contracts/admin-auth.openapi.yaml` — request/response shapes
   and status codes for every endpoint.
4. `specs/012-panel-phase-1/data-model.md` — schema fields, maps, indexes, migration.
5. `spec.md` / `research.md` / `quickstart.md` — requirements, decisions, run/test commands.

If any two sources conflict, **stop and ask** — do not guess.

## Template parity (UI/frontend tasks ONLY — skip entirely for backend tasks)

The admin panel must visually match a reference template. For any task that ports or styles
UI, open the matching source in the template **before** writing, and mirror its structure,
class names, tokens, and layout. Port the source to our Vite/React setup — do **not** copy
Next.js-specific bits (see research R2).

- Reference template root: `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard`
- Design docs (layout/spacing intent): `E:\Zhaoxiang_Qiu\work\SDeal\next_shadcn_admin_dashboard\.doc\design`

Which tasks need it (everything else does **not**):

- T003 theme tokens → the template's theme/global CSS (OKLCH token set, light + `.dark`).
- T063–T078 primitives + ThemeProvider → the template's `components/ui/<name>` + theme/boot.
- T079–T100 shell + pre-auth pages → the template's sidebar / top bar / user section and the
  "login v1" page layout.
- T137 visual-parity review → compare against the template using the SC-004 checklist.

**Read surgically.** Open only the one or two template files relevant to the current task —
never ingest the whole template (it bloats context and degrades output). The exact numeric
values (sidebar widths, radius, focus ring, top-bar height) are already pinned in `plan.md`
§2 (H3/H4); use the template for structure/classes/visual feel, and §2 for the numbers. If a
template detail and a `plan.md` §2 value disagree, §2 wins — and note it.

If you cannot access the template path, say so and stop before guessing UI styling.

## Boot sequence (run at the start of every session, before writing code)

1. Open `tasks.md` and find the first unchecked `- [ ]` task at or after the SESSION GOAL.
2. Read that task and the **next few** in your batch, plus the exact `Refs:` they cite
   (the §2 ids, contract endpoint, data-model section). Read those sections now.
3. Confirm the git working tree is clean and you are on branch `012-panel-phase-1`. If the working tree is dirty, stop and report the changed files. Do not start a new batch on top of uncommitted work unless the previous session's handoff explicitly told you to continue.
4. Open `specs/012-panel-phase-1/review-log.md` and check the most recent session for carry-forward nits, CHANGES-REQUIRED items, or "Non-blocking follow-ups" that affect your batch. Apply any outstanding corrections before starting new tasks, and update `tasks.md` notes when you do.
5. Briefly restate, in 2–3 lines, the batch you will do this session. Then begin.

## Per-task loop (strict TDD, one task at a time)

For each task, in order:

1. **Re-read the task text** (don't work from memory). Note its `Files:`, `Do:`,
   `Done when:`, and `Refs:`.
2. If it is a `[test]` task: write the test exactly as described, asserting the §2 values
   from `plan.md`. Use the injected clock (`apps/api/tests/helpers/clock.ts`) for any
   TTL / expiry / lockout / cooldown / idle assertion — never real `Date.now()`. Run it and
   **confirm it fails** for the right reason.
3. If it is an implementation task: write the **minimum** code to make its paired test pass.
   Run the test and confirm it passes.
4. Run lint + typecheck on the files you touched. Fix anything you introduced.
5. **Only when the task's `Done when:` is truly met**, flip its box in `tasks.md` from
   `- [ ]` to `- [x]`. Add a `> note:` line under the task describing the implementation highlights, test count, and any deviations. Never check a box whose test is not green.
6. Move to the next task. Do not skip ahead or batch many files before testing.

## Non-negotiables

- **Typing**: Ensure all props are strictly typed with TypeScript interfaces. Never use "any" data type and only use "unknown" when receive data from user input or external API.
- **Scope:** Build only what the current tasks describe. The guardrails in the `tasks.md`
  header and `plan.md` §1.4/§5.2 are binding: no user/role-management UI, content/media
  editors, customer views, dashboard widgets, extra theme presets/fonts, authenticator/SMS
  2FA, SSR, name/email editing, or `super_admin` edit path. **Never touch the public
  marketing site or `@modular-house/ui`.** Per-user prefs are exactly `themeMode` +
  `sidebarCollapsed` (no other preferences).
- **Security coverage:** `auth`, `loginCode`, `passwordResetToken`, refresh rotation,
  lockout, and `requirePermission` must reach 100% branch coverage. Secrets (passwords,
  OTP codes, reset tokens) are hashed-only and never logged or returned raw.
- **Contracts:** Match the OpenAPI status codes and bodies exactly (e.g. login `423` on
  lockout, reset `410` on used/expired link, neutral `429` on throttle).
- **Style:** No emoji in code. Conventional naming. Keep the admin layer isolated under
  `apps/web/src/admin/` with its own scoped Tailwind.
- **Migrations are additive only** — no destructive changes to reused feature-006 models.
- Follow the "Open-Closed Principle" (make it easy to extend but hard to break).
- Integration tests that exercise email-sending routes must mock `MailerService` at the module boundary (`vi.mock('../../src/services/mailer.js', ...)`). Assert the `to` address, subject, and that no real network call leaves the test process.

## Stop and ask (do not guess) when

- A spec/contract/data-model conflict, ambiguity, or missing detail blocks a task.
- A test still fails after ~2–3 honest attempts (report what you tried and the error).
- A task would require touching out-of-scope or public-site code to pass.
- A decision is needed that isn't pinned in the sources of truth.

## In code comments
Add clear, detailed, and professional inline comments to the attached files. The comments should accurately describe the purpose and functionality of each section, block, or key line of code.
  - Write the comments as if they are part of technical documentation—not a conversation.
  - Avoid using personal or directive language (e.g., “this is what I did” or “you should do this here”).
  - Assume the target reader is a graduate-level developer with a basic understanding of modern development practices.
  - Aim for clarity, consistency, and completeness to support long-term maintainability.

## Pre-handoff verification

Before finishing the session, run the full verification set for every package you touched:

- `pnpm --filter @modular-house/api test:run -- --no-file-parallelism`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:coverage`
- If you touched `apps/web`: `pnpm --filter @modular-house/web test:run`

Do not hand off a session where any of these fail.

## End-of-session handoff (always finish with this)

Stop when the batch is complete, you reach a checkpoint, or you hit a blocker — whichever
comes first. Then output:

- **Completed:** the task IDs you checked off this session.
- **Verification:** the test/lint/typecheck commands you ran and their results.
- **Next:** the first unchecked task ID (where the next chat should resume).
- **Notes/deviations:** anything you changed beyond the literal task text, and why. If you
  deviated from a task, add a one-line `> note:` under that task in `tasks.md` with the file name and relevant path of the files you touched.
- **Commits**: separate the implementations into individual commits. Clearly label the full relevant path for `git add`. Naming of `git commit -m` should follow `.docs\COMMIT_CONVENTION.md` . When a single source file must change for several tasks (e.g., multiple Express routes in `auth.ts`), prefer a single coherent commit over fragile patch-staging. Name the commit after the task group it completes. If the tasks are genuinely independent and the file can be split cleanly, commit separately; otherwise group them and explain the grouping in the handoff.
- **Blockers:** any open question for me.

Keep going only while output stays high-quality. If you're losing the thread or the context
is getting long, stop at the last fully-green task, check its box, and hand off cleanly — a
short, correct session is the goal.

## Useful commands (from quickstart §5)

```
pnpm --filter @modular-house/api test:run -- --no-file-parallelism
pnpm --filter @modular-house/web test:run
pnpm --filter @modular-house/api test:coverage   # security modules must hit 100% branch
pnpm --filter @modular-house/api docs:validate    # OpenAPI contract validation
pnpm --filter @modular-house/api lint	#Use the root `pnpm lint` only for a final full-monorepo check
pnpm --filter @modular-house/api typecheck		#Use the root `pnpm typecheck` only for a final full-monorepo check
pnpm --filter @modular-house/web lint
pnpm --filter @modular-house/web typecheck
```
