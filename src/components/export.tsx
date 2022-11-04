
// components
import Dropdown from 'react-bootstrap/Dropdown';
import ExportModal from '@isrd-isi-edu/chaise/src/components/modals/export-modal';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utils
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

type ExportProps = {
  reference: any,
  /**
   * if this is based on one tuple (record page), this should be passed
   */
  tuple?: any,
  /**
   * prop to make export button disable
   */
  disabled: boolean,
  /**
   * can be used to modify the csv option name
   */
  csvOptionName?: string
};

const Export = ({
  reference,
  tuple,
  disabled,
  csvOptionName
}: ExportProps): JSX.Element => {
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
   * when the dropdown is open, we should not use the tooltip
   */
  const [useTooltip, setUseTooltip] = useState(true);
  /**
   * whether to show the tooltip or not
   */
  const [showTooltip, setShowTooltip] = useState(false);

  const { dispatchError } = useError();

  const { addAlert } = useAlert();

  useEffect(() => {
    const options: any = [];
    try {
      if (reference) {
        if (reference.csvDownloadLink) {
          options.push({
            displayname: csvOptionName ? csvOptionName : 'Search results (CSV)',
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
    } catch (exp) {
      // fail silently
      // if there's something wrong with the reference, other parts
      // of the page have already thrown an error.
    }

  }, []);

  /**
   * Send the request for export
   * @param option selected export option
   * @returns Downloads the selected file
   */
  const startExporting = (option: any) => () => {
    const formatType = option.type;
    switch (formatType) {
      case 'DIRECT':
        location.href = reference.csvDownloadLink;
        break;
      case 'BAG':
      case 'FILE':
        setSelectedOption(option);
        const exporter = new ConfigService.ERMrest.Exporter(
          reference,
          reference.table.name + (tuple ? `_${tuple.uniqueId}` : ''),
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

              dispatchError({ error, isDismissible: true });
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

  // nextShow is true when the dropdown is open
  const onDropdownToggle = (nextShow: boolean) => {
    // toggle the tooltip based on dropdown's inverse state
    setUseTooltip(!nextShow);
    if (nextShow === true) setShowTooltip(false);

    // log the action
    if (nextShow) {
      LogService.logClientAction({
        action: LogService.getActionString(LogActions.EXPORT_OPEN),
        stack: LogService.getStackObject()
      }, reference.defaultLogInfo)
    }
  };

  return (
    <>
      <Dropdown className='export-menu' onToggle={onDropdownToggle}>
        <ChaiseTooltip
          placement='bottom' tooltip={MESSAGE_MAP.tooltip.export}
          show={showTooltip} onToggle={(show) => setShowTooltip(useTooltip && show)}
        >
          <Dropdown.Toggle
            disabled={disabled || !!selectedOption || options.length === 0}
            className='chaise-btn chaise-btn-primary'
          >
            <span className='chaise-btn-icon fa-solid fa-file-export' />
            <span>Export</span>
          </Dropdown.Toggle>
        </ChaiseTooltip>
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
