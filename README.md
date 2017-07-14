# Chaise [![Build Status](https://travis-ci.org/informatics-isi-edu/chaise.svg?branch=master)](https://travis-ci.org/informatics-isi-edu/chaise)
_Computer-human access interface with schema evolution!_

## Overview

Chaise is a model-driven web interface (more formally a [user agent]) for data
discovery, analysis, visualization, editing, sharing and collaboration over
tabular data (more specifically [relational data]) served up as [Web resources]
by the [ERMrest] service. Chaise dynamically renders relational data resources
based on a small set of baseline assumptions, combined with its rendering
[heuristics], and finally user preferences in order to support common user
interactions with the data. Chaise is developed in JavaScript, HTML, and CSS
which runs in most modern Web browsers. This includes Chrome 13 (or better),
Firefox 7 (or better), Internet Explorer 10 (or better including ME Edge), and
Safari 6 (or better). Chaise is the front-end component of the suite of tools
including [ERMrest], [Hatrac], and [IObox].

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

# Quick start guide

## Dependencies

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

* [Make](https://en.wikipedia.org/wiki/Make_%28software%29): usually present on any unix/linux/osx host.
* rsync: usually present on any unix/linux/osx host.
* [Node](https://nodejs.org/) version 6.x: Mac users, we recommend downloading
direct from the node site as we have seen problems with the version installed
by Homebrew.
* Additional dependencies specified in [package.json](./package.json) will be
automatically retrieved by NPM.

### Stop! Before going forward read this!

Before proceeding, first install ermrestjs. See [ermrestjs] for more
information. If you plan to run Chaise tests, you should first run the
ermrestjs tests, which will also instruct you to get shared dependencies needed
for testing Chaise.

## How to get Chaise

Get the source from its git repo.

```sh
$ git clone https://github.com/informatics-isi-edu/chaise.git
$ cd chaise
```

## How to deploy

### Set the deployment directory (optional)

Set `CHAISEDIR` to specify a target deployment location. By default, the
install target is `/var/www/html/chaise`. If this directory does not exist,
it will first create it. You may need to run `make install` with _super user_
privileges depending on the installation directory you choose.

### Deploy for production usage

This example is for **production** deployments or other deployments to the document root of a Web server. As noted above, this will install to `/var/www/html/chaise`.

```
# make install
```

### Deploy to a remote userdir

This example is how you would install the software on a remote server, for example a test server. Replacing `username` and `hostname` with real values.

```sh
$ export CHAISEDIR=username@hostname:public_html/chaise
$ make install
```

## How to configure

See the [configuration guide](./doc/configuration.md). For more information on how Chaise uses the ERMrest annotations see [the contexts guide](./doc/contexts.md).

## How to run

Once deployed the apps can be found at `http://<hostname>/chaise/<app>`, where `<app>` must be replaced with one of the app names (i.e., `search`, `recordset`).

**TODO**: We need to document how to use these apps because without additional details the bare app name without additional parameters is not sufficient.

## How to test

This section assumes you have already installed _and tested_ [ermrestjs]. If you have not, stop here and do that first, then return this step.

Before running the test cases you need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables. See [How to Get Your AUTH_COOKIE](https://github.com/informatics-isi-edu/chaise/wiki/E2E-tests-guide#how-to-get-your-auth_cookie).

The example here is based on the assumption that the tests are installed and executed against a deployment to a userdir.

```sh
export CHAISE_BASE_URL=https://HOST/~USERNAME/chaise
export ERMREST_URL=https://HOST/ermrest
export AUTH_COOKIE=YOUR_ERMREST_COOKIE
export REMOTE_CHAISE_DIR_PATH=USERNAME@HOST:public_html/chaise
export CHAISEDIR=$REMOTE_CHAISE_DIR_PATH # when testing on remote host these should be the same
```

Then run the tests (install, if you haven't already).

```sh
$ make install  # if not already installed
$ make test
```

Make will invoke `npm install` to download and install all additional
dependencies under the local `node_modules` directory relative to the project
directory.

For more information, see the [E2E tests guide](https://github.com/informatics-isi-edu/chaise/wiki/E2E-tests-guide).
