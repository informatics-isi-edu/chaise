// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import InputField, { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import { ChangeEvent, ChangeEventHandler, useEffect, useRef, useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { FileObject, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { humanFileSize } from '@isrd-isi-edu/chaise/src/utils/input-utils';

type FileFieldProps = InputFieldProps & {
  /**
   * The column model representing this field in the form.
   */
  columnModel: RecordeditColumnModel,
};

const FileField = (props: FileFieldProps): JSX.Element => {

  const { addAlert } = useAlert();
  const fileInputRef = useRef(null);

  const [fileObject, setFileObject] = useState<FileObject | null>(null);

  const fileElementId = 'fileInput' + Math.round(Math.random() * 100000);
  const fileExtensionFilter = props.columnModel.column.filenameExtFilter;
  // needs to be a comma separated list, i.e. ".jpg", ".png", ...
  const fileExtensions = fileExtensionFilter.join(',');

  const handleChange = (field: any, e: ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (fileInput.files?.length && fileInput.files?.length > 0) {
      let filename = '';

      if (fileExtensionFilter.length > 0) {
        let validFileExtension = false;
        // loop through the array, if any of the extensions in the array match the extension in the current filename, validates as true
        for (let j = 0; j < fileExtensionFilter.length; j++) {
          filename = fileInput.files[0].name;
          if (filename.slice(filename.length - fileExtensionFilter[j].length, filename.length) === fileExtensionFilter[j]) {
            validFileExtension = true;
          }
        }

        if (!validFileExtension) {
          addAlert('Invalid file extension for "' + filename + '". Valid file extensions are ' + fileExtensions, ChaiseAlertType.ERROR);
          return;
        }
      }

      // set the reference value object with selected file, url/filename
      // and also create an Upload object and save it as hatracObj in the value object
      const tempFileObject: FileObject = {
        url: '',
        filename: '',
        filesize: 0
      };
      tempFileObject.file = fileInput.files[0];
      tempFileObject.url = tempFileObject.filename = tempFileObject.file.name;
      tempFileObject.filesize = tempFileObject.file.size;

      setFileObject(tempFileObject);

      field.onChange(tempFileObject);
      field.onBlur();
    }
  };

  /**
 * input-field checks for falsy values, but the check here is different
 */
  const hasValue = (v: any) => {
    return v.url && v.url !== '';
  };

  const onClear = (e: MouseEvent) => {
    const tempFileObject: FileObject = {
      url: '',
      filename: '',
      filesize: 0
    }

    setFileObject(tempFileObject);
  }

  const openFilePicker = () => {
    const fileInputElement = fileInputRef.current;
    if (!fileInputElement) return;

    // does this make sense?
    // NOTE: .click() not available for type never so casting to HTMLInputElement
    (fileInputElement as HTMLInputElement).click();
  }

  const fileTooltip = (fileObj: FileObject) => {
    return (fileObj.filesize ? '- ' + fileObj.filename + '\n- ' + humanFileSize(fileObj.filesize) : fileObj.filename);
  }

  const renderInput = (fieldValue: any, showClear: any, clearInput: any) => {
    return (
      <div
        className={`chaise-input-control has-feedback ${props.classes} ${props.disableInput ? ' input-disabled' : ''}`}
        {... (!props.disableInput && { onClick: openFilePicker })}
      >
        {isStringAndNotEmpty(fieldValue.filename) ?
          <DisplayValue value={{ value: fieldValue.filename, isHTML: true }} /> :
          <span className='chaise-input-placeholder'>{props.placeholder}</span>
        }
        <ClearInputBtn
          btnClassName={`${props.clearClasses} input-switch-clear`}
          clickCallback={clearInput} show={showClear && !props.disableInput}
        />
      </div>
    )
  }

  const renderInputWithTooltip = (fieldValue: any, showClear: any, clearInput: any) => {
    if (!fileObject) return renderInput(fieldValue, showClear, clearInput);

    return (
      <ChaiseTooltip placement='bottom-start' tooltip={fileTooltip(fileObject)}>
        {renderInput(fieldValue, showClear , clearInput)}
      </ChaiseTooltip>
    )
  }

  return (
    <InputField {...props} onClear={onClear} checkHasValue={hasValue}>
      {/* onChange is not used as we're implementing our own onChange method */}
      {(field, onChange, showClear, clearInput) => (
        <div className={`${props.containerClasses} input-switch-file`} style={props.styles}>
          <div className='chaise-input-group'>
            {renderInputWithTooltip(field.value, showClear, clearInput)}
            {!props.disableInput && <ChaiseTooltip placement='bottom' tooltip='Select File'>
              <div className='chaise-input-group-append' tabIndex={0}>
                <label className='chaise-btn chaise-btn-secondary' role='button' htmlFor={fileElementId}>
                  <span className='fa-solid fa-folder-open'></span>
                  <span className='button-text'>Select file</span>
                </label>
              </div>
            </ChaiseTooltip>}
          </div>
          <input
            id={fileElementId}
            className={`${props.inputClasses} chaise-input-hidden`}
            name={props.name}
            type='file'
            accept={fileExtensions}
            tabIndex={-1}
            onChange={(e) => handleChange(field, e)}
            ref={fileInputRef}
          />
        </div >
      )}
    </InputField>
  );
};

export default FileField;
