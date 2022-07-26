import '@isrd-isi-edu/chaise/src/assets/scss/_export.scss';

import { useEffect, useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import ExportModal from '@isrd-isi-edu/chaise/src/components/export-modal';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type ExportProps = {
  reference: any;
  /**
   * prop to make export button disable
   */
  disabled: boolean;
};

const Export = ({ reference, disabled }: ExportProps): JSX.Element => {
  /**
   * State variable to export options
   */
  const [options, setOptions] = useState<any[]>([]);
  /**
   * State Variable to store currently exporting object
   */
  const [selectedOption, setSelectedOption] = useState<any>(null);
  /**
   * State Variable to store exporter object which is used to cancel export.
   */
  const [exporterObj, setExporterObj] = useState<any>(null);
  /**
   * State variable to control tooltip visiblity
   */
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const { dispatchError } = useError();

  const { addAlert } = useAlert();

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

      // Update the list of templates in UI
      options.push(...templates);

      setOptions(options);
    }

  }, [reference]);

  /**
   * Send the request for export
   * @param option selected export option
   * @returns Downloads the selected file
   */
  const startExporting = (option: any) => () => {
    const formatType = option.type;

    switch(formatType) {
      case 'DIRECT':
        location.href = reference.csvDownloadLink;
        break;
      case 'BAG':
      case 'FILE':
        setSelectedOption(option);
        const bagName = reference.table.name;
        const exporter = new ConfigService.ERMrest.Exporter(
          reference,
          bagName,
          option,
          ConfigService.chaiseConfig.exportServicePath
        );
        const exportParametersString = JSON.stringify(exporter.exportParameters, null, '  ');

        // begin export and start a timer
        console.info('Executing external export with the following parameters:\n' + exportParametersString);
        console.time('External export duration');

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
              setSelectedOption(null);
              setExporterObj(null);

              console.timeEnd('External export duration');

              // if it was canceled, just ignore the result
              if (response.canceled) return;
              location.href = response.data[0];
            })
            .catch((error: any) => {
              setSelectedOption(null);
              setExporterObj(null);

              console.timeEnd('External export duration');

              error.subMessage = error.message;
              error.message = 'Export failed. Please report this problem to your system administrators.';

              dispatchError({ error: error });
            });
        }
        break;
      default:
        dispatchError({
          error: new Error(`Unsupported export format: ${formatType}. Please report this problem to your system administrators.`)
        });
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
    setSelectedOption(null);

    addAlert('Export request has been canceled.', ChaiseAlertType.WARNING);
  };

  const renderExportIcon = () => {
    return <span className='chaise-btn-icon fa-solid fa-file-export'/>;
  };

  return (
    <>
        <Dropdown className='export-menu' onClick={() => setShowTooltip(false)}>
          <OverlayTrigger
            placement={ConfigService.appSettings.hideNavbar ? 'left' : 'top-end'}
            overlay={<Tooltip>{MESSAGE_MAP.tooltip.export}</Tooltip>}
            onToggle={(next: boolean) => setShowTooltip(next)}
            show={showTooltip}
          >
            <Dropdown.Toggle
              disabled={disabled || !!selectedOption || options.length === 0}
              className='chaise-btn chaise-btn-primary'
            >
              {renderExportIcon()}
              <span>Export</span>
            </Dropdown.Toggle>
          </OverlayTrigger>
          <Dropdown.Menu>
            {options.map((option: any, index: number) => (
              <Dropdown.Item
                className={`export-menu-item export-${makeSafeIdAttr(option.displayname)}`}
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
        show={!!selectedOption}
        closeModal={closeModal}
      />
    </>
  );
};

export default Export;
