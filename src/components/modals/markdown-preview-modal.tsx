// components
import Modal from 'react-bootstrap/Modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// utilites
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

import type { JSX } from 'react';

const COUNT_DOWN_SECONDS = 5;

type MarkdownPreviewModalProps = {
  /**
   * The content already transformed to markdown
   */
  markdownContent: string,
  /**
   * what we should do if users attemp to close the modal
   * NOTE: this callback must handle closing the modal
   */
  onClose: () => void,
};

const MarkdownPreviewModal = ({
  markdownContent = '',
  onClose
}: MarkdownPreviewModalProps): JSX.Element => {

  return (
    <Modal
      className='chaise-preview-markdown'
      size='lg'
      show={true}
      onHide={onClose}
    >
      <Modal.Header className='center-aligned-title'>
        <Modal.Title>Markdown Preview</Modal.Title>
        <button
          className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
          onClick={onClose}
        >
          <strong className='chaise-btn-icon'>X</strong>
          <span>Close</span>
        </button>
      </Modal.Header>
      <Modal.Body>
      <div className='outer-table'>
        <div style={{'padding': '10px'}}>
          <DisplayValue addClass value={{value: markdownContent, isHTML: true}} />
        </div>
      </div>
      </Modal.Body>
    </Modal >
  )
}

export default MarkdownPreviewModal;
