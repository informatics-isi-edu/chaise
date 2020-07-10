(function(){
    'use strict';

    angular.module('chaise.viewer')

    .constant('viewerConstant', {
        annotation: {
            // annotation table
            ANNOTATION_TABLE_NAME: "Gene_Expression:Image_Annotation",

            // fk to image table
            REFERENCE_IMAGE_VISIBLE_COLUMN_NAME: "okfHjL8_zZzvahdjNJjz-Q",
            REFERENCE_IMAGE_COLUMN_NAME: "Image",
            // the asset column that has the annotation
            OVERLAY_COLUMN_NAME: "File_URL",
            // used for filename
            Z_INDEX_COLUMN_NAME: "Z_Index",

            // anatomy table
            ANNOTATED_TERM_TABLE: "Vocabulary:Anatomy",
            ANNOTATED_TERM_ID_COLUMN_NAME: "ID",
            ANNOTATED_TERM_NAME_COLUMN_NAME: "Name",

            // anatomy fk in annotation table
            ANNOTATED_TERM_COLUMN_NAME: "Anatomy",
            ANNOTATED_TERM_VISIBLE_COLUMN_NAME: "Y7oiVf4tLQPtUWQRrtF-KQ"

        }
    })
})();
