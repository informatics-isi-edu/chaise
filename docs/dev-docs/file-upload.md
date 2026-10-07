### How File Upload works in Chaise

There're a sequence of operations that are performed to upload the files that can be tracked in `upload-progress-modal.tsx`. This component interacts with the `Upload` class (`src/models/hatrac/upload.ts`) in `ERMrestJS` to communicate with the hatrac server. Each file has an instance of this class, called `hatracObj`.

1. The component receives an array of rows from the recordedit app. These rows contain objects for files to be uploaded. The code iterates over all rows, looking for `File` objects and creates an `UploadFileObject` type object for each file to be uploaded. It calls `calculateChecksum` if there are any files to upload.

2. `calculateChecksum` calls `calculateChecksum` in `ERMrestJS` for the `hatracObj`. It keeps track of checksum calculation progress for each file and once all are done it calls `checkFileExists`.
   - After each checksum is completed, use the returned url to check if an existing file upload job exists in the local memory for this file
     - If it does, mark this file upload job as a partial upload for continuing upload instead of restarting
     - currently the "local memory" is only within the same javascript session and is NOT persisted to local storage (future implementation)

3. `checkFileExists` function checks whether a file already exists calling `fileExists` in `ERMrestJS` for the `hatracObj`. A parameter including the `previousJobUrl` is passed to this call for resuming file upload. It keeps track of the `checkFileExists` calls progress for each file and once all are done it calls `createUploadJobs`.
   - If the file already exists (same checksum and size), creating the upload job is skipped and marked as complete. `filesToUploadCt` is reduced by 1
     - If the existing file has a different filename, a request is sent to update its `content-disposition` metadata to the new filename instead of uploading the file again
   - If there is a 403 returned (file exists but the current user can't read it), the file is uploaded as a new version
   - If there is a 409 returned, it could mean the namespace already exists
     - If this occurs, check if we have an existing job for that namespace we know is partially uploaded

4. `createUploadJobs` creates an upload job for each file calling `createUploadJob` in `ERMrestJS` for the `hatracObj`. It keeps track of the upload job progress for each file and once all are done it calls `startUpload`.
   - If the file was marked to be skipped, the upload job is marked as complete (and never created)

5. `startUpload` function adds all the files to a queue and calls `startQueuedUpload`. `startQueuedUpload` uploads the files in the queue one at a time by calling the `start` function in `ERMrestJS` for the `hatracObj` (the chunks of each file are uploaded in parallel). A parameter including the `startChunkIdx` is passed to this call for resuming file upload. It keeps track of the upload progress for each file and once all are done it calls `doQueuedJobCompletion`.
   - If a `startChunkIdx` is passed, `ERMrestJS` will continue a previous file upload job from the `startChunkIdx` instead of the start of the file
   - During the file upload process, each time the upload progress changes, update `lastContiguousChunk` (stored in the recordedit provider) with the last contiguous uploaded chunk and the upload job url, in case it is interrupted and might be resumed later

6. `doQueuedJobCompletion` calls `completeUpload` in `ERMrestJS` for one file at a time, which sends the upload job closure call to Hatrac. It keeps track of the completed jobs progress for each file and once all are done it sets the url in the row and calls `onSuccess`.
   - When an upload job is completed, set the `uploadVersion` of that upload job in `lastContiguousChunk`, so it's not treated as a partial upload in case an interruption occurs while finalizing all of the uploads

7. The `onSuccess` callback of the recordedit app closes the modal and saves the rows that were updated while uploading files by calling ermrest.

8. During above steps if there is any checksum/Network error, all uploads are aborted, the modal closes, and the recordedit app renders an error message.
   - Unless the error code is 401, 408, 0, -1, 500, or 503, the upload jobs are also deleted. For these error codes the jobs are kept so the upload can be resumed.
