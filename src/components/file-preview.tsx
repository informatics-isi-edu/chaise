import '@isrd-isi-edu/chaise/src/assets/scss/_file-preview.scss';

import { useState, useEffect, useRef, type JSX } from 'react';
import Card from 'react-bootstrap/Card';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { Alert, Spinner } from 'react-bootstrap';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// models
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { formatJSONContent, getFileInfo, parseCsvContent } from '@isrd-isi-edu/chaise/src/utils/file-utils';
import { errorMessages, FILE_PREVIEW } from '@isrd-isi-edu/chaise/src/utils/constants';


interface FilePreviewProps {
  /**
   * displayed value
   */
  value?: Displayname;
  /**
   * URL of the file to preview
   */
  url: string;
  /**
   * the underlying asset column
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column: any;
  /**
   * Additional CSS class name for the container
   */
  className?: string;
}

const FilePreview = ({
  url,
  className,
  value,
  column,
}: FilePreviewProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);

  const [fileContent, setFileContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [isCsv, setIsCsv] = useState(false);
  const [isJSON, setIsJSON] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  const [canShowRendered, setCanShowRendered] = useState(false);
  const [showMarkdownRendered, setShowMarkdownRendered] = useState(true);
  const [showCsvRendered, setShowCsvRendered] = useState(true);

  const isInitialized = useRef(false);

  // Initialize on component mount - always call HEAD request
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeFile = async () => {
      const info = await getFileInfo(url);
      setIsMarkdown(info.isMarkdown);
      setIsCsv(info.isCsv);
      setIsJSON(info.isJSON);
      setError(info.errorMessage || '');

      if (info.isPreviewable && !info.errorMessage) {
        try {
          setIsLoading(true);
          const headers: Record<string, string> = {};
          if (info.canHandleRange && info.size && info.size > FILE_PREVIEW.TRUNCATED_SIZE) {
            headers.Range = `bytes=${0}-${FILE_PREVIEW.TRUNCATED_SIZE}`;
            setIsTruncated(true);
          }

          const response = await ConfigService.http.get(url, {
            responseType: 'text',
            skipHTTP401Handling: true,
            headers
          });

          // if parsing the markdown or CSV throws an error, don't show the rendered content
          if (info.isMarkdown) {
            try {
              void ConfigService.ERMrest.renderMarkdown(response.data, false, true);
              setCanShowRendered(true);
            } catch {
            }
          }

          if (info.isCsv) {
            const csvData = parseCsvContent(response.data);
            if (csvData !== null && csvData.length > 0) {
              setCanShowRendered(true);
            }
          }

          setFileContent(response.data);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load file content';
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      }
    };

    void initializeFile();
  }, [url, isInitialized]);

  // show the content if there's no error and we got it
  const shouldShowContent = fileContent && !error;

  /**
   * Render CSV as HTML table
   */
  const renderCsvTable = (csvContent: string): JSX.Element => {
    const rows = parseCsvContent(csvContent);
    if (!rows || rows.length === 0) return <div>No data to display</div>;

    const headers = column.filePreview.showCsvHeaders ? rows[0] : [];

    return (
      <div className='file-preview-csv-table'>
        <table className='table table-striped table-hover'>
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope='col'>
                  {header.replace(/^"|"$/g, '')} {/* Remove surrounding quotes */}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              // if we're showing headers, skip the first row
              (rowIndex === 0 && column.showCsvHeaders) ? null : (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      {cell.replace(/^"|"$/g, '')} {/* Remove surrounding quotes */}
                    </td>
                  ))}
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAlert = (message: string): JSX.Element => {
    return (
      <Alert variant='warning' className='file-preview-error'>
        <span className='fa-solid fa-lock fa-triangle-exclamation'></span>
        <strong className='error-title'>Warning:</strong>
        <span>{message}</span>
      </Alert>
    );
  }

  const containerClass = `chaise-file-preview-container${className ? ` ${className}` : ''}`;

  return (
    <div className={containerClass}>
      <div>
        <DisplayValue addClass value={value} />
      </div>

      {(error) && renderAlert(error)}

      {(shouldShowContent || isLoading) && (
        <div className={`file-preview-card-wrapper${canShowRendered && !isTruncated ? ' reduce-space' : ''}`}>
          {shouldShowContent && (
            <div className='file-preview-header-row'>
              <div className='file-preview-message'>{(isTruncated && renderAlert(errorMessages.filePreview.truncatedFile))}</div>
              <div className='file-preview-controls'>
                {(canShowRendered && isMarkdown) && (
                  <ChaiseTooltip
                    placement='top'
                    tooltip={showMarkdownRendered ? 'Display the raw content of the file.' : 'Display rendered markdown content.'}
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary file-preview-toggle-btn'
                      onClick={() => setShowMarkdownRendered(!showMarkdownRendered)}
                    >
                      <span className={`chaise-btn-icon fas ${showMarkdownRendered ? 'fa-code' : 'fa-eye'} file-preview-btn-icon`}></span>
                      <span>{showMarkdownRendered ? 'Display content' : 'Display markdown'}</span>
                    </button>
                  </ChaiseTooltip>
                )}

                {(canShowRendered && isCsv) && (
                  <ChaiseTooltip
                    placement='top'
                    tooltip={showCsvRendered ? 'Display the raw content of the file.' : 'Display rendered CSV content.'}
                  >
                    <button
                      className='chaise-btn chaise-btn-secondary file-preview-toggle-btn'
                      onClick={() => setShowCsvRendered(!showCsvRendered)}
                    >
                      <span className={`chaise-btn-icon fas ${showCsvRendered ? 'fa-code' : 'fa-table'} file-preview-btn-icon`}></span>
                      <span>{showCsvRendered ? 'Display content' : 'Display Table'}</span>
                    </button>
                  </ChaiseTooltip>
                )}
              </div>
            </div>
          )}

          <Card className='file-preview-container-inner'>
            <Card.Body>
              {isLoading && (
                <div className='file-preview-spinner manual-position-spinner'>
                  <Spinner animation='border' size='sm' />
                </div>
              )}

              {shouldShowContent && (
                <>
                  <div>
                    {(canShowRendered && isMarkdown && showMarkdownRendered) ? (
                      <div className='file-preview-content file-preview-markdown'>
                        <DisplayValue addClass value={{ value: ConfigService.ERMrest.renderMarkdown(fileContent, false), isHTML: true }} />
                      </div>
                    ) : (canShowRendered && isCsv && showCsvRendered) ? (
                      <div className='file-preview-content file-preview-csv'>
                        {renderCsvTable(fileContent)}
                      </div>
                    ) : (
                      <pre className='file-preview-content file-preview-text'>
                        {isJSON ? formatJSONContent(fileContent) : fileContent}
                      </pre>
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FilePreview;
