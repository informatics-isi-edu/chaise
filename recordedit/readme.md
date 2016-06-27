## Features
* Users can add multiple rows/columns to the form when in entry mode allowing for the creation of multiple records
   * This column can be empty or a duplicate of the previous entered one
* Submitting 1 row of data redirects to the appropriate record page
* Submitting multiple rows of data redirects to the corresponding recordset page for that table

### Editing
* The form also allows for users to edit existing records by clicking a button from the `record's` page
* Original record values should be pre-filled
* User is redirected back to the record page after updating an entity

### Nuances
* Columns marked with type serial do not allow user input and are disabled but visible
* Date input fields have a datepicker show up when the user clicks on the text input field
* Foreign Key support is currently limited to simple foreign keys (foreign keys made up of a single column)
* Dropdown values for foreign key relationships are displayed based on the display annotation
* Long text fields can be resized by grabbing the lower right corner
* Column names with a dotted underline denote a tooltip for that specific column

### Validations
* Input validations are run as the user inputs values into the fields
    * This is the case for integer and float validations currently
* Required validations are run when the form is submitted

### Annotations
The following are annotations that are currently being checked by the app:
* tag:misd.isi.edu,2015:vocabulary
* tag:misd.isi.edu,2015:display
* tag:misd.isi.edu,2015:hidden
* tag:isrd.isi.edu,2016:ignore
 * If `tag:isrd.isi.edu,2016:ignore` specifies contexts in which ignore a resource, recordedit follows the `entry` and `edit` contexts.

### Config Parameters
The following are the config parameters that recordedit uses:
* headTitle
* ermrestLocation
* dataBrowser

### Data Types
* Text Types
    * Text
    * Short text
    * Long text
* Numeric Types
    * Integer 2
    * Integer 4
    * integer 8
    * Float 4
    * Float 8
    * Numeric
* Boolean
* Date
* Timestampz
