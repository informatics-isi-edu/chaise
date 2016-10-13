var COMMENT_URI = "comment", FACET_URI = "facet", FACETORDER_URI = "facetOrder", DESCRIPTION_URI = "description";

var Sidebar = function() {
	var self = this;

	this.getColumns = function(table, annotations, dataTypes) {
		var columns = [], annotations = annotations || ["hidden"];
		if (table.annotations && table.annotations[COMMENT_URI] && table.annotations[COMMENT_URI].contains('exclude')) return [];
		var cDefs = table.column_definitions.slice(0);
		cDefs.forEach(function(c) {
			if (!isColumnHidden(c, annotations, dataTypes)) {
				c.table_name = table.table_name;
				columns.push(c);
			}
		});
		return columns.slice(0);
	};

	var isColumnHidden = function(c, annotations, dataTypes) {
		if (!dataTypes || dataTypes.contains(c.type.typename)) {
			if ( c['annotations'] == null || c['annotations'][COMMENT_URI] == null || !c['annotations'][COMMENT_URI].intersect(annotations).length) {
				return false;
			}
		}
		return true;
	};

	this.getAllReferenceColumnsForATable = function(schema, table, annotations, dataTypes) {
		var columns = [], referenceTables = [];
		table['foreign_keys'].forEach(function(key) {
			if (key['referenced_columns'] != null) {
				var i = 0
				key['referenced_columns'].forEach(function(refCol) {
					refCol.foreign_column_name = key['foreign_key_columns'][i++].column_name;
					referenceTables.push(refCol);
				});
			}
		});

		referenceTables.forEach(function(referenceTable) {
			for(var k in schema.content.tables) {
				var column = table.column_definitions.find(function(c) { return c.name == referenceTable.foreign_column_name });
				var isHidden = isColumnHidden(column, annotations, dataTypes);
				metadata = schema.content.tables[k];
				if (k == referenceTable['table_name']) {
					if (metadata['annotations'] && metadata['annotations'][COMMENT_URI] && !metadata['annotations'][COMMENT_URI].contains('exclude') && metadata['annotations'][COMMENT_URI].contains('association')) {
						var referredColumns = self.getColumns(schema.content.tables[referenceTable['table_name']], annotations, dataTypes);
						referredColumns.forEach(function(rc) {
							if (rc.name !== referenceTable.column_name || isHidden) {
								columns.push(rc);
							}
						});
					}
				}
			}
		});

		columns = columns.concat(this.getAllRefererColumnsForTables(schema, table, annotations, dataTypes));
		return columns.slice(0);
	};

	this.getAllRefererColumnsForTables = function(schema, table, annotations, dataTypes) {
		var tables = schema.content.tables, columns = [];
		for (var k in tables) {
			var t = tables[k];
			if (t.table_name != table.table_name) {
				t['foreign_keys'].forEach(function(key) {
					if (key['referenced_columns'] != null) {
						for (var i=0 ; i<key['referenced_columns'].length; i++) {
							if (key['referenced_columns'][i].table_name == table.table_name) {
								var cols = self.getColumns(t, annotations, dataTypes);
								cols.forEach(function(rc) {
									if (rc.name !== key['foreign_key_columns'][i].column_name) {
										columns.push(rc);
									}
								});
							}
						}
					}
				});
			}
		}
		return columns;
	};

	var getVisibleColumns = function(columns, baseName) {
		var visibleColumns = [];
		columns.forEach(function(c) {

			if (c['annotations'] != null && (
										(c.table_name == baseName && !c['annotations'][COMMENT_URI])
			 											||
				(c['annotations'][COMMENT_URI] != null && c['annotations'][COMMENT_URI].contains('top'))
														||
				(c['annotations'][FACETORDER_URI] != null && c['annotations'][FACETORDER_URI].length)))
			{
				visibleColumns.push(c);
			}
		});
		return visibleColumns.slice(0);
	};

	// Returns columns which don't have 'hidden', 'summary' and 'dataset' set in their comment annotation
	this.getAllSidebarColumns = function(schema, table, dataTypes) {
		var annotation = ['exclude', 'hidden', 'summary', 'image'];
		return self.getColumns(table, annotation, dataTypes).concat(this.getAllReferenceColumnsForATable(schema, table, annotation, dataTypes));
	};


	// Returns columns which don't have 'hidden', 'summary', 'bottom' and 'dataset' set in their comment annotation
	this.getAllVisibleSidebarColumns = function(schema, table, dataTypes) {
		var annotation = ['exclude', 'hidden', 'summary', 'bottom', 'image'];
		var columns =  self.getColumns(table, annotation, dataTypes).concat(this.getAllReferenceColumnsForATable(schema, table, annotation, dataTypes));
		return getVisibleColumns(columns, table.table_name);
	};


	// Returns columns which don't have 'hidden', 'summary', and 'dataset' set in their comment annotation
	this.getInvisibleSidebarColumns = function(schema, table, dataTypes) {
		var columns = this.getAllSidebarColumns(schema, table, dataTypes);
		this.getAllVisibleSidebarColumns(schema, table, dataTypes).forEach(function(c) {
			for (i = 0 ; i < columns.length; i++) {
				if (columns[i].name == c.name && c.table_name == columns[i].table_name) {
					columns.splice(i, 1);
					break;
				}
			}
		});

		return columns.slice(0);
	};

	// Returns columns which have  either 'hidden', 'summary', 'bottom' or 'dataset' set in their comment annotation
	this.getAllInvisibleColumns = function(schema, table, dataTypes) {
		var columns = table.column_definitions;
		this.getAllSidebarColumns(schema, table, dataTypes).forEach(function() {
			if (columns.name == c.name) {
				columns.splice(i, 1);
			}
		});
		return columns.slice(0);
	};

	this.getAllCheckableColumns = function(schema, table, dataTypes) {
		var annotation = ['exclude', 'hidden', 'summary', 'text', 'dataset', 'image', 'accommodation'], dataTypes = dataTypes || ['text', 'boolean'];
		return self.getColumns(table, annotation, dataTypes).concat(this.getAllReferenceColumnsForATable(schema, table, annotation, dataTypes));
	};

	this.getAllVisibleCheckableColumnsForATable = function(schema, table, dataTypes) {
		var annotation = ['exclude', 'hidden', 'summary', 'text', 'bottom', 'dataset', 'image', 'accommodation'], dataTypes = dataTypes || ['text', 'boolean'];
		var columns = self.getColumns(table, annotation, dataTypes).concat(this.getAllReferenceColumnsForATable(schema, table, annotation, dataTypes));
		return getVisibleColumns(columns, table.table_name);
	};

	this.getAllInvisibleCheckableSidebarColumns = function(schema, table, dataTypes) {
		var columns = this.getAllCheckableColumns(schema, table, dataTypes);
		this.getAllVisibleCheckableColumnsForATable(schema, table, dataTypes).forEach(function(c) {
			for (i=0 ; i<columns.length;i++) {
				if (columns[i].name == c.name && c.table_name == columns[i].table_name) {
					columns.splice(i, 1);
					break;
				}
			}
		});

		return columns.slice(0);
	};

	this.getAllNumericSidebarColumns = function(schema, table) {
		return this.getAllSidebarColumns(schema, table, ['int4', 'int8', 'float4', 'float8', 'serial4', 'serial8']);
	};

	this.getVisibleNumbericSidebarColumns = function(schema, table) {
		var columns = this.getAllVisibleSidebarColumns(schema, table, ['int4', 'int8', 'float4', 'float8', 'serial4', 'serial8']);
		return getVisibleColumns(columns, table.table_name);
	};

	this.getAllInvisibleNumericSidebarColumns = function() {
		return this.getInvisibleSidebarColumns(schema, table, ['int4', 'int8', 'float4', 'float8', 'serial4', 'serial8']);
	};

	this.getAllDateSidebarColumns = function(schema, table) {
		return this.getAllSidebarColumns(schema, table, ['date', 'timestamptz']);
	};

	this.getVisibleDateSidebarColumns = function(schema, table) {
		var columns = this.getAllVisibleSidebarColumns(schema, table, ['date', 'timestamptz']);
		return getVisibleColumns(columns, table.table_name);
	};

	this.getAllInvisibleDateSidebarColumns = function(schema, table) {
		return this.getInvisibleSidebarColumns(schema, table, ['date', 'timestamptz']);
	};

	this.getColumnDisplayName = function(column) {
		var annotation = column.annotations;
		// If display name found in annotation then return it else
		// compute the display name replacing undercores with space and
		// changing the case of first letter of each word to uppercase
		if (annotation && annotation[DESCRIPTION_URI] && annotation[DESCRIPTION_URI]['display'])
			return annotation[DESCRIPTION_URI]['display'];

		var parts = column.name.split('_'), strings = [];
		parts.forEach(function(part) {
			strings.push(part[0].toUpperCase() + part.substr(1));
		});
		return strings.join(' ');
	};

	this.getVisibleSidebarColumnOrder = function(schema, table) {
		var visibleColumns = this.getAllVisibleSidebarColumns(schema, table);
		var orderedColumns = [], topColumns = [];

		visibleColumns.forEach(function(c) {
			if (c['annotations'][FACETORDER_URI] != null && c['annotations'][FACETORDER_URI].length) {
				orderedColumns.push(c);
			} else {
				topColumns.push(c);
			}
		});

		orderedColumns = orderedColumns.sort(function(a, b) {
			return a['annotations'][FACETORDER_URI][0] - b['annotations'][FACETORDER_URI][0];
		});

		return orderedColumns.concat(topColumns);
	};
};

var EditInputs = function(sidebar) {
	this.sidebar = sidebar;
	var that = this;

	this.isColumnHidden = function(c, annotations) {
		var isHidden = false;
		if (c['annotations']) {
			annotations.forEach(function(a) {
				if (c['annotations'].hasOwnProperty(a)) {
					if (Array.isArray(c['annotations'][a]) && c['annotations'][a].contains("entry")) {
						isHidden = true;
					}
				}
			});
		}
		return isHidden;
	};

	this.getForeignKey = function(column, table) {
		var foreignKey = null;

		table.foreign_keys.forEach(function(fk) {
			var index = 0;
			fk.foreign_key_columns.forEach(function(col) {
				if (col.column_name == column.name) {
					column.referencedColumn = fk.referenced_columns[index++];
					foreignKey = column;
				}
			});
		});

		return foreignKey;
	};

	this.getDisplayName = function(column, property, pascalCase) {
		var annotation = column.annotations;
		property = property || 'name';
		// If display name found in annotation then return it else
		// compute the display name replacing undercores with space and
		// changing the case of first letter of each word to uppercase
		if (annotation && annotation['tag:misd.isi.edu,2015:display'] && annotation['tag:misd.isi.edu,2015:display']['name'])
			return annotation['tag:misd.isi.edu,2015:display']['name'];
		if (pascalCase) return column[property].charAt(0).toUpperCase() + column[property].slice(1);

		return column[property];
	};

	this.getVisibleColumns = function(table, annotations) {
		var columns = [], annotations = annotations;
		if (table.annotations && table.annotations[COMMENT_URI] && table.annotations[COMMENT_URI].contains('exclude')) return [];
		var cDefs = table.column_definitions.slice(0);
		cDefs.forEach(function(c) {
			if (!that.isColumnHidden(c, annotations)) {
				c.table_name = table.table_name;
				c.displayName = that.getDisplayName(c);
				columns.push(c);
			}
		});
		return columns.slice(0);
	};

	this.getColumnsWithComment = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if (c['comment']) columns.push(c);
		});
		return columns;
	};

	this.getColumnsWithRequired = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if (!c.nullok) columns.push(c);
		});
		return columns;
	};

	this.getSerialDataTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if (c.type.typename.startsWith('serial') && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

	this.getLongTextDataTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if (c.type.typename == 'longtext' && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

	this.getTextDataTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if ((c.type.typename == 'shorttext' || c.type.typename == 'text') && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

	this.getBooleanDataTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if (c.type.typename == 'boolean' && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

	this.getForeignKeyColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			var fk = that.getForeignKey(c, table);
			if (fk) columns.push(fk);
		});
		return columns;
	};

	this.getDateTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if ((c.type.typename == 'date') && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

    this.getTimestampTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if ((c.type.typename == 'timestamptz' || c.type.typename == 'timestamp') && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};


	this.getIntegerDataTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if (c.type.typename.startsWith('int') && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

	this.getFloatDataTypeColumns = function(table, annotations) {
		var columns = [];
		this.getVisibleColumns(table, annotations).forEach(function(c) {
			if ((c.type.typename.startsWith('float') || c.type.typename == "numeric") && !that.getForeignKey(c, table)) {
				columns.push(c);
			}
		});
		return columns;
	};

	this.isKey = function(name, keys) {
		if (!keys) return false;

		return keys.find(function(k) {
			return k.name == name;
		});
	};

	this.isUrl = function(column) {
		if (column.annotations && column.annotations[COMMENT_URI] && column.annotations[COMMENT_URI].contains('url')) return true;
		return false;
	};
};

var DataUtils = function() {
	this.sidebar = new Sidebar();
	this.editInputs = new EditInputs(this.sidebar);
};

module.exports = DataUtils;
