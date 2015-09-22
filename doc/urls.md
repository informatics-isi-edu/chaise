# Guidelines for Resource Naming

_This document describes the proposed guidelines for resource naming used by
Chaise._

Web-based data presentation resources SHOULD have a _name_ in the form of a URL
such that any meaningfully different presentation may be referenced, bookmarked
and shared, even if the presentation is via a single-page "[AJAX](https://en.wikipedia.org/wiki/Ajax_%28programming%29)"
or similar application.

User actions that change to different data presentation SHOULD modify the
browser history to allow backward/forward navigation, natively in the Web
browser. The full URL SHOULD be available for the user to copy and/or share
outside the browser. This MAY be in the form of a "permalink" anchor on the
page since cutting and pasting from the browser location bar is sometimes
problematic.

Chaise should use the URL to name much (if not all) of the state of the
application. At present, Chaise's internal state includes many aspects that
determine the presentation of data. These include:
- the current entity set that the user is browsing,
- the attributes that the have been used to filter the entity set,
- the current layout (e.g., list, card, or table),
- whether the slide out is shown and which panel is displayed, and
- the sort ordering and paging used to view the resulting entity set.

All of this state SHOULD be named (i.e., identified) in the URL and recoverable
by returning to a state of the application based on the URL. If represented in
the URL a user could:
- link directly to it from another web page,
- bookmark it for later viewing,
- share it (email, text, etc) to a colleague,
- or it could be crawled by a Web search engine.

This guide defines some of the principles that should be followed when designing
names for data presentation resources and specifies the names for the current
set of resources provided by Chaise.

## Background: Primary and Secondary Resource Names

Over the past few years, the handling of and naming of state by presentation
resources of single-page (or Ajax) Web applications has evolved considerably.
Chaise takes a decidedly conservative approach in its interpretation and
adherence to the W3C standards.

[RFC3986](https://tools.ietf.org/html/rfc3986) specifies the "Uniform Resource
Identifier (URI): Generic Syntax." The URI syntax allows for the identification
of a primary resource and for secondary resources within its context, by way of
the "fragment identifier" or the part of the URI following the '#' (the pound
character, also known as the "hash" or "number sign").

The RFC states that:

> The fragment identifier component of a URI allows indirect identification of a
  secondary resource by reference to a primary resource and additional
  identifying information.  The identified secondary resource may be some
  portion or subset of the primary resource, some view on representations of the
  primary resource, or some other resource defined or described by those
  representations.

The portion of the URI up to the '#' identifies the primary resource while the
fragment identifier (part that follows the '#') identifies secondary resources.
The secondary resource identifier is commonly used in modern Web applications,
so called AJAX applications, that maintain complex information in the fragment
identifier.

Thus, in Chaise, when naming resources the primary identifier SHOULD be used to
name the presentation resource (i.e., a Web application used for generating data
presentations and supporting user interactions) while the state of the
application SHOULD be represented as the secondary resource identifier in the
[fragment identifier](http://en.wikipedia.org/wiki/Fragment_identifier) part
of the URL scheme.

```
https://<authority>/path/to/resource?query-options#fragment-identifier
\________________________________________________/ \_________________/
                      |                                    |
        primary resource identifier          secondary resource identifier
                      |                                    |
 ___________________________________________________   _______________________
/                                                   \ /                       \
https://example.org/path/to/chaise/app?server=options#state/of/chaise?client=opt
```

## Resource Names in Chaise

The primary resources (Web applications) and thus resource names in Chaise are:
- `chaise/search`: resource for searching within a catalog (aliased from `chaise`)
- `chaise/record`: resource for interacting with a record in the catalog
- `chaise/login`: resource for establishing a session

These resources are inter-dependent Web applications loaded in distinct client
contexts (i.e., Web pages).

### `chaise/search` Resource Names

The `chaise/search` resource is an application for searching over collections
of entities in an ERMrest catalog. It MUST represent the search criteria in use
at well-defined states. It SHOULD represent other factors that influence the
data presentation, such as whether the search results are displayed in a list,
table, card, or other layout for example. However, since the underlying data
model may change, even within a current session, the application MAY encounter
resource names (URLs) that are no longer satisfiable. In such cases, the
application MUST notify the user of its inability to satisfy the search and MAY
fall back to a best effort attempt at satisfying the search criteria. For
instance, if the URL names a secondary resource that includes an attribute that
no longer exists in the catalog's data model at present, the application MAY
attempt to drop the predicate from the search expression and show results for
the predicates that are still satisfiable. However, again it MUST notify the
user that it was not able to satisfy all of the predicates in the original
resource name.

The following grammar is used for `chaise/search` resource naming.

```
SEARCH_URI := BASE_URI 'chaise/search' '#' CATALOG_ID '/' SCHEMA ':' TABLE '?' OPTION [ '&' OPTION ]*

BASE_URI := <a standard HTTP URL ending in the base path to the 'chaise' resource>

CATALOG_ID := <a catalog identifier>

SCHEMA := <a schema name>

TABLE := <a table name>

COLUMN := <a column name>

PREDICATE := ATTRIBUTE OP VALUE [',' VALUE]+

ATTRIBUTE := [ [SCHEMA ':'] TABLE ':' ] COLUMN

OP := '::eq::' | '::neq::' | '::gt::' | '::lt::' | <other valid EMRrest operators>

VALUE := <an URL encoded string literal>

OPTION := 'facets' '=' PREDICATE [ '/' PREDICATE ]+ | TBD

TBD := <a placeholder for one or more parameters needed to represent the state
       of the UI beyond the basic parameters needed for faceting. These may
       include the current layout (list, card, table) etc.>
```

Notes:
- In the `facets` search option, the list of predicates form a conjunction
  (i.e., a logical AND) separated by the '/' character.
- The right-hand side of a `PREDICATE` may be a single literal `VALUE` or a list
  of values separated by the `,` character. The meaning of the value list is a
  short-hand form of a disjunction that reuses the same `ATTRIBUTE` and `OP`.
  Thus `attr::eq::abc,def,ghi` means "attr equals abc or attr equals def or
  attr equals ghi".

All user-specified parameter values (id, schema, table, attribute, value, etc.)
MUST be URL encoded. As long as no special characters are used in them (such as
spaces) the values will be unchanged and user-friendly.

Example `chaise\search` URL:

```
https://example.org/chaise/search#5/xyz:experiments?facets=investigator::eq::'bill'/created::gt::'2015-04-20'
```

### `chaise/record` Resource Names

The `chaise/record` resource is an application for viewing and editing a single
data record (i.e., an entity) from a catalog of an ERMrest service. Along with
the data record, the application also display sets of related entities as part
of the record display. The application also supports browsing between records
by navigating the foreign key relationships in the data model and between
related entities. It MUST represent the identification of the record in its
resource name. It SHOULD represent other factors that influence the data
presentation, such as whether a nested table of related entities is display in
a standard or transposed table layout. However, as specified in the
`chase\search` resource, the `chaise\record` application may encounter URLs
that are no longer satisfiable due to changes in the model or the data. In such
cases, the application MUST notify the user of its inability to display the
record. Unlike, the search resource, the record resource may not have a way to
fallback and may only be able to direct the user to the search interface.

The following grammar is used for `chaise/record` resource naming.

```
RECORD_URI := BASE_URI 'chaise/record' '#' CATALOG_ID '/' SCHEMA ':' TABLE '/' PREDICATE [ '/' PREDICATE ]* '?' OPTION [ '&' OPTION ]*
BASE_URI := <a standard HTTP URL ending in the base path to the 'chaise' resource>

CATALOG_ID := <a catalog identifier>

SCHEMA := <a schema name>

TABLE := <a table name>

COLUMN := <a column name>

PREDICATE := ATTRIBUTE OP VALUE [',' VALUE]+

ATTRIBUTE := [ [SCHEMA ':'] TABLE ':' ] COLUMN

OP := '::eq::' | '::neq::' | '::gt::' | '::lt::' | <other valid EMRrest operators>

VALUE := <an URL encoded string literal>

OPTION := <TBD>

<TBD> := a placeholder for one or more parameters needed to represent the state
         of the UI beyond the basic parameters needed for faceting. These may
         include the current layout (list, card, table) etc.
```

All user-specified parameter values (id, schema, table, attribute, value, etc.)
MUST be URL encoded. As long as no special characters are used in them (such as
spaces) the values will be unchanged and user-friendly.

Example `chaise\record` URL:

```
https://example.org/chaise/record#5/xyz:experiments/id::eq::123
```

### `chaise/login` Resource Names

TBD. This should probably include a referral URL so that when other applications
send the user to the login resource, the user can be returned to the originating
application with its state restored.
