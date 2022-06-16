import '@isrd-isi-edu/chaise/src/assets/scss/_check-list.scss';

import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import { useLayoutEffect, useRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

type CheckListProps = {
  /**
   * whether the list is intiialized or not.
   * if initialized, we will set the height otherwise the height remains unchanged
   */
  initialized: boolean,
  /**
   * The rows that should be displayed
   */
  rows: FacetCheckBoxRow[],
  /**
   * Will be called after clicking on the rows
   * * the onRowClick must set the `.selected`. The check-list component will not do that automatically
   */
  onRowClick: (row: FacetCheckBoxRow, rowIndex: number, event: any) => void,
  // TODO
  // enableFavorites?: boolean,
  // onFavoritesChanged: Function
}

type CheckListRowLabelProps = {
  /**
   * The diplayed row
   */
  row: FacetCheckBoxRow
}

/**
 * Represent each row in the checklist
 * Since we want to watch the width of each row, it was easier to create this
 */
const CheckListRowLabel = ({
  row
}: CheckListRowLabelProps): JSX.Element => {

  // in these cases we want the tooltip to always show up.
  const alwaysShowTooltip = row.isNotNull || row.displayname.value === null || row.displayname.value === '';

  const [showTooltip, setShowTooltip] = useState(false);
  const labelContainer = useRef<HTMLLabelElement>(null);

  /**
   * The tooltip for null, not-null, and empty is special
   * other cases will show the displayname.
   */
  let tooltip = row.displayname;
  if (row.isNotNull) {
    tooltip = { isHTML: false, value: MESSAGE_MAP.tooltip.notNull };
  } else if (row.displayname.value === null) {
    tooltip = { isHTML: false, value: MESSAGE_MAP.tooltip.null };
  } else if (row.displayname.value === '') {
    tooltip = { isHTML: false, value: MESSAGE_MAP.tooltip.empty };
  }

  return (
    <OverlayTrigger
      trigger='hover'
      placement='right'
      overlay={<Tooltip><DisplayValue value={tooltip} /></Tooltip>}
      onToggle={(nextshow: boolean) => {
        if (!labelContainer.current) return;

        const el = labelContainer.current as HTMLElement;
        const overflow = el.scrollWidth > el.offsetWidth;

        /**
         * tooltip should be displayed if it's toggled on, and,
         *   - we always want to show tooltip
         *   - or the content overflows and is showing ellipsis
         */
        setShowTooltip(nextshow && (overflow || alwaysShowTooltip));
      }}
      show={showTooltip}
    >
       <label
        // we have specific tooltip for these modes
        className={alwaysShowTooltip ? 'chaise-icon-for-tooltip' : ''}
        ref={labelContainer}
      >
        <DisplayValue value={row.displayname} specialNullEmpty={true} />
      </label>
    </OverlayTrigger>
  );
};

/**
 * Show a checklist of options for faceting
 */
const CheckList = ({
  initialized,
  rows,
  onRowClick
}: CheckListProps): JSX.Element => {
  // TODO favorites support:
  // const [favoritesLoading, setFavoritesLoading] = useState<{[key: number]: boolean}>({});

  const listContainer = useRef<any>(null);

  /**
   * Set the height of list container to avoid jumping
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
      return (
        // mimic the same structure to make sure the height and ellipsis works the same
        <li className='chaise-checkbox ellipsis-text no-left-padding'>
          <CheckListRowLabel row={{displayname: {value: 'No results found', isHTML: false}}} />
        </li>
      )
    }

    return rows.map((row: FacetCheckBoxRow, index: number) => {
      let rowClass = 'chaise-checkbox ellipsis-text';
      if (row.disabled) {
        rowClass += ' disabled-row';
      }

      return (
        <li key={row.uniqueId} className={rowClass}>
          <input
            // TODO for testing, id was changed to className to be more appropriate
            className={`checkbox-${index}`} type='checkbox'
            checked={row.selected} disabled={row.disabled}
            onChange={(event) => onRowClick(row, index, event)}
          />
          <CheckListRowLabel row={row} />
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
