'use strict';

/* ermMatrixController:
 *   This controller is used to create a matrix based on three attributes that are given.
 *   The first attribute is used for indicating matrix rows and the second is for columns.
 *   The third attribute is used for color coding and categorizing the data sets.
 * */

/*
 TODO
 - clean the code. :|
 - show watch you got :D
 - ask what to do next!
 - maybe push?

 TODO after getting the new API:
 - get list of attributes.
 - get dataSetTypes
 - add watch on the attribute selection
 - get data for each row, column and dataType

 */

var ermMatrixController = angular.module('ermMatrixController', []);

ermMatrixController.controller('ermMatrixController', ['$scope', 'FacetsData', 'ermrest',
    function ($scope, FacetsData, ermrest) {
        var defaultAttrSelect = "Select";

        $scope.FacetsData = FacetsData;
        $scope.showMatrix = false; // determines whether the matrix is ready or not
        $scope.error = {
            "has": false,
            "message": "",
            "imp": false
        }; // for showing error

        /**
         * @desc Get the list of attributes on load.
         */
        this.getAttributeList = function getAttributeList() {
            this.attributeList = [
                {"name": defaultAttrSelect, "value": defaultAttrSelect},
                {"name": "Mouse Age Stage", "value": "mouse_age_stage"},
                {"name": "Mouse Anatomical Feature", "value": "mouse_anatomical_feature"},
                {"name": "Experiment Type", "value": "exp_type"},
                {"name": "Data Type", "value": "data_type"}
            ];//TODO getting the list of attribute names from database.

            if (this.attributeList.length < 3) {
                $scope.error = {
                    "has": true,
                    "message": "At least three attributes must be in database to create the matrix.",
                    "imp": true
                };
                return false;
            }

            // for test purpose:
            this.selectedAttributes = [
                this.attributeList[1],
                this.attributeList[2],
                this.attributeList[3]
            ];
            this.createMatrix();

            //$scope.FacetsData.progress = false;
        };

        /**
         * @desc creates the matrix based on selected attributes.
         * loads these data:
         *  - rows: a list of rows (first attribute).
         *  - columns: a list of columns (second attribute).
         *  - dataTypes: a list of data types ( third attribute).
         *  - rowLabel: name of the first attribute in the database.
         *  - colLabel: name of the second attribute in the database
         *  - dataTypeLabel: name of the third attribute in the database.
         *  -! dataSetTypes: a three dimensional array, dataSetTypes[i][j] indicates data types of data sets (a list) with rowLabel:=i and colLabel:=j
         */
        this.createMatrix = function createMatrix() {
            $scope.showMatrix = false;
            for(var attr in this.selectedAttributes){
                if(this.selectedAttributes.hasOwnProperty(attr) &&
                    this.selectedAttributes[attr].value == defaultAttrSelect){
                    $scope.error = {
                        "has": true,
                        "message": "Select all three attributes",
                        "imp": false
                    };
                    return;
                }
            }

            if (this.selectedAttributes[0] == this.selectedAttributes[1] ||
                this.selectedAttributes[0] == this.selectedAttributes[2] ||
                this.selectedAttributes[1] == this.selectedAttributes[2]) {
                $scope.error = {
                    "has": true,
                    "message": "Selected attributes must be different.",
                    "imp": false
                };

                return;
            }

            $scope.error.has = false;
            $scope.FacetsData.progress = true;

            this.attributes = [];

            this.attributes[0] = [
                "E8.5", "E9.5", "E10.5", "E11.5", "E12.5", "E13.5", "E14.5",
                "E15.5", "E16.5", "E17.5", "E18.5", "P0", "P90"
            ];//TODO make it dynamic

            this.attributes[1] = [
                "Auditory Vesicle", "Ear", "Embryonic Limb", "Eye", "Facial Epithelium", "Facial Mesenchyme", "Forebrain",
                "Frontal Suture", "Frontonasal Process", "Frontonasal Process, Ectoderm",
                "Frontonasal Process, Mesenchyme", "Genital Tubercle", "Head", "Hindbrain", "Lateral Nasal Eminence Epithelium",
                "Lateral Nasal Process", "Mandible", "Mandibular Part of First Pharyngeal Arch, Ectoderm",
                "Mandibular Part of First Pharyngeal Arch, Mesenchyme", "Mandibular Process", "Maxilla", "Maxillary Process",
                "Maxillary Process, Ectoderm", "Maxillary Process, Mesenchyme", "Medial Nasal Eminence Epithelium", "Medial Nasal Process",
                "Medial Neuroepithelium", "Midbrain", "Nasal Pit", "Neural Crest", "Neural Tube", "Neuroepithelium", "Nose", "Olfactory Placode",
                "Palatal Shelves", "Palate", "Palate, Secondary", "Paraxial Mesodem", "Pharyngeal Arch", "Rathke Pouch", "Skull", "Tongue", "Trigeminal Nerve",
            ];//TODO make it dynamic

            this.attributes[2] = [];
            for (var k = 0; k < 12; k++) {
                this.attributes[2].push("data " + k);
            }//TODO make it dynamic

            this.dataSetTypes = [];
            for (var i = 0; i < this.attributes[0].length; i++) {
                var thisRow = [];
                for (var j = 0; j < this.attributes[1].length; j++) {
                    var thisCell = [];
                    var wha = getRandomInt(0, this.attributes[2].length - 2);
                    for (var k = wha; k < wha + getRandomInt(0, 4) && k < this.attributes[2].length; k++) {
                        thisCell.push(this.attributes[2][k]);
                    }
                    thisRow.push(thisCell);
                }
                this.dataSetTypes.push(thisRow);
            }//TODO make it dynamic

            this.dataTypeColors = getColors(this.attributes[2].length); // create colors array
            this.headerHeight = maxLength(this.attributes[1]) * 4.3; // calculate the height of header
            this.legendHeight = maxLength(this.attributes[2]) * 4.6; // calculate the height of legend table

            $scope.FacetsData.progress = false;
            $scope.showMatrix = true;
        };

        /**
         * @desc changes the content of modal
         * @param row {int} index of the row
         * @param col {int} index of the column
         */
        this.openModal = function openModal(row, col) {
            this.modalContent = {
                "header": this.attributes[1][col] + " + " + this.attributes[0][row],
                "dataset": this.getDataSet(row, col),
                "row": row,
                "col": col,
                "nextCol": this.getColumn(row, col, true),
                "prevCol": this.getColumn(row, col, false),
                "nextRow": this.getRow(row, col, true),
                "prevRow": this.getRow(row, col, false)
            };
        };

        /**
         * @desc returns the next or previous column if it exists, if not, returns -1.
         * @param row {int} index of the row
         * @param col {int} index of the column
         * @param get_next {boolean} true: next column, false: previous column
         */
        this.getColumn = function getColumn(row, col, get_next) {
            var nextCol = col + (get_next ? 1 : -1);
            while (nextCol < this.attributes[1].length && nextCol >= 0) {
                if (this.dataSetTypes[row][nextCol].length > 0) return nextCol;
                nextCol = nextCol + (get_next ? 1 : -1);
            }
            return -1;
        };

        /**
         * @desc returns the next row if it exists, if not, returns -1.
         * @param row {int} index of the row
         * @param col {int} index of the column
         */
        this.getRow = function getRow(row, col, get_next) {
            var nextRow = row + (get_next ? 1 : -1);
            while (nextRow < this.attributes[0].length && nextRow >= 0) {
                if (this.dataSetTypes[nextRow][col].length > 0) return nextRow;
                nextRow = nextRow + (get_next ? 1 : -1);
            }
            return -1;
        };

        /**
         * @desc finds data sets in the correct format with the given first and second attribute
         * @param row {int} index of the row
         * @param col {int} index of the column
         */
        this.getDataSet = function getDataSet(row, col) { //TODO make it dynamic
            var result = [];
            var thisDataTypes = this.dataSetTypes[row][col];
            for (var i = 0; i < thisDataTypes.length; i++) {
                result.push({
                    "uri": "http://google.com", //easy to create
                    "title": thisDataTypes[i], //easy to find
                    "data": [ //must retrieve (three table join)
                        {
                            "uri": "http://google.com",
                            "title": "this is it"
                        },
                        {
                            "uri": "http://google.com",
                            "title": "this is it"
                        }
                    ]
                });
            }
            return result;
        };

        /**
         * @desc Gets the correct style for each part in the cell. (color and width)
         * @param dataType {String} Type of that data set
         * @param count {int} : total number of data types that cell has.
         */
        this.getDataTypeStyle = function getDataTypeStyle(dataType, count) {
            var color = this.dataTypeColors[this.attributes[2].indexOf(dataType)];
            return {
                "width": (100 / count) - 0.0001 + "%", "background-color": color
            };
        };

        /**
         * @desc Generates specified number of rainbow colors.
         * from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
         * @param maxLength {int} Number of colors.
         * @return {Array} An Array of colors (string) in the rgb('r','g','b') format
         */
        function getColors(maxLength) {
            var colors = [];
            var frequency = 5 / maxLength;
            for (var i = 0; i < maxLength; i++) {
                var r = Math.floor(Math.sin(frequency * i) * (127) + 128);
                var g = Math.floor(Math.sin(frequency * i + 2) * (127) + 128);
                var b = Math.floor(Math.sin(frequency * i + 4) * (127) + 128);
                colors.push("rgb(" + r + "," + g + "," + b + ")");
            }
            return colors;
        }

        /**
         * @desc Get a random int
         * @return {int} random number
         */
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        /**
         * @desc finds the length of longest string in an array of strings
         * @param a {Array} An array of strings.
         * @return {int} length of longest string
         */
        function maxLength(a) {
            var i = a.length - 1, m = 0;
            for (i; i >= 0; i--) {
                if (a[i].length > m) {
                    m = a[i].length;
                }
            }
            return m;
        }

        this.getAttributeList();

    }]);
