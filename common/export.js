(function () {
    'use strict';

    angular.module('chaise.export', ['chaise.utils'])

    .directive('export', ['AlertsService', 'ConfigUtils', 'DataUtils', 'ErrorService', 'logService', 'modalUtils', '$rootScope', '$timeout', 'UriUtils', '$window', function (AlertsService, ConfigUtils, DataUtils, ErrorService, logService, modalUtils, $rootScope, $timeout, UriUtils, $window) {
        var chaiseConfig = ConfigUtils.getConfigJSON();
        var context = ConfigUtils.getContextJSON();
        /**
         * Cancel the current export request
         */
        function _cancelExport(scope) {
            if (scope.exporter) {
                scope.exporter.cancel();
            }
            scope.isLoading = false;
            AlertsService.addAlert("Export request has been canceled.", "warning");
        }

        /**
         * Update the list of templates in UI
         */
        function _updateExportFormats(scope) {
            var templates = scope.reference.getExportTemplates(!chaiseConfig.disableDefaultExport);

            templates.forEach(function (template) {
                if (template.displayname) {
                    // matches object format set for default case with CSV
                    scope.exportOptions.supportedFormats.push(template);
                }
            });
        }

        /**
         * Send the request for export
         */
        function _doExport(scope, template) {
            var formatName = template.displayname;
            var formatType = template.type;
            switch (formatType) {
                case "DIRECT":
                    if (formatName === scope.csvOptionName) {
                        location.href = scope.reference.csvDownloadLink;
                    }
                    // NOTE: uncomment below when we want to support JSON
                    // else if (exportFormatName === "JSON") {
                    //     location.href = scope.reference.jsonDownloadLink;
                    // }
                    break;
                case "BAG":
                case "FILE":
                    var bagName = scope.reference.table.name;
                    if ($rootScope.tuple) {
                        bagName += "_" + $rootScope.tuple.uniqueId;
                    }
                    scope.exporter = new ERMrest.Exporter(
                        scope.reference,
                        bagName,
                        template,
                        chaiseConfig.exportServicePath
                    );
                    var exportParametersString = JSON.stringify(scope.exporter.exportParameters, null, "  ");

                    // begin export and start a timer
                    console.info("Executing external export with the following parameters:\n" + exportParametersString);
                    console.time('External export duration');
                    scope.progressModal = modalUtils.showModal({
                        templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/exportProgress.modal.html",
                        controller: "ExportProgressController",
                        windowClass: "export-progress",
                        controllerAs: "ctrl",
                        size: "md",
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            params: {
                                displayname: template.displayname
                            }
                        }
                    }, null, function () {
                        _cancelExport(scope);
                    });
                    scope.isLoading = true;

                    // TODO LOG is this enough? needed?
                    var logStack = logService.addExtraInfoToStack(null, {
                        template: {
                            displayname: scope.exporter.template.displayname,
                            type: scope.exporter.template.type
                        }
                    });
                    var logObj = {
                        action: logService.getActionString(logService.logActions.EXPORT),
                        stack: logStack
                    }
                    scope.exporter.run(logObj).then(function (response) {
                        // if it was canceled, just ignore the result
                        if (response.canceled) return;

                        console.timeEnd('External export duration');
                        scope.progressModal.close("Done");
                        scope.isLoading = false;

                        location.href = response.data[0];
                    }).catch(function (error) {
                        console.timeEnd('External export duration');
                        scope.progressModal.close("Done");
                        scope.isLoading = false;
                        error.subMessage = error.message;
                        error.message = "Export failed. Please report this problem to your system administrators.";
                        ErrorService.handleException(error, true);
                    });
                    break;
                default:
                    ErrorService.handleException(new Error("Unsupported export format: " + formatType + ". Please report this problem to your system administrators."), true);
            }
        }

        return {
            restrict: 'AE',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/export.html',
            scope: {
                reference: "=",
                disabled: "=",
                csvOptionName: "@?"
            },
            link: function (scope, element, attributes) {
                scope.isLoading = false;
                scope.exporter = null;
                scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;
                scope.hideNavbar = context.hideNavbar;

                if (!DataUtils.isNoneEmptyString(scope.csvOptionName)) {
                    scope.csvOptionName = "Search results (CSV)";
                }

                scope.logDropdownOpened = function () {
                    logService.logClientAction({
                        action: logService.getActionString(logService.logActions.EXPORT_OPEN),
                        stack: logService.getStackObject()
                    }, scope.reference.defaultLogInfo);
                };

                scope.exportOptions = {
                    supportedFormats: [
                        {
                            outputs: [],
                            displayname: scope.csvOptionName,
                            type: "DIRECT"
                        }
                    ]
                };

                scope.submit = function (template) {
                    // The actual export code - it invokes a (synchronous) web service call to either
                    // ermrest (for single table CSV or JSON export) or ioboxd (if bag or multi-file export)
                    _doExport(scope, template);
                };

                scope.$watch('reference', function (newValue, oldValue) {
                    if (newValue && scope.exportOptions.supportedFormats.length === 1) {
                        _updateExportFormats(scope);
                    }
                });
            }
        };
    }]);
})();
