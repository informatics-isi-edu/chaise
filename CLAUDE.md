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

### Viewer App

The viewer app (`src/pages/viewer.tsx`) embeds an OSD viewer in an iframe and coordinates with it via `postMessage`. The key files are `src/providers/viewer.tsx` (all state and message handling), `src/utils/viewer-utils.ts` (DB reads), and `src/services/viewer-config.ts` (table/column name config).

#### DB Tables

The viewer reads four tables whose schema/column names are all configured in viewer-config (varies per deployment):

| Table | Role |
|---|---|
| `Image` | One row per image. Provides `RID`, default z-index, pixel-per-meter, watermark. |
| `Image_Channel` | One row per channel. Provides channel name, number, pseudo-color, isRGB, channel config JSON. |
| `Processed_Image` | One row per channel × z-plane. Provides the actual IIIF/DZI image URL. |
| `Image_Annotation` | One row per annotation. Provides the SVG file URL (stored in hatrac). |

#### Init Sequence

`initializeViewerApp` (in `viewer.tsx`) runs these steps in order before OSD loads:

1. **Read `Image` table** (1 row) — gets RID, default z-index, watermark, pixel-per-meter.
2. **`initializeOSDParams`** — merges query params and the legacy `Image.uri` column to decide if a DB fetch is needed. If image URL is already in query params, skips step 3.
3. **`loadImageMetadata`** (in `viewer-utils.ts`) — three sequential reads:
   - `Image_Channel` (up to `CHANNEL_THRESHOLD` rows + total count) → sets `channels`, `hasMore`, `totalCount`
   - `Processed_Image` (filtered by imageID + z-index) → sets `mainImage.info` (the tile URLs)
   - Aggregate query on `Processed_Image` → sets `zPlane.count/min/max`
4. **`readAllAnnotations`** — reads `Image_Annotation` filtered by imageID + z-index, collects SVG URLs.
5. **Set iframe `src`** to `mview.html` — triggers `osdLoaded` from OSD, which starts the postMessage handshake.

`hasMore` is true when total channel count exceeds `CHANNEL_THRESHOLD`. When true, only the first `CHANNEL_THRESHOLD` channels are loaded; OSD shows a remove button and "Add channels" button so users can swap channels in/out.

#### postMessage Protocol

**Chaise → OSD:**

| Message | When |
|---|---|
| `initializeViewer` | Response to `osdLoaded`; sends the full `osdViewerParameters` object |
| `replaceChannels` | User changed channel selection in the channel selector modal |
| `updateZPlaneList` | Response to `fetchZPlaneList` / `fetchZPlaneListByZIndex` |
| `updateDefaultZIndexDone` | After saving a new default z-index to DB |
| `updateChannelConfigDone` | After saving channel settings to DB |

**OSD → Chaise:**

| Message | When |
|---|---|
| `osdLoaded` | OSD iframe finished loading |
| `mainImageLoaded` | OSD successfully rendered the main image |
| `mainImageLoadFailed` | OSD failed to load the main image |
| `updateMainImage` | User navigated to a different z-plane |
| `annotationsLoaded` | OSD finished loading annotation SVGs |
| `errorAnnotation` | OSD failed to parse an annotation |
| `updateAnnotationList` | OSD parsed annotation files and has group/SVG IDs |
| `onClickChangeSelectingAnnotation` | User clicked an annotation in OSD |
| `saveGroupSVGContent` | OSD returns SVG data after form submit is requested |
| `fetchZPlaneList` | OSD requests next/previous z-plane page |
| `fetchZPlaneListByZIndex` | OSD requests z-plane page containing a specific z-index |
| `updateDefaultZIndex` | User changed the default z-index in OSD toolbar |
| `updateChannelConfig` | User saved channel settings in OSD toolbar |
| `showChannelSelector` | User clicked "Add channels" in OSD toolbar |
| `showAlert` / `showPopupError` | OSD wants to surface an error or alert in Chaise |

#### Annotation Coordination

Annotations require two independent async paths to both finish before OSD can load them: (1) the DB fetch (`readAllAnnotations`) and (2) OSD signaling it's ready (`mainImageLoaded`). `ViewerAnnotationService.annotationsRecieved` and `mainImageLoadedRef` are used to coordinate — whichever finishes last calls `ViewerAnnotationService.loadAnnotations()`.
