(function () {
    'use strict';

    angular.module('chaise.modal', [])

    .controller('ConfirmDeleteController', ['$uibModalInstance', function ConfirmDeleteController($uibModalInstance) {
        var vm = this;
        vm.ok = ok;
        vm.cancel = cancel;
        vm.status = 0;

        function ok() {
            $uibModalInstance.close();
        }

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }
    }])
    .controller('ErrorDialogController', ['$uibModalInstance', 'params', function ErrorDeleteController($uibModalInstance, params) {
        var vm = this;
        vm.params = params;
        vm.ok = ok;

        function ok() {
            $uibModalInstance.close();
        }
    }])
    .controller('LoginDialogController', ['$uibModalInstance', 'params' , '$sce', function LoginDialogController($uibModalInstance, params, $sce) {
        var vm = this;
        params.login_url = $sce.trustAsResourceUrl(params.login_url);
        vm.params = params;

        vm.openWindow = function() {

            var x = window.innerWidth/2 - 800/2;
            var y = window.innerHeight/2 - 600/2;

            window.open(params.login_url, '_blank','width=800,height=600,left=' + x + ',top=' + y);

            return false;
        }

        vm.params.host = $sce.trustAsResourceUrl(window.location.host);

        vm.cancel = cancel;

        function cancel() {
            $uibModalInstance.dismiss('cancel');
        }

    }])
    .controller('SearchPopupController', ['$scope', '$uibModalInstance', 'DataUtils', 'params', 'Session', function SearchPopupController($scope, $uibModalInstance, DataUtils, params, Session) {
        var vm = this;

        vm.params = params;
        vm.ok = ok;
        vm.cancel = cancel;

        var reference = params.reference;
        vm.hasLoaded = false;
        var reference = vm.reference = params.reference;

        vm.tableModel = {
            hasLoaded:          false,
            reference:          reference,
            tableDisplayName:   reference.displayname,
            columns:            reference.columns,
            sortBy:             null,
            sortOrder:          null,
            enableSort:         true,
            enableAutoSearch:   true,
            pageLimit:          25,
            search:             null,
            config:             {viewable: false, editable: false, deletable: false, selectable: true},
            context:            params.context
        };

        var fetchRecords = function() {

            // TODO this should not be a hardcoded value, either need a pageInfo object across apps or part of user settings
            reference.read(25).then(function getPseudoData(page) {
                vm.tableModel.hasLoaded = true;
                vm.tableModel.initialized = true;
                vm.tableModel.page = page;
                vm.tableModel.rowValues = DataUtils.getRowValuesFromPage(page);
            }, function(exception) {
                if (exception instanceof ERMrest.UnauthorizedError || exception.code == 401) {
                    Session.loginInANewWindow(function() {
                        fetchRecords();
                    });
                } else {
                    AlertsService.addAlert({type: 'error', message: response.message});
                    $log.warn(response);
                }
            });
        }

        fetchRecords();

        function ok(tuple) {
            $uibModalInstance.close(tuple);
        }

        function cancel() {
            $uibModalInstance.dismiss("cancel");
        }
    }])
    .controller('UploadModalDialogController', ['$uibModalInstance', 'params', 'Session', '$scope', '$timeout', 'UiUtils', function UploadModalDialogController($uibModalInstance, params, Session, $scope, $timeout, UiUtils) {
        var vm = this;
        vm.rows =  [];

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

        var updateChecksumProgreeBar = function() {
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
            })
            
        };


        var onChecksumCompleted = function() {
            if (vm.checksumCompleted == vm.noOfFiles) {
                createUploadJobs();
            }
        };

        var updateCreateUploadJobProgreeBar = function() {
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


        var updateFileExistsProgreeBar = function() {
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

        var updateUploadProgressBar = function() {
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

        var onUploadCompleted = function() {
            if (vm.uploadCompleted == vm.noOfFiles) {
                clearInterval(speedIntervalTimer);
                completeUpload();
            }
        };

        var updateJobCompleteProgreeBar = function() {
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
            
            if (progress == vm.noOfFiles) {
                var index = 0;
                params.rows.forEach(function(row) {
                    var tuple = [];
                    var rowIndex = 0;
                    for(var k in row) {
                        if (row[k] !=null && typeof row[k] == 'object' && row[k].file) {
                            row[k] = vm.rows[index][rowIndex++].url;
                        }
                    }

                    index++;
                });
                $uibModalInstance.close();
            }
        };

        var calculateChecksum = function() {
            vm.title = "Calculating and Verifying Checksum";
            vm.isCreateUploadJob = false;
            vm.isFileExists = false;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.calculateChecksum().then(
                        itemOps.onChecksumCompleted.bind(item),
                        onChecksumError, 
                        itemOps.onChecksumProgressChanged.bind(item));
                });
            });
        };

        var createUploadJobs = function() {
            vm.title = "Creating Upload Jobs for the files";
            vm.isCreateUploadJob = true;
            vm.isFileExists = false;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.createUploadJob().then(
                        itemOps.onJobCreated.bind(item),
                        onUploadJobCreationError);
                });
            });
        };

        var checkFileExists = function() {
            vm.title = "Checking for existing files";
            vm.isFileExists = true;
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.fileExists().then(
                        itemOps.onFileExistSuccess.bind(item),
                        onFileExistsError);
                });
            });
        };

        var startUpload = function() {
            vm.title = "Uploading files";
            vm.isUpload = true;
            vm.humanTotalSize = UiUtils.humanFileSize(vm.totalSize);
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.start().then(
                        itemOps.onUploadCompleted.bind(item),
                        onUploadError, 
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

        var completeUpload = function() {
            vm.title = "Finalizing Upload";
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.completeUpload().then(
                        itemOps.onCompleteUploadJob.bind(item),
                        onCompleteUploadJobError);
                });
            });
        };

        var onUploadJobCreationError = function(err) {
            if (vm.uploadError || vm.checksumError) return;
            
            vm.uploadError = true;
            abortUploads();
            $uibModalInstance.cancel();
            throw err;
        };

        var onFileExistsError = function() {
            if (vm.uploadError || vm.checksumError) return;
            
            vm.uploadError = true;
            abortUploads();
            $uibModalInstance.cancel();
            throw err;
        };

        var onUploadError = function(err) {
            if (vm.uploadError || vm.checksumError) return;
            
            vm.uploadError = true;

            abortUploads();
            $uibModalInstance.cancel();
            throw err;
        };

        var onCompleteUploadJobError = function(err) {
            if (vm.uploadError || vm.checksumError) return;
            
            vm.uploadError = true;
            $uibModalInstance.cancel();
            throw err;
        };

        var onChecksumError = function(err) {
            if (vm.uploadError || vm.checksumError) return;
            
            vm.checksumError = true;
            
            $uibModalInstance.cancel();
            throw err;
        };

        var uploadFile = function(col) {
            var file = col.file;
            var uploadObj = col.hatracObj;
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
                sometext: "sometext",
                progress: 0,
                progressPercent: 0,
                uploadObj: uploadObj,
                url: ""
            };

            return item;
        };


        var itemOps = {
            
            onChecksumProgressChanged: function(uploadedSize) {
                this.jobCreateDone = false;
                this.fileExistsDone = false;
                this.uploadStarted = false;
                this.completeUploadJob = false;
                this.checksumPercent = Math.floor((uploadedSize/this.size) * 100);
                this.checksumProgress = uploadedSize;
                updateChecksumProgreeBar(uploadedSize);
            },

            onProgressChanged: function(uploadedSize) {
                this.uploadStarted = true;
                this.completeUploadJob = false;
                this.progressPercent = Math.floor((uploadedSize/this.size) * 100);
                this.progress = uploadedSize;
                updateUploadProgressBar(uploadedSize);
            },

            onChecksumCompleted: function(url) {
                this.checksumPercent = 100;
                this.checksumProgress = this.size;
                if (!this.checksumCompleted) { 
                    this.checksumCompleted = true;
                    this.url = url;
                    vm.checksumCompleted++;
                    onChecksumCompleted();
                }
            },

            onJobCreated: function() {
                this.jobCreateDone = true;
                this.fileExistsDone = false;
                this.uploadStarted = false;
                this.completeUploadJob = false;
                updateCreateUploadJobProgreeBar();
            },

            onFileExistSuccess: function() {
                this.fileExistsDone = true;
                this.uploadStarted = false;
                this.completeUploadJob = false;
                updateFileExistsProgreeBar();
            },

            onUploadCompleted: function(url) {
                this.progress = this.size;
                this.progressPercent = 100;
                if (!this.uploadCompleted) {
                    this.uploadCompleted = true;
                    vm.uploadCompleted++;
                    onUploadCompleted();
                }
            },

            onCompleteUploadJob: function() {
                this.completeUploadJob = true;
                updateJobCompleteProgreeBar();
            }
        };

        var abortUploads = function() {
            clearInterval(speedIntervalTimer);
            vm.speed = 0;
            params.rows.forEach(function(row) {
                for(var k in row) {
                    if (typeof row[k] == 'object' && row[k].file) {
                        row[k].uploadObj.cancel();
                    }
                }
            });
        };

        vm.cancel = abortUploads;

        params.rows.forEach(function(row) {
            var tuple = [];
            for(var k in row) {
                if (row[k] !=null && typeof row[k] == 'object' && row[k].file) {
                    vm.noOfFiles++;
                    vm.totalSize += row[k].file.size; 
                    tuple.push(uploadFile(row[k]));
                }
            }

            if (tuple.length) vm.rows.push(tuple);
        });

        if (!vm.rows.length) {
            $timeout(function() {
               $uibModalInstance.close();
            });
        } else {
            calculateChecksum();
        }

    }])
})();
