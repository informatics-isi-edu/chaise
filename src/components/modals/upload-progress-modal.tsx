// components
import Modal from 'react-bootstrap/Modal';

// hooks
import { useState } from 'react';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

type UploadProgressModalProps = {
  /**
   * prop to show modal
   */
  show: boolean;
  /**
   * prop to trigger on delete confirmation
   */
  onSuccess: () => void;
  /**
   * prop to trigger on cancel
   */
  onCancel: () => void;
  /**
   * The confirmation message
   */
  message?: JSX.Element;
  /**
   * button label prop
   */
  buttonLabel: string;
};

const UploadProgressModal = ({ show, onSuccess, onCancel, message, buttonLabel }: UploadProgressModalProps) => {

  const [title, setTitle] = useState<string>('');

  const [isUpload, setIsUpload] = useState<boolean>(false);
  const [isCreateUploadJob, setIsCreateUploadJob] = useState<boolean>(false);
  const [isFileExists, setIsFileExists] = useState<boolean>(false);

  // This will contains all the tuples who have files to be uploaded.
  const [rows, setRows] = useState<any[]>([]);

  // var reference = params.reference;
  // // The controller uses a bunch of variables that're being used to keep track of current state of upload.

  // vm.erred = false;

  const [filesCt, setFilesCt] = useState<number>(0);
  const [filesToUploadCt, setFilesToUploadCt] = useState<number>(0);

  // vm.fileExistsCount = 0;
  // vm.totalSize = 0;
  // vm.sizeTransferred = 0;
  const [humanTotalSize, setHumanTotalSize] = useState<number>(0);
  const [humanSizeTransferred, setHumanSizeTransferred] = useState<number>(0);

  // checksum step state variables
  const [checksumProgress, setChecksumProgress] = useState<number>(0);
  const [checksumCompleted, setChecksumCompleted] = useState<number>(0);

  // create upload jobs step state variables
  const [createUploadJobProgress, setCreateUploadJobProgress] = useState<number>(0);
  const [createUploadJobCompleted, setCreateUploadJobCompleted] = useState<number>(0);

  // file exists checking step state variables
  const [fileExistsProgress, setFileExistsProgress] = useState<number>(0);
  const [fileExistsCompleted, setFileExistsCompleted] = useState<number>(0);

  // upload in progress step state variables
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [numUploadsCompleted, setNumUploadsCompleted] = useState<number>(0);

  // uplaods completed step state variables
  const [uploadJobCompleteProgress, setUploadJobCompleteProgress] = useState<number>(0);
  const [uploadJobCompletedCount, setUploadJobCompletedCount] = useState<number>(0)


  const [speed, setSpeed] = useState<number>(0);


  // // used for uploading files one by one
  // vm.queue = [];

  // // used for finializing the upload jobs one by one
  // vm.jobCompletionQueue = [];

  // vm.aborted = false;

  // vm.cancel = function() {
  //     vm.aborted = true;
  //     abortUploads();
  //     $uibModalInstance.dismiss('cancel');
  // };

  // var lastByteTransferred = 0;
  // var speedIntervalTimer;

  const renderBodyContent = () => {
    if (!isCreateUploadJob && !isFileExists && !isUpload) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {checksumCompleted}/{filesCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': checksumProgress + '%' }} ></div>
        </div>
        {/* <div className='progress-percent'>{checksumProgress | number:0}%</div> */}
        <div className='progress-percent'>{checksumProgress}%</div>
      </>)
    } else if (isFileExists && !isUpload) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {fileExistsCompleted}/{filesToUploadCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': fileExistsProgress + '%' }}></div>
        </div>
        {/* <div className='progress-percent'>{fileExistsProgress | number:0}%</div> */}
        <div className='progress-percent'>{fileExistsProgress}%</div>
      </>)
    } else if (isCreateUploadJob && isFileExists && !isUpload) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {createUploadJobCompleted}/{filesToUploadCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': createUploadJobProgress + '%' }}></div>
        </div>
        {/* <div className='progress-percent'>{createUploadJobProgress | number:0}%</div> */}
        <div className='progress-percent'>{createUploadJobProgress}%</div>
      </>)
    } else if (isUpload && (numUploadsCompleted !== filesCt)) {
      return (<>
        <div className='col-md-6  pad0-left pad0-right'>
          <strong>Completed: {numUploadsCompleted}/{filesToUploadCt} Files ({humanSizeTransferred}/ {humanTotalSize}) </strong>
        </div>
        <div className='col-md-6 pad0-left pad0-right text-right'>
          <strong>Speed: {speed}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar' role='progressbar' style={{ 'width': uploadProgress + '%' }}></div>
        </div>
        {/* <div className='progress-percent'>{uploadProgress | number:0}%</div> */}
        <div className='progress-percent'>{uploadProgress}%</div>
      </>)
    } else if (isUpload && (numUploadsCompleted === filesCt)) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {uploadJobCompletedCount}/{filesCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': uploadJobCompleteProgress + '%' }}></div>
        </div>
        {/* <div className='progress-percent'>{uploadJobCompleteProgress | number:0}%</div> */}
        <div className='progress-percent'>{uploadJobCompleteProgress}%</div>
      </>)
    }
  }

  const renderRowSummary = (row: any) => {
    return row.map((item: any, itemIdx: number) => {
      return (<tr key={itemIdx}>
        <td>
          <div className='ellipsis'>{item.name} ( {item.humanFileSize} )</div>
        </td>
        <td>
          <div className='progress'>
            {(!item.uploadStarted) ?
              <div 
                className='progress-bar' 
                role='progressbar'
                style={{'width': item.checksumPercent + '%', 'backgroundColor': '#8cacc7 !important' }}
              /> : 
              <div 
                className='progress-bar' 
                role='progressbar'
                style={{ 'width': item.progressPercent + '%' }} 
              />
            }
          </div>
          {(!item.uploadStarted) ?
            <div className='progress-percent inner-progress-percent'>
              {item.checksumPercent}%
            </div> : 
            <div className='progress-percent inner-progress-percent'>
              {item.progressPercent}%
            </div>
          }
        </td>
      </tr>)
    })
  }

  const renderTableSummary = () => {
    return rows.map((row: any, rowIndex: number) => {
      if (row.length === 0) return;

      return (<tbody key={rowIndex}>
        <tr>
          <td colSpan={3}>Record <span>{rowIndex + 1}</span></td>
        </tr>
        {renderRowSummary(row)}
      </tbody>)
    })
  }

  const renderTableSummaryWrapper = () => {
    if ((!isCreateUploadJob && !isFileExists && !isUpload) || (isUpload && numUploadsCompleted !== filesCt)) {
      return (<table className='table upload-table'>
        {renderTableSummary()}
      </table>)
    }

    return;
  }

  return (
    <Modal
      className='modal-upload-progress'
      show={show}
      onHide={onCancel}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className='row no-row-margin'>{renderBodyContent()}</div>
        {renderTableSummaryWrapper()}
      </Modal.Body>
      <Modal.Footer>
        <ChaiseTooltip tooltip='Click Here if you want to cancel the request.' placement='bottom'>
          <button
            id='confirm-btn'
            className='chaise-btn chaise-btn-secondary'
            onClick={onCancel}
            type='button'
          >
            Cancel
          </button>
        </ChaiseTooltip>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadProgressModal;