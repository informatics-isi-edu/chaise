
// components
import Dropdown from 'react-bootstrap/Dropdown';
import ExportModal from '@isrd-isi-edu/chaise/src/components/modals/export-modal';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DropdownSubmenu, { DropdownSubmenuDisplayTypes } from '@isrd-isi-edu/chaise/src/components/dropdown-submenu';

// hooks
import { useEffect, useRef, useState } from 'react';
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

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
import { isGroupIncluded } from '@isrd-isi-edu/chaise/src/utils/authn-utils';
import { saveObjectAsJSONFile } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { MenuOption, MenuOptionTypes } from '@isrd-isi-edu/chaise/src/utils/menu-utils';

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

enum ExportType {
  DIRECT = 'DIRECT',
  BAG = 'BAG',
  FILE = 'FILE'
}

const Export = ({
  reference,
  tuple,
  disabled,
  csvOptionName
}: ExportProps): JSX.Element => {

  const { dispatchError } = useError();
  const { addAlert } = useAlert();
  const { session } = useAuthn();

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

  const dropdownWrapper = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const options: any = [];
    try {
      if (reference) {
        if (reference.csvDownloadLink) {
          options.push({
            displayname: csvOptionName ? csvOptionName : 'Search results (CSV)',
            type: ExportType.DIRECT,
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


  //-------------------  callbacks:   --------------------//

  const _getExporterProps = (option: any) => {
    const exporter = new ConfigService.ERMrest.Exporter(
      reference,
      reference.table.name + (tuple ? `_${tuple.uniqueId}` : ''),
      option,
      ConfigService.chaiseConfig.exportServicePath
    );
    return {
      exporter,
      stack: LogService.addExtraInfoToStack(null, {
        template: {
          displayname: exporter.template.displayname,
          type: exporter.template.type
        }
      })
    };
  }

  const downloadExportConfiguration = (option: any) => {
    const res = _getExporterProps(option);
    saveObjectAsJSONFile(res.exporter.exportParameters, `${option.displayname}.json`);

    LogService.logClientAction({
      action: LogService.getActionString(LogActions.EXPORT_CONFIG_DOWNLOAD),
      stack: res.stack
    }, reference.defaultLogInfo);

  }

  /**
   * Send the request for export
   * @param option selected export option
   * @returns Downloads the selected file
   */
  const startExporting = (option: any) => {
    const formatType = option.type;
    switch (formatType) {
      case ExportType.DIRECT:
        location.href = reference.csvDownloadLink;
        break;
      case ExportType.BAG:
      case ExportType.FILE:
        setSelectedOption(option);
        const res = _getExporterProps(option);
        const exporter = res.exporter;
        const logStack = res.stack;

        const exportParametersString = JSON.stringify(exporter.exportParameters, null, '  ');

        // begin export and start a timer
        console.info('Executing external export with the following parameters:\n' + exportParametersString);
        console.time('External export duration');

        setExporterObj(exporter);
        const logObj = {
          action: LogService.getActionString(LogActions.EXPORT),
          stack: logStack
        }
        exporter.run(logObj).then((response: any) => {
          setSelectedOption(null);
          setExporterObj(null);

          console.timeEnd('External export duration');

          // if it was canceled, just ignore the result
          if (response.canceled) return;
          location.href = response.data[0];
        }).catch((error: any) => {
          setSelectedOption(null);
          setExporterObj(null);

          console.timeEnd('External export duration');

          error.subMessage = error.message;
          error.message = 'Export failed. Please report this problem to your system administrators.';

          dispatchError({ error, isDismissible: true });
        });
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
  };

  const closeModal = () => {
    cancelExport();
    setSelectedOption(null);

    addAlert('Export request has been canceled.', ChaiseAlertType.WARNING);
  };

  /**
   * called when users want to toggle the main dropdown
   * used for conditionally hiding the tooltip when the dropdown is open. and do client logging.
   */
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

  //-------------------  render logic:   --------------------//

  // generate the submenu options if there are any non-direct templates
  const configsSubmenu: MenuOption[] = [];
  const configsSubmenuOptions: MenuOption[] = [];
  options.forEach((o) => {
    if (o.type === ExportType.DIRECT) return;

    configsSubmenuOptions.push({
      type: MenuOptionTypes.CALLBACK,
      nameMarkdownPattern: o.displayname,
      callback: () => downloadExportConfiguration(o),
      acls: { show: ['*'], enable: ['*'] },
      isValid: true,
      newTab: false,
      className: `export-submenu-item export-submenu-item-${makeSafeIdAttr(o.displayname)}`
    });
  });

  const showConfigsSubmenu = isGroupIncluded(ConfigService.chaiseConfig.exportConfigsSubmenu.acls.show, session);
  if (showConfigsSubmenu && configsSubmenuOptions.length > 0) {
    configsSubmenu.push({
      type: MenuOptionTypes.MENU,
      nameMarkdownPattern: 'Configurations',
      children: configsSubmenuOptions,
      acls: ConfigService.chaiseConfig.exportConfigsSubmenu.acls,
      logAction: LogActions.EXPORT_CONFIG_OPEN,
      isValid: true,
      newTab: false,
      className: 'export-menu-item export-menu-item-configurations'
    });
  }

  return (
    <>
      <Dropdown className='export-menu chaise-dropdown' onToggle={onDropdownToggle} ref={dropdownWrapper}>
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
        <Dropdown.Menu
          // the following is needed by DropdownSubmenu
          renderOnMount
          align={{ sm: 'start' }}
        >
          {options.map((option: any, index: number) => (
            <Dropdown.Item
              className={`export-menu-item export-menu-item-${makeSafeIdAttr(option.displayname)}`}
              key={`export-${index}`}
              onClick={() => startExporting(option)}
            >
              {option.displayname}
            </Dropdown.Item>
          ))}
          {configsSubmenu.length > 0 && <Dropdown.Divider />}
          {configsSubmenu.length > 0 &&
            <DropdownSubmenu
              displayType={DropdownSubmenuDisplayTypes.GENERAL}
              menu={configsSubmenu} parentDropdown={dropdownWrapper}
            />
          }
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
