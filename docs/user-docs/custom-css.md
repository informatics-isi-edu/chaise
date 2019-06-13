# Custom CSS Styling Tips

The default styling for specific elements can be altered by adding a custom css file to the deployment folder. This folder path then must be added as the value for the `customCSS` in config option for [chaise-config.js](chaise-config.md). For example:

```javascript
 var chaiseConfig = {
     name: 'Sample',
     customCSS: '/assets/css/chaise.css'
}
```

Custom style classes with modified styling attributes can be added in `chaise.css`. Make sure to use same class names and hierarchy as described below to avoid any discrepancy.


## Changing chaise table styles
With the current HTML structure, it is possible to apply different styles to the table directive. There are a few key HTML ids/classes to be aware of:
 - `navbar`
   - identifies the navbar that is displayed on top of every app.
 - `recordset` identifier (`#recordset`)
   - identifies (scopes) the HTML used only for the `recordset` application
   - should be specified when CSS rules are to be applied ONLY to `recordset` app
   - also have `#recordedit` and `#record` to scope rules to those apps as well
 - `recordset-container` class (`.recordset-container`)
   - identifies the recordset directive container
   - should be specified when CSS rules are to be applied anywhere the recordset directive is used
   - this would be applied to all popups in `record` and `recordedit` as well
   - leaves out the related tables in `record` app
 - `record display` identifier (`#tblRecord`)
   - identifies the record directive container
   - should be specified when CSS rules are to be applied to only the main body of `record` app
   - can be used to scope CSS rules to the inline related tables
 - `related tables container` identifier (`#rt-container`)
   - identifies the related tables container
   - should be specified when CSS rules are to be applied to only the related tables portion of `record` app
   - can be used to scope CSS rules to the related tables not in the main body
 - `r_s_<schema.name>` and `r_t_<table.name>` classes
   - identifies the record page for the particular table or schema.
 - `rs_s_<schema.name>` and `rs_t_<table.name>` classes
   - identifies the recordset page for the particular table or schema.
 - `re_s_<schema.name>` and `re_t_<table.name>` classes
   - identifies the recordedit page for the particular table or schema.
 - `s_<schema.name>` class (`.s_<schema.name>`) and `t_<table.name>` class (`.t_<table.name>`)
   - identifies the record table directive, for applying styling to the whole table (`<table>`) DOM element
   - schema class should be specified when scoping CSS rules to all tables in that schema
     - use in conjunction with table class to identify a unique table to apply styling to
   - table class should be specified when scoping CSS rules to all tables with that name
     - NOTE: currently will apply cross schemas if multiple tables with the same name exist in different schemas
 - `c_<column.name>` class (`.c_<column.name>`)
   - identifies the table heading, for applying styling to an individual table heading (`<th>`) DOM element
   - column class should be specified when scoping CSS rules to all columns with that name
   - use in conjunction with schema class and table class to be more specific as to what table headings to apply styling to

More often than not, you will want to apply styling for each of the columns rather than at the table level, so the `c_<column.name>` identifier should almost always be included in the selector.

### General HTML structure:
```html
<html id="<appname>"
  <head>...</head>
  <body>
    <div class="app-container <app-abbr>_s_<schema.name> <app-abbr>_t_<table.name>">
      <navbar></navbar>
      ...
        <div class="s_<schema.name> t_<table.name>">
          <table>
            <thead>
              <tr>
                <th class="c_<column.name>">...</th>
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

### Examples:

- Hide everything except the result table in recordset:

```css
.rs_s_schema.rs_t_table .faceting-resizable, 
.rs_s_schema.rs_t_table faceting-collapse-btn,
.rs_s_schema.rs_t_table #recordset-controls-container,
.rs_s_schema.rs_t_table #facet-filters-container {
  display: none;
}
```

- Hide navbar in recordedit:

```css
.re_s_schema.re_t_table navbar {
  display: none;
}
```

- Change the width of a column in tabular displays:

```css
.s_schema.t_table .c_column {
  min-width: 200px;
}
```


### More specific examples (using RBK [.../#2/Gene_Expression:Specimen](https://dev.rebuildingakidney.org/chaise/recordset/#2/Gene_Expression:Specimen)):
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

### Caveats
Some characters are not allowed in HTML class names. We replace those characters with HTML safe characters:
 - `&` is replaced by: `&amp;`
 - `\s` (any whitespace character) is replaced by `&nbsp;`
 - `<` is replaced by `&lt;`
 - `>` is replaced by `&gt;`
 - `"` is replaced by `&quot;`
 - `'` is replaced by `&#39;`

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
