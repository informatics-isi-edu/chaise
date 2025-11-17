import { useState, type JSX } from 'react';

// components
import Dropdown from 'react-bootstrap/Dropdown';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import SnapshotForm from '@isrd-isi-edu/chaise/src/components/navbar/snapshot-form';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const SnapshotDropdown = (): JSX.Element => {
  /**
   * when the dropdown is open, we should not use the tooltip
   */
  const [useTooltip, setUseTooltip] = useState(true);
  /**
   * whether to show the tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);

  //-------------------  UI callbacks:   --------------------//

  /**
   * called when users want to toggle the main dropdown
   * used for conditionally hiding the tooltip when the dropdown is open.
   */
  const onDropdownToggle = (nextShow: boolean) => {
    // toggle the tooltip based on dropdown's inverse state
    setUseTooltip(!nextShow);
    if (nextShow === true) setShowTooltip(false);
  };

  //-------------------  render logic:   --------------------//

  return (
    <Dropdown
      autoClose='outside'
      className='chaise-dropdown chaise-snapshot-dropdown'
      onToggle={onDropdownToggle}
    >
      <ChaiseTooltip
        placement='bottom'
        tooltip={
          ConfigService.catalogIDVersion
            ? MESSAGE_MAP.tooltip.snapshotDropdown.liveAndSnapshot
            : MESSAGE_MAP.tooltip.snapshotDropdown.snapshotOnly
        }
        show={showTooltip}
        onToggle={(show) => setShowTooltip(useTooltip && show)}
      >
        <Dropdown.Toggle
          as='a'
          aria-label='Snapshot Dropdown'
          className='chaise-btn chaise-btn-tertiary chaise-snapshot-dropdown-toggle'
        >
          <span className='chaise-btn-icon fa-solid fa-clock-rotate-left' />
        </Dropdown.Toggle>
      </ChaiseTooltip>

      <Dropdown.Menu align='end'>
        <Dropdown.Item as='div' className='permalink-form-dropdown-item'>
          <SnapshotForm />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default SnapshotDropdown;
