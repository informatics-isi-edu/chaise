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

 The fragment identifier component of a URI allows indirect identification of a
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

 Web-based data presentations SHOULD have a name in the form of a URL such that
 any meaningfully different presentation may be bookmarked and shared, even if
 the presentation is via a single-page AJAX or similar application.

 User actions that change to different data presentation SHOULD modify the
 browser history to allow back/forward navigation. The full URL SHOULD be
 available for the user to copy and/or share outside the browser. This MAY be
 in the form of a "permalink" anchor on the page since cutting and pasting from
 the browser location bar is sometimes problematic.

## Resource Names in Chaise

The primary resource names in Chaise are:
- `chaise/search`: the search interface
- `chaise`: top level redirect to `chaise/search`, effectively an alias
- `chaise/detail`: the entity detail interface (TBD: should this be called browse?)
- `chaise/login`: the login form
- `chaise/logout`: the logout form

### Secondary Resource Naming in `chaise/search`

The `chaise/search` resource identifies secondary resources using the following
fragment identifier format.

```
Chaise URI := <primary resource identifier> '#' <secondary resource identifier>

<primary resource identifier> := https :// authority / path / to / chaise / search

<secondary resource identifier> :=
    '#' catalog '=' <id> '&' entity '=' <schema>:<table> '&' facets '=' '(' <predicates> ) '&' <TBD>

<predicates> := <predicate> [ '/' <predicate> ]+

<predicate> := <facet> <op> <values>

<value> := <value> [ ',' <value> ]+
```

and where:

- `id`: the catalog id
- `schema:table`: the qualified table name that is the target of the faceting
- `facet`: the qualified `schema:table:column` name used in the faceting
  predicate (TODO: there are known issues with this method of referencing a
  column for the purpose of faceting)
- `op`: the operator in predicate should match those used in ERMrest predicates
- `value`: the value of the predicate must be a literal (should follow ERMrest
   as well unless there are issue with encoding)
- `TBD`: a placeholder for one or more parameters needed to represent the state
  of the UI beyond the basic parameters needed for faceting. These may include
  the current layout (list, card, table) etc.

At a minimum, all parameter values (id, schema, table, attribute, value, etc.)
would need to be URL encoded. But as long as no special characters are used in
them (such as spaces) the value will be unchanged and user-friendly.

The `<predicates>` is a conjunction of clauses where each clause is separated
by a `/` character as used in ERMrest. The `<values>` is a disjunction of
`<value>`s where each value is separate by a `,` character.

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

