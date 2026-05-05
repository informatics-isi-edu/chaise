# Viewer app (implementation reference)

This document describes how the viewer app is implemented inside Chaise — file layout, initialization order, and the message protocol with the embedded OpenSeadragon (OSD) viewer. For deployment, configuration, and end-user usage, see [`../viewer/viewer-app.md`](../viewer/viewer-app.md) and [`../viewer/viewer-config.md`](../viewer/viewer-config.md).

The viewer app (`src/pages/viewer.tsx`) embeds an OSD viewer in an iframe and coordinates with it via `postMessage`. The key files are `src/providers/viewer.tsx` (all state and message handling), `src/utils/viewer-utils.ts` (DB reads), and `src/services/viewer-config.ts` (table/column name config).

## DB Tables

The viewer reads four tables whose schema/column names are all configured in viewer-config (varies per deployment):

| Table | Role |
|---|---|
| `Image` | One row per image. Provides `RID`, default z-index, pixel-per-meter, watermark. |
| `Image_Channel` | One row per channel. Provides channel name, number, pseudo-color, isRGB, channel config JSON. |
| `Processed_Image` | One row per channel × z-plane. Provides the actual IIIF/DZI image URL. |
| `Image_Annotation` | One row per annotation. Provides the SVG file URL (stored in hatrac). |

## Init Sequence

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

## postMessage Protocol

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

## Annotation Coordination

Annotations require two independent async paths to both finish before OSD can load them: (1) the DB fetch (`readAllAnnotations`) and (2) OSD signaling it's ready (`mainImageLoaded`). `ViewerAnnotationService.annotationsRecieved` and `mainImageLoadedRef` are used to coordinate — whichever finishes last calls `ViewerAnnotationService.loadAnnotations()`.
