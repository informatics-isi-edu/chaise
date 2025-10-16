import '@isrd-isi-edu/chaise/src/assets/scss/_history-dropdown.scss';

// components
import Dropdown from 'react-bootstrap/Dropdown';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import PermalinkForm from '@isrd-isi-edu/chaise/src/components/recordset/permalink-form';

// hooks
import { useState, type JSX } from 'react';

const HistoryDropdown = (): JSX.Element => {
  /**
   * when the dropdown is open, we should not use the tooltip
   */
  const [useTooltip, setUseTooltip] = useState(true);
  /**
   * whether to show the tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);

  /**
   * called when users want to toggle the main dropdown
   * used for conditionally hiding the tooltip when the dropdown is open.
   */
  const onDropdownToggle = (nextShow: boolean) => {
    // toggle the tooltip based on dropdown's inverse state
    setUseTooltip(!nextShow);
    if (nextShow === true) setShowTooltip(false);
  };

  // TODO: Add permalink copy functionality
  const copyPermalink = () => {
    // Placeholder for copy permalink functionality
  };

  // TODO: Get actual permalink
  const recordsetLink = '';

  // TODO: Define actual permalink tooltip
  const permalinkTooltip = 'Copy Permalink';

  return (
    <Dropdown
      autoClose='outside'
      className='chaise-dropdown history-dropdown'
      onToggle={onDropdownToggle}
    >
      <ChaiseTooltip
        placement='bottom'
        tooltip='Navigate to past versions of this page'
        show={showTooltip}
        onToggle={(show) => setShowTooltip(useTooltip && show)}
      >
        <Dropdown.Toggle
          as='a'
          variant='link'
          className='chaise-btn chaise-btn-tertiary history-btn'
          bsPrefix='history-toggle'
        >
          <span className='chaise-btn-icon fa-solid fa-clock-rotate-left' />
        </Dropdown.Toggle>
      </ChaiseTooltip>

      <Dropdown.Menu align='end'>
        <ChaiseTooltip tooltip={permalinkTooltip} placement='left'>
          <Dropdown.Item
            href={recordsetLink}
            onClick={copyPermalink}
            style={{ justifyContent: 'flex-start', padding: '5px', display: 'none' }}
            className='chaise-btn chaise-btn-tertiary'
          >
            <span className='chaise-btn-icon fa-solid fa-bookmark' />
            <span>Copy Permalink</span>
          </Dropdown.Item>
        </ChaiseTooltip>
        <Dropdown.Item className='permalink-form-dropdown-item' as='div' style={{ padding: '5px' }}>
          <PermalinkForm />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default HistoryDropdown;
