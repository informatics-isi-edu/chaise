import Papa from 'papaparse';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { FILE_PREVIEW } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * Utility functions for file operations and content processing
 */

/**
 * Return the file extension from a URL
 */
const getFileExtention = (url: string): string => {
  let extension;
  // hatrac files have a different format
  const parts = url.match(/^\/hatrac\/([^\/]+\/)*([^\/:]+)(:[^:]+)?$/);
  if (parts && parts.length === 4) {
    extension = parts[2].split('.').pop()?.toLowerCase();
  } else {
    extension = url.split('.').pop()?.toLowerCase();
  }
  return extension || '';
};

/**
 * Determine if file type is previewable based on extension or content type
 */
export const isPreviewableFile = (contentType?: string, extension?: string): boolean => {
  // files that are explicitly previewable
  if (
    checkIsMarkdownFile(contentType, extension) ||
    checkIsCsvFile(contentType, extension) ||
    checkIsTsvFile(contentType, extension) ||
    checkIsJSONFile(contentType, extension)
  ) {
    return true;
  }

  // text-like files using content-type
  if (
    contentType &&
    (
      contentType.startsWith('text/') ||
      // cif files
      (contentType === 'chemical/x-mmcif' || contentType === 'chemical/x-cif')
    )
  ) {
    return true;
  }

  // text-like files using extension
  if (extension) {
    return ['txt', 'js', 'log', 'cif', 'pdb'].includes(extension);
  }

  return false;
};

/**
 * Check if file is markdown based on content type or extension
 */
export const checkIsMarkdownFile = (contentType?: string, extension?: string): boolean => {
  if (contentType && (contentType.includes('markdown') || contentType.includes('md'))) {
    return true;
  }

  if (extension && ['md', 'markdown'].includes(extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is CSV based on content type or extension
 */
export const checkIsCsvFile = (contentType?: string, extension?: string): boolean => {
  if (contentType && (contentType.includes('csv') || contentType.includes('comma-separated-values'))) {
    return true;
  }

  if (extension && extension === 'csv') {
    return true;
  }

  return false;
};

/**
 * Check if file is TSV based on content type or extension
 */
export const checkIsTsvFile = (contentType?: string, extension?: string): boolean => {
  if (contentType && contentType.includes('tab-separated-values')) {
    return true;
  }

  if (extension && extension === 'tsv') {
    return true;
  }

  return false;
};

/**
 * Check if file is JSON based on content type or extension
 */
export const checkIsJSONFile = (contentType?: string, extension?: string): boolean => {
  if (contentType && contentType.includes('application/json')) {
    return true;
  }

  // mvsj: MolViewSpec JSON (mol* viewer)
  if (extension && ['json', 'mvsj'].includes(extension)) {
    return true;
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
  /**
   * whether its type is previewable
   */
  isPreviewable: boolean;
  isMarkdown: boolean;
  isCsv: boolean;
  isTsv: boolean;
  isJSON: boolean;
  /**
   * if non-empty, we should not show the file preview and show the error message instead
   */
  errorMessage?: string;
  /**
   * whether we can use HTTP range request to fetch the first part of the file
   */
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
    const extension = getFileExtention(url);

    if (!canHandleRange && size && size > FILE_PREVIEW.MAX_SIZE) {
      errorMessage = errorMessages.filePreview.largeFile;
    }

    return {
      size,
      contentType,
      isPreviewable: isPreviewableFile(contentType, extension),
      isMarkdown: checkIsMarkdownFile(contentType, extension),
      isCsv: checkIsCsvFile(contentType, extension),
      isTsv: checkIsTsvFile(contentType, extension),
      isJSON: checkIsJSONFile(contentType, extension),
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
      isTsv: false,
      isJSON: false,
      errorMessage
    };
  }
};
