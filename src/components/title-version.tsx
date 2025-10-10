import type { JSX } from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// utils
import {
  getHumanizeVersionDate,
  getVersionDate,
} from '@isrd-isi-edu/chaise/src/utils/date-time-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

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

const TitleVersion = ({ reference, addParanthesis }: TitleVersionProps): JSX.Element => {
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

  return (
    <>
      {versionInfo && versionInfo.humanized && (
        <div className='chaise-title-version-info'>
          <ChaiseTooltip
            placement='bottom-start'
            tooltip={`${MESSAGE_MAP.tooltip.versionTime} ${versionInfo.date}`}
          >
            <small className='h3-class'>
              {addParanthesis && <span className='parenthesis-left'>(</span>}
              <i className='fa-solid fa-clock-rotate-left'></i>
              {versionInfo.humanized}
              {addParanthesis && <span className='parenthesis-right'>)</span>}
            </small>
          </ChaiseTooltip>
        </div>
      )}
    </>
  );
};

export default TitleVersion;
