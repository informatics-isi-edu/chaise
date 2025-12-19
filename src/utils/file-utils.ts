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
 * Return the file extension from a URL or stored filename
 * 1. If storedFilename is provided, use that to get the extension
 * 2. If contentDisposition header is provided, extract filename from it and get the extension
 * 3. Otherwise, extract from the URL (handles hatrac format as well)
 * Returns empty string if no extension found
 */
const getFileExtention = (url: string, storedFilename?: string, contentDisposition?: string): string => {
  let extension;
  if (storedFilename) {
    extension = storedFilename.split('.').pop()?.toLowerCase();
    if (extension) return extension;
  }

  if (contentDisposition) {
    const prefix = 'filename*=UTF-8\'\''; 
    const filenameIndex = contentDisposition.indexOf(prefix) + prefix.length;
    const filename = contentDisposition.substring(filenameIndex, contentDisposition.length);
    if (filename) extension = filename.split('.').pop()?.toLowerCase();
    if (extension) return extension;
  }

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
const isPreviewableFile = (contentType?: string, extension?: string, filePreviewProps?: any): boolean => {
  // files that are explicitly previewable
  if (
    checkIsMarkdownFile(contentType, extension, filePreviewProps) ||
    checkIsCsvFile(contentType, extension, filePreviewProps) ||
    checkIsTsvFile(contentType, extension) ||
    checkIsJSONFile(contentType, extension, filePreviewProps)
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

  // check the annotation for any additional previewable types
  if (filePreviewProps && filePreviewProps.checkFileType('text', contentType, extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is markdown based on content type or extension
 */
const checkIsMarkdownFile = (contentType?: string, extension?: string, filePreviewProps?: any): boolean => {
  if (contentType && (contentType.includes('markdown') || contentType.includes('md'))) {
    return true;
  }

  if (extension && ['md', 'markdown'].includes(extension)) {
    return true;
  }

  if (filePreviewProps && filePreviewProps.checkFileType('markdown', contentType, extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is CSV based on content type or extension
 */
const checkIsCsvFile = (contentType?: string, extension?: string, filePreviewProps?: any): boolean => {
  if (contentType && (contentType.includes('csv') || contentType.includes('comma-separated-values'))) {
    return true;
  }

  if (extension && extension === 'csv') {
    return true;
  }

  if (filePreviewProps && filePreviewProps.checkFileType('csv', contentType, extension)) {
    return true;
  }

  return false;
};

/**
 * Check if file is TSV based on content type or extension
 */
const checkIsTsvFile = (contentType?: string, extension?: string): boolean => {
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
const checkIsJSONFile = (contentType?: string, extension?: string, filePreviewProps?: any): boolean => {
  if (contentType && contentType.includes('application/json')) {
    return true;
  }

  // mvsj: MolViewSpec JSON (mol* viewer)
  if (extension && ['json', 'mvsj'].includes(extension)) {
    return true;
  }

  if (filePreviewProps && filePreviewProps.checkFileType('json', contentType, extension)) {
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
  /**
   * if set, number of bytes to prefetch for previewing the file
   * (only set if canHandleRange is true)
   */
  prefetchBytes?: number;
}

/**
 * send a HEAD request to get the file information.
 */
export const getFileInfo = async (url: string, storedFilename?: string, filePreviewProps?: any): Promise<FileInfo> => {
  let errorMessage = '';

  try {
    const response = await ConfigService.http.head(url, { skipHTTP401Handling: true, skipRetryBrowserError: true });
    const contentDisposition = response.headers['content-disposition'] || '';
    const contentType = response.headers['content-type'] || '';
    const contentLength = response.headers['content-length'];
    const canHandleRange = response.headers['accept-ranges'] !== 'none';
    const size = contentLength ? parseInt(contentLength, 10) : undefined;
    const extension = getFileExtention(url, storedFilename, contentDisposition);

    const isPreviewable = isPreviewableFile(contentType, extension, filePreviewProps);
    const isMarkdown = checkIsMarkdownFile(contentType, extension, filePreviewProps);
    const isCsv = checkIsCsvFile(contentType, extension, filePreviewProps);
    const isTsv = checkIsTsvFile(contentType, extension);
    const isJSON = checkIsJSONFile(contentType, extension, filePreviewProps);

    let prefetchBytes;
    if (canHandleRange) {
      if (filePreviewProps) {
        prefetchBytes = filePreviewProps.getPrefetchBytes(isMarkdown, isCsv, isJSON);
      }
      if (typeof prefetchBytes !== 'number' || prefetchBytes < 0) {
        prefetchBytes = FILE_PREVIEW.TRUNCATED_SIZE;
      }
    }
    else {
      let maxFileSize;
      if (filePreviewProps) {
        maxFileSize = filePreviewProps.getPrefetchMaxFileSize(isMarkdown, isCsv, isJSON);
      }
      if (typeof maxFileSize !== 'number' || maxFileSize < 0) {
        maxFileSize = FILE_PREVIEW.MAX_SIZE;
      }

      if (size && size > maxFileSize) {
        errorMessage = errorMessages.filePreview.largeFile;
      }
    }

    return {
      size,
      contentType,
      isPreviewable,
      isMarkdown,
      isCsv,
      isTsv,
      isJSON,
      canHandleRange,
      prefetchBytes,
      errorMessage
    };
  } catch (exception) {

    $log.warn('Unable to fetch the file info for showing the preview.');
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
      isPreviewable: false,
      isMarkdown: false,
      isCsv: false,
      isTsv: false,
      isJSON: false,
      errorMessage
    };
  }
};
