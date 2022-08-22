# Installation

## Dependencies

### Runtime Dependencies

Chaise depends on the following server- and client-side software.

- **Relational data resources**: Chaise is intended to be deployed in an environment that includes the [ERMrest] service for exposing tabular (relational) data as Web resources.
- **Web server**: Chaise can be hosted on any HTTP web server. Most likely you
  will want to deploy the app on the same host as [ERMrest]. If it is deployed
  on a separate host, you will need to enable [CORS] on the web server on which
  ERMrest is deployed.
- **ERMrestJS**: [ERMrestJS] is a client library for [ERMrest]. This library must be properly installed before installing Chaise. For more information about installing ermrestjs please refer to its installation document.
- **openseadragon-viewer**: Chaise uses [openseadragon-viewer] as part of the viewer app. If viewer app is not useful to your deployment, you don't need this. For more information about viewer app please refer to [this document](../viewer/viewer-app.md).

[ERMrest]: https://github.com/informatics-isi-edu/ermrest
[ERMrestJS]: https://github.com/informatics-isi-edu/ermrestjs
[CORS]: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing "Cross-origin resource sharing"
[openseadragon-viewer]: https://github.com/informatics-isi-edu/openseadragon-viewer

### Development Dependencies

Development dependencies include:

* [Make](https://en.wikipedia.org/wiki/Make_%28software%29): usually present on any Unix systems.
* [Rsync](https://en.wikipedia.org/wiki/Rsync): usually present on any Unix systems.
* [Node](https://nodejs.org/): usually present on any Unix systems. For development environments we recommends installing [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) which will allow you to easily install and switch between different versions.
* Additional dependencies specified in [package.json](./package.json) will be automatically retrieved by NPM.


### Stop! Before going forward read this!

Before proceeding, first install ERMrestJS. See [ERMrestJS](https://github.com/informatics-isi-edu/ermrestjs) for more
information. If you plan to run Chaise tests, you should first run the
ERMrestJS tests, which will also instruct you to get shared dependencies needed for testing Chaise.

## Deploying

1. First you need to setup some environment variables to tell Chaise where it should install the package. The following are the variables and their default values:

    ```sh
    WEB_URL_ROOT=/
    WEB_INSTALL_ROOT=/var/www/html/
    CHAISE_REL_PATH=chaise/
    ```
    Which means Chaise build folder will be copied to `/var/www/html/chaise/` location by default. And the URL path of Chaise is `/chaise/`. If that is not the case in your deployment, you should modify the variables accordingly.

    Notes:
    - All the variables MUST have a trailing `/`.

    - If you're deploying remotely, since we're using the `WEB_INSTALL_ROOT` in `rsync` command, you can use a remote location `username@host:public_html/` for this variable.

    - A very silly thing to do would be to set your deployment directory to root `/` and run `make deploy` with `sudo`. This would be very silly indeed, and would probably result in some corruption of your operating system. Surely, no one would ever do this. But, in the off chance that one might attempt such silliness, the `make deploy` rule specifies a `dont_deploy_in_root` prerequisite that attempts to put a stop to any such silliness before it goes too far.

2. Build the Chaise bundles by running the following command:

    ```sh
    make dist
    ```

    Notes:
    - Make sure to run this command with the owner of the current folder. If you attempt to run this with a different user, it will complain.


3. To deploy the package, run the following:

    ```sh
    make deploy
    ```

    Notes:
      - Before bundling and deploying Chaise packages, this command will install the node modules. You can also use alternative commands to modify this behavior. For more information please refer to the [developer guide](../dev-docs/dev-guide.md#building-and-installation).
      - If the given directory does not exist, it will first create it. So you may need to run `make deploy` with _super user_ privileges depending on the installation directory you choose.

## Configuration

See the [configuration guide](chaise-config.md).

## Running

Once deployed the apps can be found at `http://<hostname>/chaise/<app>`, where `<app>` must be replaced with one of the app names (i.e., `search`, `recordset`).

<!-- **TODO**: We need to document how to use these apps because without additional details the bare app name without additional parameters is not sufficient. -->

## Testing

Please refer to he [E2E tests guide](../dev-docs/e2e-test.md).
