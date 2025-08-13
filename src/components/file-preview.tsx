import '@isrd-isi-edu/chaise/src/assets/scss/_file-preview.scss';

import { useState, useEffect, useRef, type JSX } from 'react';
import Card from 'react-bootstrap/Card';

// models
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { formatJSONContent, getFileInfo, parseCsvContent } from '@isrd-isi-edu/chaise/src/utils/file-utils';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { Alert, Spinner } from 'react-bootstrap';

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

  const [isHeightLimited, setIsHeightLimited] = useState(true);
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
          const response = await ConfigService.http.get(url, {
            responseType: 'text',
            skipHTTP401Handling: true
          });

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

  /**
   * Handle show/more
   */
  const handleHeightToggle = () => {
    setIsHeightLimited(!isHeightLimited);
  };

  // show the content if there's no error and we got it
  const shouldShowContent = fileContent && !error;

  /**
   * Render CSV as HTML table
   */
  const renderCsvTable = (csvContent: string): JSX.Element => {
    const rows = parseCsvContent(csvContent);
    if (rows.length === 0) return <div>No data to display</div>;

    const headers = column.filePreview.showCSVHeaders ? rows[0] : [];

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
              (rowIndex === 0 && column.showCSVHeaders) ? null : (
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

  const containerClass = `chaise-file-preview-container${className ? ` ${className}` : ''}`;

  return (
    <div className={containerClass}>
      <div>
        <DisplayValue addClass value={value} />
      </div>

      {(error) && (
        <Alert variant='warning' className='file-preview-error'>
          <span className='fa-solid fa-lock fa-triangle-exclamation'></span>
          <strong className='error-title'>Warning:</strong>
          <span>{error}</span>
        </Alert>
      )}

      {(shouldShowContent || isLoading) && (
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
                  {isMarkdown && (
                    <div className='file-preview-toggle-container'>
                      <button
                        className='chaise-btn chaise-btn-secondary file-preview-toggle-btn'
                        onClick={() => setShowMarkdownRendered(!showMarkdownRendered)}
                      >
                        <span className={`chaise-btn-icon fas ${showMarkdownRendered ? 'fa-code' : 'fa-eye'} file-preview-btn-icon`}></span>
                        <span>{showMarkdownRendered ? 'Show Raw' : 'Show Rendered'}</span>
                      </button>
                    </div>
                  )}

                  {isCsv && (
                    <div className='file-preview-toggle-container'>
                      <button
                        className='chaise-btn chaise-btn-secondary file-preview-toggle-btn'
                        onClick={() => setShowCsvRendered(!showCsvRendered)}
                      >
                        <span className={`chaise-btn-icon fas ${showCsvRendered ? 'fa-code' : 'fa-table'} file-preview-btn-icon`}></span>
                        <span>{showCsvRendered ? 'Show Raw' : 'Show Table'}</span>
                      </button>
                    </div>
                  )}

                  {isMarkdown && showMarkdownRendered ? (
                    <div className={`file-preview-markdown${isHeightLimited ? ' file-preview-limited-height' : ''}`}>
                      <DisplayValue
                        addClass
                        value={{
                          value: (window as unknown as { ERMrest: { renderMarkdown: (content: string) => string } })
                            .ERMrest.renderMarkdown(fileContent),
                          isHTML: true
                        }}
                      />
                    </div>
                  ) : isCsv && showCsvRendered ? (
                    <div className={`file-preview-csv${isHeightLimited ? ' file-preview-limited-height' : ''}`}>
                      {renderCsvTable(fileContent)}
                    </div>
                  ) : (
                    <pre className={`file-preview-content${isHeightLimited ? ' file-preview-limited-height' : ''}`}>
                      {isJSON ? formatJSONContent(fileContent) : fileContent}
                    </pre>
                  )}
                </div>

                {/* Show More/Show Less button - positioned over content */}
                <div className='file-preview-height-toggle'>
                  <button
                    className='chaise-btn chaise-btn-secondary'
                    onClick={handleHeightToggle}
                  >
                    <span className={`chaise-btn-icon fas ${isHeightLimited ? 'fa-chevron-down' : 'fa-chevron-up'} file-preview-btn-icon`}></span>
                    <span>{isHeightLimited ? 'Show More' : 'Show Less'}</span>
                  </button>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default FilePreview;
