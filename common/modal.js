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
    .controller('UploadModalDialogController', ['$uibModalInstance', 'params', 'Session', function UploadModalDialogController($uibModalInstance, params, Session) {
        var vm = this;
        vm.rows =  [];

        vm.serverError = false;
        vm.uploadError = false;
        vm.checksumError = false;

        vm.totalSize = 0;
        vm.noOfFiles = 0;
        vm.checkSumCompletedCount = 0;
        vm.completedCount = 0;

        vm.checksumProgress = 0;
        vm.checksumCompleted = 0;

        vm.uploadProgress = 0;
        vm.uploadCompleted = 0;



        var updateChecksumProgreeBar = function() {

        };

        var updateUploadProgressBar = function() {

        };

        var onUploadCompleted = function() {

        };

        var onChecksumCompleted = function() {

        };

        var onUploadError = function(err) {

        };

        var onChecksumError = function(err) {

        };


        var uploadFile = function(col) {
            var file = col.file;
            var uploadObj = col.uploadObj;
            var item = {
                name: file.name, 
                size: file.size, 
                checksumProgress: 0,
                progress: 0
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

            };

            uploadObj.onChecksumCompleted = function() {
                item.checksumCompleted = true;
                if (!item.checksumCompleted) { 
                    vm.checksumCompleted++;
                    onChecksumCompleted();
                }
            };

            uploadObj.onProgressChanged = function(uploadedSize, totalSize) {
                
            };

            uploadObj.onUploadCompleted = function(url) {
                item.checksumProgress = file.size;
                item.uploadCompleted = true;
                if (!item.uploadCompleted) {
                    vm.uploadCompleted++;
                    onUploadCompleted();
                }
            };

            uploadObj.start();

            return item;
        }

        var abortUploads = function() {
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
                if (typeof row[k] == 'object' && row[k].file) {
                    vm.noOfFiles++;
                    vm.totalSize += row[k].file.size; 
                    tuple.push(uploadFile(row[k]));
                }
            }

            if (tuple.length) vm.rows.push(tuple);
        });

        if (!vm.rows.length) {
            $uibModalInstance.close();
        }

    }])
})();
