import '@isrd-isi-edu/chaise/src/assets/scss/_check-list.scss';

import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';


type CheckListProps = {
  initialized: boolean,
  rows: FacetCheckBoxRow[],
  onRowClick: (row: FacetCheckBoxRow, rowIndex: number) => void,
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
            onClick={() => onRowClick(row, index)}
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
    <ul className='chaise-list-container'>
      {renderRows()}
    </ul>
  )
};

export default CheckList;
