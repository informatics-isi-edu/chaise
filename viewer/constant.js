(function(){
    'use strict';

    angular.module('chaise.viewer')

    /**
     * TODO eventually this should be moved to a more configurable location,
     * either a standalone js file like chaise-config, or as part of the chaise-config file.
     * For now, we decided to have a centeral location for these constant without deciding how this should be configurable
     */
    .constant('viewerConstant', {
        osdViewer: {
            IMAGE_URL_QPARAM: "url",
            CHANNEL_NAME_QPARAM: "channelName",
            PSEUDO_COLOR_QPARAM: "pseudoColor",
            IS_RGB_QPARAM: "isRGB",
            CHANNEL_QPARAMS: [
                "url", "aliasName", "channelName", "pseudoColor", "isRGB"
            ],
            OTHER_QPARAMS: [
                "waterMark", "meterScaleInPixels", "scale", "x", "y", "z",
                "ignoreReferencePoint", "ignoreDimension", "enableSVGStrokeWidth", "zoomLineThickness"
            ]
        },
        image: {
            URI_COLUMN_NAME: "uri",
            DEFAULT_Z_INDEX_COLUMN_NAME: "Default_Z" // the default value of the zindex in the form TODO
        },
        channel: {
            CHANNEL_TABLE_NAME: "Image_Channel",
            CHANNE_TABLE_SCHEMA_NAME: "Gene_Expression",

            CHANNEL_TABLE_COLUMN_ORDER: [{
                "column": "Channel_Number",
                "descending": false
            }],

            REFERENCE_IMAGE_COLUMN_NAME: "Image",

            CHANNEL_NAME_COLUMN_NAME: "Name",
            PSEUDO_COLOR_COLUMN_NAME: "Pseudo_Color",
            IS_RGB_COLUMN_NAME: "IS_RGB",
            IMAGE_URL_COLUMN_NAME: "Image_URL",

            // how many channels at a time should we read from database
            PAGE_COUNT: 25,
        },
        annotation: {
            // how much should we wait for user action and then log
            SEARCH_LOG_TIMEOUT: 2000,
            LINE_THICKNESS_LOG_TIMEOUT: 1000,

            // how many annotations at a time should we read from database
            PAGE_COUNT: 25,

            // annotation table
            ANNOTATION_TABLE_NAME: "Image_Annotation",
            ANNOTATION_TABLE_SCHEMA_NAME: "Gene_Expression",

            // fk to image table in annotation table
            REFERENCE_IMAGE_VISIBLE_COLUMN_NAME: "okfHjL8_zZzvahdjNJjz-Q",
            REFERENCE_IMAGE_COLUMN_NAME: "Image",
            // the asset column that has the annotation
            OVERLAY_COLUMN_NAME: "File_URL",
            OVERLAY_HATRAC_PATH: "resources/gene_expression/annotations",

            // used internally and should be removed from the form
            Z_INDEX_COLUMN_NAME: "Z_Index",
            CHANNELS_COLUMN_NAME: "Channels",

            // anatomy fk in annotation table
            ANNOTATED_TERM_DISPLAYNAME: "Anatomy",
            ANNOTATED_TERM_COLUMN_NAME: "Anatomy",
            ANNOTATED_TERM_VISIBLE_COLUMN_NAME: "Y7oiVf4tLQPtUWQRrtF-KQ",
            ANNOTATED_TERM_FOREIGN_KEY_CONSTRAINT: ["Gene_Expression", "Image_Annotation_Anatomy_fkey"],

            // anatomy table
            ANNOTATED_TERM_TABLE_NAME: "Anatomy",
            ANNOTATED_TERM_TABLE_SCHEMA_NAME: "Vocabulary",
            ANNOTATED_TERM_ID_COLUMN_NAME: "ID",
            ANNOTATED_TERM_NAME_COLUMN_NAME: "Name",
        }
    })
})();
