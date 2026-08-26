import type { Catalog } from '@isrd-isi-edu/ermrestjs/src/models/catalog';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

/**
 * The model-app graph is a plain, JSON-serializable snapshot of the catalog model.
 * It is the single shape that layout and rendering consume.
 */

export interface ModelColumn {
  name: string;
  type: string;
  nullok: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isSystemColumn: boolean;
}

export interface ModelTable {
  schema: string;
  name: string;
  /**
   * `table` or `view`
   */
  kind: string;
  columns: Array<ModelColumn>;
  isAssociation: boolean;
}

export interface ModelEdge {
  /**
   * schema part of the fk's constraint name; bare constraint names are only unique per schema
   */
  constraintSchema: string;
  constraint: string;
  /**
   * table properties are `schema:table` keys into ModelGraph.tables
   */
  fromTable: string;
  fromColumns: Array<string>;
  toTable: string;
  toColumns: Array<string>;

  /**
   * any of the fk columns are nullok
   */
  isOptional: boolean;
  /**
   * some key's columns are all part of the fk column set, so fk values are
   * unique and the relationship is one-to-one
   */
  isOneToOne: boolean;
}

export interface ModelGraph {
  catalogId: string;
  /**
   * keyed by `schema:table`
   */
  tables: { [key: string]: ModelTable };
  edges: Array<ModelEdge>;
}

/**
 * schemas that should never show up in a diagram. `_ermrest` is already
 * hidden from clients by ermrest itself.
 */
const EXCLUDED_SCHEMAS = ['public', '_acl_admin'];

/**
 * single source of truth for the `schema:table` keys used across the graph
 */
export function tableKey(schema: string, table: string): string {
  return `${schema}:${table}`;
}

/**
 * single source of truth for edge ids: `constraintSchema:constraintName`
 */
export function edgeKey(edge: ModelEdge): string {
  return `${edge.constraintSchema}:${edge.constraint}`;
}

function isTableIncluded(table: Table): boolean {
  return !table.ignore && table.kind === 'table' && EXCLUDED_SCHEMAS.indexOf(table.schema.name) === -1;
}

function createModelTable(table: Table): ModelTable {
  // column membership in any foreign key of this table
  const fkColumns = new Set<string>();
  table.foreignKeys.all().forEach((fk) => {
    fk.colset.columns.forEach((col) => fkColumns.add(col.name));
  });

  return {
    schema: table.schema.name,
    name: table.name,
    kind: table.kind || '',
    columns: table.columns.all().map((col) => ({
      name: col.name,
      type: col.type.name,
      nullok: col.nullok,
      isPrimaryKey: col.memberOfKeys.length > 0,
      isForeignKey: fkColumns.has(col.name),
      isSystemColumn: col.isSystemColumn,
    })),
    isAssociation: table.isPureBinaryAssociation,
  };
}

function getModelEdgesForTable(table: Table): Array<ModelEdge> {
  const edges: Array<ModelEdge> = [];
  table.foreignKeys.all().forEach((fk) => {
    // skip edges that point outside the graph (excluded schemas, views)
    if (!isTableIncluded(fk.key.table)) return;
    edges.push({
      // constraint_names entries are [schema, name] pairs; [0] is the canonical one
      constraintSchema: fk.constraint_names[0][0],
      constraint: fk.constraint_names[0][1],
      fromTable: tableKey(table.schema.name, table.name),
      fromColumns: fk.colset.columns.map((col) => col.name),
      toTable: tableKey(fk.key.table.schema.name, fk.key.table.name),
      toColumns: fk.key.colset.columns.map((col) => col.name),
      isOptional: fk.colset.columns.some((col) => col.nullok),
      isOneToOne: table.keys.all().some((key) => key.colset.columns.every((col) => fk.colset.columns.includes(col))),
    });
  });
  return edges;
}

/**
 * turn an introspected ermrestjs catalog (ConfigService.catalog) into an ModelGraph.
 */
export function catalogToGraph(catalog: Catalog): ModelGraph {
  const tables: { [key: string]: ModelTable } = {};
  const edges: Array<ModelEdge> = [];

  catalog.schemas.all().forEach((schema) => {
    if (schema.ignore || EXCLUDED_SCHEMAS.indexOf(schema.name) !== -1) return;
    schema.tables.all().forEach((table) => {
      if (!isTableIncluded(table)) return;
      tables[tableKey(schema.name, table.name)] = createModelTable(table);
      edges.push(...getModelEdgesForTable(table));
    });
  });

  return { catalogId: catalog.id, tables, edges };
}
