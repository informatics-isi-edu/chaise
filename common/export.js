(function () {
    'use strict';

    angular.module('chaise.export', [])

    .constant('formatOptions', {
        "BAG": {
            algs: ["md5"],
            archiver: "zip",
            metadata: {},
            table_format: "csv"
        }
    })

    .directive('export', ['AlertsService', 'formatOptions', function (AlertsService, formatOptions) {
        return {
            restrict: 'AE',
            templateUrl: '../common/templates/export.html',
            scope: {
                reference: "=",
                hasValues: "="
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
                    scope.isLoading = true;
                    // The actual export code - it invokes a (synchronous) web service call to either
                    // ermrest (for single table CSV or JSON export) or ioboxd (if bag or multi-file export)
                    _doExport(template);
                };

                scope.$watch('hasValues', function (newValue, oldValue) {
                    if (newValue) {
                        formatOptions.BAG.name = scope.reference.location.tableName;

                        _updateExportFormats();
                    }
                });

                function _updateExportFormats() {
                    var templates = scope.reference.table.exportTemplates

                    templates.forEach(function (template) {
                        if (template.format_name) {
                            // matches object format set for default case with CSV
                            scope.exportOptions.supportedFormats.push(template);
                        }
                    });
                }

                function _doExport(template) {
                    scope.exporter = new ERMrest.Exporter(scope.reference, template);
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
                            scope.isLoading = false;
                            break;
                        case "BAG":
                        case "FILE":
                            var exportParametersString = JSON.stringify(scope.exporter.exportParameters, null, "  ");

                            // begin export and start a timer
                            console.info("Executing external export with the following parameters:\n" + exportParametersString);
                            console.time('External export duration');
                            scope.exporter.invokeExternalExport().then(function (response) {
                                location.href = response[0];

                                console.timeEnd('External export duration');
                                scope.isLoading = false;
                            }).catch(function (error) {
                                console.timeEnd('External export duration');
                                AlertsService.addAlert("Export failed for " + scope.exporter.exportParameters.catalog.host + "/iobox/export/ with " + error.message, "error");
                                scope.isLoading = false;
                            });
                            break;
                        default:
                            AlertsService.addAlert("Unsupported export format: " + formatType);
                    }
                }
            }
        };
    }]);
})();
