import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import {
  windowRef,
  ChaisePerfError,
  ChaisePerfMarks,
  ChaisePerfRecordsetDetail,
} from '@isrd-isi-edu/chaise/src/utils/window-ref';

/**
 * the canonical page-load milestones every measured app records on window.__chaisePerf
 */
type ChaisePerfMilestone = 'navbarLoad' | 'mainDataLoad' | 'fullPageLoad';

/**
 * the loose shape of an ermrestjs error (the result of ErrorService.responseToError).
 * chaise treats these as `any`; we only read the fields we report.
 */
export interface PerfLoggableError {
  status?: string;
  code?: number;
  message?: string;
  subMessage?: string;
}

/**
 * Whether performance logging is enabled (chaiseConfig.performanceLogging). Guard any
 * extra work done only for logging with this, so production pays nothing when it is off.
 */
export function isPerformanceLoggingEnabled(): boolean {
  return !!ConfigService.chaiseConfig?.performanceLogging;
}

/**
 * Record the first time a page-load milestone is reached. No-op unless performance
 * logging is enabled. Read by the deriva-load-testing tool.
 */
export function logPerformanceMilestone(name: ChaisePerfMilestone): void {
  if (!isPerformanceLoggingEnabled()) return;
  const marks: ChaisePerfMarks = windowRef.__chaisePerf || (windowRef.__chaisePerf = {});
  if (marks[name] !== undefined) return;
  marks[name] = performance.now();
}

/**
 * Record a recordset-only detail mark (window.__chaisePerf.detail.recordset). Once both the
 * facet and aggregate marks exist, derive the canonical fullPageLoad from them (first write
 * wins). No-op unless performance logging is enabled.
 */
export function logRecordsetDetail(name: keyof ChaisePerfRecordsetDetail): void {
  if (!isPerformanceLoggingEnabled()) return;
  const marks: ChaisePerfMarks = windowRef.__chaisePerf || (windowRef.__chaisePerf = {});
  const detail = marks.detail || (marks.detail = {});
  const recordset = detail.recordset || (detail.recordset = {});
  if (recordset[name] === undefined) recordset[name] = performance.now();
  if (
    marks.fullPageLoad === undefined &&
    recordset.allFacetsLoaded !== undefined &&
    recordset.allAggregatesLoaded !== undefined
  ) {
    marks.fullPageLoad = Math.max(recordset.allFacetsLoaded, recordset.allAggregatesLoaded);
  }
}

/**
 * Record the first page-load error. No-op unless performance logging is enabled.
 */
export function logPerformanceError(
  milestone: ChaisePerfError['milestone'],
  exception: PerfLoggableError
): void {
  if (!isPerformanceLoggingEnabled()) return;
  const marks: ChaisePerfMarks = windowRef.__chaisePerf || (windowRef.__chaisePerf = {});
  if (marks.error) return;
  marks.error = {
    milestone,
    status: exception?.status,
    code: exception?.code,
    message: exception?.code === 500 ? exception?.subMessage : exception?.message,
  };
}
