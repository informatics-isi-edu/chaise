import type { JSX } from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import {
  getHumanizeVersionDate,
  getLiveButtonTooltip,
  getVersionDate,
} from '@isrd-isi-edu/chaise/src/utils/snapshot-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { addLogParams } from '@isrd-isi-edu/chaise/src/utils/menu-utils';

type TitleVersionProps = {
  /**
   * the reference object
   */
  reference: any;
};

const TitleVersion = ({ reference }: TitleVersionProps): JSX.Element => {

  // -------------------  UI callbacks:   --------------------//

  const goToLive = () => {
    const catalogId = ConfigService.catalogID;
    const liveLink = windowRef.location.href.replace(catalogId, catalogId.split('@')[0]);
    windowRef.location = addLogParams(liveLink, ConfigService.contextHeaderParams);
    windowRef.location.reload();
  };

  // -------------------  render logic:   --------------------//

  let versionInfo: { [key: string]: string } | null = null;
  if (reference && reference.location.version) {
    versionInfo = {
      date: getVersionDate(reference.location),
      humanized: getHumanizeVersionDate(reference.location),
    };
  }

  if (!versionInfo || !versionInfo.humanized) return <></>;

  return (
    <div className='chaise-title-version-info chaise-btn-group'>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}.`}
      >
        <div className='chaise-btn chaise-btn-tertiary version-text'>
          <i className='chaise-btn-icon fa-solid fa-clock-rotate-left'></i>
          <span>Snapshot from {versionInfo.humanized}</span>
        </div>
      </ChaiseTooltip>
      <ChaiseTooltip placement='bottom' tooltip={getLiveButtonTooltip()}>
        <div
          className='chaise-btn chaise-btn-secondary show-live-btn'
          onClick={goToLive}
          aria-label='show live data'
        >
          Show live data
        </div>
      </ChaiseTooltip>
    </div>
  );
};

export default TitleVersion;
