// components
import Modal from 'react-bootstrap/Modal';

// utilites
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

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
        <div 
          className='markdown-container'
          style={{'padding': '10px'}} 
          dangerouslySetInnerHTML={{ __html: markdownContent}}
          ng-bind-html="ctrl.renderedMarkdown"
        />
      </div>
      </Modal.Body>
    </Modal >
  )
}

export default MarkdownPreviewModal;