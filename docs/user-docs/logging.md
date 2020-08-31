# Logging

> On February 2020 we redesigned the whole logging mechanism in chaise. If you want to analysis a data prior to this date, please refer to [the old documentation](logging-pre-feb-20.md).

This document will describe how chaise is logging server requests as well as client actions.

## Table of Contents

- [Logging](#logging)
    - [Overview](#Overview)
    - [Attributes](#attributes)
    - [Action definition](#action-definition)
    - [List of requests](#list-of-requests)
        - [Server vs. Client](#server-vs-client)
        - [Stack structure](#stack-structure)
    - [Facet compressed syntax](#facet-compressed-syntax)
    - [Error log](#error-log)
    - [Truncation](#truncation)
    - [Analysis](#analysis)
        - [Asset Download & CSV Default Export](#asset-download--csv-default-export)
        - [Finding the displayed recordset request](#finding-the-displayed-recordset-request)
    - [Change Log](#change-log)


## Overview

By providing `Deriva-Client-Context` header in ermrset requests we can log extra objects alongside the request. ERMrest will log the provided object in the `dcctx` attribute of logs. For example the following is a line from `/var/log/messages` file in dev.isrd that is for the request to getting one of the facet options.

```javascript
{
  "scheme":"https",
  "host":"dev.isrd.isi.edu",
  "status": "200 OK",
  "method":"GET",
  "path": "/ermrest/catalog/1/entity/T:=isa:experiment/dataset=1-3VFJ/$T/M:=(experiment_type)=(vocab:experiment_type:id)@sort(name,RID)?limit=11",
  "dcctx":{
      "catalog":"1",
      "schema_table":"vocab:experiment_type",
      "stack":[
        {
            "type":"set",
            "s_t":"isa:experiment",
            "filters": {"and":[{"src":[{"o":["isa", "experiment_dataset_fkey"]}, "RID"], "ch":["1-3VFJ"]}]}
        },
        {
            "type":"facet",
            "s_t":"vocab:experiment_type",
            "source": [{"o":["isa", "experiment_experiment_type_fkey"]}, "id"],
            "entity":true
        }
    ],
    "action":":set/facet,;load",
    "cid":"recordset",
    "pid":"1lp2236a1p1g2age1l1a2pxo",
    "wid":"1tw6218n1xbr2mvq251y2rsd",
    "elapsed_ms":646
 }
}
```

In the following, we're going to summarize what are the attributes that are being logged in the `dcctx` attribute alongside each request.

## Attributes

The following are the default attributes that you can find on all the requests:

- `cid`: The app name (record, recordset, recordedit).
- `wid`: The window id (randomly generated).
- `pid`: The page id (randomly generated).
- `catalog`: The catalog id.
- `schema_table`: The `schema:table` combination. This captures the table that the current action is performed on.
- `action`: A pre-defined string that implies what the request was for. Please refer to [Action definition](#action-definition) section for more information.
- `elapsed_ms`: A value set to determine the elapsed time since the ermrestJS http service has been available. This will always be in milliseconds

Depending on the request, we might log extra attributes that we are gong to list in the following. You can find more information about each one in the next section.

- `ppid`: The parent `pid`. This attributes will be available only on a number of requests. It will indicate which app and page led to this current request. These request are:
  - recordset: First read of the main entity.
  - record: First read of the main entity.
  - recordedit: The create/update request (the request generated when user clicks on submit).
  - viewer: First read of the main entity.

- `pcid`: The parent `cid`. Please refer to `ppid` to find more information on where you mind find this attribute. The following is the list of `pcid`'s that will be present on main entity requests in the chaise apps. `cid` will always represent what app the request was made from, `pcid` will represent what app the user navigated from when the main entity request was triggered.

  - `record`
  - `recordset`
  - `recordedit`
  - `viewer`
  - `navbar`
  - `navbar/record`
  - `navbar/recordset`
  - `navbar/recordedit`

  If the user clicked on a link in the navbar, the `PCID` will properly denote what app the user came from that had the navbar present. A static page that uses the navbar app, will set the `PCID` as `navbar`. Otherwise the appname will be appended (i.e.   `navbar/<appname>`). This is true for the [deriva-webapps](https://github.com/informatics-isi-edu/deriva-webapps/wiki/Logging-in-WebApps#pcid-list) as well.

- `paction`: The action in the parent page that fired the current request. Acceptable values are:
  - `view`: Available on the first read of the main entity in record page. Indicates that user clicked on "view" button in tabular displays.

- `stack`: This attribute can be found on almost all the requests. It will capture the path that user took to get to the performed action. For example, if the logged request is for when a user interacts with a add pure and binary picker, using this stack you can figure out which main table and related (or inline table) user is interacting with. `stack` is an array of objects that each node can have the following attributes:
  - Required attributes:
    - `s_t`: The end table of this node in the format of `schema:table`.
      - As an exception, in viewer app, if an image annotation is derived from file (not database), this value will not be available on the stack object.

    - `type`: The type of the node request. It can be any of: `entity` (row based), `set` (rowset based), `col` (column), `pcol` (pseudo-column), `fk` (foreign key), `related` (inline or related table), `annotation` (image annotation in viewer app).

  - Optional attributes:
    - `filters`: The facet object using the [compressed syntax](#facet-compressed-syntax).

    - `source`, and `entity`: The source path that defines this node using the compressed syntax.

    - `agg`: The aggregate function.

    - `picker`: If the request is happening on a picker, `"picker":1` is added to the last node of the `stack`.

    - `cfacet`: Only applicable to the first node. If url contains custom-facets (`*::cfacets::`), this attribute will be equal to one. In this case one of the following attributes will be available:
      - `cfacet_str`: the displayname of custom-facet (if provided in url).
      - `cfacet_path`: the ERMrest path that was sent with the custom-facet.

    - `custom_filters`: Only applicable to the first node, it captures the usage of "ermrest filters". If we could turn an "ermrest filter" into facet, this will return `true`. Otherwise it will return the given "ermrest filters".

    - `causes`: The "reload" requests are using this attribute to give more clue of why this request was generated. It is an array of unique values. The possible values are different based on the "reload" request and you should refer to each request for more information. The following is all the possible causes values:
        - `clear-all`: Clear all button clicked.
        - `clear-cfacet`: Clear "cfacet" button in breadcrumbs clicked.
        - `clear-custom-filter`: Clear "custom filter" button in breadcrumbs clicked.
        - `entity-create`: New rows have been created for the current table.
        - `entity-delete`: A row in the  current table has been deleted.
        - `entity-update`: Some rows in the table have been updated.
        - `facet-clear`: Clear facet button in breadcrumb clicked.
        - `facet-deselect`: Facet checkbox unchecked.
        - `facet-select`: Facet checkbox checked.
        - `facet-modified`: Facet changed in the modal.
        - `facet-search-box`: Facet search box changed.
        - `facet-plot-relayout`: Users interact with plot and we need to get new info for it.
        - `facet-retry`: Users click on retry for a facet that timed out.
        - `page-limit`: Change displayed number of rows per page.
        - `page-next`: Go to next page,
        - `page-prev`: Go to previous page.
        - `related-create`: New rows have been created for a related table.
        - `related-delete`: A row in one of related tables has been deleted.
        - `related-update`: Some rows in one of related table have been updated.
        - `related-inline-create`: New rows have been created for an inline related table.
        - `related-inline-delete`: A row in one of inline related tables has been deleted.
        - `related-inline-update`: Some rows in one of inline related table have been updated.
        - `sort`: sort changed.
        - `search-box`: search-box changed.

    - `start_ms`: Used only on "reload" requests to indicate the time that the page become dirty first.
    - `end_ms`: Used only on "reload" requests to indicate the time that we're sending the request. If you join all the "reload" requests by their `start_ms`, the longest `end_ms` will return the request that the user actually sees. The other requests were generated by flow-control as user kept interacting with the page without actually showing their result.

    - `search-str`: Available only on client actions that are based on interacting with a search box. It returns the new search string.

    - `num_created`: The number of rows that have been asked to be created in that request.

    - `num_updated`: The number of rows that have been asked to be updated in that request.

    - `updated_keys`: Available only on "update" request, will return the key columns and submitted values. It's an object that and the `cols` attribute returns an array of key column names, while `vals` returns an array of values that corresponds to the given `cols` array (So it's an array of arrays).

    - `template`: Used only for the "export" request and will return an object with `displayname` and `type` attributes to give more information about the used export template.

    - `old_thickness`, `new_thickness`: Available only on "line thickness adjustment" client log in viewer app. It will capture the old and new value after user interacted with the UI to change the line thickness.

    - `file`: If the displayed image annotation in viewer app is derived from a while (and not database), `"file": 1` will be added to the stack (`s_t` will not be available.)
    
    - `rid`: Available on the "go to RID" client action, to indicate the RID value that users searched for.

    - `cqp` (chaise query parameter): When a user uses a link that includes the `?` instead of the `#`. These urls are only used to help with google indexing and should be used only for navigating users from search engines to chaise apps.

- `names`: Used in "navbar" request to capture the path that user took to end up in a particular menu option. It is an array of navbar option "name"s. The last item in the array if the name of the navbar option that user is acting on, and the rest are the name of its ancestors.

## Action definition

As it is mentioned in the previous section, `action` is one of the required attributes in the logs. `action` is a string that is created using the following format:

```
[<app-mode>]*:[<stack-path>]*,[<ui-context>]*;<verb>
```

Where,

- `app-mode` (optional) is used when for apps that have different modes. The following are apps that are using this and the possible values:
  - recordedit:
    - `edit`: Edit mode of the app.
    - `create-copy`: When users end up in this app by clicking on "copy" button in record app.
    - `create-preselect`: When users end up in this app by clicking on "Add" button of related entities (In this case, we're preselecting the foreignkey relationship between related entity and the main).
    - `create`: Create mode of the app that is not the other more specific versions.
  - viewer:
    - `edit`: When users are editing an annotation.
    - `create`: When users are creating an annotation.
    - `create-preselect`: When users click on "edit" button of an annotation that was imported from a file. In this case, technically they are going to create a new annotation record in the database and the annotated term is preselected.

- `stack-path` (optional) is available only when `stack` is used and summarizes the `stack`. To distinguish between each stack nodes in this string, we're using `/`. The values used for each node are:
  - `entity`: Based on `entity` stack node `type`.
  - `set`: Based on `set` stack node `type`.
  - `col`: Based on `col` stack node `type`.
  - `pcol`: Based on `pcol` stack node `type`.
  - `related`, `related-inline`: Based on `related` stack node `type`.
  - `related-link-picker`: Used for the association link picker.
  - `facet`: Based on `facet` stack node `type`.
  - `facet-picker`: Used for facet picker.
  - `fk`: Based on `fk` stack node `type`.
  - `fk-picker`: Used for foreign key picker.
  - `annotation-set`: Annotation list displayed on the viewer app.
  - `annotation-entity`: Each individual annotation displayed in annotation list of viewer app.

  Based on this, `entity/related-inline` is a possible `stack-path`.

- `ui-context` (optional) is used to give more clue as to where in the UI this request belongs to.

- `verb` is the actual user action.


Extra rules followed in the action string:
- `/` is used in each of these sections, to indicate another level. For example `entity/related` in `stack-path` means that the whole `stack-path` of page is `entity`, and this request is part of `entity/related` subsection.
- `stack-path` has the same number of levels as `stack` and each level corresponds to each stack node. But the string used to represent a stack node can be different from the `type` used in the stack. This has been done to add more information in the action string. For example, the `load` request for both facet, and facet picker are using an stack that has `set`, and `facet` nodes. But their `stack-path`s are `set/facet` and `set/facet-picker`.
- `-` is used to separate the words at the same level. The `-` could imply hierarchy or just a separator for words, and we're not going to distinguish the two cases by using different delimiters to avoid confusion.


## List of requests

You can find the full list of log requests in [this google sheet](https://docs.google.com/spreadsheets/d/1cHhPR0AacvuH2o3QavWlJCIIyPajfn93fJzFnc7VA5M). The following sections have been added to provide more information about the content of this google sheet.

### Server vs. Client

When users open a page, or interact with the page, we might send some requests to server based on the action. You can gather more information about the request just by looking at the url associated withe request. We call these server logs. On the other hand, some user interactions won't necessarily generate a server request and therefore we are logging these by sending a HEAD request to a predefined ermrest path. Currently we're using `/ermrest/client_action` path for these client logs.


### Stack structure

As we previously explained, `stack` is used to capture the user path. It's an array of "stack nodes", where each node summarizes the user path. This has been mainly done to distinguish between the same actions that users might have taken in different paths. For instance, we show the same controls that we have in recordset app, in all of our modal pickers. Without the stack, the user path (context) would be lost. We tried to summarize the stack structure associated with each request in the google sheet. Each cell represent a node in the stack with attributes that will be available on it.

To give you a better idea of how to read the table, let's consider the case that the user is interacting with a facet picker, that was opened from an association link picker on an inline related entity. So,

- first stack node should capture the record page app and the filters that it had. So it should be of `"type": "entity"`, and should have `filters` of main page and `s_t` should be the main table.
  ```javascript
  {
    "type": "entity",
    "s_t": "schema:main_table",
    "filters": {"and": [{"src": "RID", "ch": ["RID_VALUE"]}]}
  }
  ```

- second stack node should capture the association link picker and the filters that it had before opening the facet picker. So the `s_t` should show the leaf (related) table, the `source` should capture the path from the main table to this related table, a `"picker": 1` should be added to signal that this was a picker and not the related section, and if the picker had any filters (facets), `filters` should capture those (`filters` might not be available if the user didn't select any filters).
  ```javascript
  {
    "type": "related",
    "s_t": "schema:related_table",
    "source": [{"i": ["schema", "constraint"]}, "RID"],
    "entity": true,
    "picker": 1,
    "filters": {"and": [{"src": "SOME_COLUMN", "ch": ["SOME_VALUE"]}]}
  }
  ```

- third stack node should capture the state of facet picker. So the `s_t` should show the facet table, `source` should be the path from the related table to the facet table, `"picker": 1` should be added to signal that it was a picker, and if the picker had any filters (search-box filter is the only applicable case here), `filters` should capture those (`filters` might not be available if the user didn't change the search-box value).
    ```javascript
    {
      "type": "facet",
      "s_t": "schema:facet_table",
      "source": [{"o": ["schema", "constraint2"]}, "RID"],
      "entity": false,
      "picker": 1,
      "filters": {"and": [{"key": "search-box", "s": ["TERM"]}]}
    }
    ```


And if we put these three together, this is how the stack should look like:

```javascript
{
  "stack": [
    {
      "type": "entity",
      "s_t": "schema:main_table",
      "filters": {"and": [{"src": "RID", "ch": ["RID_VALUE"]}]}
    },
    {
      "type": "related",
      "s_t": "schema:related_table",
      "source": [{"i": ["schema", "constraint"]}, "RID"],
      "entity": true,
      "picker": 1,
      "filters": {"and": [{"src": "SOME_COLUMN", "ch": ["SOME_VALUE"]}]}
    },
    {
      "type": "facet",
      "s_t": "schema:facet_table",
      "source": [{"o": ["schema", "constraint2"]}, "RID"],
      "entity": false,
      "picker": 1,
      "filters": {"and": [{"key": "search-box", "s": ["TERM"]}]}
    }
  ]
}
```

This stack would be added to any logs that we generate from that picker, and will be reflected in the action string. For example if the user opens the page-limit dropdown menu, the action would be `:entity/related-link-picker/facet-picker,page-size;open`.

## Facet compressed syntax

Since the facet object can be lengthy, we decide to modify it for the log purposes. The structure is the same, we are just going to compress some of the attribute names. These are the compressed version of each attribute used in the facet syntax:
- `i` for `inbound`
- `o` for `outbound`
- `src` for `source`
- `key` for `sourcekey`
- `ch` for `choices`
- `r` for `ranges`
- `s` for `search`

So for example if the facet object is

```javascript
"and": [
    {"source":"search-box", "search":["test"]},
    {"source": [{"inbound": ["s", "cons1"]}, {"outbound": ["s", "cons2"]}, "RID"], "choices":["1"]},
    {"sourcekey":"some-key", "ranges":[{"min": 1}]}
]
```

We're going to log it as the following:

```javascript
"and": [
    {"src":"search-box", "s":["test"]},
    {"src": [{"u": ["s", "cons1"]}, {"o": ["s", "cons2"]}, "RID"], "ch":["1"]},
    {"key":"some-key", "r":[{"min": 1}]}
]
```


## Error log

To find the errors in log, you can search for `/ermrest/terminal_error` path. This is what a error log would look like:

```javascript
{
   "e": 1,
   "message": "ERROR MESSAGE",
   "name": "ERROR TITLE"
}
```

As the name suggests, we currently are only logging terminal errors.

## Truncation

The object that we want to log might be lengthy. So we should truncate this object if it's exceeding the maximum length (we're currently limiting it to 6500 characters after encoding). In truncation logic we perform each of the described steps below to shorten the length of the object. If one step was not enough, we would perform the next step and so on until the length goes below the limit. The steps are:

1. Replace all foreign key constraints that are in `source` or `filters` properties with their ermrest-provided model RID.
2. Replace values (`choices`, `ranges`, `search`) in the `filters` with the number of values.
3. Replace all `filters.and` with the number of filters.
4. Replace all source paths with the number of path nodes.
5. Replace `stack` value with the number of stack nodes.

As you might have noticed, we are not adding any extra flag to signal truncation, and the structure itself should indicate that the request header has been truncated. The following summarizes how structure is changed based on the defined steps above:

1. Instead of array of two elements ([`schema`, `constraint`]) for the constraints, there will be a string.
2. Instead of arrays of values for `choices`, `ranges`, and `search` attributes in `filters`, there will be a number.
3. Instead of array of filters in the `filters.and`, there will be just a number.
4. Instead of an array, the `stack` value will be just a number.


## Analysis

In this section we're going to mention some of the patterns that you can use to process the logs.

#### Asset Download & CSV Default Export

Since the asset download and also the default CSV export requests are simple redirects to the location, we cannot pass `dcctx` to the header. Instead, we're sending these query parameters:

- `uinit=1`: To signal that this is chaise/ermrestjs that has generated the link.
- `cid`: The `cid` of the app that user found the link from.


The following url patterns are what's unique about each of these requests and you can use for your analysis:

- Asset download: `?limit=none&accept=csv&uinit=1&cid=`

- CSV default export: `uinit=1&cid=`

#### Finding the displayed recordset request

In recordset app, or any of the other places that use the recordset view, e.g, modal pickers, chaise will communicate with server as soon as user interacts with the page as long as we have enough flow-control slots to send the request. So there might be some requests that we generate while the user is interacting with the page that will be discarded. To find the actual request that the user sees on the page, you can use `start_ms`, and `end_ms`. All these reload requests will have these two attributes. If you join all the reload request by `start_ms`, you can find all the requests that we sent when the user started interacting at `start_ms`. So the request with the longest `end_ms` would give you the actual request that users will see on the page.

#### Find number of clicks on the "view" button in recordset app

Clicking on "view" button will navigate users to record page with a specific `paction` value. So you would need to find requests with the following values:

- `cid=record`
- `pcid=recordset`
- `paction=view`

If you're interested in doing this for each specific table, you can choose to do so by further filtering this with the value of `schema_table`.

## Change Log

### 08/26/20

###### Commit/PR Links
  - [chaise (viewer changes)](https://github.com/informatics-isi-edu/chaise/pull/2001)
  - [chaise (go to RID changes)](https://github.com/informatics-isi-edu/chaise/pull/2000)
  
###### Changed
  - Changed the initial load requests of viewer app to be aligned with the rest of the apps.
  
###### Added
  - Added proper log support to viewer app. This includes properly logging the requests that viewer app was already making and adding client logs. Please refer to the PR and documentation for more information.
  
  - Added client log action for "go to RID" feature.
  
  - Added `paction=view` to first request in record app, to indicates user clicked on "view" button in tabular displays.

### 02/12/20

###### Commit/PR Links
 - [chaise](https://github.com/informatics-isi-edu/chaise/pull/1889)
 - [ermrestjs](https://github.com/informatics-isi-edu/ermrestjs/pull/829)

###### Changed
 - Completely changed how we're logging in chaise. This is the starting date of logging as described in this documentation.
