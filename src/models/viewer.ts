import { LogObjectType } from '@isrd-isi-edu/chaise/src/models/log';

export type ViewerProps = {
  parentContainer?: HTMLElement;
  queryParams: any;
  reference: any;
  /* The log related APIs */
  logInfo: {
    /* the object that will be logged with the first request */
    logObject?: LogObjectType;
    logStack: any;
    logStackPath: string;
  }
}

export type ViewerConfig = {
  [name: string]: ViewerConfigProps;
}

export type ViewerConfigProps = {
  image: {
    /**
     * the z-index of displayed main image. if the z-plane image doesnt change,
     * this value will be used for fetching and storing the annotations.
     */
    default_z_index_column_name?: string,

    /**
     * the column that has the pixel per meter value. If value is defined,
     * it will be passed without any modifications to openseadragon-viewer
     */
    pixel_per_meter_column_name?: string,

    /**
     * The following watermark attributes are used for the watermark
     * displayed in the screenshot feature.
     */

    /**
     * if the watermark is defined in the same table, use this attribute
     * if empty, we will not use it
     */
    watermark_column_name?: string,

    /**
     * if the watermakr is defined in another table that has fk to image,
     * use the following attribute
     * TODO: need a better way to specify better foreignkey path
     */
    watermark_foreign_key_visible_column_name?: string,
    watermark_foreign_key_data_column_name?: string,

    /**
     * what should be displayed in the head title (the browser tab)
     */
    head_title_markdown_pattern?: string,

    /**
     * what should be displayed in the page title in full screen mode (non-iframe)
     */
    page_title_markdown_pattern?: string,

    /**
     * @DEPRECATED This is here for just backward compatibilty and should not be used.
     * if defined and value is none-empty, we will not send any extra request for image channel info
     * and use the value stored in this column.
     *
     * As a hack, if the stored value has query parameters, we will only
     * use the query parameters. Otherwise it will use the stored value as is.
     */
    legacy_osd_url_column_name?: string,
  },
  /**
   * the table that stores each individual image for each channel in each z
   */
  processed_image: {
    /**
     * schema of procesed image table
     */
    schema_name: string,
    /**
     * procesed image table
     */
    table_name: string,

    /**
     * the channel number column
     */
    channel_number_column_name: string,

    /**
     * how to sort the processed_image records
     */
    column_order?: {
      column: string,
      descending?: boolean
    }[],

    /**
     * where to filter based on z_index
     */
    z_index_column_name?: string,

    /**
     * where to filter based on the image
     */
    reference_image_column_name: string,

    /**
     * The following attributes will help chaise to generate a url
     * that OSD can understand to be able to locate the images.
     *
     * - `image_url_column_name`: where the pyremidical image is stored.
     * - The display method (`iiif`, `dzi`, etc) should correspond to the keys defined in `image_url_pattern`s.
     * - `iiif_version`: The version of iiif server that should be used (default is 2)
     * - `image_url_pattern`: the url_pattern to transform the value of `image_url_column_name` into something
     *    that OSD understands. in the `image_url_pattern` you have access to two variables:
     *    - `iiif_version`: the IIIF version number defined (default is 2)
     *    - `_url`: the raw value of `image_url_column_name`.
     *    - `url`: the formatted value of `image_url_column_name`: if its relative, chaise will prepend current hostname to it
     *
     * Notes:
     * - If `image_url_pattern` is not defined for a specific display method,
     *   the value of `image_url_column_name` column will be used without any transformation.
     * - In the current use case,
     *   - iiif: the hatrac location of pyremidical images are stored
     *     in `image_url_column_name`, and the pattern attribute would allow us
     *     to convert a hatrac url into a url that OSD can use to fetch the images.
     *   - dzi: the location of `ImageProperties.xml` is stored in
     *    `image_url_column_name` column and transformation is not needed.
     *   - other types (jpeg): The location of image is stored in
     *    `image_url_column_name` column and transformation is not needed.
     */
    image_url_column_name: string,
    display_method_column_name?: string,
    iiif_version?: string | number,
    image_url_pattern?: { [display_method: string]: string }
  },
  /**
   * the table that stores the channel data
   */
  image_channel: {
    // channel table
    schema_name: string,
    table_name: string,

    // the sort criteria
    column_order?: {
      column: string,
      descending?: boolean
    }[],

    /**
     * the fk column to image
     */
    reference_image_column_name: string,

    /**
     * the channelName column
     */
    channel_name_column_name: string,

    /**
     * the channelNumber column
     */
    channel_number_column_name: string,

    /**
     * the pseudoColor column (the value must be in color hex format)
     */
    pseudo_color_column_name: string,

    /**
     * a boolean column that signals whether the image is greyscale or rgb
     */
    is_rgb_column_name: string,

    /**
     * a jsonb column that holds the settings for the channel
     */
    channel_config_column_name: string,
    /**
     * the format version that should be used (default is 1.0)
     */
    channel_config_format_version?: string,

    /**
     * @DEPRECATED This is here for just backward compatibilty and should not be used.
     * the actual location of image file (info.json, ImageProperties.xml, etc)
     */
    image_url_column_name?: string
  },
  /**
   * the table that stores the annotation data
   */
  image_annotation: {
    // annotation table
    schema_name: string,
    table_name: string,

    // fk to image table in annotation table
    /**
     * TODO: need a better way to specify better foreignkey path
     * to find the visible column name, navigate to record page and find the
     * foreignkey pseudo-column to the image table.
     * in the HTML source code, find the tr containing the column.
     * the visible column name is used in id attribute with the following format:
     * id=row-<visible-column-name>
     */
    reference_image_visible_column_name: string,
    reference_image_column_name: string,

    /**
     * the asset column that has the annotation
     */
    overlay_column_name: string,
    /**
     * This attribute is only needed if youre planning on passing
     * annotation urls as query parameters. In this case, this path
     * is used to distinguish between annotation and image urls in the
     * `url` query parameter.
     */
    overlay_hatrac_path: string,

    /**
     * the columns that are used internally and should be removed from the entry form
     * TODO should be improved
     */
    z_index_column_name: string,
    channels_column_name: string,

    /**
     * annoated term fk in annotation table
     * This information is used to ensure the combination of image, annotated_term, z_index are unique
     */
    annotated_term_displayname: string,
    annotated_term_column_name: string,
    /**
     * TODO: need a better way to specify better foreignkey path
     * to find the visible column name, navigate to record page and find the
     * foreignkey pseudo-column to the annotated term table.
     * in the HTML source code, find the tr containing the column.
     * the visible column name is used in id attribute with the following format:
     * id=row-<visible-column-name>
     *
     * the fk must be based on either be to annotated_term_id_column_name or annotated_term_name_column_name
     */
    annotated_term_visible_column_name: string,
    annotated_term_foreign_key_constraint: [string | null, string],

    /**
     * annoated term table
     * This information is used to display proper value (id vs name)
     */
    annotated_term_table_name: string,
    annotated_term_table_schema_name: string,
    annotated_term_id_column_name: string,
    annotated_term_name_column_name: string
  }
}

export type ViewerAnnotationModal = {
  /**
   * the identifier to find the annotation (must be unique)
   */
  id?: string,

  /**
   * the name of the annotation
   */
  name?: string,

  /**
   * The url to record page
   */
  url: string,

  /**
   * the tuple object
   */
  tuple?: any,

  /**
   * the colors used for the annotation
   */
  colors: string[],

  /**
   * used internally in osd-viewer to identify the annotation group
   */
  groupID: string,
  /**
   * used internally in osd-viewer to identify the svg
   * TODO (why does osd-viewer need two IDs?)
   */
  svgID: string,
  /**
   * the displayname of the annotated term
   */
  anatomy: string,
  /**
   * TODO not used in chaise but osd-viewer is passing it
   */
  // description: string,
  /**
   * whether this is coming from database or file
   */
  isStoredInDB: boolean,
  /**
   * whether it can be updated or not
   */
  canUpdate: boolean,
  /**
   * whether it can be deleted or not
   */
  canDelete: boolean,
  /**
   * the stack node used for logging
   */
  logStackNode: any,
  /**
   * whether it's displayed or not
   */
  isDisplayed: boolean,
}

export enum ViewerZoomFunction {
  ZOOM_IN = 'zoomInView',
  ZOOM_OUT = 'zoomOutView',
  RESET_ZOOM = 'homeView'
}
