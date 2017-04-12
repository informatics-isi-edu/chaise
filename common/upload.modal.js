(function () {
    'use strict';

    angular.module('chaise.modal', [])

    /*
        This controller basically starts the whole upload process once the user presses the submit button
        It is called before the actual save takes place
        
        There're a sequence of operations that are performed to upload the files

        1.  The controller receives an array of raw rows from the recordedit app. These rows contain objects for file types.
            The code iterates over all rows, to find for file objects and creates an uploadFile type object.
            It calls calculateChecksum if there are any file objects

        2.  CalculateChecksum calls the relevant function in hatrac.js using the hatracObj to calcualte the checksum
            It keeps track of checksum calculationprogress for each file and once all are done it calls createUploadJob

        3.  CreateUploadJob creates an upload job for each file calling the relevant function in hatrac.js using the hatracObj
            It keeps track of the upload job progress for each file and once all are done it calls checkFileExists

        4.  CheckFileExists function checks whether a file already exists using hatrac.js.
            It keeps track of the checkfile calls progress for each file and once all are done it calls startUpload

        5.  StartUpload functions calls the start function in hatrac.js for the hatrac hatracObj for all files.
            It keeps track of the upload progress for each file and once all are done it calls completeUpload

        6.  CompleteUpload calls hatrac.js to sent the upload job closure call to Ermrest for all files.
            It keeps track of the completed jobs progress for each file and once all are done it sets the url in the row
            and closes the modal.

        7.  The recordedit app listens to the modal close event. It saves the updates rows by calling ermrest.

        8.  During above steps if there is any checksum/Network error all uploads are aborted and the modal renders an error message.

        
    */
    .controller('UploadModalDialogController', ['$uibModalInstance', 'params', 'Session', '$scope', '$timeout', 'UiUtils', function UploadModalDialogController($uibModalInstance, params, Session, $scope, $timeout, UiUtils) {
        var vm = this;

        // This will contains all the tuples who have files to be uploaded.
        vm.rows =  [];

        var reference = params.reference;
        // The controller uses a bunch of variables that're being used to keep track of current state of upload.

        vm.serverError = false;
        vm.uploadError = false;
        vm.checksumError = false;

        vm.totalSize = 0;
        vm.humanTotalSize = 0
        vm.noOfFiles = 0;
        vm.sizeTransferred = 0;
        vm.humanSizeTransferred = 0;

        vm.checksumProgress = 0;
        vm.checksumCompleted = 0;

        vm.createUploadJobProgress = 0;
        vm.createUploadJobCompleted = 0;

        vm.fileExistsProgress = 0;
        vm.fileExistsCompleted = 0;

        vm.uploadProgress = 0;
        vm.uploadCompleted = 0;

        vm.uploadJobCompleteProgress = 0;
        vm.uploadJobCompletedCount = 0;

        vm.speed = 0;
        vm.isUpload = false;
        vm.isCreateUploadJob = false;
        vm.isFileExists = false;

        var lastByteTransferred = 0;
        var speedIntervalTimer;

        // This function calls for checksumCalculation in hatrac.js for all files
        var calculateChecksum = function() {
            vm.title = "Calculating and Verifying Checksum";
            vm.isCreateUploadJob = false;
            vm.isFileExists = false;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.hatracObj.calculateChecksum(item.row).then(
                        itemOps.onChecksumCompleted.bind(item),
                        onError, 
                        itemOps.onChecksumProgressChanged.bind(item));
                });
            });
        };

        // This function creates upload jobs in hatrac.js for all files
        var createUploadJobs = function() {
            vm.title = "Creating Upload Jobs for the files";
            vm.isCreateUploadJob = true;
            vm.isFileExists = false;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.hatracObj.createUploadJob().then(
                        itemOps.onJobCreated.bind(item),
                        onError);
                });
            });
        };

        // This function calls for checkFileExists in hatrac.js for all files to determine their existence
        var checkFileExists = function() {
            vm.title = "Checking for existing files";
            vm.isFileExists = true;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.hatracObj.fileExists().then(
                        itemOps.onFileExistSuccess.bind(item),
                        onError);
                });
            });
        };

        // This function starts upload in hatrac.js for all files
        var startUpload = function() {
            vm.title = "Uploading files";
            vm.isUpload = true;
            vm.humanTotalSize = UiUtils.humanFileSize(vm.totalSize);
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.hatracObj.start().then(
                        itemOps.onUploadCompleted.bind(item),
                        onError, 
                        itemOps.onProgressChanged.bind(item));
                });
            });

            speedIntervalTimer = setInterval(function() {
                var diff = vm.sizeTransferred - lastByteTransferred;
                lastByteTransferred = vm.sizeTransferred;

                if (diff <=0) vm.speed = 0;
                else vm.speed = UiUtils.humanFileSize(diff) + "ps";
            }, 1000);

        };

        // This function completes upload job in hatrac.js for all files
        var completeUpload = function() {
            vm.title = "Finalizing Upload";
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.hatracObj.completeUpload().then(
                        itemOps.onCompleteUploadJob.bind(item),
                        onError);
                });
            });
        };

        // This function is called by all rejected promises form above functions
        var onError = function(err) {
            if (vm.uploadError || vm.checksumError) return;
            
            vm.checksumError = true;
            
            $uibModalInstance.cancel();
            throw err;
        };

        // This function aborts upload for all files
        var abortUploads = function() {
            clearInterval(speedIntervalTimer);
            vm.speed = 0;
            params.rows.forEach(function(row) {
                for(var k in row) {
                    if (typeof row[k] == 'object' && row[k].file) {
                        row[k].hatracObj.cancel();
                    }
                }
            });
        };
        vm.cancel = abortUploads;

        /**
         * @function
         * @param {Object} col - Column Object
         * @desc
         * Creates an uploadFile obj to keep track of file and its upload.
         */
        var uploadFile = function(col, column, row) {
            var file = col.file;
            
            var item = {
                name: file.name, 
                size: file.size, 
                humanFileSize: UiUtils.humanFileSize(file.size), 
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
                hatracObj: col.hatracObj,
                url: "",
                column: column,
                reference: reference,
                row: row
            };

            return item;
        };

        // This function is called as a notify promise callback by calculateChecksum function above for each file
        // It updates the progress for checksum on the UI
        uploadFile.prototype.onChecksumProgressChanged = function(uploadedSize) {
            // This code updates the specific progress bar for checksum for the file
            this.jobCreateDone = false;
            this.fileExistsDone = false;
            this.uploadStarted = false;
            this.completeUploadJob = false;
            this.checksumPercent = Math.floor((uploadedSize/this.size) * 100);
            this.checksumProgress = uploadedSize;
            
            // This code updates the main progress bar for checksum
            var progress  = 0;
            vm.isUpload = false;
            vm.isCreateUploadJob = false;
            vm.isFileExists = false;

            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    progress += item.checksumProgress;
                });
            });

            vm.checksumProgress = (progress/vm.totalSize)*100;
            $timeout(function() {
                $scope.$apply();
            });
        };

        // This function is called as a success promise callback by calculateChecksum function above for each file
        // Once all files are done it calls createUploadJob
        uploadFile.prototype.onChecksumCompleted = function(url) {
            this.checksumPercent = 100;
            this.checksumProgress = this.size;
            if (!this.checksumCompleted) { 
                this.checksumCompleted = true;
                this.url = url;
                vm.checksumCompleted++;
               
                // Once all checksums have been calculated call createUploadJobs
                // To create a job for each file
                if (vm.checksumCompleted == vm.noOfFiles) {
                    createUploadJobs();
                }
            }
        };

        // This function is called as a success promise callback by createUpload function above for each file
        // Once upload jobs for all files are done it calls checkFileExists
        uploadFile.prototype.onJobCreated = function() {
            // This code updates the individual progress bar for job creation progress for this file
            this.jobCreateDone = true;
            this.fileExistsDone = false;
            this.uploadStarted = false;
            this.completeUploadJob = false;
            
            // This code updates the main progress bar for job creation progress for all files
            var progress  = 0;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    progress += item.jobCreateDone ? 1 : 0;
                });
            });

            vm.createUploadJobProgress = (progress/vm.noOfFiles)*100;
            vm.createUploadJobCompleted = progress;

            $timeout(function() {
                $scope.$apply();
            });
            
            if (progress == vm.noOfFiles) {
                checkFileExists();
            }
        };

        // This function is called as a success promise callback by checkFileExists function above for each file
        // Once all files have been checked for their existence it calls startUpload
        uploadFile.prototype.onFileExistSuccess = function() {
             // This code updates the individual progress bar for file exist progress for current file
            this.fileExistsDone = true;
            this.uploadStarted = false;
            this.completeUploadJob = false;

            // This code updates the main progress bar for file exist progress for all files
            var progress  = 0;
            vm.isFileExists = true;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    progress += item.fileExistsDone ? 1 : 0;
                });
            });

            vm.fileExistsProgress = (progress/vm.noOfFiles)*100;
            vm.fileExistsCompleted = progress;

            $timeout(function() {
                $scope.$apply();
            });
            
            if (progress == vm.noOfFiles) {
                startUpload();
            }
        };

        // This function is called as a notify promise callback by startUpload function above for each file
        // It updates the progress for upload on the UI
        uploadFile.prototype.onProgressChanged = function(uploadedSize) {
            // This code updates the individual progress bar for uploading file
            this.uploadStarted = true;
            this.completeUploadJob = false;
            this.progressPercent = Math.floor((uploadedSize/this.size) * 100);
            this.progress = uploadedSize;
           

            // This code updates the main progress bar for uploading file
            var progress  = 0
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    progress += item.progress;
                });
            });

            vm.sizeTransferred = progress;
            vm.humanSizeTransferred = UiUtils.humanFileSize(vm.sizeTransferred);

            vm.uploadProgress = (progress/vm.totalSize)*100;
            $timeout(function() {
                $scope.$apply();
            });
        };

        // This function is called as a success promise callback by startUpload function above for each file
        // Once all files are uploaded it calls completeUpload
        uploadFile.prototype.onUploadCompleted = function(url) {
            this.progress = this.size;
            this.progressPercent = 100;
            if (!this.uploadCompleted) {
                this.uploadCompleted = true;
                vm.uploadCompleted++;
                
                // If all files have been uploaded then call completeUpload 
                // to sent requests to mark the job as done
                if (vm.uploadCompleted == vm.noOfFiles) {
                    clearInterval(speedIntervalTimer);
                    completeUpload();
                }
            }
        };

        // This function is called as a success promise callback by completeUpload function above for each file
        // Once upload jobs are marked as completed it sets the url in the columns for rows
        // And closes the modal
        uploadFile.prototype.onCompleteUploadJob = function() {
            this.completeUploadJob = true;
            

            // This code updates the main progress bar for job completion progress for all files
            var progress  = 0;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    progress += item.completeUploadJob ? 1 : 0;
                });
            });

            vm.uploadJobCompleteProgress = (progress/vm.noOfFiles)*100;
            vm.uploadJobCompletedCount = progress;

            $timeout(function() {
                $scope.$apply();
            });
            
            // If all files have been uploaded and their completed upload job calls are done
            if (progress == vm.noOfFiles) {
                var index = 0;
               
                 // Iterate over all rows that are passed as parameters to the modal controller
                params.rows.forEach(function(row) {
                    var tuple = [];
                    var rowIndex = 0;

                    // Iterate over each property/column of a row
                    for (var k in row) {
                    
                        // If the column type is object and has a file property inside it
                        // then set the url in the corresonding column for the row as its value
                        var column = reference.columns.find(function(c) { return c.name == k;  });
                        if (row[k] != null && (column._base.annotations.names().indexOf('tag:isrd.isi.edu,2016:asset') != -1) && typeof row[k] == 'object' && row[k].file) {
                            row[k] = vm.rows[index][rowIndex++].url;
                        }
                    }

                    index++;
                });
                $uibModalInstance.close();
            }
        };

        // Iterate over all rows that are passed as parameters to the modal controller
        params.rows.forEach(function(row) {

            // Create a tuple for the row
            var tuple = [];

            // Iterate over each property/column of a row
            for(var k in row) {

                // If the column type is object and has a file property inside it
                // Then increment the count for no of files and create an uploadFile Object for it
                // Push this to the tuple array for the row
                // NOTE: each file object has an hatracObj property which is an hatrac object
                var column = reference.columns.find(function(c) { return c.name == k;  });
                if (row[k] != null && (column._base.annotations.names().indexOf('tag:isrd.isi.edu,2016:asset') != -1) && typeof row[k] == 'object' && row[k].file) {
                    vm.noOfFiles++;
                    vm.totalSize += row[k].file.size; 
                    tuple.push(new uploadFile(row[k], column, row));
                }
            }

            // Push the tuple on vm.rows which is a local variable
            vm.rows.push(tuple);
        });

        // If there are no files to be uploaded then simply close the modal
        // Else start with calling calculateChecksum
        if (!vm.noOfFiles) {
            $timeout(function() {
               $uibModalInstance.close();
            });
        } else {
            calculateChecksum();
        }

    }])
})();