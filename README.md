# Chaise

[Chaise](https://github.com/informatics-isi-edu/chaise) is a Web UI for the
[ERMrest](https://github.com/informatics-isi-edu/ermrest) service.

## Runtime Dependencies

Everything needed is included in this package. Third party dependencies have
been bundled under `scripts/vendors`.

The app can be hosted on any HTTP web server. Most likely you will want to
deploy the app on the same host as *ERMrest*. If it is deployed on a separate
host, you will need to enable *CORS* on the web server on which *ERMrest*
is deployed.

## Development Dependencies

To run the build script you will need:

* Node (See [nodejs](https://nodejs.org/))
* Make (i.e., `make`, `gmake`, etc.)

All other dependencies are described in the *Node* `package.json` file.

# Build

Get the source and use the `Makefile`. See `make help` for information on
alternative *make targets*.

```sh
git clone https://github.com/informatics-isi-edu/chaise.git
cd chaise
make all
```

# Install

After building (above), copy to your host (i.e., `/var/www/chaise`).

# Launch

In a browser enter this URL and replace `<hostname>`.

```
http://<hostname>/chaise/app.html
```
