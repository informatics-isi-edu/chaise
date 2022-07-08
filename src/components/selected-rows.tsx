import { SelectedRow } from '@isrd-isi-edu/chaise/src/models/recordset'
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { useLayoutEffect, useRef, useState } from 'react';
import { ResizeSensor } from 'css-element-queries';


type SelectedRowProps = {
  /**
   * The selected-chiclet rows
   */
  rows: SelectedRow[];
  /**
   * The callback that will be called when users click on remove
   * If the first parameter is null, users clicked on "clear-all" button.
   */
  removeCallback: (row: SelectedRow | null, event: any) => void;
};

/**
 * Can be used to show the selected chiclets
 * Note: since plot is using the same functionlaity we created a seaprate component for it.
 */
const SelectedRows = ({
  rows,
  removeCallback
}: SelectedRowProps): JSX.Element => {
  const [overflow, setOverflow] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const container = useRef<HTMLDivElement>(null);

  // 3 rows where each row has the height of 25px
  const maxHeight = 25 * 3;

  /**
   * Depending on the height of the selected chiclets, we should trigger the
   * show more/less logic
   */
  useLayoutEffect(() => {
    if (!container || !container.current) return;

    let cachedHeight = -1, tm: any;
    const sensor = new ResizeSensor(container.current as Element, (dimension) => {
      if (dimension.height === cachedHeight || !container.current) return;
      cachedHeight = dimension.height;
      if (tm) clearTimeout(tm);
      tm = setTimeout(() => {
        if (container.current) {
          setOverflow(container.current.scrollHeight > maxHeight);
        }
      }, 200);
    });

    return () => {
      sensor.detach();
    }
  }, []);

  const renderSelectedRow = (row: any) => {
    const val = <DisplayValue specialNullEmpty={true} value={row.displayname} />;
    return (
      <>
        <ChaiseTooltip
          placement='bottom-start'
          tooltip='Clear selected row'
        >
          <span className='selected-chiclet-remove' onClick={(event) => removeCallback(row, event)}>
            <i className='fa-solid fa-xmark selected-chiclet-remove-icon' />
          </span>
        </ChaiseTooltip>
        <ChaiseTooltip
          placement='bottom-start'
          tooltip={val}
          tooltipAlwaysOnLeft={true}
        >
          <span className='selected-chiclet-name'>{val}</span>
        </ChaiseTooltip>
      </>
    )
  }

  const renderShowMoreLessBtn = (isMoreBtn: boolean) => (
    <ChaiseTooltip
      placement='bottom-start'
      tooltip={isMoreBtn ? 'Click to show all selected values.' : 'Click to hide some selected values.'}
    >
      <button
        className={`chaise-btn chaise-btn-tertiary selected-chiclet-btn ${isMoreBtn ? 'show-more-btn' : 'show-less-btn'}`}
        onClick={() => setShowMore(isMoreBtn)}
      >
        ...Show {isMoreBtn ? 'more' : 'less'}
      </button>
    </ChaiseTooltip>
  )

  const renderClearAllBtn = () => (
    <ChaiseTooltip
      placement='bottom-start'
      tooltip='Clear all selected rows'
    >
      <button
        className='chaise-btn chaise-btn-tertiary clear-all-btn selected-chiclet-btn'
        onClick={(event) => removeCallback(null, event)}
      >
        <span>Clear selection</span>
      </button>
    </ChaiseTooltip>
  )

  let containerStyles = {};
  if (overflow && !showMore) {
    containerStyles = { maxHeight, overflowY: 'hidden' };
  }

  /**
   * Note: given that we neeed the container ref to always be defined,
   *       we are going to created the container even if there aren't any rows
   */
  return (
    <div className='chiclets-container'>
      <div className='selected-chiclets' ref={container} style={containerStyles}>
        {rows && rows.map((row: any) => (
          <div key={row.uniqueId} className='selected-chiclet'>
            {renderSelectedRow(row)}
          </div>
        ))}
        {rows && rows.length > 0 && !overflow &&
          <div className='selected-chiclet'>{renderClearAllBtn()}</div>
        }
      </div>
      {rows && rows.length > 0 && overflow &&
        // we want to push the show more/less button to the next line
        <div>
          <div className='selected-chiclet'>{renderShowMoreLessBtn(!showMore)}</div>
          <div className='selected-chiclet'>{renderClearAllBtn()}</div>
        </div>
      }
    </div>
  )
};

export default SelectedRows;
