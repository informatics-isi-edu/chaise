# Chaise [![Build Status](https://travis-ci.org/informatics-isi-edu/chaise.svg?branch=master)](https://travis-ci.org/informatics-isi-edu/chaise)
_Computer-human access interface with schema evolution!_

## Introduction

Chaise is a model-driven web interface (more formally a [user agent]) for data
discovery, analysis, visualization, editing, sharing and collaboration over
tabular data (more specifically [relational data]) served up as [Web resources]
by the [ERMrest] service. Chaise dynamically renders relational data resources
based on a small set of baseline assumptions, combined with its rendering
[heuristics], and finally user preferences in order to support common user
interactions with the data. Chaise is developed in JavaScript, HTML, CSS, and
runs in most modern Web browsers. It is the front-end component of the suite of
tools including [ERMrest], [Hatrac], and [IObox].

[heuristics]: https://en.wikipedia.org/wiki/Heuristic_%28computer_science%29
[relational data]: https://en.wikipedia.org/wiki/Relational_database
[user agent]: https://en.wikipedia.org/wiki/User_agent
[Web resources]: https://en.wikipedia.org/wiki/Web_resource
[ERMrest]: https://github.com/informatics-isi-edu/ermrest
[Hatrac]: https://github.com/informatics-isi-edu/hatrac
[IObox]: https://github.com/informatics-isi-edu/iobox

## Dynamic Rendering Approach

Chaise is intended to support specific user interactions, as briefly introduced
above (e.g., discovery, analysis, editing, etc.). As such, its presentation
capabilities are narrowly scoped to support these interactions. Thus, Chaise
makes a few assumptions about how users will interact with the underlying
data.

A few representative but non-exhaustive examples of these assumptions include:
- search, explore, and browse collections of data
- navigate from one data record to the next by following their
  relationships (i.e., following links)
- add, edit, remove data records from the database
- create, alter, or extend the data model itself
- subset and export data collections
- share data with other users
- annotate data records with [tags] or [controlled vocabulary] terms

[tags]: https://en.wikipedia.org/wiki/Tag_(metadata)
[controlled vocabulary]: https://en.wikipedia.org/wiki/Controlled_vocabulary
[data model]: https://en.wikipedia.org/wiki/Data_model
[denormalized]: https://en.wikipedia.org/wiki/Denormalization

Beyond these baseline assumptions about basic usage, Chaise makes almost no
assumptions about the structure of the underlying [data model], such as its
tables, columns, keys, foreign key relationships, etc. Chaise begins by
introspecting the data model by getting the `catalog/N/schema` resource from
[ERMrest]. The schema resource includes lightweight semantic annotations about
the model in addition to the underlying relational database schema. Chaise uses
its rending heuristics to decide, for instance, how to flatten a hierarchical
structure into a simplified (or [denormalized]) presentation for searching and
viewing. The schema annotations are then used to modify or override its
rendering heuristics, for instance, to hide a column of a table or to use a
specific display name in the interface that is different than the column name
from the table definition of the schema. Chaise then applies user preferences
to further override the rendering decisions and annotations, for instance, to
present a nested table of data in a transposed layout (i.e., with the columns
and rows flipped).

See the [heuristics guide](./doc/heuristics.md) for more information.

## Chaise Apps and their Contexts

|              | compact         | compact/brief | detailed        | entry | entry/edit | entry/create | filter | name | * |
|--------------|-----------------|---------------|-----------------|-------|------------|--------------|--------|------|---|
| [recordset](https://github.com/informatics-isi-edu/chaise/blob/master/recordset/readme.md)    | Pertains to the data that loads inside the recordset table       | -             | -        | -     | -          | -            | -      | -    | - |
| [record](https://github.com/informatics-isi-edu/chaise/blob/master/record/readme.md)   | General case that is used if `compact/brief` is not defined.       | Pertains to the data inside the related tables that are loaded after the record. Inherits from `compact` if not defined.             | Pertains to the record itself and the way that the record data will be displayed on the page.         | -     | -          | -            | -      | -    | - |
| [recordedit](https://github.com/informatics-isi-edu/chaise/blob/master/recordedit/readme.md)   | -       | -             | -        | General case that is used during creation if  `entry/create` is not defined and used for editing if `entry/edit` is not defined.    | Modifies the form that shows for editing. Inherits from `entry` if not defined.          | Modifies the form that shows for creation. Inherits from `entry` if not defined.            | -      | -    | - |
| [viewer](https://github.com/informatics-isi-edu/chaise/blob/master/viewer/readme.md)       | -       | -             | -        | -     | -          | -            | -      | -    | - |

More information about what each context does for each app can be found in that app's readme.md file.

## Quick Start Guide
### Runtime Dependencies

Chaise depends on the following server- and client-side software.

- **Relational data resources**: Chaise is intended to be deployed in an
  environment that includes the [ERMrest] service for exposing tabular
  (relational) data as Web resources.
- **Web server**: Chaise can be hosted on any HTTP web server. Most likely you
  will want to deploy the app on the same host as [ERMrest]. If it is deployed
  on a separate host, you will need to enable [CORS] on the web server on which
  ERMrest is deployed.
- **Client-side JavaScript Libraries**: [AngularJS] and other client-side
  JavaScript runtime dependencies are bundled in `scripts/vendors` in this
  repository.
- **ERMrestJS**: [ermrestjs] is a client library for [ERMrest]. It must be
  deployed to the same base directory as Chaise. If Chaise is deployed to
  `/path/to/chaise` then ermrestjs must be installed in `/path/to/ermrestjs`.

[ermrestjs]: https://github.com/informatics-isi-edu/ermrestjs
[AngularJS]: https://angularjs.org
[CORS]: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing "Cross-origin resource sharing"

### Development Dependencies

Development dependencies include:

* [Make](https://en.wikipedia.org/wiki/Make_%28software%29)
* [Node](https://nodejs.org/)
* Additional dependencies specified in [package.json](./package.json)

### How to Install

Get the source and run `make`. See `make help` for information on alternative
make targets.

```sh
git clone https://github.com/informatics-isi-edu/chaise.git
cd chaise
sudo make install
```

Make will invoke `npm install` to download and install all additional
dependencies under the local `node_modules` directory relative to the project
directory.


### How to Deploy

To generate HTML and minimal stuff to deploy Chaise you need to run

```sh
make all
```

After running (above), copy to your host (i.e., `/var/www/path/to/chaise`).

### How to Configure

See the [configuration guide](./doc/configuration.md).

### How to Run

Point a modern web browser at `http://<hostname>/path/to/chaise/search`.

### How to run E2E (End to End) Test

Before running the tests, you'll need a [Sauce Labs](https://saucelabs.com/)
account (free for open source projects). Configure your Sauce Labs credentials
in a terminal:

```sh
export SAUCE_USERNAME=YOUR_USERNAME
export SAUCE_ACCESS_KEY=YOUR_ACCESS_KEY
```

Set a base URL for the Protractor tests (i.e. the path to your Chaise and Ermrest installation):

```sh
export CHAISE_BASE_URL=http://<hostname>/path/to/chaise
export ERMREST_URL=https://<hostname>/path/to/ermrest
```

Set the authCookie used for generating data for testcases.

```sh
export AUTH_COOKIE=<YourERMRest_cookie>
```

Then run `make test`.

For more info on how to configure and run E2E Tests refere following [link](https://github.com/informatics-isi-edu/chaise/wiki/E2E-tests-guide)

### How to run Unit Tests

Chaise uses `Karma` to run Unit tests. To run these tests you'll need to install karma-cli globally.

```sh
sudo npm install karma-cli -g
```

To run all unit test run following command from your terminal.

```sh
karma start
```

For more info on how to configure and run Unit Tests refer following [link](https://github.com/informatics-isi-edu/chaise/wiki/Unit-Test-Guide)

### How to run all tests

To run E2E as well as Unit tests, invoke following make command

```sh
make testall
```
