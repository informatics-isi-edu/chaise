# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

Avoid `npm install` directly — it can modify `package-lock.json` unintentionally. Use `make npm-install-all-modules` when you need all deps regardless of `NODE_ENV`.

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

## Commit Messages

Uses semantic-release with conventional commits:

```
<type>(<scope>): <subject>
```

Types that trigger releases: `feat` (minor), `fix` / `perf` / `refactor` (patch).
Types that don't: `docs`, `chore`, `test`, `ci`.

Common scopes: `record`, `recordset`, `recordedit`, `viewer`, `facet`, `export`, `hatrac`, `deps`, `deps-dev`, `build`, `types`.

## Apps

App-specific implementation references live under `docs/dev-docs/` and are auto-loaded into Claude's context (via path-scoped rules in `.claude/rules/`) when working on the relevant app:

- **Record**: [`docs/dev-docs/record-app.md`](docs/dev-docs/record-app.md) — provider state, flow control, condition gating
- **Viewer**: [`docs/dev-docs/viewer-app.md`](docs/dev-docs/viewer-app.md) — file layout, init sequence, postMessage protocol
