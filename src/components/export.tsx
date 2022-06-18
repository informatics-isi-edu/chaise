import '@isrd-isi-edu/chaise/src/assets/scss/_export.scss';

import { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Button, Modal } from 'react-bootstrap';

import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

type ExportProps = {
  reference: any;
  disabled: boolean;
  cancelDownload: any
};

type ExportModalProps = {
  show: boolean;
  closeModal: () => void;
};

const Export = ({ reference, disabled, cancelDownload }: ExportProps): JSX.Element => {
  /**
   * State variable to open progress modal dialog
   */
  const [show, setShow] = useState(false);
  /**
   * State variable to show spinner
   */
  const [options, setOptions] = useState([]);
  /**
   * State Variable to store currently exporting object
   */
  const [exportingOption, setExportingOption] = useState(null);

  useEffect(() => {
    const options: any = [];

    if (reference.csvDownloadLink) {
      options.push({
        displayname: 'CSV',
        type: 'DIRECT',
      });
    }

    const templates = reference.getExportTemplates(
      !ConfigService.chaiseConfig.disableDefaultExport
    );
    
    options.push(...templates);

    setOptions(options);

  }, [reference]);

  const startExporting = (option: any) => (event: any) => {
    setShow(true);
    const formatType = option.type;

    switch(formatType) {
      case 'DIRECT':
        location.href = reference.csvDownloadLink;
        break;
      case 'BAG':
      case 'FILE': 
        setExportingOption(option);
        const bagName = reference.table.name;
        const exporter = ConfigService.ERMrest.Exporter(
          reference,
          bagName,
          option,
          ConfigService.chaiseConfig.exportServicePath
        );
        if (exporter) {
          exporter
            .then((response: any) => {
              // if it was canceled, just ignore the result
              setShow(false);
              if (response.canceled) return;
              location.href = response.data[0];
            })
            .catch((error: any) => {
              setShow(false);
            });
        }
        break;
    }
  };

  const closeModal = () => {
    // TODO: Cancel Download logic will go here
    cancelDownload();
    setShow(false);
  };

  /**
   * returns Modal Component - Component that renders progress modal dialog
   */
  const ExportModal = ({ title, show, closeModal }: ExportModalProps) => {
    return (
      <Modal
        show={show}
        onHide={closeModal}
        backdrop='static'
        keyboard={false}
      >
        <Modal.Header>
          <Modal.Title>Exporting {exportingOption && exportingOption.displayname}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='modal-text'>Your request is being processed...</div>
          <div className='modal-text'>
            You will be prompted to download the file when it is ready.
          </div>
          <div className='progress'>
            <div
              className='progress-bar progress-bar-striped active'
              aria-valuenow={100}
              aria-valuemax={100}
              style={{ width: '100%' }}
            ></div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='outline-primary' onClick={closeModal}>
            cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  const renderExportIcon = () => {
    return <span className='chaise-btn-icon fa-solid fa-file-export'/>;
  };

  return (
    <>
      <OverlayTrigger
        placement='left'
        overlay={<Tooltip>{MESSAGE_MAP.tooltip.export}</Tooltip>}
      >
        <Dropdown className='export-menu'>
          <Dropdown.Toggle
            disabled={disabled}
            variant='success'
            className='chaise-btn chaise-btn-primary'
          >
            {renderExportIcon()}
            <span>Export</span>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {options.map((option: any, index: number) => (
              <Dropdown.Item
                className='export-menu-item'
                key={`export-${index}`}
                onClick={startExporting(option)}
              >
                {option.displayname}
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>
      </OverlayTrigger>
      <ExportModal show={show} closeModal={closeModal} />
    </>
  );
};

export default Export;
