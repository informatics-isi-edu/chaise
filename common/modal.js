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

        vm.uploadProgress = 0;
        vm.uploadCompleted = 0;

        vm.speed = 0;
        vm.isUpload = false;

        var lastByteTransferred = 0;
        var speedIntervalTimer;

        var updateChecksumProgreeBar = function() {
            var progress  = 0;
            vm.isUpload = false;
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

        var updateUploadProgressBar = function() {
            vm.isUpload = true;
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

                clearInterval(speedIntervalTimer);

                $uibModalInstance.close();
            }
        };

        var startUpload = function() {
           
            vm.humanTotalSize = UiUtils.humanFileSize(vm.totalSize);
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.start();
                });
            });

            speedIntervalTimer = setInterval(function() {
                var diff = vm.sizeTransferred - lastByteTransferred;
                lastByteTransferred = vm.sizeTransferred;

                if (diff <=0) vm.speed = 0;
                else vm.speed = UiUtils.humanFileSize(diff) + "ps";
            }, 1000);

        };

        var onChecksumCompleted = function() {
            if (vm.checksumCompleted == vm.noOfFiles) {
                startUpload();
            }
        };

        var onUploadError = function(err) {
            abortUploads();
        };

        var onChecksumError = function(err) {
            alert("checksum error " + err.message);
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
                uploadCompleted: false,
                uploadStarted: false,
                sometext: "sometext",
                progress: 0,
                progressPercent: 0,
                uploadObj: uploadObj,
                url: ""
            };

            uploadObj.onServerError = function(command, jqXHR, textStatus, errorThrown) {
                if (vm.uploadError || vm.serverError || vm.checksumError) return;
                vm.serverError = true;
                if (jqXHR.status === 401) {
                    alert("Sorry you are not allowed to upload:" + jqXHR.responseText);
                } else {
                    alert(jqXHR.status + "  " + errorThrown);
                    console.log("Our server is not responding correctly");
                }
            };

            uploadObj.onUploadError = function(xhr) {
                if (vm.uploadError || vm.serverError || vm.checksumError) return;

                vm.uploadError = true;
                if (xhr.status === 401) {
                    alert("Sorry you are not allowed to upload : " + xhr.responseText);
                } else {
                    alert(xhr.status + "  " + xhr.responseText);
                }
            };

            uploadObj.onChecksumError = function(err) {
                if (vm.uploadError || vm.serverError || vm.checksumError) return;
                
                vm.checksumError = true;
                onChecksumError();
            };

            uploadObj.onChecksumProgressChanged = function(uploadedSize, totalSize) {
                item.uploadStarted = false;
                item.checksumPercent = Math.floor((uploadedSize/totalSize) * 100);
                item.checksumProgress = uploadedSize;
                updateChecksumProgreeBar(uploadedSize);
            };

            uploadObj.onProgressChanged = function(uploadedSize, totalSize) {
                item.uploadStarted = true;
                item.progressPercent = Math.floor((uploadedSize/totalSize) * 100);
                item.progress = uploadedSize;
                updateUploadProgressBar(uploadedSize);
            };

            uploadObj.onChecksumCompleted = function(url) {
                item.checksumPercent = 100;
                item.checksumProgress = item.size;
                if (!item.checksumCompleted) { 
                    item.checksumCompleted = true;
                    item.url = url;
                    vm.checksumCompleted++;
                    onChecksumCompleted();
                }
            };


            uploadObj.onUploadCompleted = function(url) {
                item.progress = item.size;
                item.progressPercent = 100;
                if (!item.uploadCompleted) {
                    item.uploadCompleted = true;
                    vm.uploadCompleted++;
                    onUploadCompleted();
                }
            };

            return item;
        }

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
            vm.isUpload = false;
            vm.rows.forEach(function(row) {
                row.forEach(function(item) {
                    item.uploadObj.calculateChecksum();
                });
            });
        }

    }])
})();
