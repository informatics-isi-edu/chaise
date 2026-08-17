import type { Table } from '@isrd-isi-edu/ermrestjs/src/models/table';

export interface ERDColumn {
  name: string;
  type: string;
  nullok: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isSystemColumn: boolean;
}

export class ERDTable {
  schema: string;
  name: string;
  kind: string;
  columns: Array<ERDColumn>;
  // TODO:
  // isAssoc: boolean

  constructor(table: Table, columns: Array<ERDColumn>) {
    this.schema = table.schema.name;
    this.name = table.name;
    this.kind = table.kind || 'table';
    this.columns = columns;
  }

  toJson() {
    return {
      schema: this.schema,
      name: this.name,
      kind: this.kind,
      columns: this.columns.map((col) => ({
        name: col.name,
        type: col.type,
        nullok: col.nullok,
        isPrimaryKey: col.isPrimaryKey,
        isForeignKey: col.isForeignKey,
        isSystemColumn: col.isSystemColumn
      }))
    }
  }

  fromJson(json: ReturnType<ERDTable.toJson>) {
    this.schema = json.schema;
    this.name = json.name;
    this.kind = json.kind;
    this.columns = json.columns.map((col: any) => ({
      name: col.name,
      type: col.type,
      nullok: col.nullok,
      isPrimaryKey: col.isPrimaryKey,
      isForeignKey: col.isForeignKey,
      isSystemColumn: col.isSystemColumn
    }));
  }
}
