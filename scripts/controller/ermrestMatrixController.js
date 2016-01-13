'use strict';

/* ermMatrixController:
 *   This controller is used to create a matrix based on a table and three attributes that are given.
 *   The first attribute is used for indicating matrix rows and the second is for columns.
 *   The third attribute is used for color coding and categorizing the data sets.
 *
 */

var ermMatrixController = angular.module('ermMatrixController', []);

ermMatrixController.controller('ermMatrixController', ['$scope', 'FacetsData', 'ermrest',
  function($scope, FacetsData, ermrest) {
    /* variables
    this:
      tableList, selectedTable
      attributeList, selectedAttributes
      dataSetTypes, matrixAttributes, dataTypeColors
      modalContent
    $scope:
      showMatrix, error, FacetsDatas, schemaReady, error
      modalProgress
    */
    var defaultSelectInput = "Select";
    var ERROR = {
        "emptyDBError" : "There is no table in the database.",
        "dataSetError" : "Select a Dataset.",
        "notEnoughAttrsError" : "The selected dataset must have at least three attributes to create the matrix.",
        "selectAllAttrsError" : "Select all three attributes.",
        "selectDiffAttrsError" : "Selected attributes must be different."
    };

    $scope.FacetsData = FacetsData;
    $scope.schemaReady = false; // whether we have the schema or not
    $scope.attributesReady = false; // whether we have attribute list or not
    $scope.showMatrix = false; // whether the matrix is ready or not
    $scope.modalProgress = false; // whether to show the matrix progress bar or not
    $scope.error = {
      "has": false,
      "message": "",
      "imp": false
    }; // for showing error


    /**
     * @desc get the schema of the database, for choosing the table.
     */
    this.getSchema = function getSchema() {
      this.tableList = [{
        "name": defaultSelectInput,
        "value": defaultSelectInput
      }, {
        "name": "dataset",
        "value": "dataset"
      }]; //TODO make it dynamic, getting the list of tables

      if (this.tableList.length == 1) {
        showError(ERROR.emptyDBError, true);
        showProgress(false);
        return;
      }
      $scope.error.has = false;

      this.selectedTable = this.tableList[0];
      $scope.schemaReady = true;
      showProgress(false);
    };

    /**
     * @desc Get the list of attributes on changing the dataset.
     */
    this.getAttributeList = function getAttributeList() {
      this.attributeList = [];
      $scope.showMatrix = false;
      $scope.attributesReady = false;

      if (this.selectedTable.name == defaultSelectInput) {
        showError(ERROR.dataSetError, false);
        return;
      }

      $scope.error.has = false;
      showProgress(true);

      this.attributeList = [{
        "name": defaultSelectInput,
        "value": defaultSelectInput
      }, {
        "name": "Mouse Age Stage",
        "value": "mouse_age_stage"
      }, {
        "name": "Mouse Anatomical Feature",
        "value": "mouse_anatomical_feature"
      }, {
        "name": "Experiment Type",
        "value": "exp_type"
      }, {
        "name": "Data Type",
        "value": "data_type"
      }]; //TODO getting the list of attribute names from database based on the dataset.

      if (this.attributeList.length < 3) {
        showError(ERROR.notEnoughAttrsError, false);
        return false;
      }

      this.selectedAttributes = [
        this.attributeList[0],
        this.attributeList[0],
        this.attributeList[0]
      ];

      showProgress(false);
      $scope.attributesReady = true;
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

      if(this.checkAttributeErrors()) return; // checking for error

      $scope.error.has = false;
      showProgress(true);

      this.matrixAttributes = [];
      this.matrixAttributes[0] = [
        "E8.5", "E9.5", "E10.5", "E11.5", "E12.5", "E13.5", "E14.5",
        "E15.5", "E16.5", "E17.5", "E18.5", "P0", "P90"
      ]; //TODO make it dynamic
      this.matrixAttributes[1] = [
        "Auditory Vesicle", "Ear", "Embryonic Limb", "Eye", "Facial Epithelium", "Facial Mesenchyme", "Forebrain",
        "Frontal Suture", "Frontonasal Process", "Frontonasal Process, Ectoderm",
        "Frontonasal Process, Mesenchyme", "Genital Tubercle", "Head", "Hindbrain", "Lateral Nasal Eminence Epithelium",
        "Lateral Nasal Process", "Mandible", "Mandibular Part of First Pharyngeal Arch, Ectoderm",
        "Mandibular Part of First Pharyngeal Arch, Mesenchyme", "Mandibular Process", "Maxilla", "Maxillary Process",
        "Maxillary Process, Ectoderm", "Maxillary Process, Mesenchyme", "Medial Nasal Eminence Epithelium", "Medial Nasal Process",
        "Medial Neuroepithelium", "Midbrain", "Nasal Pit", "Neural Crest", "Neural Tube", "Neuroepithelium", "Nose", "Olfactory Placode",
        "Palatal Shelves", "Palate", "Palate, Secondary", "Paraxial Mesodem", "Pharyngeal Arch", "Rathke Pouch", "Skull", "Tongue", "Trigeminal Nerve",
      ]; //TODO make it dynamic

      this.matrixAttributes[2] = [];
      for (var k = 0; k < 12; k++) {
        this.matrixAttributes[2].push("data " + k);
      } //TODO make it dynamic

      this.dataSetTypes = [];
      for (var i = 0; i < this.matrixAttributes[0].length; i++) {
        var thisRow = [];
        for (var j = 0; j < this.matrixAttributes[1].length; j++) {
          var thisCell = [];
          var wha = getRandomInt(0, this.matrixAttributes[2].length - 2);
          for (var k = wha; k < wha + getRandomInt(0, 4) && k < this.matrixAttributes[2].length; k++) {
            thisCell.push(this.matrixAttributes[2][k]);
          }
          thisRow.push(thisCell);
        }
        this.dataSetTypes.push(thisRow);
      } //TODO make it dynamic

      this.dataTypeColors = getColors(this.matrixAttributes[2].length); // create colors array
      this.headerHeight = maxLength(this.matrixAttributes[1]) * 4.3; // calculate the height of header
      this.legendHeight = maxLength(this.matrixAttributes[2]) * 4.6; // calculate the height of legend table

      showProgress(false);
      $scope.showMatrix = true;
    };

    /**
     * @desc changes the content of modal
     * @param row {int} index of the row
     * @param col {int} index of the column
     */
    this.openModal = function openModal(row, col) {
      this.modalContent = {
        "header": this.matrixAttributes[1][col] + " + " + this.matrixAttributes[0][row],
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
     * @return {int} Index of the next/previous column (-1 if there is no such element.)
     */
    this.getColumn = function getColumn(row, col, get_next) {
      var nextCol = col + (get_next ? 1 : -1);
      while (nextCol < this.matrixAttributes[1].length && nextCol >= 0) {
        if (this.dataSetTypes[row][nextCol].length > 0) return nextCol;
        nextCol = nextCol + (get_next ? 1 : -1);
      }
      return -1;
    };

    /**
     * @desc returns the next row if it exists, if not, returns -1.
     * @param row {int} index of the row
     * @param col {int} index of the column
     * @return {int} Index of the next/previous row (-1 if there is no such element.)
     */
    this.getRow = function getRow(row, col, get_next) {
      var nextRow = row + (get_next ? 1 : -1);
      while (nextRow < this.matrixAttributes[0].length && nextRow >= 0) {
        if (this.dataSetTypes[nextRow][col].length > 0) return nextRow;
        nextRow = nextRow + (get_next ? 1 : -1);
      }
      return -1;
    };

    /**
     * @desc finds data sets in the correct format with the given first and second attribute
     * @param row {int} index of the row
     * @param col {int} index of the column
     * @return {Array} list of dataset with the given first and second attribute
     */
    this.getDataSet = function getDataSet(row, col) {
      showProgress(true, true);
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
            }, {
              "uri": "http://google.com",
              "title": "this is it"
            }
          ]
        });
      }//TODO get the dataset
      showProgress(false, true);
      return result;
    };

    /**
     * @desc Gets the correct style for each part in the cell. (color and width)
     * @param dataType {String} Type of that data set
     * @param count {int} : total number of data types that cell has.
     * @return {Object} style for the given datatype.
     */
    this.getDataTypeStyle = function getDataTypeStyle(dataType, count) {
      var color = this.dataTypeColors[this.matrixAttributes[2].indexOf(dataType)];
      return {
        "width": (100 / count) - 0.0001 + "%",
        "background-color": color
      };
    };

    /**
    * @desc find if there is any error in the attribute form
    * @return {boolean} true: there's an error, false: there's no error.
    */
    this.checkAttributeErrors = function checkAttributeErrors(){
      // check if all the attributes are selected
      for (var attr in this.selectedAttributes) {
        if (this.selectedAttributes.hasOwnProperty(attr) &&
          this.selectedAttributes[attr].value == defaultSelectInput) {
          showError(ERROR.selectAllAttrsError, false);
          return true;
        }
      }

      // check if attributes are different
      var valueArr = this.selectedAttributes.map(function(item) {
        return item.name
      });
      var isDuplicate = valueArr.some(function(item, idx) {
        return valueArr.indexOf(item) != idx;
      });
      if (isDuplicate) {
        showError(ERROR.selectDiffAttrsError, false);
        return true;
      }

      return false;
    }

    /**
     * @desc Generates specified number of rainbow colors.
     * from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
     * @param count {int} Number of colors.
     * @return {Array} An Array of colors (string) in the rgb('r','g','b') format
     */
    function getColors(count) {
      var colors = [];
      var frequency = 5 / count;
      for (var i = 0; i < count; i++) {
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
      var i = a.length - 1,
        m = 0;
      for (i; i >= 0; i--) {
        if (a[i].length > m) {
          m = a[i].length;
        }
      }
      return m;
    }

    /**
    * @desc toggle the progress bar
    * @param start {boolean} true: show the progress bar, false: hide it.
    * @param is_modal {boolean} whether the progress is for modal or not
    */
    function showProgress(start, is_modal) {
      if(is_modal){
          $scope.modalProgress = start;
      }else{
          $scope.FacetsData.progress = start;
      }
    }

    /**
    * @desc show error message
    * @param message {String} the error message
    * @param is_imp {boolean} true: just display the error in the page and nothing else
    */
    function showError(message, is_imp) {
      $scope.error = {
        "message": message,
        "imp": is_imp,
        "has": true
      }
    }

    /**
    * @desc hides the error
    */
    function hideError() {
      $scope.error.has = false;
    }

    this.getSchema(); // getting the database schema

  }
]);
