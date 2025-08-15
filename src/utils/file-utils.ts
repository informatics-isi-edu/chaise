// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// third party
import Papa from 'papaparse';

// utils
import { errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { FILE_PREVIEW } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * Utility functions for file operations and content processing
 */

/**
 * Determine if file type is previewable based on URL or content type
 */
export const isPreviewableFile = (contentType?: string, url?: string): boolean => {
  if (contentType) {
    return (
      contentType.startsWith('text/') ||
      contentType.includes('json') ||
      contentType.includes('javascript') ||
      contentType.includes('csv')
    );
  }

  if (url) {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['txt', 'json', 'md', 'markdown', 'log', 'csv'].includes(extension || '');
  }

  return false;
};

/**
 * Check if file is markdown based on content type or URL extension
 */
export const checkIsMarkdownFile = (contentType?: string, url?: string): boolean => {
  if (contentType) {
    return contentType.includes('markdown') || contentType.includes('md');
  }

  if (url) {
    const extension = url.split('.').pop()?.toLowerCase();
    return ['md', 'markdown'].includes(extension || '');
  }

  return false;
};

/**
 * Check if file is CSV based on content type or URL extension
 */
export const checkIsCsvFile = (contentType?: string, url?: string): boolean => {
  if (contentType) {
    return contentType.includes('csv') || contentType.includes('comma-separated-values');
  }

  if (url) {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'csv';
  }

  return false;
};

/**
 * Check if file is JSON based on content type or URL extension
 */
export const checkIsJSONFile = (contentType?: string, url?: string): boolean => {
  if (contentType) {
    return contentType.includes('json') || contentType.includes('application/json');
  }

  if (url) {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension === 'json';
  }

  return false;
};

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
export const parseCsvContent = (csvContent: string): string[][] | null => {
  try {
    const parseResult = Papa.parse(csvContent, {
      skipEmptyLines: true,
      header: false
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
  /**
   * whether its type is previewable
   */
  isPreviewable: boolean;
  isMarkdown: boolean;
  isCsv: boolean;
  isJSON: boolean;
  /**
   * if non-empty, we should not show the file preview and show the error message instead
   */
  errorMessage?: string;
  canHandleRange?: boolean;
}

/**
 * send a HEAD request to get the file information.
 */
export const getFileInfo = async (url: string): Promise<FileInfo> => {
  let errorMessage = '';

  try {
    const response = await ConfigService.http.head(url, { skipHTTP401Handling: true, skipRetryBrowserError: true });
    const contentType = response.headers['content-type'] || '';
    const contentLength = response.headers['content-length'];
    const canHandleRange = response.headers['accept-ranges'] !== 'none';
    const size = contentLength ? parseInt(contentLength, 10) : undefined;

    if (!canHandleRange && size && size > FILE_PREVIEW.MAX_SIZE) {
      errorMessage = errorMessages.filePreview.largeFile;
    }

    return {
      size,
      contentType,
      isPreviewable: isPreviewableFile(contentType, url),
      isMarkdown: checkIsMarkdownFile(contentType, url),
      isCsv: checkIsCsvFile(contentType, url),
      isJSON: checkIsJSONFile(contentType, url),
      canHandleRange,
      errorMessage
    };
  } catch (exception) {

    $log.warn('Unable to fetch the file info for showing the preview.');
    const ermrestError = ConfigService.ERMrest.responseToError(exception);
    if (ermrestError instanceof ConfigService.ERMrest.UnauthorizedError) {
      errorMessage = errorMessages.filePreview.unauthorized;
    } else if (ermrestError instanceof ConfigService.ERMrest.ForbiddenError) {
      errorMessage = errorMessages.filePreview.forbidden;
    } else if (ermrestError instanceof ConfigService.ERMrest.UnknownError) {
      errorMessage = errorMessages.filePreview.unknownError;
    }

    return {
      isPreviewable: false,
      isMarkdown: false,
      isCsv: false,
      isJSON: false,
      errorMessage
    };
  }
};
