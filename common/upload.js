(function () {
    'use strict';

    angular.module('chaise.upload', ['ermrestjs'])


        .directive('upload', [ '$timeout', 'ERMrest', function($timeout, ERMrest) {

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/upload.html',
                scope: {
                    column: '=',
                    values: '=',
                    value: '=',
                    reference: '='
                },
                link: function (scope, element,attrs, ngModel) {
                    scope.fileEl;
                    scope.fileElId = "fileInput" +  Math.round(Math.random() * 100000);

                    $timeout(function() {

                        scope.fileEl = angular.element(element[0].querySelector('input[type="file"]'));

                        // Bind change event file input
                        scope.fileEl
                            .bind('change', function (event) {

                                if (event.target.files.length) {
                                    // set the reference value object with selected file, url/filename
                                    // and also create an Upload object and save it as hatracObj in the value object
                                    scope.value.file = event.target.files[0];
                                    scope.value.hatracObj = new ERMrest.Upload(scope.value.file, {
                                        column: scope.column,
                                        reference: scope.reference
                                    });
                                    scope.value.url = scope.value.file.name;
                                    scope.$apply();
                                }
                            });

                    }, 10);


                    scope.select = function() {
                        scope.fileEl.click();
                    };

                    scope.clear = function() {
                        scope.value.url = "";
                        delete scope.value.file;
                        delete scope.value.hatracObj;
                        scope.fileEl.val("");
                    };
                }
            };
        }])

        /*
            This controller basically starts the whole upload process once the user presses the submit button
            It is called before the actual save takes place

            There're a sequence of operations that are performed to upload the files

            1.  The controller receives an array of raw rows from the recordedit app. These rows contain objects for file types.
                The code iterates over all rows, to find for file objects and creates an uploadFile type object.
                It calls calculateChecksum if there are any file objects

            2.  CalculateChecksum calls the relevant function in hatrac.js using the hatracObj to calculate the checksum
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
        .controller('UploadModalDialogController', ['$uibModalInstance', 'params', 'Session', '$log', '$scope', '$timeout', 'UiUtils', function UploadModalDialogController($uibModalInstance, params, Session, $log, $scope, $timeout, UiUtils) {
            var vm = this;

            // This will contains all the tuples who have files to be uploaded.
            vm.rows =  [];

            var reference = params.reference;
            // The controller uses a bunch of variables that're being used to keep track of current state of upload.

            vm.erred = false;

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

            vm.queue = [];

            vm.aborted = false;

            vm.cancel = function() {
                vm.aborted = true;
                abortUploads();
                $uibModalInstance.dismiss();
            };

            var lastByteTransferred = 0;
            var speedIntervalTimer;

            // This function calls for checksumCalculation in hatrac.js for all files
            var calculateChecksum = function() {

                if (vm.erred || vm.aborted) return;

                vm.title = "Calculating and Verifying Checksum";
                vm.isCreateUploadJob = false;
                vm.isFileExists = false;
                vm.isUpload = false;
                vm.rows.forEach(function(row) {
                    row.forEach(function(item) {
                        item.hatracObj.calculateChecksum(item.row).then(
                            item.onChecksumCompleted.bind(item),
                            onError,
                            item.onChecksumProgressChanged.bind(item));
                    });
                });
            };

            // This function creates upload jobs in hatrac.js for all files
            var createUploadJobs = function() {

                if (vm.erred || vm.aborted) return;

                vm.title = "Creating Upload Jobs for the files";
                vm.isCreateUploadJob = true;
                vm.isFileExists = false;
                vm.isUpload = false;
                vm.rows.forEach(function(row) {
                    row.forEach(function(item) {
                        item.hatracObj.createUploadJob().then(
                            item.onJobCreated.bind(item),
                            onError);
                    });
                });
            };

            // This function calls for checkFileExists in hatrac.js for all files to determine their existence
            var checkFileExists = function() {

                if (vm.erred || vm.aborted) return;

                vm.title = "Checking for existing files";
                vm.isFileExists = true;
                vm.isUpload = false;
                vm.rows.forEach(function(row) {
                    row.forEach(function(item) {
                        item.hatracObj.fileExists().then(
                            item.onFileExistSuccess.bind(item),
                            onError);
                    });
                });
            };

            // This function starts upload in hatrac.js for all files
            var startUpload = function() {

                if (vm.erred || vm.aborted) return;

                vm.title = "Uploading files";
                vm.isUpload = true;
                vm.humanTotalSize = UiUtils.humanFileSize(vm.totalSize);

                vm.queue = [];

                vm.rows.forEach(function(row) {
                    row.forEach(function(item) {
                        item.onProgressChanged(0);
                        vm.queue.push(item);
                    });
                });

                startQueuedUpload();

                vm.speed = "Calculating Speed";

                speedIntervalTimer = setInterval(function() {
                    var diff = vm.sizeTransferred - lastByteTransferred;
                    lastByteTransferred = vm.sizeTransferred;

                    if (diff > 0) vm.speed = UiUtils.humanFileSize(diff) + "ps";

                }, 1000);

            };

            var startQueuedUpload = function() {

                if (vm.erred || vm.aborted) return;

                var item = vm.queue.shift();
                if(!item) return;

                item.hatracObj.start().then(
                            item.onUploadCompleted.bind(item),
                            onError,
                            item.onProgressChanged.bind(item));
            };

            // This function completes upload job in hatrac.js for all files
            var completeUpload = function() {

                if (vm.erred || vm.aborted) return;

                vm.title = "Finalizing Upload";
                vm.rows.forEach(function(row) {
                    row.forEach(function(item) {
                        item.hatracObj.completeUpload().then(
                            item.onCompleteUploadJob.bind(item),
                            onError);
                    });
                });
            };

            // This function aborts upload for all files
            var abortUploads = function(err) {

                var deleteUploadJob = false;

                if (err && ([401, 408, 0 , -1, 500, 503].indexOf(err.code) == -1)) {
                    deleteUploadJob = true;
                }

                clearInterval(speedIntervalTimer);
                vm.aborted = true;
                vm.speed = 0;
                params.rows.forEach(function(row) {
                    for(var k in row) {
                        if (row[k] != null && typeof row[k] == 'object' && row[k].file) {
                            row[k].hatracObj.cancel(deleteUploadJob);
                        }
                    }
                });
            };

            // This function is called by all rejected promises form above functions
            var onError = function(err) {
                if (vm.erred || vm.aborted) return;

                vm.erred = true;

                abortUploads();

                $uibModalInstance.dismiss(err);
            };


            /**
             * @function
             * @param {Object} data - data object for the file column
             * @param {Ermrest.Column} column - Column Object
             * @param {Object} row - Json key value Object of row values
             * @desc
             * Creates an uploadFile obj to keep track of file and its upload.
             */
            var uploadFile = function(data, column, row) {
                var file = data.file;

                this.name = file.name;
                this.size = file.size;
                this.humanFileSize = UiUtils.humanFileSize(file.size);
                this.checksumProgress = 0;
                this.checksumPercent = 0;
                this.checksumCompleted = false;
                this.jobCreateDone = false;
                this.fileExistsDone = false;
                this.uploadCompleted = false;
                this.uploadStarted = false;
                this.completeUploadJob = false;
                this.progress = 0;
                this.progressPercent = 0;
                this.hatracObj = data.hatracObj;
                this.url = "";
                this.column = column;
                this.reference = reference;
                this.row = row;

                return this;
            };

            // This function is called as a notify promise callback by calculateChecksum function above for each file
            // It updates the progress for checksum on the UI
            uploadFile.prototype.onChecksumProgressChanged = function(uploadedSize) {

                if (vm.erred || vm.aborted) return;

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
                    try {
                        $scope.$apply();
                    } catch (e) {
                        $log.warn("$scope.$apply() error. $apply was called while a digest cycle was running.");
                    }
                });
            };

            // This function is called as a success promise callback by calculateChecksum function above for each file
            // Once all files are done it calls createUploadJob
            uploadFile.prototype.onChecksumCompleted = function(url) {

                if (vm.erred || vm.aborted) return;

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

                if (vm.erred || vm.aborted) return;

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
                    try {
                        $scope.$apply();
                    } catch (e) {
                        $log.warn("$scope.$apply() error. $apply was called while a digest cycle was running.");
                    }
                });

                if (progress == vm.noOfFiles) {
                    checkFileExists();
                }
            };

            // This function is called as a success promise callback by checkFileExists function above for each file
            // Once all files have been checked for their existence it calls startUpload
            uploadFile.prototype.onFileExistSuccess = function() {

                if (vm.erred || vm.aborted) return;

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
                    try {
                        $scope.$apply();
                    } catch (e) {
                        $log.warn("$scope.$apply() error. $apply was called while a digest cycle was running.");
                    }
                });

                if (progress == vm.noOfFiles) {
                    startUpload();
                }
            };

            // This function is called as a notify promise callback by startUpload function above for each file
            // It updates the progress for upload on the UI
            uploadFile.prototype.onProgressChanged = function(uploadedSize) {

                if (vm.erred || vm.aborted) return;

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
                    try {
                        $scope.$apply();
                    } catch (e) {
                        $log.warn("$scope.$apply() error. $apply was called while a digest cycle was running.");
                    }
                });
            };

            // This function is called as a success promise callback by startUpload function above for each file
            // Once all files are uploaded it calls completeUpload
            uploadFile.prototype.onUploadCompleted = function(url) {

                if (vm.erred || vm.aborted) return;

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
                startQueuedUpload();
            };

            // This function is called as a success promise callback by completeUpload function above for each file
            // Once upload jobs are marked as completed it sets the url in the columns for rows
            // And closes the modal
            uploadFile.prototype.onCompleteUploadJob = function() {

                if (vm.erred || vm.aborted) return;

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
                    try {
                        $scope.$apply();
                    } catch (e) {
                        $log.warn("$scope.$apply() error. $apply was called while a digest cycle was running.");
                    }
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
                            if (column && row[k] != null && (column.isAsset) && typeof row[k] == 'object' && row[k].file) {
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
                    if (column && column.isAsset) {

                        // If the column value of the row contains a file object then add it to the tuple to upload
                        // else if column contains url then set it in the column directly
                        // if the url is empty then set the column values as null
                        if (row[k] != null && typeof row[k] == 'object' && row[k].file) {
                            vm.noOfFiles++;
                            vm.totalSize += row[k].file.size;
                            tuple.push(new uploadFile(row[k], column, row));
                        } else {
                            row[k] = (row[k].url && row[k].url.length) ? row[k].url : null;
                        }
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
