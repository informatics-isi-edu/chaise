import '@isrd-isi-edu/chaise/src/assets/scss/_export.scss';

import { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { Button, Modal } from 'react-bootstrap';

import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

type ExportProps = {
  reference: any;
  /**
   * prop to make export button disable
   */
  disabled: boolean;
  /**
   * prop that triggers download cancel
   */
  onCancelDownload: any
};

type ExportModalProps = {
  /**
   * prop to set export modal title
   */
  title: string;
  /**
   * prop to show modal
   */
  show: boolean;
  /**
   * prop to close modal
   */
  closeModal: () => void;
};

const Export = ({ reference, disabled, onCancelDownload }: ExportProps): JSX.Element => {
  /**
   * State variable to open progress modal dialog
   */
  const [show, setShow] = useState(false);
  /**
   * State variable to export options
   */
  const [options, setOptions] = useState([]);
  /**
   * State Variable to store currently exporting object
   */
  const [selectedOption, setSelectedOption] = useState(null);
  /**
   * State Variable to store exporter object which is used to cancel export.
   */
  const [exporterObj, setExporterObj] = useState(null);

  useEffect(() => {
    const options: any = [];

    if (reference) {
      if (reference.csvDownloadLink) {
        options.push({
          displayname: 'Search results (CSV)',
          type: 'DIRECT',
        });
      }
  
      const templates = reference.getExportTemplates(
        !ConfigService.chaiseConfig.disableDefaultExport
      );
      
      options.push(...templates);
  
      setOptions(options);
    }

  }, [reference]);

  const startExporting = (option: any) => () => {
    const formatType = option.type;

    switch(formatType) {
      case 'DIRECT':
        location.href = reference.csvDownloadLink;
        break;
      case 'BAG':
      case 'FILE': 
        setShow(true);
        setSelectedOption(option);
        const bagName = reference.table.name;
        const exporter = new ConfigService.ERMrest.Exporter(
          reference,
          bagName,
          option,
          ConfigService.chaiseConfig.exportServicePath
        );
        setExporterObj(exporter);
        if (exporter) {
          const logStack = LogService.addExtraInfoToStack(null, {
              template: {
                  displayname: exporter.template.displayname,
                  type: exporter.template.type
              }
          });
          const logObj = {
              action: LogService.getActionString(LogActions.EXPORT),
              stack: logStack
          }
          exporter
            .run(logObj)
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

  const cancelExport = () => {
    // Cancel download
    if (!!exporterObj) {
      exporterObj.cancel();
    }
  }

  const closeModal = () => {
    cancelExport();
    setShow(false);

    // Call parent component callback to show alert box
    onCancelDownload();
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
          <Modal.Title>{title}</Modal.Title>
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
          <Button className='chaise-btn chaise-btn-primary' variant='outline-primary' onClick={closeModal}>
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
        <Dropdown className='export-menu'>
          <OverlayTrigger
            placement='left'
            overlay={<Tooltip>{MESSAGE_MAP.tooltip.export}</Tooltip>}
          >
            <Dropdown.Toggle
              disabled={disabled}
              variant='success'
              className='chaise-btn chaise-btn-primary'
            >
              {renderExportIcon()}
              <span>Export</span>
            </Dropdown.Toggle>
          </OverlayTrigger>
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
      
      <ExportModal 
        title={`Exporting ${selectedOption ? selectedOption.displayname : ''}`}
        show={show} 
        closeModal={closeModal} 
      />
    </>
  );
};

export default Export;
