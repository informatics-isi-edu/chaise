import { Displayname } from '@isrd-isi-edu/chaise/src/models//displayname'

export enum RecordsetSelectMode {
  NO_SELECT,
  SINGLE_SELECT,
  MULTI_SELECT
}

export enum RecordsetDisplayMode {
  FULLSCREEN = 'fullscreen',
  TABLE = 'table',
  RELATED = 'related',
  INLINE = 'related/inline',
  POPUP = 'popup',
  FACET_POPUP = 'popup/facet',
  FK_POPUP = 'popup/foreignkey',
  FK_POPUP_CREATE = 'popup/foreignkey/create',
  FK_POPUP_EDIT = 'popup/foreignkey/edit',
  PURE_BINARY_POPUP_ADD = 'popup/purebinary/add',
  PURE_BINARY_POPUP_UNLINK = 'popup/purebinary/unlink',
  SAVED_QUERY_POPUP = 'popup/savedquery'
}

export type RecordsetConfig = {
  viewable: boolean,
  editable: boolean,
  deletable: boolean,
  sortable: boolean,
  selectMode: RecordsetSelectMode,
  showFaceting: boolean,
  disableFaceting: boolean,
  displayMode: RecordsetDisplayMode,
  // TODO enable favorites
}

export type SortColumn = {
  column: string,
  descending?: boolean
}

export type FacetCheckBoxRow = {
  uniqueId?: string | null,
  displayname: Displayname,
  selected?: boolean,
  disabled?: boolean,
  isNotNull?: boolean,
  alwaysShowTooltip?: boolean
}
