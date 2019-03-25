# Logging

By providing `Deriva-Client-Context` header in ermrset requests we can log extra objects alongside the request. ERMrest will log the provided object in the `dcctx` attribute of logs. For example the following is a line from `/var/log/messages` file in dev.isrd:

```
Jan 24 16:29:50 dev.isrd.isi.edu ermrest[4313.139635548755712]:
{
  "elapsed":0.014,
  "req":"OSGHMz7JSySiS0Y5UOLA6w",
  "scheme":"https",
  "host":"dev.isrd.isi.edu",
  "status":"304 Not Modified",
  "method":"GET",
  "path":"/ermrest/catalog/1/attributegroup/M:=isa:dataset/F5:=left(thumbnail)=(isa:file:id)/$M/F4:=left(owner)=(isa:person:name)/$M/F3:=left(gene_summary)=(vocabulary:gene_summary:id)/$M/F2:=left(status)=(isa:dataset_status:id)/$M/F1:=left(project)=(isa:project:id)/$M/release_date,id;M:=array(M:*),F5:=array(F5:*),F4:=array(F4:*),F3:=array(F3:*),F2:=array(F2:*),F1:=array(F1:*)@sort(release_date::desc::,id)?limit=26", "client":"128.9.184.94",
  "referrer":"https://dev.isrd.isi.edu/~ashafaei/chaise/recordset/",
  "agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36",
  "track":"f671a1bf.559966234faaf",
  "dcctx":{
    "wid":"2d1a297p1l3t24942o261ot1",
    "cid":"recordset",
    "schema_table":"isa:dataset",
    "pid":"1fyj2i5t2ew02qg41xuc2mxf",
    "page_size":25,
    "action":"recordset/main/load"
 }
}
```

You can see the `dcctx` attribute. This belongs to the request for showing the entities in the recordset app.

## Attributes
The following are the default attributes that you can find on all the requests:

- `cid`: The app name (record, recordset, recordedit).
- `wid`: The window id (randomly generated).
- `pid`: The page id (randomly generated).
- `schema_table`: The `schema:table` combination.
- `action`: A pre-defined string that implies what the request was for. Refer to [the action list](#action-list) for more information.

The following are the optional attributes that you might find on requests:
- `facet`: If url contains filter, this attributes gives you the [facet](https://github.com/informatics-isi-edu/ermrestjs/wiki/Facets-JSON-Structure) equivalent of that filter.
- `filter`: If we couldn't represent the given filter in terms of facet. This will be just a simple string.
- `page_size`: The number of entities that we requested.
- `referrer`: It's an object that has `schema_table` and `facet` (`filter`) as its attributes. This attribute is available on request that needs to capture their parent entity (for example related entities will have the main entity as referrer).
- `source`: The source path of facet. You will find this attribute in the requests that belong to a facet.
- `t`: If this attribute exists and its value is `1`, then the given object is truncated since it was lengthy. Refer to [truncation](#truncation) for more information.

## Action List

The table below summarizes all the requests that we currently are logging in chaise and their respective `action`.

| App                         | Description                                    | Action                                  | Extra            | Notes                   |
|-----------------------------|------------------------------------------------|-----------------------------------------|------------------|-------------------------|
| chaise-wide                 | get catalog information                        | model/catalog                           |                  |                         |
| chaise-wide                 | get catalog schemas information                | model/schema                            |                  |                         |
| record                      | load main entity                               | record/main/load                        |                  |                         |
|                             | update main entity                             | record/main/update                      |                  |                         |
|                             | load aggregates in main entity                 | record/aggregate                        |                  |                         |
|                             | update aggregates in main entity               | record/aggregate/update                 |                  |                         |
|                             | load inline entities                           | record/inline                           |                  |                         |
|                             | update inline entities                         | record/inline/update                    |                  |                         |
|                             | load aggregates in inline entities             | record/inline/aggregate                 |                  |                         |
|                             | update aggregates in inline entities           | record/inline/aggregate/update          |                  |                         |
|                             | load related entities                          | record/related                          | referrer         |                         |
|                             | update related entities                        | record/related/update                   | referrer         |                         |
|                             | load aggregates in related entities            | record/related/aggregate                |                  |                         |
|                             | update aggregates in related entities          | record/related/aggregate/update         |                  |                         |
|                             | read p&b values to add                         | pre-create/prefill/association          |                  |                         |
|                             | read pre selected p&b values to add            | pre-create/prefill/association/disabled |                  |                         |
|                             | create p&b                                     | create/prefill/association              |                  |                         |
|                             |                                                |                                         |                  |                         |
| recordedit                  | create record                                  | create/new                              |                  |                         |
|                             | read the foreignkey values for prefill         | pre-create/prefill                      |                  |                         |
|                             | create by add button on fk modal               | create/prefill                          |                  |                         |
|                             | read the current row for copy                  | pre-create/copy                         |                  |                         |
|                             | create record from copy                        | create/copy                             |                  |                         |
|                             | creating row by clicking on add in fk modal    | create/modal                            |                  |                         |
|                             | read entities to be updated                    | pre-update                              |                  | page_size is inaccurate |
|                             | update entities                                | update                                  |                  |                         |
|                             | get default value for fks                      | recordedit/default                      |                  |                         |
|                             |                                                |                                         |                  |                         |
| recordset                   | recordset main data read on load               | recordset/main/load                     |                  |                         |
| recordset/record/recordedit | recordset main data read on update             | recordset/main/update                   |                  |                         |
| recordset/record/recordedit | recordset main data read on page change        | recordset/main/page                     | sort, page, type |                         |
| recordset/record/recordedit | recordset main data read on sort change        | recordset/main/sort                     | sort             |                         |
| recordset/record/recordedit | recordset main data read on limit change       | recordset/main/limit                    |                  |                         |
| recordset/record/recordedit | recordset main data read on facet change       | recordset/main/facet                    |                  |                         |
| recordset/record/recordedit | recordset get main count                       | recordset/main/count                    |                  |                         |
| recordset/record/recordedit | recordset get aggregated values                | recordset/main/aggregate                |                  |                         |
| recordset/record/recordedit | recordset read facet                           | recordset/facet                         | referrer, source |                         |
| recordset/record/recordedit | recordset initialize preselected entity facets | recordset/facet/init                    | referrer, source |                         |
| recordset/record/recordedit | recordset get buckets for a facet              | recordset/facet/histogram               | referrer, source |                         |
| recordset/record/recordedit | recordset click on show details                | recordset/viewmore                      | referrer, source |                         |
|                             |                                                |                                         |                  |                         |
| record                      | export from recordset                          | export/recordset                        |                  |                         |
| recordset                   | export from record                             | export/record                           |                  |                         |
|                             |                                                |                                         |                  |                         |
| record                      | delete from record                             | delete/record                           |                  |                         |
| recordedit                  | delete from recordedit                         | delete/recordedit                       |                  |                         |
| record/recordset/recordedit | delete row from recordset table                | delete/recordset                        |                  |                         |
| record                      | delete related entity rows                     | delete/record/related                   |                  |                         |
|                             |                                                |                                         |                  |                         |
| viewer                      | main request                                   | viewer/main                             |                  |                         |
|                             | get annotation table                           | viewer/annotation                       |                  |                         |
|                             | get annotation comments                        | viewer/comment                          |                  |                         |
|                             | get anatomy data                               | viewer/anatomy                          |                  |                         |               |

## Error Log

Currently we're only logging terminal errors (we might want to change that to log 5xx errors too). To find the errors in log, you can search for `terminal_error` path. This is what a error log would look like:

```
{
   e: 1,
   message: "ERROR MESSAGE",
   name: "ERROR TITLE"
}
```


## Truncation

The object that we want to log might be lengthy so we should truncate this object if it's exceeding the maximum length (we're currently limiting it to 7000). If the object has `t:1` that means it has been truncated. If the content was longer than the limit, we should truncate based on this order: facet, source, referrer. Which means that referrer has more priority over source, and source over facet.

## Change Log

#### March 25, 2019

###### Changed
- Fixed the action of scalar column requests.
- Changed the action for removing related entity rows from `delete/recordset/related` to `delete/record/related`.
- Fixed the issue of reporting both load and update requests of record page as `record/main`. Now they are being logged with proper action.
- `recordset/export` was used as action for export from both record and recordset. Now `export/record` and `export/recordset` are going to be reported.
- Fixed a bug that would cause record load requests to be reported as update.

###### Added
- Added proper `dcctx` logging to viewer app.
- New actions have been attached to schema (`"model/schema"`) and catalog (`"model/catalog"`) requests.
- `catalog` has been added to all the requests.
- `column` has been added to requests for getting a scalar facet data.
-  If there are preselected facets, in entity mode we have to get the row-name corresponding to the selected value. Customized action (`recordset/facet/init`) has been added for this request.
- Added proper action `recordset/facet/histogram` to the request for getting buckets of a range picker facet.

#### March 8, 2019

###### Changed
 - We realized that the first request of adding pure and binary is not using the correct action. It was using the `recordset/main/load`. We changed it to use the appropriate `pre-create/prefill/association` action with `referred` information.
