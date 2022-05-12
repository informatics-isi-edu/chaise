export enum LogActions {
  // general

  // - server=
  PRELOAD = ';preload',
  LOAD= ';load',
  RELOAD= ';reload',
  DELETE= ';delete',
  EXPORT= ';export',
  SHARE_OPEN= 'share' + ';open',
  CREATE= ';create',
  UPDATE= ';update',

  // - client=
  CANCEL= ';cancel',
  OPEN= ';open',
  CLOSE= ';close',
  EXPORT_OPEN= 'export' + ';open',
  ADD_INTEND= 'add' + ';intend',
  EDIT_INTEND= 'edit' + ';intend',
  DELETE_INTEND= 'delete' + ';intend',
  DELETE_CANCEL= 'delete' + ';cancel',
  SHARE_LIVE_LINK_COPY= 'share/live' + ';copy',
  SHARE_VERSIONED_LINK_COPY= 'share/version' + ';copy',
  CITE_BIBTEXT_DOWNLOAD= 'cite/bibtex' + ';download',

  // recordset app and table=

  //   - server=
  COUNT= ';count',
  RECOUNT= ';recount',
  FACET_CHOICE_LOAD= 'choice' + ';load',
  FACET_CHOICE_RELOAD= 'choice' + ';reload',
  FACET_RANGE_LOAD= 'range' + ';load',
  FACET_RANGE_RELOAD= 'range' + ';reload',
  FACET_HISTOGRAM_LOAD= 'range' + ';load-histogram',
  FACET_HISTOGRAM_RELOAD= 'range' + ';reload-histogram',
  PRESELECTED_FACETS_LOAD= 'choice/preselect' + ';preload',
  SAVED_QUERY_OPEN= 'saved-query' + ';open',

  //   - client=
  PERMALINK_LEFT= 'permalink' + ';click-left',
  PERMALINK_RIGHT= 'permalink' + ';click-right',
  PAGE_SIZE_OPEN= 'page-size' + ';open',
  PAGE_SIZE_SELECT= 'page-size' + ';select',
  FACET_PANEL_SHOW= 'panel' + ';show',
  FACET_PANEL_HIDE= 'panel' + ';hide',
  PAGE_SELECT_ALL= 'page' + ';select-all',
  PAGE_DESELECT_ALL= 'page' + ';deselect-all',
  PAGE_NEXT= 'page' + ';next',
  PAGE_PREV= 'page' + ';previous',
  SORT= ';sort',
  SELECTION_CLEAR= 'selection' + ';clear',
  SELECTION_CLEAR_ALL= 'selection' + ';clear-all',
  BREADCRUMB_CLEAR= 'breadcrumb' + ';clear',
  BREADCRUMB_CLEAR_ALL= 'breadcrumb' + ';clear-all',
  BREADCRUMB_CLEAR_CFACET= 'breadcrumb' + ';clear-cfacet',
  BREADCRUMB_CLEAR_CUSTOM= 'breadcrumb' + ';clear-custom',
  BREADCRUMB_SCROLL_TO= 'breadcrumb' + ';scroll-to',
  SEARCH_BOX_AUTO= 'search-box' + ';search-delay',
  SEARCH_BOX_CLEAR= 'search-box' + ';clear',
  SEARCH_BOX_CLICK= 'search-box' + ';search-click',
  SEARCH_BOX_ENTER= 'search-box' + ';search-enter',

  // record app=

  // - server=
  LOAD_DOMAIN= ';load-domain', // add pure and binary first request
  RELOAD_DOMAIN= ';reload-domain',
  LINK= ';link',
  UNLINK= ';unlink',

  // - client=
  TOC_SHOW= 'toc' + ';show',
  TOC_HIDE= 'toc' + ';hide',
  RELATED_DISPLAY_TABLE= 'display/table' + ';show',
  RELATED_DISPLAY_MARKDOWN= 'display/mkdn' + ';show',
  EMPTY_RELATED_SHOW= 'show-empty' + ';show',
  EMPTY_RELATED_HIDE= 'show-empty' + ';hide',
  UNLINK_INTEND= 'unlink' + ';intend',
  UNLINK_CANCEL= 'unlink' + ';cancel',

  SCROLL_TOP= ';scroll-top',
  TOC_SCROLL_TOP= 'toc/main' + ';scroll-to',
  TOC_SCROLL_RELATED= 'toc/section' + ';scroll-to',

  // recordedit app=

  // - server=
  FOREIGN_KEY_PRESELECT= ';preselect',
  FOREIGN_KEY_DEFAULT= ';default',

  // - client=
  FORM_CLONE= ';clone',
  FORM_CLONE_X= ';clone-x',
  FORM_REMOVE= ';remove',
  SET_ALL_OPEN= 'set-all' + ';open',
  SET_ALL_CLOSE= 'set-all' + ';close',
  SET_ALL_CANCEL= 'set-all' + ';cancel',
  SET_ALL_APPLY= 'set-all' + ';apply',
  SET_ALL_CLEAR= 'set-all' + ';clear',

  // viewer app=
  // TODO viewer logs are a bit different, so for now I just used a prefix for them.
  //      I should later evaluate this decision and see whether I should remove these prefixes
  //      after that we should be able to merge some of the actions with the rest of the chaise

  // - server=
  VIEWER_ANNOT_FETCH= ';fetch',
  VIEWER_LOAD_BEFORE= ';load-before',
  VIEWER_LOAD_AFTER= ';load-after',

  // - client=
  VIEWER_ANNOT_PANEL_SHOW= 'toolbar/panel' + ';show',
  VIEWER_ANNOT_PANEL_HIDE= 'toolbar/panel' + ';hide',
  VIEWER_CHANNEL_SHOW= 'toolbar/channel' + ';show',
  VIEWER_CHANNEL_HIDE= 'toolbar/channel' + ';hide',
  VIEWER_SCREENSHOT= 'toolbar' + ';screenshot',
  VIEWER_ZOOM_RESET= 'toolbar' + ';zoom-reset',
  VIEWER_ZOOM_IN= 'toolbar' + ';zoom-in',
  VIEWER_ZOOM_OUT= 'toolbar' + ';zoom-out',
  // VIEWER_ZOOM_IN_MOUSE= 'mouse' + ';zoom-in',
  // VIEWER_ZOOM_OUT_MOUSE= 'mouse' + ';zoom-out',

  VIEWER_ANNOT_LINE_THICKNESS= 'line-thickness' + ';adjust',
  VIEWER_ANNOT_DISPLAY_ALL= ';display-all',
  VIEWER_ANNOT_DISPLAY_NONE= ';display-none',
  VIEWER_ANNOT_SHOW= ';show',
  VIEWER_ANNOT_HIDE= ';hide',
  VIEWER_ANNOT_HIGHLIGHT= ';highlight',

  VIEWER_ANNOT_DRAW_MODE_SHOW= 'draw-mode' + ';show',
  VIEWER_ANNOT_DRAW_MODE_HIDE= 'draw-mode' + ';hide',

  // - authn=
  LOGOUT_NAVBAR= 'navbar/account' + ';logout',
  LOGIN_NAVBAR= 'navbar/account' + ';login',
  LOGIN_ERROR_MODAL= 'error-modal' + ';login',
  LOGIN_LOGIN_MODAL= 'login-modal' + ';login',
  LOGIN_WARNING= 'warning' + ';login',
  SESSION_VALIDATE= 'session' + ';validate',
  SESSION_RETRIEVE= 'session' + ';retrieve',

  SWITCH_USER_ACCOUNTS_LOGIN= 'switch-accounts' + ';login',
  SWITCH_USER_ACCOUNTS_WIKI_LOGIN= 'switch-accounts-wiki' + ';login',
  SWITCH_USER_ACCOUNTS_LOGOUT= 'switch-accounts' + ';logout',

  // - login=
  VERIFY_GLOBUS_GROUP_LOGIN= 'verify-globus-group' + ';login',
  VERIFY_GLOBUS_GROUP_LOGOUT= 'verify-globus-group' + ';logout',

  // - navbar=
  NAVBAR_BRANDING= 'navbar/branding' + ';navigate',
  NAVBAR_MENU_EXTERNAL= 'navbar/menu' + ';navigate-external',
  NAVBAR_MENU_INTERNAL= 'navbar/menu' + ';navigate-internal',
  NAVBAR_MENU_OPEN= 'navbar/menu' + ';open',
  NAVBAR_ACCOUNT_DROPDOWN= 'navbar/account' + ';open',
  NAVBAR_PROFILE_OPEN= 'navbar/account/profile' + ';open',
  NAVBAR_RID_SEARCH= 'navbar/go-to-rid' + ';navigate'
}

export enum LogStackTypes{
  ENTITY= 'entity',
  SET= 'set',
  RELATED= 'related',
  FOREIGN_KEY= 'fk',
  COLUMN= 'col',
  PSEUDO_COLUMN= 'pcol',
  FACET= 'facet',
  SAVED_QUERY= 'saved_query',

  // used in viewer app=
  ANNOTATION= 'annotation',
  CHANNEL= 'channel',
  Z_PLANE= 'z-plane'
}

export enum LogStackPaths {
  ENTITY= 'entity',
  SET= 'set',
  COLUMN= 'col',
  PSEUDO_COLUMN= 'pcol',
  FOREIGN_KEY= 'fk',
  FACET= 'facet',
  RELATED= 'related',
  RELATED_INLINE= 'related-inline',
  ADD_PB_POPUP= 'related-link-picker',
  UNLINK_PB_POPUP= 'related-unlink-picker',
  FOREIGN_KEY_POPUP= 'fk-picker',
  FACET_POPUP= 'facet-picker',
  SAVED_QUERY_CREATE_POPUP= 'saved-query-entity',
  SAVED_QUERY_SELECT_POPUP= 'saved-query-picker',
  // these two have been added to the tables that recordedit is showing
  // (but not used in logs technically since we're not showing any controls he)
  RESULT_SUCCESFUL_SET= 'result-successful-set',
  RESULT_FAILED_SET= 'result-failed-set',
  RESULT_DISABLED_SET= 'result-disabled-set',

  // used in viewer app=
  ANNOTATION_ENTITY= 'annotation-entity',
  ANNOTATION_SET= 'annotation-set',
  CHANNEL_SET= 'channel-set',
  Z_PLANE_ENTITY= 'z-plane-entity',
  Z_PLANE_SET= 'z-plane-set'
}

export enum LogAppModes {
  DEFAULT='',
  EDIT= 'edit',
  CREATE= 'create',
  CREATE_COPY= 'create-copy',
  CREATE_PRESELECT= 'create-preselect'
}

export enum LogParentActions {
  // APPLY_COLLECTION= 'apply-co', // proposed for applying a personal collection
  APPLY_SAVED_QUERY= 'apply-sq',
  EXPLORE= 'explore',
  // TITLE= 'title', // proposed for title for record app
  VIEW= 'view'
}

// why we had to reload a request
export enum LogReloadCauses {
  CLEAR_ALL= 'clear-all', // clear all button
  CLEAR_CFACET= 'clear-cfacet',
  CLEAR_CUSTOM_FILTER= 'clear-custom-filter',
  ENTITY_BATCH_UNLINK= 'entity-batch-unlink', // row(s) in the table has been unlinked
  ENTITY_CREATE= 'entity-create', // new rows has been created in the table
  ENTITY_DELETE= 'entity-delete', // a row in the table has been deleted
  ENTITY_UPDATE= 'entity-update', // a row in the table has been updated
  FACET_CLEAR= 'facet-clear', // a facet cleared
  FACET_DESELECT= 'facet-deselect', // a facet deselected
  FACET_SELECT= 'facet-select', // a facet selected
  FACET_MODIFIED= 'facet-modified', // facet changed in the modal
  FACET_SEARCH_BOX= 'facet-search-box', // facet search box changed
  FACET_PLOT_RELAYOUT= 'facet-histogram-relayout', // users interact with plot and we need to get new info for it
  FACET_RETRY= 'facet-retry', // users click on retry for a facet that errored out
  PAGE_LIMIT= 'page-limit', // change page limit
  PAGE_NEXT= 'page-next', // go to next page
  PAGE_PREV= 'page-prev', // go to previous page
  RELATED_BATCH_UNLINK= 'related-batch-unlink', // row(s) in one of the related tables have been unlinked
  RELATED_CREATE= 'related-create', // new rows in one of the related tables has been created
  RELATED_DELETE= 'related-delete', // a row in one of the related tables has been deleted
  RELATED_UPDATE= 'related-update', // a row in one of the related tables has been edited
  RELATED_INLINE_BATCH_UNLINK= 'related-inline-batch-unlink', // row(s) in one of the related (inline) tables have been unlinked
  RELATED_INLINE_CREATE= 'related-inline-create', // new rows in one of the related (inline) tables has been created
  RELATED_INLINE_DELETE= 'related-inline-delete', // a row in one of the related (inline) tables has been deleted
  RELATED_INLINE_UPDATE= 'related-inline-update', // a row in one of the related (inline) tables has been edited
  SORT= 'sort', // sort changed
  SEARCH_BOX= 'search-box', // search box value changed
}
