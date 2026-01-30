import Papa from 'papaparse';

// ermrestjs
import type { AssetPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * Format file content for display - attempts to format JSON, otherwise returns as-is
 */
export const formatJSONContent = (content: string): string => {
  try {
    // Try to parse and format as JSON
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Return as-is if not valid JSON
    return content;
  }
};

/**
 * Parse CSV content into table structure using PapaParse
 * Returns null if parsing fails
 */
export const parseCsvContent = (csvContent: string, isTSV?: boolean): string[][] | null => {
  try {
    const parseResult = Papa.parse(csvContent, {
      skipEmptyLines: true,
      header: false,
      delimiter: isTSV ? '\t' : undefined,
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      $log.warn('CSV parsing errors:', parseResult.errors);
      return null;
    }

    return parseResult.data as string[][];
  } catch (error) {
    $log.error('Failed to parse CSV content:', error);
    return null;
  }
};

// TODO once we properly include ermrestjs in chaise, we should import FilePreviewTypes from there
export enum FilePreviewTypes {
  IMAGE = 'image',
  MARKDOWN = 'markdown',
  CSV = 'csv',
  TSV = 'tsv',
  JSON = 'json',
  TEXT = 'text',
}
/**
 * Type guard to check if a value is a FilePreviewTypes
 */
export const isFilePreviewType = (value: unknown): value is FilePreviewTypes => {
  if (typeof value !== 'string') return false;
  return Object.values(FilePreviewTypes).includes(value as FilePreviewTypes);
};

export interface FileInfo {
  size?: number;
  contentType?: string;
  previewType: FilePreviewTypes | null;
  /**
   * if non-empty, we should not show the file preview and show the error message instead
   */
  errorMessage?: string;
  /**
   * whether we can use HTTP range request to fetch the first part of the file
   */
  canHandleRange?: boolean;
  /**
   * if set, number of bytes to prefetch for previewing the file
   * (only set if canHandleRange is true)
   */
  prefetchBytes?: number;
  /**
   * if set, maximum file size allowed for prefetching
   */
  prefetchMaxFileSize?: number;
  /**
   * the filename associated with the file
   */
  filename?: string;
}

/**
 * send a HEAD request to get the file information.
 */
export const getFileInfo = async (
  /**
   * the file url
   */
  url: string,
  /**
   * the filename (used for extension mapping)
   */
  storedFilename?: string,
  /**
   * the asset column that this file belongs to
   */
  column?: AssetPseudoColumn,
  /**
   * force a specific preview type
   * (used by the markdown renderer to set the preview type)
   */
  forcedPreviewType?: FilePreviewTypes,
  /**
   * force a specific prefetch bytes value
   * (used by the markdown renderer to set the prefetch bytes)
   */
  forcedPrefetchBytes?: number,
  /**
   * force a specific prefetch max file size value
   * (used by the markdown renderer to set the prefetch max file size)
   */
  forcedPrefetchMaxFileSize?: number
): Promise<FileInfo> => {
  let errorMessage = '';

  try {
    const response = await ConfigService.http.head(url, {
      skipHTTP401Handling: true,
      skipRetryBrowserError: true,
    });
    const contentDisposition = response.headers['content-disposition'] || '';
    const contentType = response.headers['content-type'] || '';
    const contentLength = response.headers['content-length'];
    const size = contentLength ? parseInt(contentLength, 10) : undefined;
    const infoStr = [
      `url: ${url}`,
      `Content-Type: ${contentType}`,
      `Content-Length: ${contentLength}`,
      `Content-Disposition: ${contentDisposition}`,
      `accept-ranges: ${response.headers['accept-ranges']}`,
      `storedFilename: ${storedFilename}`,
      `forcedPreviewType: ${forcedPreviewType}`,
      `forcedPrefetchBytes: ${forcedPrefetchBytes}`,
      `forcedPrefetchMaxFileSize: ${forcedPrefetchMaxFileSize}`,
    ].join('\n');
    $log.debug(`Fetched file HEAD info:\n${infoStr}`);

    const res = ConfigService.ERMrest.FilePreviewService.getFilePreviewInfo(
      url,
      column,
      storedFilename,
      contentDisposition,
      contentType,
      forcedPreviewType,
      forcedPrefetchBytes,
      forcedPrefetchMaxFileSize
    );
    const { previewType, prefetchBytes, prefetchMaxFileSize, filename } = res;
    const canHandleRange = response.headers['accept-ranges'] !== 'none' && previewType !== 'image';
    if (previewType && size && size > prefetchMaxFileSize) {
      errorMessage = errorMessages.filePreview.largeFile;
    }
    return {
      size,
      contentType,
      previewType,
      canHandleRange,
      prefetchBytes,
      prefetchMaxFileSize,
      errorMessage,
      filename,
    };
  } catch (exception) {
    $log.warn('Unable to fetch the file info for showing the preview.');
    $log.warn(exception);
    const ermrestError = ConfigService.ERMrest.responseToError(exception);
    if (ermrestError instanceof ConfigService.ERMrest.UnauthorizedError) {
      errorMessage = errorMessages.filePreview.unauthorized;
    } else if (ermrestError instanceof ConfigService.ERMrest.ForbiddenError) {
      errorMessage = errorMessages.filePreview.forbidden;
    } else if (ermrestError instanceof ConfigService.ERMrest.NotFoundError) {
      errorMessage = errorMessages.filePreview.notFound;
    } else {
      errorMessage = errorMessages.filePreview.unknownError;
    }

    return {
      previewType: null,
      errorMessage,
    };
  }
};
