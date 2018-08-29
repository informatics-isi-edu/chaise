# Installing

## Installing ERMrestJS first

Before proceeding, first [install ERMrestJS](../ermrestjs/). If you plan to run Chaise tests, you should first run the ERMrestJS tests, which will also instruct you to get shared dependencies needed for testing Chaise.

## Cloning the Chaise repo

Get the source from its Git repo.

```sh
$ git clone https://github.com/informatics-isi-edu/chaise.git
$ cd chaise
```

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

## Configuring

See the [configuration guide](user-docs/chaise-config.md).

## Running Chaise

Once deployed, the apps can be found at `http://<hostname>/chaise/<app>`, where `<app>` must be replaced with one of the app names (i.e., `search`, `recordset`).

**TODO**: We need to document how to use these apps because without additional details the bare app name without additional parameters is not sufficient.

## How to test

This section assumes you have already installed _and tested_ [ERMrestJS](../ermrestjs/). If you have not, stop here and do that first, then return this step.

Before running the test cases you need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables. See [How to Get Your AUTH_COOKIE](dev-docs/e2e-test.md#how-to-get-your-auth_cookie).

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

For more information, see the [E2E tests guide](dev-docs/e2e-test.md).
