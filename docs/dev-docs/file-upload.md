### How File Upload works in Chaise

There're a sequence of operations that are performed to upload the files that can be tracked in `upload-progress-modal.tsx`. This component interacts with `hatrac.js` in `ERMrestJS` to communicate with the hatrac server.

1. The component receives an array of rows from the recordedit app. These rows contain objects for files to be uploaded. The code iterates over all rows, looking for `File` objects and creates an `UploadFileObject` type object for each file to be uploaded. It calls `calculateChecksum` if there are any files to upload.

2. `calculateChecksum` calls `calculateChecksum` in `hatrac.js` for the `hatracObj`. It keeps track of checksum calculation progress for each file and once all are done it calls `checkFileExists`.
  - After each checksum is completed, use the returned url to check if an existing file upload job exists in the local memory for this file
    - If it does, mark this file upload job as a partial upload for continuing upload instead of restarting
    - currently the "local memory" is only within the same javascript session and is NOT persisted to local storage (future implementation)

3. `checkFileExists` function checks whether a file already exists calling `fileExists` in `hatrac.js` for the `hatracObj`. A parameter including the `previousJobUrl` is passed to this call for resuming file upload. It keeps track of the `checkFileExists` calls progress for each file and once all are done it calls `createUploadJob`.
  - If the file already exists, creating the upload job is skipped and marked as complete. `filesToUploadCt` is reduced by 1
  - If there is a 403 returned (job/file exists but the current user can't read it), use the same job with a new version
  - If there is a 409 returned, it could mean the namespace already exists 
    - If this occurs, check if we have an existing job for that namespace we know is partially uploaded

4. `createUploadJob` creates an upload job for each file calling `createUploadJob` in `hatrac.js` for the `hatracObj`. It keeps track of the upload job progress for each file and once all are done it calls `startUpload`.
  - If the file was marked to be skipped, the upload job is marked as complete (and never created)

5. `startUpload` function calls `startQuededUpload` which will then queue files to be uploaded. This queue is iterated over using `startQuededUpload` which calls the `start` function in `hatrac.js` for the `hatracObj` for all files. A parameter including the `startChunkIdx` is passed to this call for resuming file upload. It keeps track of the upload progress for each file and once all are done it calls `doQueuedJobCompletion`.
  - If a `startChunkIdx` is passed, `hatrac.js` will continue a previous file upload job from the `startChunkIdx` instead of the start of the file
  - During the file upload process, after each chunk has been completed, update the `lastContiguousChunkMap` with information about the current file upload job in case it is interrupted and might be resumed later

6. `completeUpload` calls `hatrac.js` to send the upload job closure call to Ermrest for all files. It keeps track of the completed jobs progress for each file and once all are done it sets the url in the row and closes the modal.
  - When an upload job is completed, update the `lastContiguousChunkMap` for that upload job in case an interruption occurs while finalizing all of the uploads

7. The recordedit app listens to the modal close event. It saves the rows that were updated while uploading files by calling ermrest.

8. During above steps if there is any checksum/Network error, in some cases, all uploads are aborted, the modal closes, and the recordedit app renders an error message.