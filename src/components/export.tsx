import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { MESSAGE_MAP } from '@chaise/utils/message-map';

type ExportProps = {
  reference: any,
  disabled: boolean
}


const Export = ({
  reference,
  disabled
}: ExportProps): JSX.Element => {

  // TODO implement


  const [showSpinner, setShowSpinner] = useState(false);


  const renderExportIcon = () => {
    if (showSpinner) return (<span className="chaise-btn-icon fa-solid fa-rotate fa-spin" />);

    return <span className="chaise-btn-icon fa-solid fa-file-export" />;
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
