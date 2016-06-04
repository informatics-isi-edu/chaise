
var request = require('request'), fs = require('fs');

var table_names = ["project_protocol_document","human_gender","dataset_experiment_type","dataset_somite_count","dataset","dataset_instrument","file","mouse_anatomic_source","human_phenotype","dataset_data_type","human_age_stage","dataset_mouse_age_stage","dataset_zebrafish_genotype","dataset_image","dataset_mouse_phenotype","dataset_human_enhancer","dataset_mouse_mutation","dataset_human_gender","mouse_mutation","zebrafish_anatomic_source","instrument","zebrafish_age_stage","project_member","dataset_mouse_genotype","dataset_human_phenotype","dataset_geo","mouse_genotype","mouse_genetic_background","dataset_preview","data_type","dataset_mouse_genetic_background","dataset_mouse_enhancer","dataset_human_age_stage","dataset_zebrafish_anatomic_source","project_investigator","mouse_enhancer","mouse_age_stage","dataset_mouse_gene","dataset_chromosome","dataset_file","zebrafish_genotype","mouse_phenotype","dataset_human_anatomic_source","external_reference","dataset_zebrafish_age_stage","project","person","experiment_type","human_anatomic_source","human_enhancer","mouse_gene","dataset_organism","organism","dataset_mouse_anatomic_source"];

exportEntities = function(table) {
	request
	  .get('https://dev.isrd.isi.edu/ermrest/catalog/1/entity/legacy:' + table)
	  .pipe(fs.createWriteStream('./data/legacy/' + table + '.json'));
};

table_names.forEach(function(table) {
	exportEntities(table);
});




