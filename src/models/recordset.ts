import { Displayname } from '@isrd-isi-edu/chaise/src/models//displayname'
import { RangeOption, TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker'
import React from 'react'

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
  // enableFavorites: boolean
}

export type SortColumn = {
  column: string,
  descending?: boolean
}

export type FacetCheckBoxRow = {
  uniqueId?: string | null,
  displayname: Displayname,
  selected?: boolean,
  isNotNull?: boolean,
  tuple?: any,
  isFavorite?: boolean,
  metaData?: {
    min: RangeOption,
    minExclusive: boolean,
    max: RangeOption,
    maxExclusive: boolean
  }
}

export type FacetModel = {
  initialized: boolean,
  isOpen: boolean,
  isLoading: boolean,
  noConstraints: boolean,
  facetHasTimeoutError: boolean,
  // if the stable key is greater than length 1, the favorites won't be supported for now
  // TODO: support this for composite stable keys
  enableFavorites: boolean
}

export type FacetRequestModel = {
  // some facets require extra step to process preselected filters
  preProcessed: boolean,
  processed: boolean,
  // TODO why??
  // appliedFilters: [],
  registered: boolean,
  processFacet: Function, // TODO
  preProcessFacet: Function, //TODO
  getAppliedFilters: Function, // TODO
  removeAppliedFilters: Function, // TODO
  reloadCauses: string[], // why the reload request is being sent to the server (might be empty)
  reloadStartTime: number, //when the facet became dirty
  // TODO log stuff
  // I could capture the whole logStack,
  // but only did logStackNode so I can call the recordTableUtils.getLogStack with it.
  logStackNode: any
}

/**
 * The selected row in recordset
 * NOTE while we could just use "tuple" type, in case of
 * faceting we don't necessarily have the "tuple" object and
 * therefore we're creating this object ourselves.
 */
export type SelectedRow = {
  displayname: Displayname;
  uniqueId: string | null;
  data?: any; // TODO
  // the following can be added for plot app and might require change:
  // cannotBeRemoved?: boolean;
}
