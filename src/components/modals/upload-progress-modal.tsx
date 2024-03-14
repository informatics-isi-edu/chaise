// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import ProgressBar from 'react-bootstrap/ProgressBar';

// hooks
import { useEffect, useRef, useState } from 'react';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useRecordedit from '@isrd-isi-edu/chaise/src/hooks/recordedit';

// models
import { FileObject, UploadFileObject } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { humanFileSize } from '@isrd-isi-edu/chaise/src/utils/input-utils';

export interface UploadProgressModalProps {
  /**
   * rows of data from recordedit form to get file values from
   */
  rows: any[];
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
  onCancel: (exception?: any) => void;
}

const UploadProgressModal = ({ rows, show, onSuccess, onCancel }: UploadProgressModalProps) => {

  const { reference } = useRecordedit();

  const [title, setTitle] = useState<string>('');

  // Contains arrays of UploadFileObjects. Each array is for each record number, each record might contain multiple files
  const [uploadRows, setUploadRows, uploadRowsRef] = useStateRef<UploadFileObject[][]>([]);

  // 5 Booleans control the state of the upload modal
  const [isUpload, setIsUpload] = useState<boolean>(false);
  const [isCreateUploadJob, setIsCreateUploadJob] = useState<boolean>(false);
  const [isFileExists, setIsFileExists] = useState<boolean>(false);

  const erred = useRef<boolean>(false);
  const aborted = useRef<boolean>(false);

  // total number of files being uploaded
  const [filesCt, setFilesCt] = useState<number>(0);
  // total number of files to upload after checking if any exist on the server already
  // NOTE: This number will be less than filesCt if files already exist in hatrac
  const [filesToUploadCt, setFilesToUploadCt, filesToUploadCtRef] = useStateRef<number>(0);

  // counter of files that already exist in hatrac. Might not be needed
  const [fileExistsCount, setFileExistsCount] = useState<number>(0);
  // the total size of all files to be uploaded
  const [totalSize, setTotalSize, totalSizeRef] = useStateRef<number>(0);
  // the total size transferred to the server already, updated by onNotify callback
  const [sizeTransferred, setSizeTransferred, sizeTransferredRef] = useStateRef<number>(0);
  // the total more readable size of all files to be uploaded
  const [humanTotalSize, setHumanTotalSize] = useState<string>('');
  // the total more readable size transferred to the server already, updated by onNotify callback
  const [humanSizeTransferred, setHumanSizeTransferred] = useState<string>('');

  // following state variables for each step have 2 values:
  //   - progress: value from 0 - 100
  //   - completed: number of files completed in this step so far

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

  // uploads completed step state variables
  const [uploadJobCompleteProgress, setUploadJobCompleteProgress] = useState<number>(0);
  const [uploadJobCompletedCount, setUploadJobCompletedCount] = useState<number>(0)

  // used for uploading files one by one
  const [queue, setQueue, queueRef] = useStateRef<UploadFileObject[]>([]);
  // used for finializing the upload jobs one by one
  const [jobCompletionQueue, setJobCompletionQueue, jobCompletionQueueRef] = useStateRef<UploadFileObject[]>([])

  // current upload speed
  const [speed, setSpeed] = useState<string>('');
  // used in the speed calculation
  const [lastByteTransferred, setLastByteTransferred, lastByteTransferredRef] = useStateRef<number>(0);
  let speedIntervalTimer: NodeJS.Timer;

  /*=== Hooks ===*/

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const uploadStarted = useRef<boolean>(false);

  useEffect(() => {
    if (uploadStarted.current) return;
    uploadStarted.current = true;

    let tempFilesCt = 0,
      tempTotalSize = 0;
    // Iterate over all rows that are passed as parameters to the modal controller
    rows.forEach((row: any) => {

      // Create a tuple for the row
      const tuple: UploadFileObject[] = [];

      // Iterate over each property/column of a row
      for (const k in row) {

        // If the column type is object and has a file property inside it
        // Then increment the count for no of files and create an uploadFile Object for it
        // Push this to the tuple array for the row
        // NOTE: each file object has an hatracObj property which is an hatrac object
        let column = reference.columns.find((c: any) => { return c.name === k; });
        if (!column) {
          // the file might be related to one of the columns in the input-iframe column mapping
          reference.columns.forEach((col: any) => {
            if (!col.isInputIframe || column) return;
            column = col.inputIframeProps.columns.find((c: any) => c.name === k);
          });
        }
        if (column && column.isAsset) {

          // If the column value of the row contains a file object then add it to the tuple to upload
          // else if column contains url then set it in the column directly
          // if the url is empty then set the column values as null
          if (row[k] !== null && typeof row[k] === 'object' && row[k].file) {
            tempFilesCt++;
            tempTotalSize += row[k].file.size;

            tuple.push(createUploadFileObject(row[k], column, row));
          } else {
            row[k] = (row[k] && row[k].url && row[k].url.length) ? row[k].url : null;
          }
        }
      }

      // Push the tuple on vm.rows which is a local variable
      uploadRowsRef.current.push(tuple);
    });

    setFilesCt(tempFilesCt);
    setTotalSize(tempTotalSize);

    // If there are no files to be uploaded then simply close the modal
    // Else start with calling calculateChecksum
    if (!tempFilesCt) {
      setTimeout(onSuccess);
    } else {
      setFilesToUploadCt(tempFilesCt);
      setTimeout(() => {
        calculateChecksum()
      });
    }
  }, [])

  const cancelUpload = () => {
    aborted.current = true
    // TODO: abortUploads
    abortUploads();
    onCancel();
  }

  /*=== Functions for uploading ===*/

  // This function calls for checksumCalculation in hatrac.js for all files
  const calculateChecksum = () => {

    if (erred.current || aborted.current) return;

    setTitle('Calculating and Verifying Checksum');
    setIsCreateUploadJob(false);
    setIsFileExists(false);
    setIsUpload(false);
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        item.hatracObj.calculateChecksum(item.row).then(
          (url: string) => onChecksumCompleted(item, url),
          onError,
          (uploaded: number) => onChecksumProgressChanged(item, uploaded));
      });
    });
  };

  // This function checks for files existing before upload job is created
  // verifies if the same file exists in the namespace with the same size/length
  const checkFileExists = () => {

    if (erred.current || aborted.current) return;

    setTitle('Checking for existing files');
    setIsFileExists(true);
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        item.hatracObj.fileExists().then(
          () => onFileExistSuccess(item),
          onError);
      });
    });
  }

  // This function creates upload jobs in hatrac.js for all files
  // if the job was marked to be skipped in the fileExists check, skip creating the job and mark it as complete
  const createUploadJobs = () => {

    if (erred.current || aborted.current) return;

    setTitle('Creating Upload Jobs for the files');
    setIsCreateUploadJob(true);
    setIsUpload(false);
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        if (item.hatracObj.updateDispositionOnly) {
          item.hatracObj.createUpdateMetadataJob().then(
            () => onJobCreated(item),
            onError)
        } else {
          item.hatracObj.createUploadJob().then(
            () => onJobCreated(item),
            onError);
        }
      });
    });
  };

  // This function starts the upload in hatrac.js for all files
  const startUpload = () => {

    if (erred.current || aborted.current) return;

    setTitle('Uploading files');
    setIsUpload(true);
    setHumanTotalSize(humanFileSize(totalSizeRef.current));

    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        onProgressChanged(item, 0);
        queueRef.current.push(item);
      });
    });

    // start uploading files
    startQueuedUpload();

    setSpeed('Calculating Speed');
    // create an interval that periodically checks the uploaded content and updates the user on the speed
    speedIntervalTimer = setInterval(() => {
      const diff = sizeTransferredRef.current - lastByteTransferredRef.current;
      setLastByteTransferred(sizeTransferredRef.current);
      
      if (diff > 0) setSpeed(humanFileSize(diff) + 'ps');
    }, 1000);
  };

  // This function starts to upload the next file in queue
  const startQueuedUpload = () => {

    if (erred.current || aborted.current) return;

    const item = queueRef.current.shift();
    if (!item) return;

    item.hatracObj.start().then(
      () => onUploadCompleted(item),
      onError,
      (size: number) => onProgressChanged(item, size));
  };

  // Complete upload jobs one by one
  const doQueuedJobCompletion = () => {

    if (erred.current || aborted.current) return;

    setTitle('Finalizing Upload');

    const item = jobCompletionQueueRef.current.shift();
    if (!item) return;

    item.hatracObj.completeUpload().then(
      (url: string) => onCompleteUploadJob(item, url),
      onError);
  };

  // This function aborts upload for all files
  const abortUploads = (err?: any) => {

    let deleteUploadJob = false;

    if (err && ([401, 408, 0, -1, 500, 503].indexOf(err.code) === -1)) {
      deleteUploadJob = true;
    }

    clearInterval(speedIntervalTimer);
    aborted.current = true;
    setSpeed('');
    rows.forEach((row: any) => {
      for (const k in row) {
        if (row[k] !== null && typeof row[k] === 'object' && row[k].file) {
          row[k].hatracObj.cancel(deleteUploadJob);
        }
      }
    });
  };

  // This function is called by all rejected promises from above functions
  const onError = (err: any) => {
    if (erred.current || aborted.current) return;

    erred.current = true;
    abortUploads(err);
    onCancel(err);
  };

  /*=== uploadFile class ===*/
  /**
   * @function
   * @param {FileObject} data - FileObject for the file column
   * @param {Ermrest.Column} column - Column Object
   * @param {Object} row - Json key value Object of row values from the recordedit form
   * @desc
   * Creates an uploadFile obj to keep track of file and its upload.
   */
  const createUploadFileObject = (data: FileObject, column: any, row: any): UploadFileObject => {
    const file = data.file;

    const uploadFileObject: UploadFileObject = {
      name: file.name,
      size: file.size,
      humanFileSize: humanFileSize(file.size),
      checksumProgress: 0,
      checksumPercent: 0,
      checksumCompleted: false,
      jobCreateDone: false,
      fileExistsDone: false,
      uploadCompleted: false,
      uploadStarted: false,
      completeUploadJob: false,
      progress: 0,
      progressPercent: 0,
      hatracObj: data.hatracObj,
      url: '',
      column: column,
      reference: reference,
      row: row
    }

    return uploadFileObject;
  };

  // This function is called as a notify promise callback by calculateChecksum function above for each file
  // It updates the progress for checksum on the UI
  const onChecksumProgressChanged = (ufo: UploadFileObject, uploadedSize: number) => {

    if (erred.current || aborted.current) return;

    // This code updates the specific progress bar for checksum for the file
    ufo.jobCreateDone = false;
    ufo.fileExistsDone = false;
    ufo.uploadStarted = false;
    ufo.completeUploadJob = false;
    ufo.checksumPercent = Math.floor((uploadedSize / ufo.size) * 100);
    ufo.checksumProgress = uploadedSize;

    // This code updates the main progress bar for checksum
    let progress = 0;
    setIsUpload(false);
    setIsCreateUploadJob(false);
    setIsFileExists(false);

    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        progress += item.checksumProgress;
      });
    });

    setChecksumProgress((progress / totalSizeRef.current) * 100);
  };

  // This function is called as a success promise callback by calculateChecksum function above for each file
  // Once all files are done, call checkFileExists
  const onChecksumCompleted = (ufo: UploadFileObject, url: string) => {

    if (erred.current || aborted.current) return;

    ufo.fileExistsDone = false;
    ufo.checksumPercent = 100;
    ufo.checksumProgress = ufo.size;
    if (!ufo.checksumCompleted) {
      ufo.checksumCompleted = true;
      ufo.url = url;
      setChecksumCompleted((prev: number) => prev + 1);
    }
  };

  useEffect(() => {
    if (filesCt === 0 || checksumCompleted !== filesCt) return;

    checkFileExists();
  }, [checksumCompleted])

  // This function is called as a success promise callback by checkFileExists function above for each file
  // Once all files have been checked if they exist or not, call createUploadJobs
  const onFileExistSuccess = (ufo: UploadFileObject) => {

    if (erred.current || aborted.current) return;

    ufo.skipUploadJob = ufo.hatracObj.jobDone;
    ufo.fileExistsDone = true;
    ufo.jobCreateDone = false;

    let tempfilesToUploadCt = filesToUploadCtRef.current;
    // if the job is already done, that means the file has an identical file already in the server (md5 and size match)
    // we don't want to even create a job for that file because it shouldn't be uploaded
    if (ufo.hatracObj.jobDone) {
      tempfilesToUploadCt = tempfilesToUploadCt - 1;
      setFilesToUploadCt((prev: number) => prev - 1);
    } else {
      setFileExistsCount((prev: number) => prev + 1)
    }

    // This code updates the main progress bar for file exist progress for all files
    let progress = 0;
    setIsFileExists(true);
    setIsUpload(false);
    let pendingFileExists = false;
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        if (!item.fileExistsDone) {
          pendingFileExists = true;
        }
        progress += item.fileExistsDone ? 1 : 0;
      });
    });

    setFileExistsProgress((progress / tempfilesToUploadCt) * 100);
    setFileExistsCompleted(progress);

    // all the file-exists request has been returned
    if (!pendingFileExists) {
      createUploadJobs();
    }
  }

  // This function is called as a success promise callback by createUploadJobs function above for each file
  // Once upload jobs for all files are done it calls startUpload
  const onJobCreated = (ufo: UploadFileObject) => {

    if (erred.current || aborted.current) return;

    // This code updates the individual progress bar for job creation progress for this file
    ufo.jobCreateDone = true;
    ufo.uploadStarted = false;
    ufo.completeUploadJob = false;

    // This code updates the main progress bar for job creation progress for all files
    let progress = 0;
    let pendingJobCreation = false;
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        if (!item.jobCreateDone) {
          pendingJobCreation = true;
        }
        progress += item.jobCreateDone ? 1 : 0;
      });
    });

    setCreateUploadJobProgress((progress / filesToUploadCtRef.current) * 100);
    setCreateUploadJobCompleted(progress);

    // all the upload jobs has been created
    if (!pendingJobCreation) {
      startUpload();
    }
  };

  // This function is called as a notify promise callback by startUpload function above for each file
  // It updates the progress for upload on the UI
  const onProgressChanged = (ufo: UploadFileObject, uploadedSize: number) => {

    if (erred.current || aborted.current) return;

    // This code updates the individual progress bar for uploading file
    ufo.uploadStarted = true;
    ufo.completeUploadJob = false;
    ufo.progressPercent = Math.floor((uploadedSize / ufo.size) * 100);
    ufo.progress = uploadedSize;


    // This code updates the main progress bar for uploading file
    let progress = 0
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        progress += item.progress;
      });
    });

    setSizeTransferred(progress);
    setHumanSizeTransferred(humanFileSize(sizeTransferred));

    setUploadProgress((progress / totalSizeRef.current) * 100);
  };

  // This function is called as a success promise callback by startUpload function above for each file
  // If there are still uploads pending, this function starts the next queued upload
  // Once all files are uploaded it calls doQueuedJobCompletion
  const onUploadCompleted = (ufo: UploadFileObject) => {

    if (erred.current || aborted.current) return;

    ufo.progress = ufo.size;
    ufo.progressPercent = 100;
    if (!ufo.uploadCompleted) {
      ufo.uploadCompleted = true;
      // find if there are any job pending
      const uploadPending = uploadRowsRef.current.some((row: UploadFileObject[]) => {
        return row.some((item: UploadFileObject) => {
          return !item.uploadCompleted;
        });
      });

      setNumUploadsCompleted((prev: number) => prev + 1)

      // If all files have been uploaded then call doQueuedJobCompletion
      // to sent requests to mark the job as done
      if (!uploadPending) {
        clearInterval(speedIntervalTimer);

        uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
          row.forEach((item: UploadFileObject) => {
            jobCompletionQueueRef.current.push(item);
          });
        });

        doQueuedJobCompletion();
        return;
      }
    }
    startQueuedUpload();
  };

  // This function is called as a success promise callback by doQueuedJobCompletion function above for each file
  // Once upload jobs are marked as completed it sets the url in the columns for rows
  // When there are no more pending jobs to complete, close the modal
  const onCompleteUploadJob = (ufo: UploadFileObject, url: string) => {

    if (erred.current || aborted.current) return;

    ufo.completeUploadJob = true;
    ufo.versionedUrl = url;

    // This code updates the main progress bar for job completion progress for all files
    let progress = 0;
    let pendingJobCompletion = false;
    uploadRowsRef.current.forEach((row: UploadFileObject[]) => {
      row.forEach((item: UploadFileObject) => {
        if (!item.completeUploadJob) {
          pendingJobCompletion = true;
        }
        progress += item.completeUploadJob ? 1 : 0;
      });
    });

    setUploadJobCompleteProgress((progress / filesCt) * 100);
    setUploadJobCompletedCount(progress);

    // some job completion requests are still pending
    if (pendingJobCompletion) {
      doQueuedJobCompletion();
      return;
    }

    let index = 0;

    // Iterate over all rows that are passed as parameters to the modal controller
    rows.forEach((row: any) => {
      let rowIndex = 0;

      // Iterate over each property/column of a row
      for (const k in row) {

        // If the column type is object and has a file property inside it
        // then set the url in the corresonding column for the row as its value
        let column = reference.columns.find((c: any) => { return c.name === k; });
        if (!column) {
          // the file might be related to one of the columns in the input-iframe column mapping
          reference.columns.forEach((col: any) => {
            if (!col.isInputIframe || column) return;
            column = col.inputIframeProps.columns.find((c: any) => c.name === k);
          })
        }
        if (column && column.isAsset && row[k] !== null && typeof row[k] === 'object' && row[k].file) {
          row[k] = uploadRowsRef.current[index][rowIndex++].versionedUrl;
        }
      }

      index++;
    });

    onSuccess();
  };


  /*=== Functions for rendering modal content ===*/
  // render the main progress bar for ALL upload jobs
  const renderBodyContent = () => {
    if (!isCreateUploadJob && !isFileExists && !isUpload) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {checksumCompleted}/{filesCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': checksumProgress + '%' }} ></div>
        </div>
        <div className='progress-percent'>{Number(checksumProgress).toFixed(2)}%</div>
      </>)
    } else if (isFileExists && !isUpload) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {fileExistsCompleted}/{filesToUploadCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': fileExistsProgress + '%' }}></div>
        </div>
        <div className='progress-percent'>{Number(fileExistsProgress).toFixed(2)}%</div>
      </>)
    } else if (isCreateUploadJob && isFileExists && !isUpload) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {createUploadJobCompleted}/{filesToUploadCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': createUploadJobProgress + '%' }}></div>
        </div>
        <div className='progress-percent'>{Number(createUploadJobProgress).toFixed(2)}%</div>
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
        <div className='progress-percent'>{Number(uploadProgress).toFixed(2)}%</div>
      </>)
    } else if (isUpload && (numUploadsCompleted === filesCt)) {
      return (<>
        <div className='col-md-12 pad0-left pad0-right text-right'>
          <strong>Completed: {uploadJobCompletedCount}/{filesCt}</strong>
        </div>
        <div className='progress'>
          <div className='progress-bar upload-progress-bar' role='progressbar' style={{ 'width': uploadJobCompleteProgress + '%' }}></div>
        </div>
        <div className='progress-percent'>{Number(uploadJobCompleteProgress).toFixed(2)}%</div>
      </>)
    }
  }

  // render individual progress bars for each file to be uploaded
  const renderRowSummary = (row: UploadFileObject[]) => {
    return row.map((item: UploadFileObject, itemIdx: number) => {
      return (<tr key={itemIdx}>
        <td>
          <div className='ellipsis'>{item.name} ( {item.humanFileSize} )</div>
        </td>
        <td>
          <div className='progress'>
            {(!item.uploadStarted) ?
              <ProgressBar now={item.checksumPercent} /> : <ProgressBar now={item.checksumPercent} />
            }
          </div>
          {(!item.uploadStarted) ?
            <div className='progress-percent inner-progress-percent'>
              {Number(item.checksumPercent).toFixed(2)}%
            </div> :
            <div className='progress-percent inner-progress-percent'>
              {Number(item.progressPercent).toFixed(2)}%
            </div>
          }
        </td>
      </tr>)
    })
  }

  const renderTableSummary = () => {
    return uploadRows.map((row: UploadFileObject[], rowIndex: number) => {
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

  if (filesCt === 0) return <></>;

  return (
    <Modal
      className='modal-upload-progress'
      show={show}
      onHide={cancelUpload}
    >
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        <div className='modal-close-absolute'><Spinner animation='border' /></div>
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
            onClick={cancelUpload}
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
