'use strict';

/* ermMatrixController:
 *   This controller is used to create a matrix based on three attributes that are given.
 *   The first attribute is used for indicating matrix rows and the second is for columns.
 *   The third attribute is used for color coding and categorizing the data sets.
 * */

var ermMatrixController = angular.module('ermMatrixController', []);

ermMatrixController.controller('ermMatrixController', ['$scope', 'FacetsData', 'ermrest',
    function ($scope, FacetsData, ermrest) {
        $scope.FacetsData = FacetsData;

        /**
         * loads these data:
         *  - rows: a list of rows (first attribute).
         *  - columns: a list of columns (second attribute).
         *  - dataTypes: a list of data types ( third attribute).
         *  - rowLabel: name of the first attribute in the database.
         *  - colLabel: name of the second attribute in the database
         *  - dataTypeLabel: name of the third attribute in the database.
         *  -! dataSetTypes: a three dimensional array, dataSetTypes[i][j] indicates data types of data sets (a list) with rowLabel:=i and colLabel:=j
         */
        this.loadData = function loadData() {

            this.rows = [
                "E8.5", "E9.5", "E10.5", "E11.5", "E12.5", "E13.5", "E14.5",
                "E15.5", "E16.5", "E17.5", "E18.5", "P0", "P90"
            ];//TODO make it dynamic

            this.columns = [
                "Auditory Vesicle", "Ear", "Embryonic Limb", "Eye", "Facial Epithelium", "Facial Mesenchyme", "Forebrain",
                "Frontal Suture", "Frontonasal Process", "Frontonasal Process, Ectoderm",
                "Frontonasal Process, Mesenchyme", "Genital Tubercle", "Head", "Hindbrain", "Lateral Nasal Eminence Epithelium",
                "Lateral Nasal Process", "Mandible", "Mandibular Part of First Pharyngeal Arch, Ectoderm",
                "Mandibular Part of First Pharyngeal Arch, Mesenchyme", "Mandibular Process", "Maxilla", "Maxillary Process",
                "Maxillary Process, Ectoderm", "Maxillary Process, Mesenchyme", "Medial Nasal Eminence Epithelium", "Medial Nasal Process",
                "Medial Neuroepithelium", "Midbrain", "Nasal Pit", "Neural Crest", "Neural Tube", "Neuroepithelium", "Nose", "Olfactory Placode",
                "Palatal Shelves", "Palate", "Palate, Secondary", "Paraxial Mesodem", "Pharyngeal Arch", "Rathke Pouch", "Skull", "Tongue", "Trigeminal Nerve"
            ];//TODO make it dynamic

            this.dataTypes = [];
            for (var k = 0; k < 12; k++) {
                this.dataTypes.push("data " + k);
            }//TODO make it dynamic


            this.rowLabel = "row";//TODO make it dynamic
            this.colLabel = "column";//TODO make it dynamic
            this.dataTypeLabel = "Experiment Type";//TODO make it dynamic
            this.dataSetTypes = [];
            for (var i = 0; i < this.rows.length; i++) {
                var thisRow = [];
                for (var j = 0; j < this.columns.length; j++) {
                    var thisCell = [];
                    var wha = getRandomInt(0, this.dataTypes.length - 2);
                    for (var k = wha; k < wha + getRandomInt(0, 4) && k < this.dataTypes.length; k++) {
                        thisCell.push(this.dataTypes[k]);
                    }
                    thisRow.push(thisCell);
                }
                this.dataSetTypes.push(thisRow);
            }//TODO make it dynamic

            this.dataTypeColors = getColors(this.dataTypes.length);

            $scope.FacetsData.progress = false;
        };

        /**
         * changes the content of modal
         * @param row index of the row
         * @param col index of the column
         */
        this.openModal = function openModal(row, col) {
            this.modalContent = {
                "header": this.columns[col] + " + " + this.rows[row],
                "dataset": this.getDataSet(row, col),
                "row": row,
                "col": col,
                "nextCol": this.getNextColumn(row, col),
                "prevCol": this.getPrevColumn(row, col),
                "nextRow": this.getNextRow(row, col),
                "prevRow": this.getPrevRow(row, col)
            };
        };

        /**
         * returns the next column if it exists, if not, returns -1.
         * @param row index of the row
         * @param col index of the column
         */
        this.getNextColumn = function getNextColumn(row, col) {
            var nextCol = col + 1;
            while (nextCol < this.columns.length){
                if (this.dataSetTypes[row][nextCol].length > 0) return nextCol;
                nextCol++;
            }
            return -1;
        };

        /**
         * returns the previous column if it exists, if not, returns -1.
         * @param row index of the row
         * @param col index of the column
         */
        this.getPrevColumn = function getPrevColumn(row, col) {
            var prevCol = col - 1;
            while (prevCol >= 0){
                if (this.dataSetTypes[row][prevCol].length > 0) return prevCol;
                prevCol--;
            }
            return -1;
        };

        /**
         * returns the next row if it exists, if not, returns -1.
         * @param row index of the row
         * @param col index of the column
         */
        this.getNextRow = function getNextRow(row, col) {
            var nextRow = row + 1;
            while (nextRow < this.rows.length){
                if (this.dataSetTypes[nextRow][col].length > 0) return nextRow;
                nextRow++;
            }
            return -1;
        };

        /**
         * returns the previous row if it exists, if not, returns -1.
         * @param row index of the row
         * @param col index of the column
         */
        this.getPrevRow = function getPrevRow(row, col) {
            var prevRow = row - 1;
            while (prevRow >= 0){
                if (this.dataSetTypes[prevRow][col].length > 0) return prevRow;
                prevRow--;
            }
            return -1;
        };

        /**
         * finds data sets in the correct format with the given first and second attribute
         * @param row index of the row
         * @param col index of the column
         */
        this.getDataSet = function getDataSet(row, col) { //TODO make it dynamic
            var result = [];
            var thisDataTypes = this.dataSetTypes[row][col];
            for (var i = 0; i < thisDataTypes.length; i++) {
                result.push({
                    "uri": "http://google.com",
                    "title": thisDataTypes[i],
                    "data": [
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
         * Gets the correct style for each part in the cell. (color and width)
         * @param dataType Type of that data set
         * @param count : total number of data types that cell has.
         */
        this.getDataTypeStyle = function getDataTypeStyle(dataType, count) {
            var color = this.dataTypeColors[this.dataTypes.indexOf(dataType)];
            return {
                "height": "100%", "width": (100 / count) - 0.0001 + "%", "background-color": color, "float": "left"
            };
        };

        /**
         * Generates specified number of rainbow colors.
         * from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
         * @param maxLength : Number of colors.
         * @returns {Array} : An Array of colors (string) in the rgb('r','g','b') format
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
         * Get a random integer
         * @returns integer : random number
         */
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        }

        this.loadData();

    }]);

