import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';
// import CheckList from '@isrd-isi-edu/chaise/src/components/facet-check-list';
import { useState } from 'react';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/facet-utils';


type FacetCheckPresenceProps = {
  facetColumn: any,
  index: number
}

const FacetCheckPresence = ({
  facetColumn,
  index
}: FacetCheckPresenceProps) : JSX.Element => {

  const [checkboxRows, setCheckboxRows] = useState<FacetCheckBoxRow[]>(() => {
    const res : FacetCheckBoxRow[] = [];
    if (!facetColumn.hideNotNullChoice) {
      res.push(getNotNullFacetCheckBoxRow(facetColumn.hasNotNullFilter));
    }
    if (!facetColumn.hideNullChoice) {
      res.push(getNullFacetCheckBoxRow(facetColumn.hideNullChoice));
    }
    return res;
  });

  const onRowClick = (row: FacetCheckBoxRow, rowIndex: number) => {
    const checked = !row.selected;

    $log.log(`facet checkbox ${row.uniqueId} has been ${checked ? 'selected' : 'deselected'}`);

    setCheckboxRows((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => curr !== row ? curr : {...curr, selected: checked});
    });
  };

  return (
    <div className='check-presence'>
      {/* TODO */}
      {/* <CheckList initialized={true} rows={checkboxRows} onRowClick={onRowClick} /> */}
    </div>
  )
};

export default FacetCheckPresence;
