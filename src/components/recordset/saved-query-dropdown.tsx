// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Dropdown from 'react-bootstrap/Dropdown';
import DuplicateSavedQueryModal from '@isrd-isi-edu/chaise/src/components/modals/duplicate-saved-query-modal';
import Recordedit from '@isrd-isi-edu/chaise/src/components/recordedit/recordedit';
import RecordsetModal from '@isrd-isi-edu/chaise/src/components/modals/recordset-modal';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useEffect, useState, type JSX } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { LogActions, LogAppModes, LogStackPaths, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { RecordeditColumnModel, RecordeditDisplayMode, RecordeditProps, appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';
import {
  RecordsetConfig, RecordsetDisplayMode,
  RecordsetProps, RecordsetSelectMode
} from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { RECORDSET_DEFAULT_PAGE_SIZE } from '@isrd-isi-edu/chaise/src/utils/constants';
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

  const { session } = useAuthn();
  const { addAlert } = useAlert();
  const { dispatchError } = useError();

  // whether to show the tooltip or not
  const [showTooltip, setShowTooltip] = useState(false);
  // when the dropdown is open, we should not use the tooltip
  const [useTooltip, setUseTooltip] = useState(true);

  const [disableDropdown, setDisableDropdown] = useState<boolean>(true);

  const [recordeditModalProps, setRecordeditModalProps] = useState<RecordeditProps | null>(null)
  const [recordsetModalProps, setRecordsetModalProps] = useState<RecordsetProps | null>(null);
  // set after checking if the existing search criteria exists to open the duplcate saved query modal
  const [tupleForDuplicateSavedQuery, setTupleForDuplicateSavedQuery] = useState<any | null>(null)

  useEffect(() => {
    if (!savedQueryReference) return;
    // if insert is false, disable the button
    // TODO: should this be checking for insert !== true ?
    const shouldDisableDropdown = !savedQueryReference.table.rights.insert;
    setDisableDropdown(shouldDisableDropdown);
  }, [savedQueryReference])

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
    *
    * @param facetModels: array of appliedFilter arrays
    */
  function _getStableFacets(facetModels: any[][]) {
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

      if (fm.length === 0) {
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

        if (stableKeyColName !== fc.column.name) {
          // TODO we're assuming that it's just simple key,
          //     if this assumption has changed, we should change this implementation too
          // we have to change the column and choices values
          filter.source_domain.column = stableKeyColName;
          filter.choices = [];


          for (let j = 0; j < fm.length; j++) {
            const af = fm[j];
            // ignore the not-null choice (it's already encoded and we don't need to map it)
            if (af.isNotNull) {
              continue;
            }
            // add the null choice manually
            if (af.uniqueId === null) {
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
    if (!savedQueryConfig || !savedQueryConfig.mapping.columnNameMapping) return;
    const columnModels: any[] = [];
    const rows: any[] = [];
    const tempSavedQueryReference = savedQueryReference.contextualize.entryCreate;
    tempSavedQueryReference.computeBulkCreateForeignKeyObject(null);

    // set columns list
    tempSavedQueryReference.columns.forEach((col: any) => {
      columnModels.push(columnToColumnModel(col));
    });

    // should be only one description column
    const descriptionInputType = columnModels.filter((model: RecordeditColumnModel) => {
      return model.column.name === 'description'
    })[0].inputType;
    const isDescriptionMarkdown = descriptionInputType === 'longtext' || descriptionInputType === 'markdown';

    /**
     * Checks each option.displayname.value and formats it properly for display
     *   - special cases for `null`, `empty string` and `All records with value` options
     *
     * @param options - array of selected facet option objects for 1 facet
     * @returns formatted string to display for 1 facet
     **/
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
        if (idx + 1 !== options.length) str += ','
      });

      return str;
    }

    /**
     * Appends each facet name to the name string to be returned until the length of
     *   the returned name exceeds `savedQueryConfig.defaultNameLimits.totalTextLimit`
     *
     * @param names - array of facet names with options selected in them
     * @returns formatted string of all facet names appended together
     */
    const iterativeDefaultName = (names: string[]) => {
      let name: string = nameDescriptionPrefix + ' ' + modelsWFilters.length + ' facets: ';

      // iterate over facetNames, appending each facet name if the length isn't over the limit
      for (let i = 0; i < names.length; i++) {
        const fn = names[i];
        if ((name + ', ' + fn).length <= savedQueryConfig.defaultNameLimits.totalTextLimit) {
          if (i !== 0) name += ', ';
          name += fn;
        } else {
          name += '...';
          break;
        }
      }

      return name;
    }

    /**
     * Creates the description for a single facet to append with other facet descriptions to use as
     *   a default value for the saved query description field
     *
     * @param facet - string that includes the facet name and total number of selections
     * @param optionsString - formatted string of all selected facet options for the given facet
     * @returns formatted string of the facet name, number selected, and selected facet options rownames
     */
    const facetDescription = (facet: string, optionsString: string) => {
      // no need for preText in non markdown
      const preText = (isDescriptionMarkdown ? '  -' : '');
      const value = preText + facet + ':' + optionsString + ';';
      return value;
    }

    /**
     *
     *
     * @param descriptions - array of facet descriptions generated from `facetDescription()`
     * @param initialValue - initial string that facet descriptions will be appended to
     * @returns default description value to fill in for the saved query description field
     */
    const iterativeDefaultDescription = (descriptions: string[], initialValue: string) => {
      const separator = isDescriptionMarkdown ? '\n' : '';

      /**
       * appends the list of facetDescriptions together and prepends the initial value
       * if the length is over the totalTextLimit, false is returned
       *
       * @param stringArray - array of facet descriptions
       * @returns string | false
       */
      const shouldReturnDescription = (stringArray: string[]): string | false => {
        const description = initialValue + stringArray.join(separator);
        return description.length <= savedQueryConfig.defaultDescriptionLimits.totalTextLimit ? description : false;
      }

      // call function to check if we can return the default decription value and stay under the length
      let descriptionOrFalse = shouldReturnDescription(descriptions);
      // if !false, return the description without changing it
      if (descriptionOrFalse) return descriptionOrFalse;

      // Truncate each individual facet description and perform length limit check again
      const tempDescriptions = [...descriptions];
      const singleLimit = savedQueryConfig.defaultDescriptionLimits.facetTextLimit
      descriptions.forEach((description: string, idx: number) => {
        if (description.length > singleLimit) tempDescriptions[idx] = description.substring(0, singleLimit) + '...';
      });

      // call function again after truncated the length of individual facet descriptions
      descriptionOrFalse = shouldReturnDescription(tempDescriptions);
      if (descriptionOrFalse) return descriptionOrFalse;

      // if here, description is still over the max length limit, add each facet description if the length isn't over the limit
      // use tempDescriptions since we want to use each truncated description still
      let description = initialValue;
      for (let i = 0; i < tempDescriptions.length; i++) {
        const fd = tempDescriptions[i];
        if ((description + fd + separator).length <= savedQueryConfig.defaultDescriptionLimits.totalTextLimit) {
          description += fd;
          if (i !== tempDescriptions.length - 1) description += separator;
        } else {
          description += isDescriptionMarkdown ? '  - ...' : ', ...';
          break;
        }
      }

      return description;
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
    const facetNames: string[] = [];
    const facetDescriptions: string[] = [];

    let name = nameDescriptionPrefix
    const initialDescription = nameDescriptionPrefix + ':' + (isDescriptionMarkdown ? '\n' : '');

    const allFilters = appliedFiltersCallback();
    const modelsWFilters: SavedQueryFacetModel[] = [];

    allFilters.forEach((facetFilter: any, idx: number) => {
      if (facetFilter.length === 0) return;

      const tempObj: SavedQueryFacetModel = {
        appliedFilters: facetFilter,
        displayname: reference.facetColumns[idx].displayname.value,
        preferredMode: reference.facetColumns[idx].preferredMode
      };

      modelsWFilters.push(tempObj);
    });

    if (reference.location.searchTerm) {
      const searchTerm = ' ' + reference.location.searchTerm;
      name += searchTerm;
      if (modelsWFilters.length > 0) name += ';';
      facetDescriptions.push(facetDescription(' Search', searchTerm));
    }

    // iterate over the facetModels to create the default name and description values;
    modelsWFilters.forEach((fm: SavedQueryFacetModel, modelIdx: number) => {
      // ===== setting default name =====
      // create the facetNames array in the case the name after creating the string with all facets and option names is longer than the nameLengthThreshold
      facetNames.push(fm.displayname);

      const numChoices = fm.appliedFilters.length;
      const facetDetails = ' ' + fm.displayname + ' (' + numChoices + ' choice' + (numChoices > 1 ? 's' : '') + ')';
      // set to default value to use if the threshold are broken
      let facetInfo = facetDetails;

      // used for the description and name if not too long
      let facetOptionsString = ''; // the concatenation of facet option names
      if (fm.preferredMode === 'ranges') facetOptionsString += ' ' + fm.displayname + ' (';
      facetOptionsString += facetOptionsToString(fm.appliedFilters);
      if (fm.preferredMode === 'ranges') facetOptionsString += ')';

      // savedQueryConfig.defaultNameLimits.keys -> [ facetChoiceLimit, facetTextLimit, totalTextLimit ]
      const underChoiceLimit = fm.appliedFilters.length <= savedQueryConfig.defaultNameLimits.facetChoiceLimit;
      const underTextLimit = facetOptionsString.length <= savedQueryConfig.defaultNameLimits.facetTextLimit;
      if (underChoiceLimit && underTextLimit) facetInfo = facetOptionsString;
      name += facetInfo;
      if (modelIdx + 1 !== modelsWFilters.length) name += ';'

      // ===== setting default description =====
      facetDescriptions.push(facetDescription(facetDetails, facetOptionsString))
    });

    // if name is longer than the set string length threshold, show the compact version with facet names only
    if (name.length > savedQueryConfig.defaultNameLimits.totalTextLimit) name = iterativeDefaultName(facetNames);
    // set the default description based on length limit heuristics defined in `iterativeDefaultDescription()` function
    const description = iterativeDefaultDescription(facetDescriptions, initialDescription);

    const row: any = {};

    // get the stable facet
    const facetObj = _getStableFacets(allFilters);
    const query_id = SparkMD5.hash(JSON.stringify(facetObj));

    /**
     * column names come from the configuration
     * ['catalog', 'description', 'encodedFacets', 'facets', 'queryId', 'queryName', 'schemaName', 'tableName', 'userId']
     */
    const colMap = savedQueryConfig.mapping.columnNameMapping;
    row[colMap.queryName] = name;
    row[colMap.description] = description;
    // set id based on hash of `facets` columns
    row[colMap.queryId] = query_id;
    row[colMap.encodedFacets] = facetObj ? windowRef.ERMrest.encodeFacet(facetObj) : null;
    row[colMap.facets] = facetObj;
    row[colMap.tableName] = reference.table.name;
    row[colMap.schemaName] = reference.table.schema.name;
    row[colMap.catalog] = reference.table.schema.catalog.name;
    row[colMap.userId] = session?.client.id;

    row[colMap.lastExecutionTime] = 'now';

    rows.push(row);

    // check to see if the saved query exists for the given user, table, schema, and selected facets
    let queryUri = savedQueryReference.uri + '/' + colMap.userId + '=' + fixedEncodeURIComponent(row[colMap.userId]);
    queryUri += '&' + colMap.schemaName + '=' + fixedEncodeURIComponent(row[colMap.schemaName]);
    queryUri += '&' + colMap.tableName + '=' + fixedEncodeURIComponent(row[colMap.tableName]);
    queryUri += '&' + colMap.queryId + '=' + row[colMap.queryId];

    windowRef.ERMrest.resolve(queryUri, ConfigService.contextHeaderParams).then((response: any) => {
      const stackPath = LogService.getStackPath(LogStackPaths.SET, LogStackPaths.SAVED_QUERY_CREATE_POPUP);
      const currStackNode = LogService.getStackNode(LogStackTypes.SAVED_QUERY, savedQueryReference.table);

      const logObj = {
        action: LogService.getActionString(LogActions.PRELOAD, stackPath, LogAppModes.CREATE),
        stack: LogService.getStackObject(currStackNode)
      };

      return response.read(1, logObj);
    }).then((page: any) => {
      // if a row is returned, a query with this set of facets exists already
      if (page.tuples.length > 0) {
        setTupleForDuplicateSavedQuery(page.tuples[0]);
      } else {
        const stackPath = LogService.getStackPath(LogStackPaths.SET, LogStackPaths.SAVED_QUERY_CREATE_POPUP);
        const currStackNode = LogService.getStackNode(LogStackTypes.SAVED_QUERY, tempSavedQueryReference.table);
        const logObj = {
          action: LogService.getActionString(LogActions.CREATE, stackPath, LogAppModes.CREATE),
          stack: LogService.addExtraInfoToStack(LogService.getStackObject(currStackNode), { 'num_created': 1 })
        };

        setRecordeditModalProps({
          appMode: appModes.CREATE,
          config: { displayMode: RecordeditDisplayMode.POPUP },
          modalOptions: {
            parentReference: reference,
            onClose: hideRecordeditModal
          },
          onSubmitSuccess: onCreateSavedQuerySuccess,
          // TODO: parentContainer?
          prefillRowData: rows,
          queryParams: {},
          reference: tempSavedQueryReference,
          /* The log related APIs */
          logInfo: {
            logAppMode: LogAppModes.CREATE,
            logObject: logObj,
            logStack: logObj.stack,
            logStackPath: stackPath
          }
        })
      }
    }).catch((err: any) => {
      $log.debug(err);
    });
  }

  const showSavedQueries = () => {
    // tableName and userId are required, the dropdown isn't created unless the required columns are present for saved queries
    const facetBlob = {
      and: [{
        choices: [reference.table.name],
        // name of column storing table name in saved_query table
        source: savedQueryConfig?.mapping.columnNameMapping?.tableName
      }, {
        choices: [session?.client.id],
        // name of column storing user id in saved_query table
        source: savedQueryConfig?.mapping.columnNameMapping?.userId
      }]
    }

    const lastExecutedColumnName = savedQueryConfig?.mapping.columnNameMapping?.lastExecutionTime || 'last_Execution_time';
    const uri = savedQueryReference.uri + '/' + facetTxt + windowRef.ERMrest.encodeFacet(facetBlob) + '@sort(' + lastExecutedColumnName + '::desc::)';
    windowRef.ERMrest.resolve(uri, ConfigService.contextHeaderParams).then((ref: any) => {
      // we don't want to allow faceting in the popup
      const tempSavedQueryReference = ref.contextualize.compactSelectSavedQueries.hideFacets();

      const recordsetConfig: RecordsetConfig = {
        viewable: false,
        editable: true,
        deletable: true,
        sortable: true,
        selectMode: RecordsetSelectMode.NO_SELECT,
        // NOTE: when supporting faceting in saved_queries popup
        //   contextualize params.reference to compact/select/saved_queries and check reference.display.facetPanelOpen before setting false
        disableFaceting: true,
        // used popup/savedquery so that we can configure which button to show and change the modal title
        displayMode: RecordsetDisplayMode.SAVED_QUERY_POPUP
      };

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
        initialPageLimit: RECORDSET_DEFAULT_PAGE_SIZE,
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

  const hideDuplicateSavedQueryModal = () => setTupleForDuplicateSavedQuery(null);
  const hideRecordsetModal = () => setRecordsetModalProps(null);
  const hideRecordeditModal = () => setRecordeditModalProps(null);

  const onCreateSavedQuerySuccess = () => {
    hideRecordeditModal();
    addAlert('Search criteria saved.', ChaiseAlertType.SUCCESS);
  }

  // isOpen is true when the dropdown is open
  const onDropdownToggle = (isOpen: boolean) => {
    // toggle the tooltip based on dropdown's inverse state
    setUseTooltip(!isOpen);
    if (isOpen === true) setShowTooltip(false);

    // log the action
    if (isOpen) {
      LogService.logClientAction({
        action: LogService.getActionString(LogActions.EXPORT_OPEN),
        stack: LogService.getStackObject()
      }, savedQueryReference.defaultLogInfo)
    }
  };

  // render a dropdown or a div that looks like a disabled dropdown
  const renderDropdown = () => {
    if (disableDropdown) {
      // if dropdown is disabled, create a "fake" dropdown element
      return (
        <ChaiseTooltip
          placement='bottom-end'
          tooltip={<span>Please login to be able to save searches for <code><DisplayValue value={reference.displayname} /></code>.</span>}
        >
          <div className='chaise-btn chaise-btn-primary disabled dropdown-toggle'>
            <span className='chaise-btn-icon fa-solid fa-floppy-disk' />
            <span>Saved searches</span>
          </div>
        </ChaiseTooltip>
      )
    }

    return (
      <Dropdown className='saved-query-menu chaise-dropdown' onToggle={onDropdownToggle}>
        <ChaiseTooltip
          placement='bottom-end'
          tooltip={MESSAGE_MAP.tooltip.saveQuery}
          show={showTooltip}
          onToggle={(show) => setShowTooltip(useTooltip && show)}
        >
          <Dropdown.Toggle className='chaise-btn chaise-btn-primary'>
            <span className='chaise-btn-icon fa-solid fa-floppy-disk' />
            <span>Saved searches</span>
          </Dropdown.Toggle>
        </ChaiseTooltip>
        <Dropdown.Menu>
          <Dropdown.Item className='saved-query-menu-item' onClick={saveQuery}>Save current search criteria</Dropdown.Item>
          <Dropdown.Item className='saved-query-menu-item' onClick={showSavedQueries}>Show saved search criteria</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  // TODO: tooltip stays showing after closing either modal
  return (
    <>
      {renderDropdown()}
      {tupleForDuplicateSavedQuery &&
        <DuplicateSavedQueryModal
          tuple={tupleForDuplicateSavedQuery}
          onClose={hideDuplicateSavedQueryModal}
        />
      }
      {recordeditModalProps &&
        <Recordedit {...recordeditModalProps} ></Recordedit>
      }
      {recordsetModalProps &&
        <RecordsetModal
          modalClassName='saved-query-popup'
          recordsetProps={recordsetModalProps}
          onClose={hideRecordsetModal}
          // NOTE: needs to be defined for RecordsetModal but isn't used in this case
          // TODO: do we want to update reference instead of reloading the page?
          onSubmit={() => { return }}
        />
      }
    </>
  );
};

export default SavedQueryDropdown;
