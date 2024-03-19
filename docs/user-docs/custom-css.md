# Custom CSS Styling Tips

The default styling for specific elements can be altered by adding a custom css file to the deployment folder. This folder path then must be added as the value for the `customCSS` in config option for [chaise-config.js](chaise-config.md). For example:

```javascript
 var chaiseConfig = {
     name: 'Sample',
     customCSS: '/assets/css/chaise.css'
}
```

Custom style classes with modified styling attributes can be added in `chaise.css`. Make sure to use same class names and hierarchy as described below to avoid any discrepancy.

## Table of Contents

- [Changing chaise styles](#changing-chaise-styles)
  - [Body](#body)
  - [Navbar](#navbar)
  - [Page-sepecific](#page-sepecific)
  - [Inline comments](#inline-comments)
- [Character replacement](#character-replacement)
- [Examples](#examples)
- [Custom Markdown Styles](#custom-markdown-styles)
- [Bootstrap styles](#bootstrap-styles)

## Changing chaise styles

The following is how the HTML of main Chaise apps look like:

```html
<html id="<appname>">
  ...
  <body class="chaise-body">
    ...
    <div class="app-container <app-abbr>_s_<schema.name> <app-abbr>_t_<table.name>">
      <navbar></navbar>
      ...
        <div class="s_<schema.name> t_<table.name>">
          <table>
            <thead>
              <tr>
                <th class="c_<column.name>">...</th>
                ...
              </tr>
            <thead>
            <tbody>...</tbody>
          </table>
        </div> <!-- end schema name, table name div -->
      ...
    </div> <!-- end of app-container -->
  </body>
</html>
```

In the following we will go over the identifiers that can be used to target different parts of the page in order to customize their styles.

### Body

The following are classes added to the `body` element:

- `.chaise-body`: added to all Chaise apps.
- `.chaise-mac`: This class can be used to apply any custom styling specific to the Mac OS irrespective of the browser type e.g., change table column spacing on Mac OS.
- `.chaise-firefox`: This class can be used to apply any custom styling specific to the Firefox browser irrespective of the operating system. e.g., change table column spacing in Firefox browser.

### Navbar

Navbar related classes:

 - `navbar`:  identifies the navbar that is displayed on top of every app.
 - `.chaise-navbar-banner-container`: identifies the navbar banners.
 - Please refer to [navbar app documentation](navbar-app.md#how-to-customize-navbar-ui) for more information.

### Page-sepecific

 - `#recordset`: identifies (scopes) the HTML used ONLY for the Recordset page.
 - `#record`: identifies (scopes) the HTML used ONLY for the Record page.
 - `#recordedit`: identifies (scopes) the HTML used ONLY for the Recordedit page.
 - `.recordset-container`: identifies the Recordset component container
   - This would be applied to all popups in Record and Recordedit pages as well.
   - Doesn't apply to the tables displayed for related entities in Record page.
 - `.record-main-section-table`: identifies the main section of the Record page.
   - Should be specified when CSS rules are to be applied to only the main section of the Record page (and not related section).
   - Can be used to scope CSS rules to the inline related tables
 - `.related-section-container`: identifies the related tables container
   - Should be specified when CSS rules are to be applied to only the related tables portion of  the Record page.
   - Can be used to scope CSS rules to the related tables not in the main body.
 - `.r_s_<schema.name>` and `.r_t_<table.name>`:
   - Identifies the Record page for the particular table or schema.
 - `.rs_s_<schema.name>` and `.rs_t_<table.name>`:
   - Identifies the Recordset page for the particular table or schema.
 - `.re_s_<schema.name>` and `.re_t_<table.name>`:
   - Identifies the Recordedit page for the particular table or schema.
 - `.s_<schema.name>` and `.t_<table.name>`:
   - Identifies the Record table component, for applying styling to the whole table (`<table>`) DOM element.
   - Schema class should be specified when scoping CSS rules to all tables in that schema.
   - Use schema in conjunction with table class to identify a unique table to apply styling to.
   - Table class should be specified when scoping CSS rules to all tables with that name
     - NOTE: currently will apply cross schemas if multiple tables with the same name exist in different schemas
 - `.c_<column.name>`:
   - identifies the table heading, for applying styling to an individual table heading (`<th>`) DOM element
   - column class should be specified when scoping CSS rules to all columns with that name
   - use in conjunction with schema class and table class to be more specific as to what table headings to apply styling to
   - More often than not, you will want to apply styling for each of the columns rather than at the table level, so the `.c_<column.name>` identifier should almost always be included in the selector.

### Inline comments

The following are the selectors for the inline comments:

- `.inline-tooltip`: The wrapper for the comments that are displayed inline.
  - `.inline-tooltip.inline-tooltip-sm`: Used for column-level inline comments
    - `.recordedit-container .inline-comment-row`: Recordedit columns
  - `.inline-tooltip.inline-tooltip-lg`: Table-level inline comments (Recordset page title, Record inline and related entities)

Common custom rules that you might want to define for inline comments:

1. Change the default font-size

```css
.inline-tooltip.inline-tooltip-sm {
  font-size: 10px !important; /* default is 13px */
}

.inline-tooltip.inline-tooltip-lg {
  font-size: 20px !important; /* default is 16px */
}
```

2. Changing the color, font-size, or font-style of the inline comments in recordedit:

```css
.recordedit-container .inline-comment-row .inline-tooltip {
  /* changing the color */
  color: #333 !important;

  /* changing its size */
  font-size: 14px !important;

  /* making it italic: */
  font-style: italic !important;
}
```


## Character replacement

In the previous section, we showed that in some cases we're using schema, table, or column names in the identifiers. In HTML, both class names and id attributes:
   - Must begin with a letter A-Z or a-z
   - Can be followed by: letters (A-Za-z), digits (0-9), hyphens ("-"), and underscores ("\_")

That's why we're going to transform the schema, table, or column names before using them in the identifiers. THe following is how the transformation works:
- Any unsafe characters will be replaced with a "-".
- If the name contains multiple unsafe characters in a row, all will be replaced by 1 single "-".

For example, if your column name is `text (name)`, chaise will rewrite this as `text-name-` and then will use `c_text-name-` as the class name.

## Examples

1. Hide everything except the result table in recordset:
```css
.rs_s_schema.rs_t_table .top-left-panel,
.rs_s_schema.rs_t_table .side-panel-resizable,
.rs_s_schema.rs_t_table .recordset-controls-container {
  display: none;
}

.rs_s_schema.rs_t_table .top-right-panel,
.rs_s_schema.rs_t_table .main-container {
    padding-left: 20px !important;
}
```

2. Hide navbar in recordedit:

```css
.re_s_schema.re_t_table navbar {
  display: none;
}
```

3. Increase the width of a column in tabular displays:

```css
.s_schema.t_table .c_column {
  min-width: 200px;
}
```
NOTE: The `min-width` property will almost always be honored. If content is shorter than the `min-width`, there will be whitespace after the content. If the content is longer than the `min-width`, the width will be at minimum the value set for `min-width` and get wider to accomodate the content. This may be affected by having many columns with each having a `min-width` property set.

NOTE: The `max-width` property will also almost always be honored. If the content is shorter than the `max-width` value, then it will shrink down to fit the content. If the content itself has to show on one line and is longer than the `max-width` value, the `max-width` will be ignored.

4. Change the color of the Related Table section header to chaise blue from #747474

```css
#record .chaise-accordions .accordion-button {
  background: #4674A7;
}
```
NOTE: Depending on the color that the header is changed to, the text color and buttons might need to be modified as well.

 - Change the color of 1 sepcific Related Table header:
 ```css
 #record .chaise-accordions #rt-heading-header_name .accordion-button {
   background: #4674A7;
 }
 ```
 NOTE: This uses an `id` selector (`#`) that relies on the `id` attribute of the `.chaise-accordion` element. The id is always in the form of `rt-heading-` + the related table heading text (which includes special characters). For example, since `Authors *` in PDB has a superscript `*` for the related table heading in the `Entry` table, the `id` is being set to `rt-heading-Authors-sup-sup-`.

 - To change the text color to black from default (white):
 ```css
 #record .chaise-accordions .accordion-button {
   color: black;
 }
 ```

 - To change the buttons (by default, the styles are for chaise-btn-secondary):
 ```css
 #record .chaise-accordions .chaise-accordion-header-buttons .related-table-actions .chaise-btn {
   color: black;
   background-color: #ffffff;
   border: 1px solid #4674a7;
 }
 ```
 NOTE: `color` refers to text color. `background-color` refers to the background. `border` is the "width", "style", and "color".


### More specific examples (using RBK [.../#2/Gene_Expression:Specimen](https://dev.rebuildingakidney.org/chaise/recordset/#2/Gene_Expression:Specimen))
```css
#recordset .s_Gene_Expression.t_Specimen .c_Images {
  min-width: 210px;
}
```
   - This scopes the defined styling to the recordset application (`#recordset`)
     - without this, the rule would also apply to the related tables whenever they may appear in the `record`
     - or to the search popups in `recordedit` or `record`
   - This scopes it to only the `Specimen` table in the `Gene_Expression` schema (`.s_Gene_Expression.t_Specimen`)
   - This scopes it to only the `Images` column (`.c_Images`)
   - adds the styling to the table header
     - we are using `thead` here because the HTML column element sizing for `<table>` relies on the properties of `thead>tr>th` before those defined for `tbody>tr>td`

By relaxing the selector, we can make the rule more general:
```css
.s_Gene_Expression.t_Specimen .c_Images {
  min-width: 210px;
}
```
   - this will apply the styling to the `Images` column for all `Gene_Expression:Specimen` tables in all apps
     - useful when the column in `s:t` needs to be styled the same in all apps
```css
.t_Specimen .c_Images {
  min-width: 210px;
}
```
   - this will apply the styling to the `Images` column for all `Specimen` tables in all apps
     - useful when the column in `t` needs to be styled the same in all apps for all schemas that it may exist in
```css
.s_Gene_Expression .c_Images {
  min-width: 210px;
}
```
   - this will apply the styling to the `Images` columns in all the tables for the `Gene_Expression` schema (if it exists)
     - useful when the column in `s` needs to be styled the same in all apps regardless of what table that it may exist in
```css
.c_Images {
  min-width: 210px;
}
```
   - this will apply the styling to all columns with `column.name = Images`
     - useful if multiple Images columns are defined in many different tables in many different schemas


For pseudocolumns, it's not immediately obvious what they name will be. We use a hashing function in `ermrestJS` that is based on the full path of the column. So `this/path/id=value` will become something like `hsoinel`.

## Custom Markdown Styles
Markdown component applies [github](https://github.com/sindresorhus/github-markdown-css/blob/gh-pages/github-markdown.css) css for all general purpose preview and content rendering. Here are some of the examples:

```css
/* Sample chaise.css */

/* header font for h3 */
.markdown-container h3 {
  font-size: 1.25em;
}

/* style for list */
.markdown-container ul,
.markdown-container ol {
  padding-left: 2em;
}

.markdown-container ul ul,
.markdown-container ul ol,
.markdown-container ol ol,
.markdown-container ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

.markdown-container li {
  word-wrap: break-all;
}

.markdown-container li>p {
  margin-top: 16px;
}

/* style for table */
.markdown-container table {
  border-spacing: 0;
  border-collapse: collapse;
}

.markdown-container table {
  display: block;
  width: 100%;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-container table th {
  font-weight: 600;
}

.markdown-container table th,
.markdown-container table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

/* style for code type markdown */
.markdown-container pre code {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}
```

## Bootstrap styles

To make changes to Bootstrap styles, do not edit the bootstrap style sheet. Add your own file (usually named `custom.css`), add it to the `css` directory and link to it from your `<head>` tag _after_ the Bootstrap style sheet (this will make sure that custom styles override the Bootstrap styles):

```
 <link href="css/bootstrap.min.css" rel="stylesheet">
 <link href="css/custom.css" rel="stylesheet">
```
