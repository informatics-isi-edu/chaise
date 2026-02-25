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

## Architecture

Chaise is a **React + TypeScript** monolith that produces 7 separate single-page apps (recordset, record, recordedit, viewer, login, help, navbar) from a single codebase. It is the primary frontend for ERMrest — a backend relational data service. ERMrest schema annotations drive most of the adaptive UI behavior.

### App Structure

Each app follows the same pattern:
- **`src/pages/<app>.tsx`** — entry point; bootstraps providers and renders `AppWrapper`
- **`src/components/app-wrapper.tsx`** — root component; sets up context providers, navbar, error boundaries
- **`src/providers/<app>.tsx`** — app-specific state via React Context (recordset, record, recordedit, viewer all have their own)
- **`src/providers/authn.tsx`**, **`alerts.tsx`**, **`error.tsx`** — shared global providers

### Key Layers

| Layer | Path | Purpose |
|---|---|---|
| Pages | `src/pages/` | App entry points |
| Components | `src/components/` | Reusable UI; app-specific subdirs (`recordset/`, `record/`, etc.) |
| Providers | `src/providers/` | Global state via React Context |
| Hooks | `src/hooks/` | Custom hooks (`useAuthn`, `useError`, `useStateRef`, etc.) |
| Models | `src/models/` | TypeScript interfaces |
| Services | `src/services/` | Business logic, config, logging, auth storage, flow control |
| Utils | `src/utils/` | Stateless helper functions (26 modules) |

### State Management Pattern

State is managed via React Context + custom hooks. Each app has a provider with all app-specific state, and components access it through a corresponding `use<App>()` hook. See `src/providers/` and `src/hooks/` for the pattern. The `useStateRef` custom hook (`src/hooks/use-state-ref.ts`) combines `useState` and `useRef` for values that both trigger re-renders and need synchronous access.

### Services vs Utils

- **Services** (`src/services/`) — stateful modules with shared scope, often singletons (e.g., `ConfigService`, logging)
- **Utils** (`src/utils/`) — stateless collections of individually exported functions

### Webpack Build

`webpack/main.config.js` → `webpack/app.config.js` (`getWebPackConfig()`). Builds one bundle per app. Also produces library builds of navbar and login for embedding in external apps. ERMrestJS and Plotly are treated as externals (loaded at runtime, not bundled).

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

## Commit Messages

Uses semantic-release with conventional commits:

```
<type>(<scope>): <subject>
```

Types that trigger releases: `feat` (minor), `fix` / `perf` / `refactor` (patch).
Types that don't: `docs`, `chore`, `test`, `ci`.

Common scopes: `record`, `recordset`, `recordedit`, `viewer`, `facet`, `export`, `hatrac`, `deps`, `deps-dev`, `build`, `types`.
