import type { Catalog } from '@isrd-isi-edu/ermrestjs/src/models/catalog';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

/**
 * The ERD model is a plain, JSON-serializable snapshot of the catalog model.
 * It is the single shape that layout and rendering consume, and it matches the
 * JSON that the deriva-er-diagram python CLI will emit, so the two
 * implementations can be diffed against the same catalog.
 */

export interface ERDColumn {
  name: string;
  type: string;
  nullok: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isSystemColumn: boolean;
}

export interface ERDTable {
  schema: string;
  name: string;
  /**
   * `table` or `view`
   */
  kind: string;
  columns: Array<ERDColumn>;
  isAssociation: boolean;
}

export interface ERDEdge {
  constraint: string;
  /**
   * table properties are `schema:table` keys into ERDGraph.tables
   */
  fromTable: string;
  fromColumns: Array<string>;
  toTable: string;
  toColumns: Array<string>;
}

export interface ERDGraph {
  catalogId: string;
  /**
   * keyed by `schema:table`
   */
  tables: { [key: string]: ERDTable };
  edges: Array<ERDEdge>;
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

function isTableIncluded(table: Table): boolean {
  return !table.ignore && table.kind === 'table' && EXCLUDED_SCHEMAS.indexOf(table.schema.name) === -1;
}

function erdTableFromErmrest(table: Table): ERDTable {
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

function erdEdgesFromErmrest(table: Table): Array<ERDEdge> {
  const edges: Array<ERDEdge> = [];
  table.foreignKeys.all().forEach((fk) => {
    // skip edges that point outside the graph (excluded schemas, views)
    if (!isTableIncluded(fk.key.table)) return;
    edges.push({
      // constraint_names entries are [schema, name] pairs
      constraint: fk.constraint_names[0][1],
      fromTable: tableKey(table.schema.name, table.name),
      fromColumns: fk.colset.columns.map((col) => col.name),
      toTable: tableKey(fk.key.table.schema.name, fk.key.table.name),
      toColumns: fk.key.colset.columns.map((col) => col.name),
    });
  });
  return edges;
}

/**
 * turn an introspected ermrestjs catalog (ConfigService.catalog) into an ERDGraph.
 */
export function catalogToGraph(catalog: Catalog): ERDGraph {
  const tables: { [key: string]: ERDTable } = {};
  const edges: Array<ERDEdge> = [];

  catalog.schemas.all().forEach((schema) => {
    if (schema.ignore || EXCLUDED_SCHEMAS.indexOf(schema.name) !== -1) return;
    schema.tables.all().forEach((table) => {
      if (!isTableIncluded(table)) return;
      tables[tableKey(schema.name, table.name)] = erdTableFromErmrest(table);
      edges.push(...erdEdgesFromErmrest(table));
    });
  });

  return { catalogId: catalog.id, tables, edges };
}
