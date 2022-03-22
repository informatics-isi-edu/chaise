export enum RecordsetSelectMode {
  NO_SELECT,
  SINGLE_SELECT,
  MULTI_SELECT
}

export enum RecordSetDisplayMode {
  FULLSCREEN = 'fullscreen',
  TABLE = 'table',
  RELATED = 'related',
  INLINE = 'related/inline',
  POPUP = 'popup',
  FK_POPUP = 'popup/foreignkey',
  FK_POPUP_CREATE = 'popup/foreignkey/create',
  FK_POPUP_EDIT = 'popup/foreignkey/edit',
  PURE_BINARY_POPUP_ADD = 'popup/purebinary/add',
  PURE_BINARY_POPUP_UNLINK = 'popup/facet',
  SAVED_QUERY_POPUP = 'popup/savedquery'
}

export type RecordSetConfig = {
  viewable: boolean,
  editable: boolean,
  deletable: boolean,
  sortable: boolean,
  selectMode: RecordsetSelectMode,
  showFaceting: boolean,
  facetPanelOpen: boolean,
  displayMode: RecordSetDisplayMode,
  // TODO enable favorites
}

export type SortColumn = {
  column: string,
  descending?: boolean
}
