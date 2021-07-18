/**
 * The configuration to signal which rows should include the google-dataset jsonld
 * We're going to create a jsonld for the records that:
 * - have proper google-dataset annotation
 * - either their table is not mentioned here, or is mentioned and 
 *   matches one of the given values in here.
 * for more info refer to docs/user-docs/google-dataset.md
 */
var googleDatasetConfigs = {
  "<catalog_number>": {
    "<schema_name>": {
      "table_name>": {
        "columns": ["<array of column names>"],
        "values": ["<array of values>"]
      }
    }
  }
};