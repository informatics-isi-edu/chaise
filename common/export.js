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
                    supportedFormats: [{name: "CSV", type: "DIRECT", template: null}]
                };

                scope.submit = function (format) {
                    scope.isLoading = true;
                    // The actual export code - it invokes a (synchronous) web service call to either
                    // ermrest (for single table CSV or JSON export) or ioboxd (if bag or multi-file export)
                    _doExport(format);
                };

                scope.$watch('hasValues', function (newValue, oldValue) {
                    if (newValue) {
                        formatOptions.BAG.name = scope.reference.location.tableName;
                        _updateExportFormats();
                    }
                });

                function _updateExportFormats() {
                    var templates = ERMrest.readTemplatesAnnotation(scope.reference);

                    templates.forEach(function (template) {
                        var name = template.name;
                        var format_name = template.format_name;
                        var format_type = template.format_type;
                        if (format_name) {
                            var format = {name: format_name, type: format_type, template: template};
                            scope.exportOptions.supportedFormats.push(format);
                        }
                    });
                }

                function _doExport(format) {
                    scope.exporter = new ERMrest.Exporter(scope.reference, format, formatOptions);
                    var formatName = format.name;
                    var formatType = format.type;
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
                            var exportParams = scope.exporter.exportParameters;
                            var exportParametersString = JSON.stringify(exportParams, null, "  ");

                            // begin export and start a timer
                            console.info("Executing external export with the following parameters:\n" + exportParametersString);
                            console.time('External export duration');
                            scope.exporter.invokeExternalExport().then(function (response) {
                                location.href = response[0];

                                console.timeEnd('External export duration');
                                scope.isLoading = false;
                            }).catch(function (error) {
                                console.timeEnd('External export duration');
                                AlertsService.addAlert("Export failed for " + exportParams.catalog.host + "/iobox/export/ with " + error.message, "error");
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
