Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

var Association = function(options) {
	options = options || {};
	this.schema = options.schema;
	var SCHEMA_METADATA = [], schema_association_tables_names = [], association_tables_names = [], association_tables = [], back_references = [], DEFAULT_TABLE = null;
	var TABLES_LIST_URI = 'comment', COLUMNS_MAP_URI = 'description', COLUMNS_LIST_URI = 'comment';

	this.getContent = function() {
		return {
			schema_association_tables_names: schema_association_tables_names,
			association_tables_names: association_tables_names,
			association_tables: association_tables,
			back_references: back_references,
			SCHEMA_METADATA: SCHEMA_METADATA,
			DEFAULT_TABLE: DEFAULT_TABLE
		};
	};

	this.hasAReference = function(table, ignoreTables) {
		var has = false;
		for (var k in back_references) {
			if (!ignoreTables.contains(k) && back_references[k].contains(table)) {
				has = true;
				break;
			}
		}

		return has;
	};

	this.getTables = function() {
		for (var k in this.schema.tables) {
			var table = this.schema.tables[k];
			SCHEMA_METADATA.push(table);
		}

		var rootTables = [];
		
		SCHEMA_METADATA.forEach(function(table) {
			var exclude = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				(table['annotations'][TABLES_LIST_URI].contains('exclude') || table['annotations'][TABLES_LIST_URI].contains('association'));
			var nested = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				table['annotations'][TABLES_LIST_URI].contains('nested');
			
			if (!exclude && !nested) {
				rootTables.push(table['table_name']);
				var isDefault = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
					table['annotations'][TABLES_LIST_URI].contains('default');
				if (isDefault) {
					DEFAULT_TABLE = table['table_name'];
				}
			}
			if (table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				table['annotations'][TABLES_LIST_URI].contains('association')) {
				schema_association_tables_names.push(table['table_name']);
			}
		});

		if (DEFAULT_TABLE == null) {
			DEFAULT_TABLE = rootTables[0];
		}

		back_references = setTablesBackReferences();


		setAssociationTablesNames(DEFAULT_TABLE);
		setAssociationTables(DEFAULT_TABLE);
	}

	function setTablesBackReferences() {
		var schema_back_references = {};
		var tables = [];
		SCHEMA_METADATA.forEach(function(table) {
			var isNested = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null && table['annotations'][TABLES_LIST_URI].contains('nested');
			var exclude = table['annotations'] != null && table['annotations'][TABLES_LIST_URI] != null &&
				(table['annotations'][TABLES_LIST_URI].contains('association'));
			if (isNested || !exclude) {
				tables.push(table['table_name']);
			}
		});

		SCHEMA_METADATA.forEach(function(table) {
			table['foreign_keys'].forEach(function(fk) {
				fk['referenced_columns'].forEach(function(ref_column) {
					if (tables.contains(ref_column['table_name'])) {
						if (schema_back_references[ref_column['table_name']] == null) {
							schema_back_references[ref_column['table_name']] = [];
						}
						schema_back_references[ref_column['table_name']].push(table['table_name']);
					}
				});
			});
		});

		return schema_back_references;
	}

	function setAssociationTablesNames(table) {
		association_tables_names = [];
		if (back_references != null && back_references[table] != null) {
			schema_association_tables_names.forEach(function(name) {
				if (back_references[table].contains(name)) {
					association_tables_names.push(name);
				}
			});
		}
		var vocabularies = getAssociationTablesNames(table);
		if (vocabularies != null) {
			vocabularies.forEach(function(name) {
				if (!association_tables_names.contains(name)) {
					association_tables_names.push(name);
				}
			});
		}
	}

	function getAssociationTablesNames(table) {
		var ret = [];
		var referenceTables = [];
		var tableMetadata = null;
		SCHEMA_METADATA.forEach(function(metadata) {
			if (metadata['table_name'] == table) {
				tableMetadata = metadata;
				return false;
			}
		});
		if (tableMetadata != null) {
			tableMetadata['foreign_keys'].forEach(function(key) {
				if (key['referenced_columns'] != null) {
					key['referenced_columns'].forEach(function(refCol) {
						referenceTables.push(refCol['table_name']);
					});
				}
			});
		}
		referenceTables.forEach(function(referenceTable) {
			SCHEMA_METADATA.forEach(function(metadata) {
				if (metadata['table_name'] == referenceTable) {
					if (metadata['annotations'] != null && metadata['annotations'][TABLES_LIST_URI] != null && metadata['annotations'][TABLES_LIST_URI].contains('association')) {
						ret.push(metadata['table_name']);
					}
				}
			});
		});
		if (ret.length == 0) {
			ret = null;
		}
		return ret;
	};


	function getColumnDisplayName(column) {
		var parts = column.split('_');
		var i = 0;
		parts.forEach(function(part) {
			parts[i++] = part[0].toUpperCase() + part.substr(1);
		});
		return parts.join(' ');
	};

	function setAssociationTables(table_name) {
		association_tables = {};
		var index = 0;
		SCHEMA_METADATA.forEach(function(table) {
			if (association_tables_names.contains(table['table_name'])) {
				var fk_columns = [];
				table['foreign_keys'].forEach(function(foreign_keys) {
					var k = 0;
					foreign_keys['referenced_columns'].forEach(function(referenced_column) {
						if (referenced_column['table_name'] == table_name) {
							fk_columns.push(foreign_keys['foreign_key_columns'][k]['column_name']);
						}
						k++
					});
				});
				if (fk_columns.length > 0) {
					var columns = [];
					table['column_definitions'].forEach(function(column_definition) {
						if (!fk_columns.contains(column_definition['name'])) {
							var display = getColumnDisplayName(column_definition['name']);
							if (column_definition['annotations'] != null && column_definition['annotations'][COLUMNS_MAP_URI] != null && column_definition['annotations'][COLUMNS_MAP_URI]['display'] != null) {
								display = column_definition['annotations'][COLUMNS_MAP_URI]['display'];
							}
							if (column_definition['annotations'] == null || column_definition['annotations'][COLUMNS_LIST_URI] == null || !column_definition['annotations'][COLUMNS_LIST_URI].contains('hidden')) {
								columns.push({'name': column_definition['name'],
									'display': display});
							}
						}
					});
					if (columns.length > 0) {
						association_tables[table['table_name']] = {
							'columns': columns,
							'metadata': table,
							'alias': 'A' + (++index)
						};
					}
				}
			}
		});
		setVocabularyTables(index);
	};

	function setVocabularyTables(index) {
		SCHEMA_METADATA.forEach(function(i, table) {
			if (association_tables[table['table_name']] == null && association_tables_names.contains(table['table_name'])) {
				var columns = [];
				table['column_definitions'].forEach(function(column_definition) {
					// if (column_definition['annotations'] != null && column_definition['annotations'][COLUMNS_LIST_URI] != null && !column_definition['annotations'][COLUMNS_LIST_URI].contains('hidden')) {
					if (column_definition['annotations'][COLUMNS_LIST_URI] == null || !column_definition['annotations'][COLUMNS_LIST_URI].contains('hidden')) {
						var display = getColumnDisplayName(column_definition['name']);
						if (column_definition['annotations'] != null && column_definition['annotations'][COLUMNS_MAP_URI] != null && column_definition['annotations'][COLUMNS_MAP_URI]['display'] != null) {
							display = column_definition['annotations'][COLUMNS_MAP_URI]['display'];
						}
						columns.push({'name': column_definition['name'],
							'display': display});
					}
				});
				if (columns.length > 0) {
					association_tables[table['table_name']] = {
						'columns': columns,
						'metadata': table,
						'alias': 'A' + (++index)
					};
				}
			}
		});
	};

	this.getTables();

};

module.exports = Association;
