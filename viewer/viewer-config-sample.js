var viewerConfigs = {
    "*": {
        main_image: {
            uri_column_name: "uri",

            default_z_index_column_name: "Default_Z",

            pixel_per_meter_column_name: "Pixels_Per_Meter",

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
        processed_image: {
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

            // where to filter based on z_index and the iamge
            z_index_column_name: "Z_Index",
            reference_image_column_name: "Reference_Image",

            image_url_column_name: "File_URL",

            //{"source": [{"outbound": ["Gene_Expression", "Processed_Image_Reference_Image_Channel_Number_fkey"]}, "RID"], "entity": true}
            channel_visible_column_name: "AeweZsAMVSdW7Vf91boEfw",

            display_method_column_name: "Display_Method",

            // how to generate the url
            iiif_version: "2",
            image_url_pattern: {
                "iiif": "/iiif/{{{iiif_version}}}/{{#encode url}}{{/encode}}/info.json"
            }
        },
        image_channel: {
            schema_name: "Gene_Expression",
            table_name: "Image_Channel",

            // the sort criteria
            column_order: [{
                "column": "Channel_Number",
                "descending": false
            }],

            reference_image_column_name: "Image",
            channel_name_column_name: "Name",
            pseudo_color_column_name: "Pseudo_Color",
            is_rgb_column_name: "Is_RGB",
            image_url_column_name: "Image_URL"
        },
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

            // used internally and should be removed from the form
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
