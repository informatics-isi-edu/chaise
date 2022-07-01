import { SelectedChiclet } from '@isrd-isi-edu/chaise/src/models/recordset'
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { useLayoutEffect, useRef, useState } from 'react';
import { ResizeSensor } from 'css-element-queries';


type SelectedChicletProps = {
  rows: SelectedChiclet[];
  removeCallback: (row: SelectedChiclet | null, event: any) => void;
};

/**
 * Can be used to show the selected chiclets
 * Note: since plot is using the same functionlaity we created a seaprate component for it.
 */
const SelectedChiclets = ({
  rows,
  removeCallback
}: SelectedChicletProps): JSX.Element => {
  const [overflow, setOverflow] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const container = useRef<HTMLDivElement>(null);

  // 3 rows where each row has the height of 25px
  const maxHeight = 25 * 3;

  useLayoutEffect(() => {
    if (!container || !container.current) return;

    setOverflow(container.current.scrollHeight > maxHeight);

  }, [rows]);

  // TODO it should be dynamic
  const checkHeight = () => {
    let cachedHeight : number = -1, tm : any;
    return new ResizeSensor(container.current as Element, (dimension) => {
      if (dimension.height === cachedHeight) return;
      cachedHeight = dimension.height;
      if (tm) clearTimeout(tm);
      tm = setTimeout(() => {
        setOverflow(container.current!.scrollHeight > maxHeight);
      }, 500);
    });
  };

  const renderShowMoreLessBtn = (isMoreBtn: boolean) => (
    <ChaiseTooltip
      placement='bottom-start'
      tooltip={isMoreBtn? 'Click to show all selected values.' : 'Click to hide some selected values.'}
    >
      <button
        className={`chaise-btn chaise-btn-tertiary selected-chiclet-btn ${isMoreBtn ? 'show-more-btn' : 'show-less-btn'}`}
        onClick={() => setShowMore(isMoreBtn)}
      >
        ...Show {isMoreBtn ? 'more' : 'less'}
      </button>
    </ChaiseTooltip>
  )

  const renderClearBtn = () => (
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

  if (rows.length === 0) {
    return <></>;
  }

  let containerStyles = {};
  if (overflow && !showMore) {
    containerStyles = {maxHeight, overflowY: 'hidden'};
  }

  return (
    <div className='chiclets-container'>
      <div className='selected-chiclets' ref={container} style={containerStyles}>
        {rows.map((row: any, index: number) => (
          <div key={row.uniqueId} className='selected-chiclet'>
            <ChaiseTooltip
              placement='bottom-start'
              tooltip='Clear selected row'
            >
              <span className='selected-chiclet-remove' onClick={(event) => removeCallback(row, event)}>
                <i className='fa-solid fa-xmark' />
              </span>
            </ChaiseTooltip>
            <DisplayValue specialNullEmpty={true} value={row.displayname} />
          </div>
        ))}
        {!overflow &&
          <div className='selected-chiclet'>{renderClearBtn()}</div>
        }
      </div>
      {overflow &&
        <div>
          <div className='selected-chiclet'>{renderShowMoreLessBtn(!showMore)}</div>
          <div className='selected-chiclet'>{renderClearBtn()}</div>
        </div>
      }
    </div>
  )
};

export default SelectedChiclets;
