import type { JSX } from 'react';

// components
import FilterChiclet from '@isrd-isi-edu/chaise/src/components/recordset/filter-chiclet';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import {
  getHumanizeVersionDate,
  getVersionDate,
} from '@isrd-isi-edu/chaise/src/utils/date-time-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { addLogParams } from '@isrd-isi-edu/chaise/src/utils/menu-utils';

type TitleVersionProps = {
  /**
   * the reference object
   */
  reference: any;
  /**
   * whether to add paranthesis around the version info
   */
  addParanthesis?: boolean;
};

const TitleVersion = ({ reference, addParanthesis }: TitleVersionProps): JSX.Element | null => {
  /**
   * version info
   */
  let versionInfo: { [key: string]: string } | null = null;
  if (reference && reference.location.version) {
    versionInfo = {
      date: getVersionDate(reference.location),
      humanized: getHumanizeVersionDate(reference.location),
    };
  }


  const goToLive = () => {
    const catalogId = ConfigService.catalogID;
    const liveLink = windowRef.location.href.replace(catalogId, catalogId.split('@')[0]);
    windowRef.location = addLogParams(liveLink, ConfigService.contextHeaderParams);
    windowRef.location.reload();
  };

  if (!versionInfo || !versionInfo.humanized) return null;

  return (
    <div className='chaise-title-version-info chaise-btn-group'>
      {/* version 1 and 2 */}
      {/* <FilterChiclet
        identifier={0}
        value={<><span className='chaise-btn-icon fa-solid fa-clock-rotate-left'></span><span>{versionInfo.humanized}</span></>}
        valueTooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}
        iconTooltip={'Reload the page and display the live data.'}
        onRemove={goToLive}
        removeIcon={<i className='fa-solid fa-arrow-left'></i>}

        // version 2
        afterTitle={
          <ChaiseTooltip placement='bottom' tooltip={'Reload the page and display the live data.'}>
            <button className='chaise-btn chaise-btn-secondary filter-chiclet-value' onClick={goToLive}>View live data</button>
          </ChaiseTooltip>
        }
        hideRemove
      /> */}

      {/* version 3 */}
      {/* <div className='chaise-btn-group'> */}
        <ChaiseTooltip
          placement='bottom-start'
          tooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}
        >
          <div className='chaise-btn chaise-btn-tertiary version-text'>
            <i className='chaise-btn-icon fa-solid fa-clock-rotate-left'></i>
            <span>Snapshot from {versionInfo.humanized}</span>
          </div>
        </ChaiseTooltip>
        <ChaiseTooltip placement='bottom' tooltip={'Reload the page and display the live data.'}>
          <div className='chaise-btn chaise-btn-secondary show-live-btn' onClick={goToLive} aria-label='show live data'>
            Show live data
          </div>
        </ChaiseTooltip>
      {/* </div> */}
    </div>
  );
};

export default TitleVersion;
