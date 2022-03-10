import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@chaise/utils/message-map';
import FontAwesome from '../services/fontawesome';

type ExportProps = {
  reference: any,
  disabled: boolean
}


const Export = ({
  reference,
  disabled
}: ExportProps): JSX.Element => {
  FontAwesome.addExportFonts();

  // TODO implement


  const [showSpinner, setShowSpinner] = useState(false);


  const renderExportIcon = () => {
    if (showSpinner) return (<FontAwesomeIcon className="chaise-btn-icon fa-spin" icon="sync-alt" />);

    return <FontAwesomeIcon className="chaise-btn-icon" icon="file-export" />;
  }

  return (
    <OverlayTrigger placement='bottom' overlay={
      <Tooltip>{MESSAGE_MAP.tooltip.export}</Tooltip>
    }
    >
      <Dropdown>
        <Dropdown.Toggle disabled={disabled} variant="success" className='chaise-btn chaise-btn-primary'>
          {renderExportIcon()}
          Export
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item>Item 1</Dropdown.Item>
          <Dropdown.Item>Item 2</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </OverlayTrigger>
  )

}

export default Export;
