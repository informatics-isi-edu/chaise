import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { windowRef, ChaisePerfError, ChaisePerfMarks } from '@isrd-isi-edu/chaise/src/utils/window-ref';

/**
 * the milestone keys recorded on window.__chaisePerf (everything except the error object)
 */
type ChaisePerfMarkName = Exclude<keyof ChaisePerfMarks, 'error'>;

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
export function logPerformanceMilestone(name: ChaisePerfMarkName): void {
  if (!isPerformanceLoggingEnabled()) return;
  const marks: ChaisePerfMarks = windowRef.__chaisePerf || (windowRef.__chaisePerf = {});
  if (marks[name] !== undefined) return;
  marks[name] = performance.now();
}

/**
 * Record the first page-load error. No-op unless performance logging is enabled.
 */
export function logPerformanceError(milestone: ChaisePerfError['milestone'], exception: PerfLoggableError): void {
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
