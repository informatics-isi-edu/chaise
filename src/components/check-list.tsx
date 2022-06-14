import '@isrd-isi-edu/chaise/src/assets/scss/_check-list.scss';

import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import { useLayoutEffect, useRef } from 'react';


type CheckListProps = {
  initialized: boolean,
  rows: FacetCheckBoxRow[],
  // NOTE: the onRowClick must set the .selected
  //        the check-list component will not do that automatically
  onRowClick: (row: FacetCheckBoxRow, rowIndex: number, event: any) => void,
  // TODO
  // enableFavorites?: boolean,
  // onFavoritesChanged: Function
}

const CheckList = ({
  initialized,
  rows,
  onRowClick
}: CheckListProps): JSX.Element => {
  // TODO favorites support:
  // const [favoritesLoading, setFavoritesLoading] = useState<{[key: number]: boolean}>({});

  const listContainer = useRef<any>(null);

  /**
   * Seth the height of
   */
  useLayoutEffect(() => {
    if (!listContainer.current) return;

    const el = listContainer.current;
    if (initialized) {

      // the timeout is needed to make sure we're getting the height after it's added to DOM
      setTimeout(() => {
        // set the height to the clientHeight or the rendered height so when the content changes the page doesn't thrash
        // plus 1 to fix a truncation of the list issue
        el.style.height = el.scrollHeight + 1 + 'px';
        el.style.overflow = 'hidden';
      });
    } else {
      el.style.height = '';
      el.style.overflow = '';
    }
  }, [initialized]);

  const renderRows = () => {
    if (initialized && rows.length === 0) {
      return <>No Results Found</>
    }

    return rows.map((row: FacetCheckBoxRow, index: number) => {
      let rowClass = 'chaise-checkbox ellipsis-text';
      if (row.disabled) {
        rowClass += ' disabled-row';
      }
      // TODO tooltip

      return (
        <li key={row.uniqueId} className={rowClass}>
          <input
            // TODO for testing, id was changed to className to be more appropriate
            className={`checkbox-${index} ellipsis-text`} type='checkbox'
            checked={row.selected} disabled={row.disabled}
            onChange={(event) => onRowClick(row, index, event)}
          />
          {/* TODO tooltip for null */}
          <label><DisplayValue value={row.displayname} specialNullEmpty={true} /></label>
          {/* TODO favorites: */}
          {/* <span ng-if="enableFavorites && row.isFavoriteLoading" className="favorite-icon favorite-spinner-container pull-right">
            <span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>
          </span>
          <span ng-if="enableFavorites && !row.isFavoriteLoading && (!row.isNotNull && row.displayname.value != null) && row.isFavorite" className="favorite-icon glyphicon glyphicon-star pull-right" ng-click="callToggleFavorite(row)"></span>
          <span ng-if="enableFavorites && !row.isFavoriteLoading && (!row.isNotNull && row.displayname.value != null) && !row.isFavorite" className="favorite-icon hover-show glyphicon glyphicon-star-empty pull-right" ng-click="callToggleFavorite(row)"></span>
          */}
        </li>
      );
    });
  }




  return (
    <ul className='chaise-list-container' ref={listContainer}>
      {renderRows()}
    </ul>
  )
};

export default CheckList;
