import Papa from 'papaparse';

// ermrestjs
import type { AssetPseudoColumn } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import type { FilePreviewTypes } from '@isrd-isi-edu/ermrestjs/src/services/file-preview';

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
      delimiter: isTSV ? '\t' : undefined
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
}

/**
 * send a HEAD request to get the file information.
 */
export const getFileInfo = async (
  url: string,
  storedFilename?: string,
  column?: AssetPseudoColumn
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
    const res = ConfigService.ERMrest.FilePreviewService.getFilePreviewInfo(
      url,
      column,
      storedFilename,
      contentDisposition,
      contentType
    );

    const { previewType, prefetchBytes, prefetchMaxFileSize } = res;
    const canHandleRange = response.headers['accept-ranges'] !== 'none' && previewType !== 'image';

    if (size && size > prefetchMaxFileSize) {
      errorMessage = errorMessages.filePreview.largeFile;
    }

    return {
      size,
      contentType,
      previewType,
      canHandleRange,
      prefetchBytes,
      errorMessage,
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
