/* eslint-disable max-len */
// TODO should be broken up
export const MESSAGE_MAP = {
  catalogMissing: 'No catalog specified and no Default is set.',
  generalPreconditionFailed: 'This page is out of sync with the server. Please refresh the page and try again.',
  onePagingModifier: 'Invalid URL. Only one paging modifier allowed',
  pageRefreshRequired: {
    title: 'Page Refresh Required',
    message: 'This record cannot be deleted at this time because someone else has modified it. Please refresh this page before attempting to delete again.',
  },
  pagingModifierRequiresSort: 'Invalid URL. Paging modifier requires @sort',
  reviewModifiedRecord: {
    title: 'Review Modified Record',
    message: 'This record cannot be deleted or unlinked at this time because someone else has modified it. The record has been updated with the latest changes. Please review them before trying again.',
  },
  sessionExpired: {
    title: 'Your session has expired. Please login to continue.',
  },
  previousSession: {
    message: [
      'Your login session has expired. You are now accessing data anonymously. ',
      '<a onclick=\'login()\'>Log in</a> to continue your privileged access. ',
      '<i class="chaise-icon chaise-info" tooltip-placement="bottom-left" uib-tooltip="Clicking on \'×\' button on the right will snooze this alert for one hour."></i>',
    ].join(''),
  },
  noSession: {
    title: 'You need to be logged in to continue.',
  },
  clickActionMessage: {
    continueMessageReload: 'Click <b>Reload</b> to start over with the identity ',
    anonContinueMessageReload: 'Click <b>Reload</b> to start over with limited anonymous access; or',
    continueMessage1: 'Click <b>Continue</b> to continue as ',
    continueMessage2: ' after you restore your login status.',
    anonContinueMessage: 'Click <b>Login</b> to login and continue access as ',
    messageWReplace: 'Click <b>OK</b> to reload this page without @errorStatus.',
    multipleRecords: 'Click <b>OK</b> to show all the matched records.',
    noRecordsFound: 'Click <b>OK</b> to show the list of all records.',
    okGoToRecordset: 'Click <b>OK</b> to go to the Recordset.',
    pageRedirect: 'Click <b>OK</b> to go to the ',
    reloadMessage: 'Click <b>Reload</b> to start over.',
    unsupportedFilters: 'Click <b>OK</b> to continue with the subset of filter criteria which are supported at this time.',
  },
  errorMessageMissing: 'An unexpected error has occurred. Please try again',
  tableMissing: 'No table specified in the form of \'schema-name:table-name\' and no Default is set.',
  maybeNeedLogin: 'You may need to login to see the model or data.',
  maybeUnauthorizedMessage: 'You may not be authorized to view this record (or records).',
  unauthorizedMessage: 'You are not authorized to perform this action.',
  hatracUnauthorizedMessage: 'You are not authorized to upload or modify the file at this location. Please contact your system administrators.',
  reportErrorToAdmin: ' Please report this problem to your system administrators.',
  noRecordForFilter: 'No matching record found for the given filter or facet.',
  noRecordForRid: 'No matching record found for the given RID.',
  loginRequired: 'Login Required',
  permissionDenied: 'Permission Denied',
  loginStatusChanged: 'Unexpected Change of Login Status',
  unauthorizedErrorCode: 'Unauthorized Access',
  localStorageDisabled: 'localStorage is disabled by the browser settings. Some features might not work as expected',
  showErrDetails: 'Show Error Details',
  hideErrDetails: 'Hide Error Details',
  tooltip: {
    versionTime: 'You are looking at data that was snapshotted on ',
    downloadCSV: 'Click to download all matched results',
    permalink: 'Click to copy the current url to clipboard.',
    actionCol: 'Click on the action buttons to view, edit, or delete each record',
    viewCol: 'Click on the icon to view the detailed page associated with each record',
    null: 'Search for any record with no value assigned',
    empty: 'Search for any record with the empty string value',
    notNull: 'Search for any record that has a value',
    showMore: 'Click to show more available filters',
    showDetails: 'Click to show more details about the filters',
    saveQuery: 'Click to save the current search criteria',
    export: 'Click to choose an export format.',
    liveData: 'You are viewing snapshotted data. Click here to return to the live data catalog.'
  },
  URLLimitMessage: 'Maximum URL length reached. Cannot perform the requested action.',
  queryTimeoutList: '<ul class=\'show-list-style\'><li>Reduce the number of facet constraints.</li><li>Minimize the use of \'No value\' and \'All Records with Value\' filters.</li></ul>',
  queryTimeoutTooltip: 'Request timeout: data cannot be retrieved. Refresh the page later to try again.',
  duplicateSavedQueryMessage: 'This search has already been saved. Please edit it under <b>Show Saved Search Criteria</b> if you wish to change its name or description.',
};
