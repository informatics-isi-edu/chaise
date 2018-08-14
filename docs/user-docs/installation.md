# Installation

## Dependencies

### Runtime Dependencies

Chaise depends on the following server- and client-side software.

- **Relational data resources**: Chaise is intended to be deployed in an
  environment that includes the [ERMrest] service for exposing tabular (relational) data as Web resources.
- **Web server**: Chaise can be hosted on any HTTP web server. Most likely you
  will want to deploy the app on the same host as [ERMrest]. If it is deployed
  on a separate host, you will need to enable [CORS] on the web server on which
  ERMrest is deployed.
- **Client-side JavaScript Libraries**: [AngularJS] and other client-side
  JavaScript runtime dependencies are bundled in `scripts/vendors` in this repository.
- **ERMrestJS**: ERMrestJS is a client library for [ERMrest]. It must be
  deployed to the same base directory as Chaise. If Chaise is deployed to
  `/path/to/chaise` then ERMrestJS must be installed in `/path/to/ermrestjs`.

[ERMrestJS]: https://github.com/informatics-isi-edu/ermrestjs
[AngularJS]: https://angularjs.org
[CORS]: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing "Cross-origin resource sharing"

### Development Dependencies

Development dependencies include:

* [Make](https://en.wikipedia.org/wiki/Make_%28software%29): usually present on any unix/linux/osx host.
* [Rsync](https://en.wikipedia.org/wiki/Rsync): usually present on any unix/linux/osx host.
* [Node](https://nodejs.org/) version 6.x: Mac users, we recommend downloading
direct from the node site as we have seen problems with the version installed
by Homebrew.
* Additional dependencies specified in [package.json](./package.json) will be
automatically retrieved by NPM.

### Stop! Before going forward read this!

Before proceeding, first install ERMrestJS. See [ERMrestJS](https://github.com/informatics-isi-edu/ermrestjs) for more
information. If you plan to run Chaise tests, you should first run the
ERMrestJS tests, which will also instruct you to get shared dependencies needed for testing Chaise.

## Deploying

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

**Important** For production usage, we strongly recommend that Chaise only be installed in `/var/www/html/chaise`. This is the only configuration that we actively support.

### Deploy to a remote userdir

This example is how you would install the software on a remote server, for example a test server. Replacing `username` and `hostname` with real values.

```sh
$ export CHAISEDIR=username@hostname:public_html/chaise
$ make install
```

## Configuration

See the [configuration guide](chaise-config.md).

## Running

Once deployed the apps can be found at `http://<hostname>/chaise/<app>`, where `<app>` must be replaced with one of the app names (i.e., `search`, `recordset`).

**TODO**: We need to document how to use these apps because without additional details the bare app name without additional parameters is not sufficient.

## Testing

This section assumes you have already installed _and tested_ [ERMrestJS](https://github.com/informatics-isi-edu/ermrestjs). If you have not, stop here and do that first, then return this step.

Before running the test cases you need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables. See [How to Get Your AUTH_COOKIE](../dev-docs/e2e-test.md#how-to-get-your-auth_cookie).

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

For more information, see the [E2E tests guide](../dev-docs/e2e-test.md).
