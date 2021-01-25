# Image viewer

Chaise 2D image viewer utilizes [OpenSeadragon](https://openseadragon.github.io/) to provide support for:

- **Greyscale and RGB images**. If an image is marked
as greyscale, data-modelers can define a default _pseudo color_ that will be used
to properly add color to the image. Users have the ability to change that color
using the appropriate channel UI.
- **Single or multiple channel images**. In case of multi-channel images, viewer app 
  will blend the images together. Users have the ability to toggle images and manipulate
  the blending.
- **Image annotations** that overlay on top of main images. If data-modelers have 
  properly configured the application, viewer app will fetch and display the annotations. 
  Users have the ability to edit, delete, or create new annotation.
- (_not implemented_) **Multi-z images**. If data-modelers have properly configured the application,
  viewer app provides a mechanism to navigate through the z-plane to
  display the images with different z-indices.
- **IIIF, DZI, and other browser compatible images**. Viewer app uses the location
of the images to find the appropriate mechanism in order to fetch the image based on their types.
In case of IIIF images, the proper image API will be used for fetching the tile images,
while DZI relies on precomputed tile images to be present in the file system.


## Table of contents

- [Dependencies](#dependencies)
- [Deploying](#deploying)
- [How it works](#how-it-works)
  * [Query parameters](#query-parameters)
  * [Configuration](#configuration)
- [Testing](#testing)

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

Chaise viewer app uses ERMrest to fetch the proper metadata and utilizes
openseadragon-viewer to render the fetched imaging metadata, and provide UI tools 
so users can interact with the image. To use openseadragon-viewer, viewer
app must provide some parameters. The following are different sources for deriving 
these parameters:

- URL query parameters that are passed to viewer app. URL query parameters have
  priority over other ways of providing parameters, and override the behavior.

- Metadata stored in ERMrest. For more information about how the database
  model works and can be configured please refer to [configuration  document](viewer-config.md).


### Query parameters

Different browsers have different rules about the length limitation of query parameters.
Users can also manipulate the query parameters. So we generally advise against 
usage of query parameters. Although, in some cases query parameters are the 
most convenient way to use viewer app. For example:
- The required model and metadata are not defined in the database and you just
  want to show an image without the extra features
  (Refer to [viewer-config.js documentation](viewer-config.md) for more information
  about the required model structure.)
- You want to override the default behavior and show only a small set of images or annotations. For example, 
  assume in the database the image has multiple annotations and you just want to 
  show that one specific annotation in a record page. You can provide an iframe 
  with a query parameter that specifies the annotation url. 
- For debugging or testing.
- Modifying the default value of a general parameter.

Query parameters will be passed without any modification to the openseadragon-viewer.
So you can use any of the parameters that are defined in the
[openseadragon-viewer usage document](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/master/docs/user-docs/usage.md). There are two categories of parameteres:

<!-- TODO add links to each section -->

- [**Channel parameters**](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/master/docs/user-docs/usage.md#channel-parameters): these parameters provide information about the image channel.
  The main channel parameter is `url`. The value of this parameter must be the location
  of the image file (`info.json`, `ImageProperties.xml`, etc) and if present, we will
  ignore the data stored in database.

- [**General parameters**](https://github.com/informatics-isi-edu/openseadragon-viewer/blob/master/docs/user-docs/usage.md#general-parameters): parameters that will not affect the actual displayed image data,
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
