import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname'
import { SelectedChiclet } from '@isrd-isi-edu/chaise/src/models/recordset'
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { useLayoutEffect, useRef, useState } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';


type SelectedChicletNameProp = {
  displayname: Displayname
}

// TODO this can be a reusable component for all the places that we want to show ellupsis
const SelectedChicletName = ({
  displayname
}: SelectedChicletNameProp) : JSX.Element => {

  const wrapper = useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const inner = <DisplayValue specialNullEmpty={true} value={displayname} />;
  return (
    <OverlayTrigger
      trigger={['hover', 'focus']}
      placement='bottom-start'
      overlay={<Tooltip>{inner}</Tooltip>}
      show={showTooltip}
      onToggle={(nextshow: boolean) => {
        if (!wrapper.current) return;

        const el = wrapper.current as HTMLElement;
        const overflow = el.scrollWidth > el.offsetWidth;

        setShowTooltip(nextshow && overflow);
      }}
    >
      <span className='selected-chiclet-name' ref={wrapper}>
        {inner}
      </span>
    </OverlayTrigger>
  )
};


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
}: SelectedChicletProps) : JSX.Element => {
  // TODO show more, show less logic

  const container = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!container) return;

  }, [rows]);

  if (rows.length === 0) {
    return <></>;
  }

  return (
    <div className='chiclets-container selected-chiclets' ref={container}>
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
          <SelectedChicletName displayname={row.displayname} />
        </div>
      ))}
      {/* using the same class to ensure consistent position and spacing */}
      <div className='selected-chiclet'>
        <ChaiseTooltip
          placement='bottom-start'
          tooltip='Clear all selected rows'
        >
          <button
            className='chaise-btn chaise-btn-tertiary clear-all-btn'
            onClick={(event) => removeCallback(null, event)}
          >
            <span>Clear selection</span>
          </button>
        </ChaiseTooltip>
      </div>
    </div>
  )
};

export default SelectedChiclets;
