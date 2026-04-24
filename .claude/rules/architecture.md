---
paths:
  - "src/**"
  - "webpack/**"
---

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
