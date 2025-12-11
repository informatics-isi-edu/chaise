import { useState } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// models
import { ChaiseError } from '@isrd-isi-edu/chaise/src/models/errors';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import Alert from 'react-bootstrap/Alert';

type ViewerErrorToastProps = {
  viewerError: ChaiseError;
};

const ViewerErrorToast = ({ viewerError }: ViewerErrorToastProps) => {
  const [showSubMessage, setShowSubMessage] = useState(false);

  const toggleSubMessage = () => {
    setShowSubMessage((prev) => !prev);
  };

  const hasSubMessage = viewerError.subMessage && viewerError.subMessage.trim().length > 0;

  return (
    <div className='viewer-error-overlay'>
      <Alert variant='danger' className='viewer-error-message'>
        <div>
          <DisplayValue value={{ isHTML: true, value: viewerError.message }} internal />
        </div>
        {hasSubMessage && (
          <>
            <button
              className='chaise-btn chaise-btn-tertiary toggle-error-details'
              onClick={toggleSubMessage}
            >
              <i className={`fa-solid fa-caret-${showSubMessage ? 'down' : 'right'}`}></i>
              {showSubMessage ? MESSAGE_MAP.hideErrDetails : MESSAGE_MAP.showErrDetails}
            </button>
            {showSubMessage && <pre className='error-details'>{viewerError.subMessage}</pre>}
          </>
        )}
      </Alert>
    </div>
  );
};

export default ViewerErrorToast;
