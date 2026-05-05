# Record app (implementation reference)

This document describes how the record app is implemented inside Chaise — provider state, request flow, and the condition gating system. For the broader flow-control logic that record shares with recordset, see [`flow-control.md`](flow-control.md).

The record app (`src/pages/record.tsx`) shows a single entity along with its inline columns, related tables, and citation. Its central provider is `src/providers/record.tsx`, which owns all state and orchestrates the request flow via `flowControl` (see `src/services/record-flow-control.ts`).

## Key files

| File | Role |
|---|---|
| `src/pages/record.tsx` | App entry point. |
| `src/providers/record.tsx` | All state + orchestration: column models, related models, request queue draining, condition evaluation, update handling. |
| `src/services/record-flow-control.ts` | `RecordFlowControl` class: holds `requestModels`, `requestQueue` (priority heap), `conditionModels`, slot counters. |
| `src/models/record.ts` | Interfaces: `RecordRequestModel`, `RecordColumnModel`, `RecordRelatedModel`, `RecordConditionModel`. |
| `src/components/record/record.tsx` | Top-level layout. |
| `src/components/record/record-main-section.tsx` | Main section column rendering with `canShow` visibility gate. |
| `src/utils/record-utils.ts` | `canShowRelated` / `canShowInlineRelated` visibility helpers. |

## Flow control

The full flow-control logic is in [`flow-control.md`](flow-control.md). Quick summary specific to record:

- A priority queue (`IndexedMinHeap`) of `RecordRequestModel`s drains after the main entity read completes. Priority is the index from ERMrestJS's `activeList.requests`.
- `processRequests` gates the queue drain on `dirtyMain` — the main entity read must finish before any secondary requests can run.
- `processed` on a request model is the "skip me" flag: when popped from the queue, items with `processed === true` are ignored.

## Conditions

Columns / inline / related entities can be gated behind conditions (defined in ERMrestJS via `condition` or `condition_key`). `Reference.activeList.conditionalGroups` exposes them; chaise builds a `RecordConditionModel` per group with:

- `condition` — the `ActiveListCondition` (with `evaluateCondition`).
- `conditionedItems` — which columns / inline / related entities are gated.
- `dependentRequestModels` — secondary fetches that should only run after the condition resolves to "show". These are tracked in `requestModels` but kept OUT of the request queue until `evaluateConditionModel` decides.

`evaluateConditionModel` is the single decision point. It runs after the main entity read for sync conditions, and from `attachPseudoColumnValue` once the source's secondary fetch lands for async conditions. On show: deps are upserted with `processed = false`. On hide: deps are marked `processed = true`.

On update (`updateRecordPage(true)`), every condition resets to `evaluated = false` and dependents are marked `processed = true` — this gates any stale queue entries from the previous run until re-evaluation decides. See the inline comment at `src/providers/record.tsx:341` for the load-bearing reasoning (the early return in `evaluateConditionModel` for async conditions doesn't touch dep `processed`, so without the `true` reset a stale queue entry would fire before re-evaluation).
