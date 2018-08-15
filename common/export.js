(function () {
    'use strict';

    angular.module('chaise.export', ['chaise.utils'])

    .directive('export', ['AlertsService', 'logActions', 'modalUtils', '$timeout', 'UriUtils', function (AlertsService, logActions, modalUtils, $timeout, UriUtils) {

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
            var templates = scope.reference.table.exportTemplates;

            templates.forEach(function (template) {
                if (template.format_name) {
                    // matches object format set for default case with CSV
                    scope.exportOptions.supportedFormats.push(template);
                }
            });
        }

        /**
         * Send the request for export
         */
        function _doExport(scope, template) {
            var formatName = template.format_name;
            var formatType = template.format_type;
            switch (formatType) {
                case "DIRECT":
                    if (formatName === "CSV") {
                        location.href = scope.reference.csvDownloadLink;
                    }
                    // NOTE: uncomment below when we want to support JSON
                    // else if (exportFormatName === "JSON") {
                    //     location.href = scope.reference.jsonDownloadLink;
                    // }
                    break;
                case "BAG":
                case "FILE":
                    scope.exporter = new ERMrest.Exporter(scope.reference, template);
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
                                format_name: template.format_name
                            }
                        }
                    }, null, function () {
                        _cancelExport(scope);
                    });
                    scope.isLoading = true;

                    scope.exporter.run({action: logActions.export}).then(function (response) {
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
                        AlertsService.addAlert("Export failed. Please report this problem to your system administrators. Details: " + error.message, "error");
                    });
                    break;
                default:
                    AlertsService.addAlert("Unsupported export format: " + formatType + ". Please report this problem to your system administrators.");
            }
        }

        return {
            restrict: 'AE',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/export.html',
            scope: {
                reference: "=",
                hasValues: "=",
                disabled: "="
            },
            link: function (scope, element, attributes) {
                scope.isLoading = false;
                scope.exporter = null;

                scope.exportOptions = {
                    supportedFormats: [
                        {
                            outputs: [],
                            name: "default_csv",
                            format_name: "CSV",
                            format_type: "DIRECT"
                        }
                    ]
                };

                scope.submit = function (template) {
                    // The actual export code - it invokes a (synchronous) web service call to either
                    // ermrest (for single table CSV or JSON export) or ioboxd (if bag or multi-file export)
                    _doExport(scope, template);
                };

                scope.$watch('hasValues', function (newValue, oldValue) {
                    if (newValue && scope.exportOptions.supportedFormats.length === 1) {
                        _updateExportFormats(scope);
                    }
                });
            }
        };
    }]);
})();
