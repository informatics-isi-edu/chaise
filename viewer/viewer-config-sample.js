var viewerConfigs = {
    "*": {
        main_image: {
            // DEPRECATED This is here for just backward compatibilty and should not be used.
            /**
             * if defined and value is none-empty, we will not send any extra request for image channel info
             * and use the value stored in this column.
             *
             * As a hack, if the stored value has query parameters, we will only
             * use the query parameters. Otherwise it will use the stored value as is.
             */
            uri_column_name: "uri",

            /**
             * the z-index of displayed main image. if the z-plane image doesn't change,
             * this value will be used for fetching and storing the annotations.
             */
            default_z_index_column_name: "Default_Z",

            /**
             * the column that has the pixel per meter value. If value is defined,
             * it will be passed without any modifications to openseadragon-viewer
             */
            pixel_per_meter_column_name: "Pixels_Per_Meter",

            /**
             * The following watermark attributes are used for the watermark
             * displayed in the screenshot feature.
             */

            // if the watermark is defined in the same table, use this attribute
            watermark_column_name: "",

            // if the watermakr is defined in another table that has fk to image,
            // use the following attribute
            watermark_foreign_key_visible_column_name: "Pq797msQqRnD3Je3Jp01HQ",
            watermark_foreign_key_data_column_name: "URL",

            // what should be displayed in the head title (the browser tab)
            head_title_markdown_pattern: "",

            // what should be displayed in the page title
            page_title_markdown_pattern: "",
        },
        /**
         * the table that stores each individual image for each channel in each z-plane
         */
        processed_image: {
            // procesed image table
            schema_name: "Gene_Expression",
            table_name: "Processed_Image",

            // the sort criteria
            column_order: [{
                "column": "Z_Index",
                "descending": false
            }, {
                "column": "Channel_Number",
                "descending": false
            }],

            // where to filter based on z_index and the image
            z_index_column_name: "Z_Index",
            reference_image_column_name: "Reference_Image",

            // the actual location of image file (info.json, ImageProperties.xml, etc)
            image_url_column_name: "File_URL",

            //{"source": [{"outbound": ["Gene_Expression", "Processed_Image_Reference_Image_Channel_Number_fkey"]}, "RID"], "entity": true}
            channel_visible_column_name: "AeweZsAMVSdW7Vf91boEfw",

            // what is the display method (`iiif`, `dzi`, etc)
            display_method_column_name: "Display_Method",

            // how to generate the url
            iiif_version: "2", // if not passed, `2` will be used
            image_url_pattern: {
                "iiif": "/iiif/{{{iiif_version}}}/{{#encode url}}{{/encode}}/info.json"
            }
        },
        /**
         * the table that stores the channel data
         */
        image_channel: {
            // channel table
            schema_name: "Gene_Expression",
            table_name: "Image_Channel",

            // the sort criteria
            column_order: [{
                "column": "Channel_Number",
                "descending": false
            }],

            // the fk column to main_image
            reference_image_column_name: "Image",

            // the channelName column
            channel_name_column_name: "Name",

            // the pseudoColor column (the value must be in color hex format)
            pseudo_color_column_name: "Pseudo_Color",

            // a boolean column that signals whether the image is greyscale or rgb
            is_rgb_column_name: "Is_RGB",

            // DEPRECATED This is here for just backward compatibilty and should not be used.
            // the actual location of image file (info.json, ImageProperties.xml, etc)
            image_url_column_name: "Image_URL"
        },
        /**
         * the table that stores the annotation data
         */
        image_annotation: {
            // annotation table
            schema_name: "Gene_Expression",
            table_name: "Image_Annotation",

            // fk to image table in annotation table
            reference_image_visible_column_name: "okfHjL8_zZzvahdjNJjz-Q",
            reference_image_column_name: "Image",

            // the asset column that has the annotation
            overlay_column_name: "File_URL",
            overlay_hatrac_path: "resources/gene_expression/annotations",

            // the columns that are used internally and should be removed from the entry form
            z_index_column_name: "Z_Index",
            channels_column_name: "Channels",

            // anatomy fk in annotation table
            annotated_term_displayname: "Anatomy",
            annotated_term_column_name: "Anatomy",
            annotated_term_visible_column_name: "Y7oiVf4tLQPtUWQRrtF-KQ",
            annotated_term_foreign_key_constraint: ["Gene_Expression", "Image_Annotation_Anatomy_fkey"],

            // anatomy table
            annotated_term_table_name: "Anatomy",
            annotated_term_table_schema_name: "Vocabulary",
            annotated_term_id_column_name: "ID",
            annotated_term_name_column_name: "Name"
        }
    }
}
