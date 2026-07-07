# Commit Message Convention

This document defines the commit message convention for this repository. It consolidates the entire [`@commitlint/config-conventional`](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional) package (v21.1.0) — an enforcement of the [Conventional Commits](https://www.conventionalcommits.org/) specification — into a single reference.

Commits are parsed with the `conventional-changelog-conventionalcommits` preset and validated against the rules below. Every rule has a **severity**: an **error** (🔴) blocks the commit, while a **warning** (🟡) is reported but does not.

---

## 1. Message Anatomy

A commit message is made of a **header**, an optional **body**, and an optional **footer**, each separated by a blank line:

```
<type>(<scope>): <subject>
            │
            └─ the "header" (required)
<blank line>
<body>            (optional)
<blank line>
<footer>          (optional)
```

A concrete example:

```
feat(parser): add ability to parse arrays

The parser now accepts bracketed lists and converts them into
native array structures before validation runs.

BREAKING CHANGE: the parse() return type changed from object to array.
Closes #123
```

The three structural pieces:

- **Header** — a single line: `type`, an optional `(scope)`, a colon-space, then the `subject`. This is the only mandatory part.
- **Body** — free-form prose explaining *what* and *why* (not *how*). Optional.
- **Footer** — metadata such as breaking-change notices and issue references. Optional.

---

## 2. Commit Types

The `type` declares the category of the change. It **must** be one of the eleven values below (rule `type-enum`). Each type below also lists the changelog section it maps to and the description used by the interactive prompt.

| Type | Use it for | Changelog section | Emoji |
|------|-----------|-------------------|-------|
| `feat` | A new feature | Features | ✨ |
| `fix` | A bug fix | Bug Fixes | 🐛 |
| `docs` | Documentation-only changes | Documentation | 📚 |
| `style` | Changes that don't affect meaning (white-space, formatting, missing semicolons, etc.) | Styles | 💎 |
| `refactor` | A code change that neither fixes a bug nor adds a feature | Code Refactoring | 📦 |
| `perf` | A code change that improves performance | Performance Improvements | 🚀 |
| `test` | Adding missing tests or correcting existing tests | Tests | 🚨 |
| `build` | Changes to the build system or external dependencies (e.g. gulp, broccoli, npm) | Builds | 🛠 |
| `ci` | Changes to CI configuration files and scripts (e.g. Travis, Circle, BrowserStack, SauceLabs) | Continuous Integrations | ⚙️ |
| `chore` | Other changes that don't modify `src` or `test` files | Chores | ♻️ |
| `revert` | Reverts a previous commit | Reverts | 🗑 |

The `type` must be written in **lower-case** (rule `type-case`) and must **not** be empty (rule `type-empty`).

---

## 3. Scope

The scope is optional and written in parentheses immediately after the type. It names the area of the codebase affected — a component, module, or file name, e.g. `feat(auth):` or `fix(api):`. The configuration places no restriction on the set or casing of scopes.

---

## 4. Subject

The subject is the short summary on the header line, after the colon and space.

- Write it in **imperative tense** — "add", not "added" or "adds".
- It must **not** be empty (rule `subject-empty`).
- It must **not** end with a period (rule `subject-full-stop`).
- It must **not** be written entirely in sentence-case, start-case, pascal-case, or upper-case (rule `subject-case`). In practice this means: don't capitalize the first letter of the whole subject and don't use Title Case or ALL CAPS. Lower-case and mixed wording (e.g. capitalized proper nouns mid-sentence) are accepted.

| Subject | Result |
|---------|--------|
| `fix(scope): some message` | ✅ passes |
| `fix(scope): some Message` | ✅ passes (mixed case allowed) |
| `fix(SCOPE): Some message` | 🔴 fails — sentence-case |
| `fix(SCOPE): Some Message` | 🔴 fails — start-case |
| `fix(SCOPE): SomeMessage`  | 🔴 fails — pascal-case |
| `fix(SCOPE): SOMEMESSAGE`  | 🔴 fails — upper-case |

---

## 5. Header (the whole first line)

- The header must be **100 characters or fewer** (rule `header-max-length`). 🔴
- The header must be trimmed — **no leading or trailing whitespace** (rule `header-trim`). 🔴

```sh
echo "fix: some message"                                                                # ✅ passes
echo "fix: some message that is way too long and breaks the line max-length by several characters"  # 🔴 fails
```

---

## 6. Body

The body is separated from the header by one blank line and explains the change in more depth.

- It **must** be preceded by a leading blank line (rule `body-leading-blank`). 🟡 *warning*
- Each line of the body must be **100 characters or fewer** (rule `body-max-line-length`). 🔴

```sh
# 🟡 warning — no blank line before body
echo "fix: some message
body"

# ✅ passes
echo "fix: some message

body"
```

---

## 7. Footer

The footer holds metadata: breaking-change declarations and issue references.

- It **must** be preceded by a leading blank line (rule `footer-leading-blank`). 🟡 *warning*
- Each line of the footer must be **100 characters or fewer** (rule `footer-max-line-length`). 🔴

```sh
# 🟡 warning — no blank line before footer
echo "fix: some message
BREAKING CHANGE: It will be significant"

# ✅ passes
echo "fix: some message

BREAKING CHANGE: It will be significant"
```

### Breaking changes

A breaking change is declared in the footer with a `BREAKING CHANGE:` token followed by a description of what broke and what consumers must do. A commit that introduces a breaking change should include a body explaining it.

### Issue references

Reference issues in the footer, e.g. `Closes #123`, `fix #123`, or `re #123`.

---

## 8. Full Rule Reference

| Rule | Applies to | Condition | Severity |
|------|-----------|-----------|----------|
| `type-enum` | type | must be one of the 11 allowed types | 🔴 error |
| `type-case` | type | must be lower-case | 🔴 error |
| `type-empty` | type | must not be empty | 🔴 error |
| `subject-case` | subject | must not be sentence/start/pascal/upper-case | 🔴 error |
| `subject-empty` | subject | must not be empty | 🔴 error |
| `subject-full-stop` | subject | must not end with `.` | 🔴 error |
| `header-max-length` | header | ≤ 100 characters | 🔴 error |
| `header-trim` | header | no leading/trailing whitespace | 🔴 error |
| `body-leading-blank` | body | blank line before body | 🟡 warning |
| `body-max-line-length` | body | each line ≤ 100 characters | 🔴 error |
| `footer-leading-blank` | footer | blank line before footer | 🟡 warning |
| `footer-max-line-length` | footer | each line ≤ 100 characters | 🔴 error |

---

## 9. Quick Examples

```sh
# Valid
feat: add support for dark mode
fix(api): handle null response from upstream service
docs: correct typo in installation guide
refactor(parser): simplify token lookahead logic
perf(render): cache layout measurements between frames
revert: revert "feat: add support for dark mode"

# Valid with body and footer
fix(auth): reject expired tokens before validation

Previously expired tokens reached the validation layer and produced a
confusing error. They are now short-circuited at the gateway.

Closes #482

# Invalid
foo: some message                    # ✗ "foo" is not an allowed type
FIX: some message                    # ✗ type must be lower-case
: some message                       # ✗ type must not be present-but-empty
fix:                                 # ✗ subject must not be empty
fix: some message.                   # ✗ subject must not end with a period
fix(SCOPE): Some Message             # ✗ subject must not be start-case
```

---

## 10. Setup

To enforce this convention with commitlint:

```sh
npm install --save-dev @commitlint/config-conventional @commitlint/cli
echo "export default {extends: ['@commitlint/config-conventional']};" > commitlint.config.js
```

For the full list of available rules and their options, see the [commitlint rules reference](https://commitlint.js.org/reference/rules).
