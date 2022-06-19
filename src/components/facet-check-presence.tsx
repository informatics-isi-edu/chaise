import { FacetCheckBoxRow, FacetModel } from '@isrd-isi-edu/chaise/src/models/recordset';
import FacetCheckList from '@isrd-isi-edu/chaise/src/components/facet-check-list';
import { useEffect, useState } from 'react';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/facet-utils';
import Q from 'q';
import { LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';


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
}

const FacetCheckPresence = ({
  facetColumn,
  facetModel,
  facetIndex,
  register,
  updateRecordsetReference
}: FacetCheckPresenceProps): JSX.Element => {

  const [checkboxRows, setCheckboxRows] = useState<FacetCheckBoxRow[]>(() => {
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
   * register the flow-control related functions for the facet
   * this will ensure the functions are registerd based on the latest facet changes
   */
  useEffect(() => {
    callRegister();
  }, [facetModel, checkboxRows]);

  //-------------------  flow-control related functions:   --------------------//
  const callRegister = () => {
    register(facetIndex, processFacet, preProcessFacet, getAppliedFilters);
  };

  const preProcessFacet = () => {
    const defer = Q.defer();
    // this function is expected but we don't need any extra logic here.
    return defer.resolve(true), defer.promise;
  }

  const processFacet = () => {
    const defer = Q.defer();

    // we will set the checkboxRows to the value of this variable at the end
    const updatedRows: FacetCheckBoxRow[] = [];

    if (!facetColumn.hideNotNullChoice) {
      updatedRows.push(getNotNullFacetCheckBoxRow(facetColumn.hasNotNullFilter));
    }
    if (!facetColumn.hideNullChoice) {
      updatedRows.push(getNullFacetCheckBoxRow(facetColumn.hasNullFilter));
    }

    setCheckboxRows(updatedRows);

    return defer.resolve(true), defer.promise;
  };

  const getAppliedFilters = () => {
    return checkboxRows.filter((cbr: FacetCheckBoxRow) => cbr.selected);
  };

  //-------------------  UI related callbacks:   --------------------//
  const onRowClick = (row: FacetCheckBoxRow, rowIndex: number, event: any) => {
    const checked = !row.selected;
    $log.log(`facet checkbox ${row.uniqueId} has been ${checked ? 'selected' : 'deselected'}`);

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
