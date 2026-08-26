import type { Catalog } from '@isrd-isi-edu/ermrestjs/src/models/catalog';
import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

/**
 * The ERD model is a plain, JSON-serializable snapshot of the catalog model.
 * It is the single shape that layout and rendering consume.
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
  /**
   * schema part of the fk's constraint name; bare constraint names are only unique per schema
   */
  constraintSchema: string;
  constraint: string;
  /**
   * table properties are `schema:table` keys into ERDGraph.tables
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

/**
 * single source of truth for edge ids: `constraintSchema:constraintName`
 */
export function edgeKey(edge: ERDEdge): string {
  return `${edge.constraintSchema}:${edge.constraint}`;
}

function isTableIncluded(table: Table): boolean {
  return !table.ignore && table.kind === 'table' && EXCLUDED_SCHEMAS.indexOf(table.schema.name) === -1;
}

function createERDTable(table: Table): ERDTable {
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

function getERDEdgesForTable(table: Table): Array<ERDEdge> {
  const edges: Array<ERDEdge> = [];
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
 * turn an introspected ermrestjs catalog (ConfigService.catalog) into an ERDGraph.
 */
export function catalogToGraph(catalog: Catalog): ERDGraph {
  const tables: { [key: string]: ERDTable } = {};
  const edges: Array<ERDEdge> = [];

  catalog.schemas.all().forEach((schema) => {
    if (schema.ignore || EXCLUDED_SCHEMAS.indexOf(schema.name) !== -1) return;
    schema.tables.all().forEach((table) => {
      if (!isTableIncluded(table)) return;
      tables[tableKey(schema.name, table.name)] = createERDTable(table);
      edges.push(...getERDEdgesForTable(table));
    });
  });

  return { catalogId: catalog.id, tables, edges };
}
