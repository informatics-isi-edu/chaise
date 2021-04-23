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
- **ERMrestJS**: [ERMrestJS] is a client library for [ERMrest]. This library must be properly installed before installing Chaise. For more information about installing ermrestjs please refer to its installation document.

[ERMrest]: https://github.com/informatics-isi-edu/ermrest
[ERMrestJS]: https://github.com/informatics-isi-edu/ermrestjs
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

1. First you need to setup some environment variables to tell Chaise where it should install the package. The following are the variables and their default values:

    ```
    WEB_URL_ROOT=/
    WEB_INSTALL_ROOT=/var/www/html/
    CHAISE_REL_PATH=chaise/
    ```
    Which means Chaise build folder will be copied to `/var/www/html/chaise/` location by default. And the URL path of Chaise is `/chaise/`. If that is not the case in your deployment, you should modify the variables accordingly.

    Notes:
    - All the variables MUST have a trailing `/`.

    - If you're installing remotely, since we're using the `WEB_INSTALL_ROOT` in `rsync` command, you can use a remote location `username@host:public_html/` for this variable.

    - A very silly thing to do would be to set your deployment directory to root `/` and run `make install` with `sudo`. This would be very silly indeed, and would probably result in some corruption of your operating system. Surely, no one would ever do this. But, in the off chance that one might attempt such silliness, the `make install` rule specifies a `dont_install_in_root` prerequisite that attempts to put a stop to any such silliness before it goes too far.

2. After making sure the variables are properly set, run the following command:

    ```
    $ make install
    ```

    Notes:
      - If the given directory does not exist, it will first create it. So you may need to run `make install` with _super user_ privileges depending on the installation directory you choose.

## Configuration

See the [configuration guide](chaise-config.md).

## Running

Once deployed the apps can be found at `http://<hostname>/chaise/<app>`, where `<app>` must be replaced with one of the app names (i.e., `search`, `recordset`).

<!-- **TODO**: We need to document how to use these apps because without additional details the bare app name without additional parameters is not sufficient. -->

## Testing

This section assumes you have already installed _and tested_ [ERMrestJS](https://github.com/informatics-isi-edu/ermrestjs). If you have not, stop here and do that first, then return this step.

Before running the test cases you need to set `ERMREST_URL`, `CHAISE_BASE_URL`, `AUTH_COOKIE`, `RESTRICTED_AUTH_COOKIE`, and `REMOTE_CHAISE_DIR_PATH` environment variables. See [How to Get Your AUTH_COOKIE](../dev-docs/e2e-test.md#how-to-get-your-auth-cookie).

The example here is based on the assumption that the tests are installed and executed against a deployment to a userdir.

```sh
export CHAISE_BASE_URL=https://HOST/~USERNAME/chaise
export ERMREST_URL=https://HOST/ermrest
export AUTH_COOKIE=YOUR_WEBAUTHN_COOKIE
export RESTRICTED_AUTH_COOKIE=YOUR_SECOND_USER_ERMREST_COOKIE
export REMOTE_CHAISE_DIR_PATH=USERNAME@HOST:public_html/chaise
```

Then run the tests (install, if you haven't already).

```sh
$ make install  # if not already installed
$ npm install # if npm dependencies not already installed
$ make test
```

For more information, see the [E2E tests guide](../dev-docs/e2e-test.md).
