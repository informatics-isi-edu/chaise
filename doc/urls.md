# Guidelines for Resource Naming

_This document describes the proposed guidelines for resource naming used by
Chaise._

Chaise should use the URI to name much (if not all) of the state of the
application. For example, the state of the app currently includes things like:
- the current entity set that the user is browsing,
- the attributes that the have been used to filter the entity set,
- the current layout (list, card, or table),
- whether the slide out is shown and which panel is displayed, and
- the sort ordering and paging used to view the resulting entity set.

All of this state could and should be identified in the URL and recoverable by
returning to a state of the app based on the URL. If it were represented in the
URL then a user could:

- link directly to it from another web page,
- bookmark it for later viewing, or
- share it (email, text, etc) to a colleague.

To do this properly, the state of the application should come in the [fragment
identifier](http://en.wikipedia.org/wiki/Fragment_identifier) portion of the
URL scheme. That means that it should be after the '#' character in the URL:

```
https://<authority>/path/to/resource?query-options#fragment-identifier
```

## Background: Primary and Secondary Resource Names

[RFC3986](https://tools.ietf.org/html/rfc3986) specifies the "Uniform Resource
Identifier (URI): Generic Syntax." The URI syntax allows for the identification
of a primary resource and for secondary resources within its context, by way of
the "fragment identifier" or the part of the URI following the '#' (the "hash
sign" or "number sign").

The RFC states that:

> The fragment identifier component of a URI allows indirect identification of a
  secondary resource by reference to a primary resource and additional
  identifying information.  The identified secondary resource may be some
  portion or subset of the primary resource, some view on representations of the
  primary resource, or some other resource defined or described by those
  representations.

The portion of the URI up to the '#' identifies the primary resource while the
fragment identifier (part that follows the '#') identifies secondary resources.
The secondary resource identifier is commonly used in dynamic web applications,
sometimes called AJAX applications, that maintain complex information in the
fragment identifier.

## Use of Primary and Secondary Resource Names

As stated in the [heuristics](heuristics.md) section:

> Web-based data presentations SHOULD have a name in the form of a URL such that
  any meaningfully different presentation may be bookmarked and shared, even if
  the presentation is via a single-page AJAX or similar application.

> User actions that change to different data presentation SHOULD modify the
  browser history to allow back/forward navigation. The full URL SHOULD be
  available for the user to copy and/or share outside the browser. This MAY be
  in the form of a "permalink" anchor on the page since cutting and pasting from
  the browser location bar is sometimes problematic.

## Resource Names in Chaise

The primary resource names in Chaise are:
- `chaise/search`: resource for searching within a catalog (aliased from `chaise`)
- `chaise/record`: resource for interacting with a record in the catalog
- `chaise/login`: resource for establishing a session

### Resource Naming in `chaise/search`

The `chaise/search` resource identifies secondary resources using the following
format.

```
SEARCH_URI := BASE_URI 'chaise/search' '#' CATALOG_ID '/' SCHEMA ':' TABLE '?' SEARCH_OPTION [ '&' SEARCH_OPTION ]*

BASE_URI := a standard HTTP URL ending in the base path to the 'chaise' resource

CATALOG_ID := a catalog identifier

SCHEMA := a schema name

TABLE := a table name

SEARCH_OPTIONS := 'facets' '=' PREDICATE [ '/' PREDICATE ]+ |
                  <TBD>

PREDICATE := ATTRIBUTE OP VALUE [',' VALUE]+

ATTRIBUTE := [SCHEMA] [':' TABLE] [':' COLUMN]

COLUMN := a column name

OP := '::eq::' | '::neq::' | '::gt::' | '::lt::' | other valid EMRrest operators

VALUE := URL encoded string literal

<TBD> := a placeholder for one or more parameters needed to represent the state
         of the UI beyond the basic parameters needed for faceting. These may
         include the current layout (list, card, table) etc.
```

Notes:
- In the `facets` search option, the list of predicates form a conjunction
  (i.e., a logical AND) separated by the '/' character.
- The right-hand side of a `PREDICATE` may be a single literal `VALUE` or a list
  of values separated by the `,` character. The meaning of the value list is a
  short-hand form of a disjunction that reuses the same `ATTRIBUTE` and `OP`.
  Thus `attr::eq::abc,def,ghi` means "attr equals abc or attr equals def or
  attr equals ghi".

At a minimum, all parameter values (id, schema, table, attribute, value, etc.)
would need to be URL encoded. But as long as no special characters are used in
them (such as spaces) the value will be unchanged and user-friendly.

Example Chaise Search URI:
```
https://.../path/to/chaise/search#5/xyz:experiments?facets=investigator::eq::'bill'/created::gt::'2015-04-20'
```

### Secondary Resource Naming in `chaise/detail`

The `chaise/detail` resource identifies secondary resources using the following
fragment identifier format.

```
Chaise URI := <primary resource identifier> '#' <secondary resource identifier>

<primary resource identifier> := https :// authority / path / to / chaise / detail

<secondary resource identifier> :=
    '#' catalog '=' <id> '&' entity '=' <schema>:<table> '&' <attribute> '=' <value> [ '&' <attribute> '=' <value> ]+
```

**TBD**:

1. Should we define interchangeable aliases like 'c' in place of the long form
   of "catalog" to make more compact

2. Should might want to make the fragment identifiers for `search` and `detail`
   more uniform where applicable.

3. We probably want to make these more similar with ERMrest.
