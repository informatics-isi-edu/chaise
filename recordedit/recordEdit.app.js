(function() {
    'use strict';

    angular.module('chaise.recordEdit', [
        '720kb.datepicker',
        'chaise.alerts',
        'chaise.authen',
        'chaise.delete',
        'chaise.errors',
        'chaise.filters',
        'chaise.modal',
        'chaise.navbar',
        'chaise.utils',
        'chaise.validators',
        'ermrestjs',
        'ngMessages',
        'ngSanitize',
        //'rzModule',
        'ui.bootstrap',
        'ui.select'
    ])

    .run(['ERMrest', 'ErrorService', 'headInjector', 'recordEditModel', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', function runRecordEditApp(ERMrest, ErrorService, headInjector, recordEditModel, UiUtils, UriUtils, $log, $rootScope, $window) {
        var context = { booleanValues: ['', true, false] };
        UriUtils.setOrigin();
        headInjector.addTitle();
        headInjector.addCustomCSS();

        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();
        UriUtils.setLocationChangeHandling();

        try {
            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

            context = $rootScope.context = UriUtils.parseURLFragment($window.location, context);
            context.appName = "recordedit";

            // If defined but false, throw an error
            if (!chaiseConfig.editRecord && chaiseConfig.editRecord !== undefined) {
                var message = 'Chaise is currently configured to disallow editing records. Check the editRecord setting in chaise-config.js.';
                var error = new Error(message);
                error.code = "Record Editing Disabled";

                throw error;
            }

            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

            context = $rootScope.context = UriUtils.parseURLFragment($window.location, context);
            context.appName = "recordedit";

            ERMrest.resolve(ermrestUri, {cid: context.appName}).then(function getReference(reference) {
                $rootScope.reference = (context.filter ? reference.contextualize.entryEdit : reference.contextualize.entryCreate);
                $rootScope.reference.session = $rootScope.session;

                $log.info("Reference: ", $rootScope.reference);

                // Case for editing an entity
                if (context.filter) {
                    // check id range before reading?
                    $rootScope.reference.read(1).then(function getPage(page) {
                        var column, value,
                            tuple = page.tuples[0],
                            values = tuple.values;

                        $rootScope.tuples = page.tuples;
                        $rootScope.displayname = tuple.displayname;

                        for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                            column = $rootScope.reference.columns[i];

                            switch (column.type.name) {
                                case "timestamptz":
                                case "date":
                                    value = (values[i] ? new Date(values[i]) : '');
                                    break;
                                case "int2":
                                case "int4":
                                case "int8":
                                case "float4":
                                case "float8":
                                case "numeric":
                                    value = (values[i] ? parseInt(values[i], 10) : '');
                                    break;
                                default:
                                    value = values[i];
                                    break;
                            }

                            recordEditModel.rows[recordEditModel.rows.length - 1][column.name] = value;
                        }
                    }, function error(response) {
                        $log.warn(response);
                        throw reponse;
                    });
                } else {
                    $rootScope.displayname = $rootScope.reference.displayname;
                }
            }, function error(response) {
                $log.warn(response);
                throw response;
            }).catch(function genericCatch(exception) {
                ErrorService.catchAll(exception);
            });
        } catch (exception) {
            ErrorService.errorPopup(exception.message, exception.code, "home page");
        }
    }]);
})();
