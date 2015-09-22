# Heuristics and Guidelines for Data Presentation

The heuristics proposed here are intended to support the model-driven
presentation of tabular data from an
[ERMrest](http://github.com/informatics-isi-edu/ermrest) service instance. They
are intended to complement several sources of domain information:

- [ERMrest model resources](http://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/model/rest.md#schemata-retrieval) a.k.a. table schemata
- [ERMrest model annotations](http://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/index.md#model-annotations)
  - [Proposed common ERMrest annotations](http://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md)
- User preferences via GUI controls, cookies, etc.?

## Status

This is intended as a living document to capture proposed behaviors and
(eventually) implementation status. Changes should be suggested in the form of
pull-requests and/or discussion in the issue-tracker.

## General Presentation

### Bookmarking

Web-based data presentations SHOULD have a _name_ in the form of a URL such
that any meaningfully different presentation may be bookmarked and shared, even
if the presentation is via a single-page AJAX or similar application.

- User actions that change to different data presentation SHOULD modify the
  browser history to allow back/forward navigation.
- The full URL SHOULD be available for the user to copy and/or share outside
  the browser. This MAY be in the form of a "permalink" anchor on the page
  since cutting and pasting from the browser location bar is sometimes
  problematic.

See [Guidelines for Resource Naming](urls.md) for more details.

### Linked-Data Presentation

Closely related to [bookmarking](#bookmarking), many data presentation
scenarios can offer connections to other *related* data presentations. A
web-based presentation SHOULD offer these as simple embedded URLs.

- Anchors or buttons to navigate to an alternate presentation of the same data.
- Anchors to navigate to a presentation of related data, e.g. another record
  linked to the entity in an entity-relationship model.
- Embedded image tags showing graphical representations of the entity.
- Download links to retrieve an alternate representation of the entity, e.g.
  bulk science data being presented in a catalog.

It is RECOMMENDED that these links be rendered into HTML pages as explicit
anchors, image tags, etc. so that they are discoverable and accessible by
different client software.

### Type-Appropriate Presentation of Values

ERMrest data in general has type information available at the level of the
scalar values stored in columns of tables. Type-appropriate presentation for
input and output SHOULD be used wherever feasible. In some cases, relevant type
information MAY be found in the annotations on tables or columns, because the
presentation type is not distinguishable merely from scalar types.

- Numbers
- Dates
- Timestamps
- Short Text Fragments
- Re-flowing Text
- Marked-up Text
- In-line Images
- External Images and Viewers
- Downloadable URLs

### Alternate Interpretation of Entities

At a basic level, all entities are structured data. In the absence of any
higher-level semantic information, all ERMrest data results SHOULD be presented
as structured tuples of scalar values. Optionally, annotations MAY indicate
other presentation modes.

- Entities with thumbnail or other alternate representations
- Entities representing external content, e.g. entries in a data catalog
  - In-line viewers or other embedding
  - Download links
  - Launchers or other external access applications

## Record-Set Presentation

Consider presentations that are focused on a tabular (monomorphic) set of
entity records, e.g. those matching particular query criteria and drawn from
one entity table. For these presentations, we might have the following
parameters:

1. The _base URL_ of the ERMrest catalog containing the data, e.g.
   `https://example.com/ermrest/catalog/42`.
2. The _entity type_ of the entity-type being presented, e.g. `Schema1:Table2`.
3. The _entity path_ that embodies a query, e.g.
   `Schema1:Table2/category=foo,bar`.

The _entity type_ can be inferred from the _entity path_ but let's consider
them as separate parameters to simplify discussion. The resulting ERMrest URL
combines these as _base URL_ + `/entity/` + _entity path_ + _query options_,
e.g. `https://example.com/ermrest/catalog/42/entity/Schema1:Table2/category=foo,bar?limit=none`.

The results of retrieving the full (unlimited) query resource is a tabular set
of all records matching the criteria.

### Paging

Record-sets SHOULD be presented using
[paged data access](http://github.com/informatics-isi-edu/ermrest/blob/master/api-doc/data/naming.md#data-paging).

- The paging key SHOULD be an existing key column (or composite key) found in
  the table definition of the model.
- The number of records to show in one page SHOULD be chosen appropriately for
  the viewing application environment.

### Alternate Interpretation of Entity Sets

As described above in (#alternate-interpretation-of-entities), a set of
entities SHOULD be presentable as a table. Alternate presentations MAY be
meaningful for the set:

- Transposable table
- Thumbnail gallery
- Slideshow or carousel
- A statistical summary
  - Scoreboard where records have *completion* information
  - Pie-chart where records have discrete classes
  - Histogram where records have scalar properties
- A timeline of sequenced events
- Graph or Tree view of linked entities

### Alternate Presentation of Relationships

- Replace foreign key references (outbound) with preferred names for related
  entities, if known. This MAY replace multiple columns with a single column in
  the case of composite foreign keys.
- Add psuedo-record fields populated with arrays of preferred names for related
  entities with inbound foreign key references to this record set.
- Offer two levels of navigable relationship links:
  - Transition to record-detail presentation for one related entity name.
  - Transition to related record-set presentation for all entities related by
    one particular mode linkage.

## Record-Detail Presentation

Consider presentations that are focused on a specific entity record. This is
essentially a degenerate case of the (#record-set-presentation). Because the
set has only a single member, default presentation modes SHOULD be tuned for
that case and additional related information and navigation SHOULD be offered.

1. Present the single record with multiple alternative (simultaneous?) views
  - As structured set of fields
  - With an in-line image or thumbnail
  - With a download link
2. Present related entities as record-sets
  - Exception: present *simple* related entity sets as a psuedo-column of the
    detailed record?

Entity-relationships should be presented as either a psuedo-column or
supplementary record-set, and SHOULD NOT be presented simultaneously in both
forms.

## Vocabulary Presentation

A vocabulary is a convention of use for interpreting an entity-type as a set of
controlled vocabulary terms. A vocabulary has four parts, though some may be
omitted:

1. internal identifier: a key that has no particular meaning to users, e.g. a
   system-generated serial number
2. *identifier*: a key that has meaning to users, i.e. an externally-assigned
   concept identifier in a standard vocabulary
3. *term*: a textual key that has meaning to users, i.e. a standard keyword or
   phrase in a controlled vocabulary
4. *description*: a textual field explaining the meaning to users

When presenting references to vocabulary entities, the following forms are
RECOMMENDED:

- Allow a user preference to override generic heuristics where multiple options
  are available.
- In dense table views, prefer *identifier* to *term* as they are usually more
  compact. Offer *term* as a tooltip where available.
- In detailed entity views, present both *identifier* and *term*.
- In manual user input contexts also consider *description*
  - In a term-definitions listing
  - As a slide-out or other "more information" flow triggered by user action
  - As a secondary search corpus for keyword-based search

### Recognizing Vocabularies

1. A use of the [vocabulary annotation](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2015-vocabulary)
   identifies a vocabulary table and assigns a mapping to its columns.
2. A single-column table where its integer or textual column is also its key
   and one or more tables make foreign-key references to the table. Consider
   the single column to be the *identifier*.
3. A table where an integer key has one or more foreign-key references to it
   from other tables and other keys also exist. Consider the referenced integer
   key to be the *internal identifier*.
  - A single textual key exists. Consider it to be the *identifier*.
  - Multiple textual keys exist.
    - Any keys with foreign key references are potentially *identifier*.
    - Any keys without foreign key references are potentially *term*.
  - Any non-key textual columns are potential *description*.

In the case of multiple *identifier* fields, whichever is referenced in a
particular entity context will be presented as an identifier while others are
ignored. It is assumed that the table referenced the particular *identifier*
due to its appropriateness in that context. However, when presenting *term* or
*description* details, all candidate values SHOULD be presented because it is
unknown which would benefit the user.

## Facet Presentation

A presentation layer built on top of an ERM (entity-relationship model) enables
the exploration and query of rich, complex data structures, in contrast to the
[Bag of words model](https://en.wikipedia.org/wiki/Bag-of-words_model) typical
of search engines. The downside of more complex query capabilities, however, is
that it introduces a complexity for the end user to comprehend and navigate. A
faceted presentation needs to strike a balance between exposing the data
structure to enable complex queries without overwhelming the user with its
complexity. In addition, there are details of the
[physical schema](https://en.wikipedia.org/wiki/Physical_schema) which may be
unnecessary to the end user's comprehension of the model. For instance, the
many-to-many relationship in relational schema is implemented with an
"association table," which may be critical to the implementation of the data
model but a search presentation layer can simplify the presentation of the model
without sacrificing the query capabilities.

The heuristics here are RECOMMENDED in order to address these types of issues.
The heuristics SHOULD apply unless specifically overridden by schema annotation
or user preference. These heuristics assume the context of faceting over the
attributes of a specific entity-type and related entity-types. In a relational
model, these may be referred to as the columns, table, and related tables,
respectively.

1. Include the columns of the table currently being faceted on.
  - Exclude surrogate key columns (e.g., sequential numeric primary keys).
  - Exclude foreign key columns.
  - Unless otherwise directed, display columns in the natural order from the
    table definition from the schema.
2. For table columns that are foreign keys to vocabulary tables, include the
   `term` column from the vocabulary table (see [vocabulary annotation](https://github.com/informatics-isi-edu/ermrest/blob/master/user-doc/annotation.md#2015-vocabulary)).
3. If there exists many-to-many relationships between the table and vocabulary
   tables, include the `term` column from the vocabulary table.
  - Note that this is a scenario where an "association table" will have been
    used to model the many-to-many relationship, but such a table need not be
    shown in the faceted search display as it is unnecessary for the purpose of
    building a complex query and yet overcomplicates the display.
4. For table columns that are foreign keys to other non-vocabulary tables:
  - Allow navigation from the current faceting context to the context of the
    related table and recursively apply these heuristics.
  - Alternatively: Display a grouped set of columns which are drawn from the
    related table. Grouped columns could be displayed in an accordion or
    expandable tree style. These heuristics are not meant to be prescriptive of
    the exact form of presentation.
5. Apply rule #4 to related tables that have a foreign key relationship to the
   table that is being faceted on.
6. TBD, rule #4 could also be applied to related tables that are related by way
   of an association table (i.e., many-to-many relationship).
