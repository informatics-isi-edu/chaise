# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, and others) when working with code in this repository.

## Build & Development Commands

```bash
make deps               # Install production npm dependencies (npm ci)
make deps-test          # Install all dependencies including dev/test + Playwright browsers
make dist               # Full build: clean deps install + webpack (use for first install or after package-lock changes)
make dist-wo-deps       # Webpack build only, skips deps install (use during active development)
make lint               # ESLint (errors only)
make lint-w-warn        # ESLint (errors + warnings)
make deploy             # rsync build output to /var/www/html/chaise/
make deploy-w-config    # deploy + rsync config files
make clean              # Remove build artifacts
make distclean          # Remove build artifacts + node_modules
```

Avoid bare `npm install` for setup since it can modify `package-lock.json` unintentionally; use `make npm-install-all-modules`. A deliberate single-dep bump (`npm install pkg@ver`, then verify the lock diff) is fine.

## Running Tests

All tests are Playwright E2E using Chromium. Tests require a deployed build (`make deploy`) and a running ERMrest backend.

```bash
make testparallel       # Run all 4 parallel test configurations (standard CI target)

# Run specific app test suites (sequential):
make testrecordset
make testrecord
make testrecordadd
make testrecordedit
make testnavbar
make testfooter
make testerrors
make testpermissions
make testmodel

# Run a single Playwright config file directly:
npx playwright test --project=chromium --config test/e2e/specs/all-features/recordset/presentation.config.ts
```

Parallel test configs are under `test/e2e/specs/{all-features,all-features-confirmation,default-config,delete-prohibited}/playwright.config.ts`.

## Using a Local ERMrestJS

By default, Chaise uses the ERMrestJS published to npm. To use a local clone:

```bash
# in ermrestjs directory:
npm link

# in chaise directory:
npm link @isrd-isi-edu/ermrestjs
```

## Code Conventions

- **Filenames**: kebab-case
- **Types/Classes/Enums**: PascalCase
- **Functions/variables**: camelCase; `_` prefix for private
- **Imports**: always use the `@isrd-isi-edu/chaise` alias (never relative paths):
  ```ts
  import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
  ```
- **react-bootstrap**: import individual components, not the whole library:
  ```ts
  import Button from 'react-bootstrap/Button'; // ✅
  import { Button } from 'react-bootstrap';     // ❌
  ```
- Use `DisplayValue` instead of `dangerouslySetInnerHTML`
- Functional components only (class components only for special cases)
- Avoid `any` types
- Single quotes, semicolons, 2-space indent
- All functions must have proper JSDoc comments (you can skip the return type if it's self-explanatory)
- **SCSS colors**: never use a hex/literal color directly in SCSS. Either reuse an existing general-purpose entry from `src/assets/scss/maps/_color-map.scss`, or add a new entry there and reference it via `map.get(variables.$color-map, '<key>')`.

## Commit Messages

Uses semantic-release with conventional commits:

```
<type>(<scope>): <subject>
```

Types that trigger releases: `feat` (minor), `fix` / `perf` / `refactor` (patch).
Types that don't: `docs`, `chore`, `test`, `ci`.

Common scopes: `record`, `recordset`, `recordedit`, `viewer`, `facet`, `export`, `hatrac`, `deps`, `deps-dev`, `build`, `types`.

## Apps

App-specific implementation references live under `docs/dev-docs/`. Claude Code auto-loads them via path-scoped rules in `.claude/rules/` when working on the relevant app. Other agents (Codex, etc.) don't read `.claude/rules/`, so read the matching doc below, plus `.claude/rules/architecture.md` for the overall app structure and `.claude/rules/e2e-tests.md` when touching `test/e2e/`:

- **Record**: [`docs/dev-docs/record-app.md`](docs/dev-docs/record-app.md) — provider state, flow control, condition gating
- **Viewer**: [`docs/dev-docs/viewer-app.md`](docs/dev-docs/viewer-app.md) — file layout, init sequence, postMessage protocol

## Writing

Applies to PR descriptions, commit messages, issues, and review or PR comments.

- Write for a human teammate unless told otherwise. Be concise: what changed and why, nothing the diff already makes obvious.
- Scale length to the change. A one-line fix gets one sentence. No boilerplate headers like "Summary" or "Test plan" on routine PRs.
- Automated PRs (Dependabot, releases) can be terser and more structured, but still short.

## Code Review Rules

- Keep each comment short: the problem, why it matters, and the fix. No praise, and no restating what the PR does.
- Only comment on things that affect behavior, correctness, security, or compatibility. Formatting and lint belong to the linters.
- Flag a PR title whose conventional-commit type doesn't match the change (e.g. `chore:` for a user-visible fix). PRs are squash-merged and semantic-release reads the title to decide whether and how to release.
