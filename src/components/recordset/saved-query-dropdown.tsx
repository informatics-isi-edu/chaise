// components
import Dropdown from 'react-bootstrap/Dropdown';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';

// hooks
import { useEffect, useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// models
import { LogActions, LogAppModes, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import {
  FacetModel, RecordsetConfig, RecordsetDisplayMode,
  RecordsetProps, RecordsetSelectMode
} from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { RECORDSET_DEAFULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
import { columnToColumnModel } from '@isrd-isi-edu/chaise/src/utils/recordedit-utils';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { fixedEncodeURIComponent } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import SparkMD5 from 'spark-md5';

type SavedQueryFacetModel = {
  appliedFilters: any[],
  displayname: string,
  preferredMode: string
}

type SavedQueryDropdownProps = {
  appliedFiltersCallback: Function
};

const SavedQueryDropdown = ({
  appliedFiltersCallback
}: SavedQueryDropdownProps): JSX.Element => {

  const facetTxt = '*::facets::';
  const {
    reference,
    savedQueryConfig,
    savedQueryReference,
  } = useRecordset();

  const {
    session
  } = useAuthn();

  const {
    dispatchError
  } = useError();

  /**
   * whether to show the tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);
  /**
   * when the dropdown is open, we should not use the tooltip
   */
  const [useTooltip, setUseTooltip] = useState<boolean>(true);
  const [displayedTooltip, setDisplayedTooltip] = useState<string>(MESSAGE_MAP.tooltip.saveQuery);
  const [disableDropdown, setDisableDropdown] = useState<boolean>(true);

  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);

  useEffect(() => {
    if (!savedQueryReference) return;
    // if insert is false, disable the button
    // should this be checking for insert !== true ?
    const shouldDisableDropdown = !savedQueryReference.table.rights.insert;
    setDisableDropdown(shouldDisableDropdown);
    // TODO: fix <code> tag not being rendered properly
    //       fix tooltip not showing on disabled element
    // if (shouldDisableDropdown) setDisplayedTooltip('Please login to be able to save searches for <code>' + reference.displayname.value + '</code>.');
  }, [savedQueryReference])

  // nextShow is true when the dropdown is open
  const onDropdownToggle = (nextShow: boolean) => {
    // toggle the tooltip based on dropdown's inverse state 
    setUseTooltip(!nextShow);
    if (nextShow === true) setShowTooltip(false);

    // log the action
    if (nextShow) {
      LogService.logClientAction({
        action: LogService.getActionString(LogActions.EXPORT_OPEN),
        stack: LogService.getStackObject()
      }, savedQueryReference.defaultLogInfo)
    }
  };

  /**
    * Transform facets to a more stable version that can be saved.
    * The overal returned format is like the following:
    * {
    *  "and": [
    *    {
    *      "sourcekey": "key",
    *      "choices": [v1, v2, ..],
    *      "source_domain": {
    *        "schema":
    *        "table":
    *        "column":
    *      }
    *    }
    *  ]
    * }
    * NOTE: will return null if there aren't any facets
    */
  function _getStableFacets(facetModels: SavedQueryFacetModel[]) {
    const filters = [];
    if (reference.location.searchTerm) {
      // TODO this is a bit hacky
      filters.push({ 'sourcekey': 'search-box', 'search': [reference.location.searchTerm] });
    }

    // NOTE: there are no facets on location when no filters are applied
    //    return 'and' of search term or nothing at all
    if (!reference.location.facets || !reference.location.facets.hasNonSearchBoxVisibleFilters) {
      if (filters.length > 0) {
        return { 'and': filters };
      } else {
        return null;
      }
    }

    for (let i = 0; i < facetModels.length; i++) {
      const fm = facetModels[i],
        fc = reference.facetColumns[i];

      if (fm.appliedFilters.length == 0) {
        continue;
      }

      const filter = fc.toJSON();

      // we should use sourcekey if we have it
      // NOTE accessing private variable
      if (fc._facetObject.sourcekey) {
        delete filter.source;
        filter.sourcekey = fc._facetObject.sourcekey;
      }

      // add entity mode
      filter.entity = fc.isEntityMode;

      // add markdown_name
      filter.markdown_name = getDisplaynameInnerText(fc.displayname);

      // encode source_domain
      filter.source_domain = {
        schema: fc.column.table.schema.name,
        table: fc.column.table.name,
        column: fc.column.name,
      };

      // in entity choice mode we have to map to stable key
      if (fc.isEntityMode && fc.preferredMode === 'choices') {
        const stableKeyCols = fc.column.table.stableKey,
          stableKeyColName = stableKeyCols[0].name;

        if (stableKeyColName != fc.column.name) {
          // TODO we're assuming that it's just simple key,
          //     if this assumption has changed, we should change this implementation too
          // we have to change the column and choices values
          filter.source_domain.column = stableKeyColName;
          filter.choices = [];


          for (let j = 0; j < fm.appliedFilters.length; j++) {
            let af = fm.appliedFilters[j];
            // ignore the not-null choice (it's already encoded and we don't need to map it)
            if (af.isNotNull) {
              continue;
            }
            // add the null choice manually
            if (af.uniqueId == null) {
              filter.choices.push(null);
            } else {
              filter.choices.push(af.tuple.data[stableKeyColName]);
            }
          }
        }
      }

      // make sure the items are sorted so it's not based on user selection
      if (Array.isArray(filter.choices)) {
        filter.choices.sort();
      }

      filters.push(filter);
    }

    return { 'and': filters };
  }

  const saveQuery = () => {
    if (!savedQueryConfig) return;
    const columnModels: any[] = [];
    const tempSavedQueryReference = savedQueryReference.contextualize.entryCreate;

    const rowData: {
      rows: any[],
      submissionRows: any[],
      foreignKeyData: any[],
      oldRows: any[]
    } = {
      rows: [],
      submissionRows: [],
      foreignKeyData: [],
      oldRows: []
    };

    // set columns list
    tempSavedQueryReference.columns.forEach((col: any) => {
      columnModels.push(columnToColumnModel(col));
    });

    const isDescriptionMarkdown = columnModels.filter((model: RecordeditColumnModel) => {
      return model.column.name == 'description'
    })[0].inputType == 'longtext'

    const facetOptionsToString = (options: any[]) => {
      let str = '';
      options.forEach((option: any, idx: number) => {
        const name = option.displayname.value;
        if (name === null) {
          str += ' _No value_';
        } else if (name === '<i>All records with value </i>') {
          str += ' _All records with value_'
        } else if (name === '') {
          str += ' _Empty_'
        } else {
          str += ' ' + name;
        }
        if (idx + 1 != options.length) str += ','
      });
      return str;
    }

    const facetDescription = (facet: string, optionsString: string, notLastIdx: boolean) => {
      let value = (isDescriptionMarkdown ? '  -' : '') + facet + ':' + optionsString + ';';
      if (notLastIdx) value += '\n';

      return value;
    }

    /*
     * The following code is for creating the default name and description
     *
     * `name` begins with the reference displayname and "with". The rest of the name is created by
     * iterating over each facet and the selections made in the facets. The value appended to the
     * name for each facet will follow 1 of 3 formats:
     *   1. listing the options if under the numFacetChoices and facetTextLength thresholds
     *      <option1>, <option2>, <option3>, ...
     *   2. in the case of ranges, listing the facet displayname and the selections if under the numFacetChoices and facetTextLength thresholds
     *      <facet displayname> (<option1>, <option2>, <option3>, ...)
     *   3. listing the facet displayname and number of selections if over either of the numFacetChoices or facetTextLength thresholds
     *      <facet displayname> (6 choices)
     * If the name after appending all facet names together is over the nameLength threshold,
     * a further shortened syntax is used for the whole name:
     *     <reference displayname> with x facets: <facet1 displayname>, <facet2 displayname>, <facet3 displayname>, ...
     *
     * `description` begins with the reference displayname and "with" also. The rest of the
     * description is created by iterating over each facet and the selections made in the facets.
     * description format for each facet is generally:
     *     <facet displayname> (x choices): <option1>, <option2>, <option3>, ...
     *
     * The format for description slightly differs depending on whether the input type is text
     * or longtext. If longtext, each facet description is preceded by a hyphen (`-`) and is on a new line.
     * Otherwise, the description is all one line with no hyphens
     */
    const nameDescriptionPrefix = reference.displayname.value + ' with';
    let facetNames = '';

    let name = nameDescriptionPrefix
    let description = nameDescriptionPrefix + ':\n';

    const allFilters = appliedFiltersCallback();
    console.log(allFilters);
    // TODO: facetModels are not on recordset provider?
    //     think of how to do this different
    const modelsWFilters: SavedQueryFacetModel[] = [];

    allFilters.forEach((facetFilter: any, idx: number) => {
      if (facetFilter.length === 0) return;

      let tempObj: SavedQueryFacetModel = {
        appliedFilters: facetFilter,
        displayname: reference.facetColumns[idx].displayname.value,
        preferredMode: reference.facetColumns[idx].preferredMode
      };

      modelsWFilters.push(tempObj);
    })

    console.log(modelsWFilters);

    if (reference.location.searchTerm) {
      name += ' ' + reference.location.searchTerm;
      if (modelsWFilters.length > 0) name += ';';
      description += facetDescription(' Search', reference.location.searchTerm, modelsWFilters.length > 0)
    }

    // iterate over the facetModels to create the default name and description values;
    modelsWFilters.forEach((fm: any, modelIdx: number) => {
      // ===== setting default name =====
      // create the facetNames string in the case the name after creating the string with all facets and option names is longer than the nameLengthThreshold
      facetNames += ' ' + fm.displayname;
      if (modelIdx + 1 != modelsWFilters.length) facetNames += ',';

      const numChoices = fm.appliedFilters.length;
      const facetDetails = ' ' + fm.displayname + ' (' + numChoices + ' choice' + (numChoices > 1 ? 's' : '') + ')';
      // set to default value to use if the threshold are broken
      let facetInfo = facetDetails;

      // used for the description and name if not too long
      let facetOptionsString = ''; // the concatenation of facet option names
      if (fm.preferredMode == 'ranges') facetOptionsString += ' ' + fm.displayname + ' (';
      facetOptionsString += facetOptionsToString(fm.appliedFilters);
      if (fm.preferredMode == 'ranges') facetOptionsString += ')';

      // savedQueryConfig.defaultNameLimits.keys -> [ facetChoiceLimit, facetTextLimit, totalTextLimit ]
      const underChoiceLimit = fm.appliedFilters.length <= savedQueryConfig.defaultNameLimits.facetChoiceLimit;
      const underTextLimit = facetOptionsString.length <= savedQueryConfig.defaultNameLimits.facetTextLimit;
      if (underChoiceLimit && underTextLimit) facetInfo = facetOptionsString;
      name += facetInfo;
      if (modelIdx + 1 != modelsWFilters.length) name += ';'

      // ===== setting default description =====
      description += facetDescription(facetDetails, facetOptionsString, modelIdx + 1 != modelsWFilters.length);
    });

    // if name is longer than the set string length threshold, show the compact version with facet names only
    if (name.length > savedQueryConfig.defaultNameLimits.totalTextLimit) name = nameDescriptionPrefix + ' ' + modelsWFilters.length + ' facets:' + facetNames;

    const row: any = {};
    row.name = name;
    row.description = description;

    // get the stable facet
    const facetObj = _getStableFacets(modelsWFilters);
    console.log(facetObj);
    const query_id = SparkMD5.hash(JSON.stringify(facetObj));

    // set id based on hash of `facets` columns
    row.query_id = query_id;
    row.encoded_facets = facetObj ? windowRef.ERMrest.encodeFacet(facetObj) : null;
    row.facets = facetObj;
    row.table_name = reference.table.name;
    row.schema_name = reference.table.schema.name;
    row.user_id = session?.client.id;

    rowData.rows.push(row);


    // check to see if the saved query exists for the given user, table, schema, and selected facets
    let queryUri = savedQueryReference.uri + '/user_id=' + fixedEncodeURIComponent(row.user_id);
    queryUri += '&schema_name=' + fixedEncodeURIComponent(row.schema_name);
    queryUri += '&table_name=' + fixedEncodeURIComponent(row.table_name) + '&query_id=' + row.query_id;

    windowRef.ERMrest.resolve(queryUri, ConfigService.contextHeaderParams).then((response: any) => {
      const stackPath = LogService.getStackPath(LogStackPaths.SET, LogStackPaths.SAVED_QUERY_CREATE_POPUP);
      const currStackNode = LogService.getStackNode(LogStackTypes.SAVED_QUERY, savedQueryReference.table);

      const logObj = {
        action: LogService.getActionString(LogActions.PRELOAD, stackPath, LogAppModes.CREATE),
        stack: LogService.getStackObject(currStackNode)
      };

      return response.read(1, logObj);
    }).then((page: any) => {
      console.log(page);
      // if a row is returned, a query with this set of facets exists already
      if (page.tuples.length > 0) {
        // modalUtils.showModal({
        //   templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/duplicateSavedQuery.modal.html",
        //   windowClass: "duplicate-saved-query",
        //   controller: "DuplicateSavedQueryModalDialogController",
        //   controllerAs: "ctrl",
        //   keyboard: true,
        //   resolve: {
        //     params: {
        //       tuple: page.tuples[0]
        //     }
        //   }
        // }, null, null, false, false);
      } else {
        // modalUtils.showModal({
        //   templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/createSavedQuery.modal.html",
        //   windowClass: "create-saved-query",
        //   controller: "SavedQueryModalDialogController",
        //   controllerAs: "ctrl",
        //   size: "md",
        //   keyboard: true,
        //   resolve: {
        //     params: {
        //       reference: savedQueryReference,
        //       parentReference: scope.vm.reference,
        //       columnModels: columnModels,
        //       rowData: rowData
        //     }
        //   }
        // }, function success() {
        //   // notify user of success before closing
        //   AlertsService.addAlert("Search criteria saved.", "success");
        // }, null, false, false);
      }
    }).catch((err: any) => {
      $log.debug(err);
    });
  }

  const showSavedQueries = () => {
    var facetBlob = {
      and: [{
        choices: [reference.table.name],
        source: 'table_name' // name of column storing table name in saved_query table
      }, {
        choices: [session?.client.id],
        source: 'user_id'
      }]
    }

    const uri = savedQueryReference.uri + "/" + facetTxt + windowRef.ERMrest.encodeFacet(facetBlob) + '@sort(last_execution_time::desc::)';
    windowRef.ERMrest.resolve(uri, ConfigService.contextHeaderParams).then((ref: any) => {
      // we don't want to allow faceting in the popup
      const tempSavedQueryReference = ref.contextualize.compactSelectSavedQueries.hideFacets();

      const recordsetConfig: RecordsetConfig = {
        viewable: true,
        editable: true,
        deletable: true,
        sortable: true,
        selectMode: RecordsetSelectMode.SINGLE_SELECT,
        // NOTE: when supporting faceting in saved_queries popup
        //   contextualize params.reference to compact/select/saved_queries and check reference.display.facetPanelOpen before setting false
        showFaceting: false,
        disableFaceting: true,
        // used popup/savedquery so that we can configure which button to show and change the modal title
        displayMode: RecordsetDisplayMode.SAVED_QUERY_POPUP
      };

      // params.saveQueryRecordset = true;

      const stackElement = LogService.getStackNode(
        LogStackTypes.SET,
        tempSavedQueryReference.table,
        { source: savedQueryReference.compressedDataSource, entity: true }
      );

      const logStack = LogService.getStackObject(stackElement),
        logStackPath = LogService.getStackPath('', LogStackPaths.SAVED_QUERY_SELECT_POPUP);

      setRecordsetModalProps({
        parentReference: reference,
        initialReference: tempSavedQueryReference,
        initialPageLimit: RECORDSET_DEAFULT_PAGE_SIZE,
        config: recordsetConfig,
        logInfo: {
          logStack: logStack,
          logStackPath: logStackPath
        }
      });
    }).catch((error: any) => {
      $log.warn(error);

      dispatchError({ error: error });
    });
  }

  const hideRecordsetModal = () => {
    setRecordsetModalProps(null);
  };

  return (
    <>
      <Dropdown className='saved-query-menu' onToggle={onDropdownToggle}>
        <ChaiseTooltip
          placement='bottom-end' tooltip={displayedTooltip}
          show={showTooltip} onToggle={(show) => setShowTooltip(useTooltip && show)}
        >
          <Dropdown.Toggle
            disabled={disableDropdown}
            className='chaise-btn chaise-btn-primary'
          >
            <span className='chaise-btn-icon fa-solid fa-floppy-disk' />
            <span>Saved searches</span>
          </Dropdown.Toggle>
        </ChaiseTooltip>
        <Dropdown.Menu>
          <Dropdown.Item className="saved-query-menu-item" onClick={saveQuery}>Save current search criteria</Dropdown.Item>
          <Dropdown.Item className="saved-query-menu-item" onClick={showSavedQueries}>Show saved search criteria</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      {/* <SavedQueryModal></SavedQueryModal> */}
      { recordsetModalProps &&
        <RecordsetModal
          modalClassName='saved-query-popup'
          recordsetProps={recordsetModalProps}
          onClose={hideRecordsetModal}
          onSubmit={() => { return }}
        />
      }
    </>
  );
};

export default SavedQueryDropdown;