# Image viewer

In this section you can find all the information related to 2D image viewer application.

## Table of contents

- [Features](#features)
- [Dependencies](#dependencies)
- [Deploying](#deploying)
- [How it works](#how-it-works)
  * [Query parameters](#query-parameters)
  * [Configuration](#configuration)
- [Testing](#testing)

## Features

The viewer app is capable of:
- Displaying one or more images by blending them together. We call each image a
__channel__. So a view with multiple image is referred to as a __multi-channel__ view.
- (_not implemented_) Offering a multi-z view for the images that have
the proper z-plane data. Users can navigate from one z-index to another if they choose to.
- Allowing the manipulation of color for the greyscale channels. If an image is marked
as greyscale, data-modelers can define a default __pseudo color__ that will be used
to properly add color to the image. Users have the ability to change that color
using the appropriate channel UI.
- Adding overlay on top of images. We call these overlays __image annotations__.
If data-modelers have properly configured the application, viewer app will fetch
and display the annotations. Users have the ability to edit, delete, or create new annotation.

## Dependencies

Apart from [other chaise dependencies](installation.md#dependencies), viewer app
depends on the [openseadragon-viewer](https://github.com/informatics-isi-edu/openseadragon-viewer) as well.


## Deploying

You need to deploy both chaise and openseadragon-viewer to make sure viewer app is properly installed. The following are the steps to install both packages:

1. First you need to setup some environment variables. The following are the variables and their default values,

    ```
    WEB_URL_ROOT=/
    WEB_INSTALL_ROOT=/var/www/html/
    CHAISE_REL_PATH=chaise/
    OSD_VIEWER_REL_PATH=openseadragon-viewer/
    ```
    > - All the variables MUST have a trailing `/`.
    > - If you're installing remotely, since we're using the `WEB_INSTALL_ROOT`
    in `rsync` command, you can use a remote location `username@host:public_html/`
    for this variable.

    Which means,

      - Chaise build folder will be copied to `/var/www/html/chaise/` location.
      - The URL path to access Chaise is `/chaise/`.
      - openseadragon-viewer build folder will be copied to `/var/www/html/openseadragon-viewer/` location.
      - The URL path to access openseadragon-viewer is `/openseadragon-viewer/`.

    If that is not the case in your deployment, you should modify the variables accordingly.


2. Clone the openseadragon-viewer repository,
    ```
    $ git clone git@github.com:informatics-isi-edu/openseadragon-viewer.git
    ```

3. Run the following command in the openseadragon-viewer folder
   (make sure to run this in the openseadragon-viewer folder),
    ```
    $ make install
    ```

3. Make sure Chaise is properly installed by calling the following command under Chaise
  (make sure to run this in the Chaise folder),
    ```
    $ make install
    ```

## How it works

Chaise viewer app is a user-friendly interface to openseadragon-viewer.  In the end,
Chaise must provide the appropriate parameters to that application. Chaise derives
the list of parameters from the following sources:

- URL query parameters that are passed to the viewer app. URL query parameters are
  mainly used to ignore what's stored in the database.

- The stored data in the database. For more information about how the database
  model works and can be configured please refer to [configuration  document](viewer-config.md).


### Query parameters

As it was mentioned, query parameters are used to avoid sending queries to database.
You should only use query parameters in either of these cases:
- The required model and data are not defined in the database
  (Refer to [viewer-config.js documentation](viewer-config.md) for more information
  about the required model structure).
- You want to show only a small set of images or annotations.
- For debugging or testing.
- Modifying the default value of a parameter.

Query parameters will be passed without any modification to the openseadragon-viewer.
So you can use any of the parameters that are defined in the
[openseadragon-viewer usage document](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/master/docs/user-docs/usage.md). There are two categories of parameteres:

- **Channel parameters**: these parameters provide information about the image channel.
  The main channel parameter is `url`. The value of this parameter must be the location
  of the image file (`info.json`, `ImageProperties.xml`, etc) and if present, we will
  ignore the data stored in database.

- **General parameters**: parameters that will not affect the actual displayed image data,
  and will modify other parts of the page. These parameters can be used in conjunction
  of image data stored in the database.

> The actual image (channel) information will only come from either the query parameter or database. If the image channel `url` is passed, we will not fetch the image related data from database. Other non-channel-related query parameters might be coming either sources and will be merged together (query parameter has priority.)

The following are some examples of query parameters:

1. Displaying a greyscale IIIF image with a customized channel name and color:

    ```
    https://server.com/chaise/viewer/#1/schema:table/RID=val?url=/path/to/info.json&channelName=Leica%2FALEXA%20488&pseudoColor=%23ff00ff
    ```
2. Displaying a DZI multi-channel image
    ```
    https://server.com/chaise/viewer/#1/schema:table/RID=val?url=/first/path/to/ImageProperties.xml&url=/second/path/to/ImageProperties.xml
    ```

3. Changing the watermark and meterScaleInPixels

    ```
    https://server.com/chaise/viewer/#1/schema:table/RID=val?waterMark=example.com&meterScaleInPixels=14000
    ```


### Configuration

Viewer app works under a set of assumptions. Most of the assumptions
can be configured and modified by using the `viewer-config.js` file.
For more information please refer to [configuration document](viewer-config.md).

## Testing

Viewer app features are tested manually. For more information please refer to the
[Viewer regression tests wiki page](https://github.com/informatics-isi-edu/chaise/wiki/Viewer-regression-tests).
