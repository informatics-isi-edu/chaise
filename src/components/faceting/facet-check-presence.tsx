
// components
import FacetCheckList from '@isrd-isi-edu/chaise/src/components/faceting/facet-check-list';

// hooks
import { useEffect } from 'react';
import useVarRef from '@isrd-isi-edu/chaise/src/hooks/var-ref';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { FacetCheckBoxRow, FacetModel } from '@isrd-isi-edu/chaise/src/models/recordset';
import { LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';

// servies
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import Q from 'q';
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';

type FacetCheckPresenceProps = {
  /**
   * The facet column
   */
  facetColumn: any,
  /**
   * The facet model that has the UI state variables
   */
  facetModel: FacetModel,
  /**
   * The index of facet in the list of facetColumns
   */
  facetIndex: number,
  /**
  * Allows registering flow-control related function in the faceting component
  */
  register: Function,
  /**
   * dispatch the update of reference
   */
  updateRecordsetReference: Function
};

const FacetCheckPresence = ({
  facetColumn,
  facetModel,
  facetIndex,
  register,
  updateRecordsetReference
}: FacetCheckPresenceProps): JSX.Element => {

  const [checkboxRows, setCheckboxRows, checkboxRowsRef] = useStateRef<FacetCheckBoxRow[]>(() => {
    const res: FacetCheckBoxRow[] = [];
    if (!facetColumn.hideNotNullChoice) {
      res.push(getNotNullFacetCheckBoxRow(facetColumn.hasNotNullFilter));
    }
    if (!facetColumn.hideNullChoice) {
      res.push(getNullFacetCheckBoxRow(facetColumn.hideNullChoice));
    }
    return res;
  });

  /**
   * We must create references for the state and local variables that
   * are used in the flow-control related functions. This is to ensure the
   * functions are using thier latest values.
   */
  const facetColumnRef = useVarRef(facetColumn);

  /**
   * register the flow-control related functions for the facet
   * this will ensure the functions are registerd based on the latest facet changes
   */
  useEffect(() => {
    callRegister();
  }, [facetModel, checkboxRows]);

  //-------------------  flow-control related functions:   --------------------//
  /**
   * register the callbacks (this should be called after related state variables changed)
   */
  const callRegister = () => {
    register(facetIndex, processFacet, preProcessFacet, getAppliedFilters, removeAppliedFilters);
  };

  /**
   * The registered callback to pre-process facets
   */
  const preProcessFacet = () => {
    const defer = Q.defer();
    // this function is expected but we don't need any extra logic here.
    return defer.resolve(true), defer.promise;
  }

  /**
   * The registered callback to process and update facets
   */
  const processFacet = () => {
    const defer = Q.defer();

    // we will set the checkboxRows to the value of this variable at the end
    const updatedRows: FacetCheckBoxRow[] = [];

    if (!facetColumnRef.current.hideNotNullChoice) {
      updatedRows.push(getNotNullFacetCheckBoxRow(facetColumnRef.current.hasNotNullFilter));
    }
    if (!facetColumnRef.current.hideNullChoice) {
      updatedRows.push(getNullFacetCheckBoxRow(facetColumnRef.current.hasNullFilter));
    }

    setCheckboxRows(updatedRows);

    return defer.resolve(true), defer.promise;
  };

  /**
   * The registered callback to get the selected filters
   */
  const getAppliedFilters = () => {
    return checkboxRowsRef.current.filter((cbr: FacetCheckBoxRow) => cbr.selected);
  };

  /**
   * The registered callback to remove all the selected filters
   */
  const removeAppliedFilters = () => {
    setCheckboxRows((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => {
        return { ...curr, selected: false }
      });
    });
  }

  //-------------------  UI related callbacks:   --------------------//
  const onRowClick = (row: FacetCheckBoxRow, rowIndex: number, event: any) => {
    const checked = !row.selected;

    const cause = checked ? LogReloadCauses.FACET_SELECT : LogReloadCauses.FACET_DESELECT;
    // get the new reference based on the operation
    let ref;
    if (row.isNotNull) {
      if (checked) {
        ref = facetColumn.addNotNullFilter();
      } else {
        ref = facetColumn.removeNotNullFilter();
      }
      $log.debug(`faceting: request for facet (index=${facetIndex}) choice add. Not null filter.`);
    } else {
      if (checked) {
        ref = facetColumn.addChoiceFilters([row.uniqueId]);
      } else {
        ref = facetColumn.removeChoiceFilters([row.uniqueId]);
      }
      $log.debug(`faceting: request for facet (index=${facetIndex}) choice ${row.selected ? 'add' : 'remove'}. uniqueId='${row.uniqueId}`);
    }

    // this function checks the URL length as well and might fails
    if (!updateRecordsetReference(ref, facetIndex, cause)) {
      $log.debug('faceting: URL limit reached. Reverting the change.');
      event.preventDefault();
      return;
    }
    setCheckboxRows((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => {
        if (curr === row) return { ...curr, selected: checked };
        // if checked, the other one must be unchecked.
        else if (checked) return { ...curr, selected: false }
        else return curr;
      });
    });
  };

  //------------------------  render logic:   -----------------------//
  return (
    <div className='check-presence'>
      <FacetCheckList rows={checkboxRows} onRowClick={onRowClick} />
    </div>
  )
};

export default FacetCheckPresence;
