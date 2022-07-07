import { Displayname } from '@isrd-isi-edu/chaise/src/models//displayname'
import { TimeStamp } from '@isrd-isi-edu/chaise/src/models/range-picker'
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
    min: number | string | TimeStamp | null,
    minExclusive: boolean,
    max: number | string | TimeStamp | null,
    maxExclusive: boolean
  }
}

export type FacetModel = {
  initialized: boolean,
  isOpen: boolean,
  isLoading: boolean,
  noConstraints: boolean,
  facetError: boolean,
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
  // but only did logStackNode so I can call the recordTableUtils.getTableLogStack with it.
  // logStackNode: facetLogStackNode,
  // instead of just logStackPath, we're capturing parent so it can be used in facet and facet picker.
  // parentLogStackPath: $scope.vm.logStackPath ? $scope.vm.logStackPath : logService.logStackPaths.SET,
}
