(function(){
    'use strict';

    angular.module('chaise.viewer')

    .constant('viewerConstant', {
        image: {
            URI_COLUMN: "uri",
            DEFAULT_Z: "" // the default value of the zindex in the form TODO
        },
        annotation: {
            // annotation table
            ANNOTATION_TABLE_NAME: "Image_Annotation",
            ANNOTATION_TABLE_SCHEMA_NAME: "Gene_Expression",

            // fk to image table in annotation table
            REFERENCE_IMAGE_VISIBLE_COLUMN_NAME: "okfHjL8_zZzvahdjNJjz-Q",
            REFERENCE_IMAGE_COLUMN_NAME: "Image",
            // the asset column that has the annotation
            OVERLAY_COLUMN_NAME: "File_URL",

            // used internally and should be removed from the form
            Z_INDEX_COLUMN_NAME: "Z_Index",
            CHANNELS_COLUMN_NAME: "Channels",

            // anatomy fk in annotation table
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
