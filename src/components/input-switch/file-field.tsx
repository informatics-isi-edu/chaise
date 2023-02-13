// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ClearInputBtn from '@isrd-isi-edu/chaise/src/components/clear-input-btn';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';

// models
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';
import { FileObject, RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';

// utils
import { fireCustomEvent } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { humanFileSize } from '@isrd-isi-edu/chaise/src/utils/input-utils';

type FileFieldProps = {
  /**
   *  the name of the field
   */
  name: string,
  /**
  * placeholder text
  */
  placeholder?: string,
  /**
  * classes for styling the input element
  */
  classes?: string,
  inputClasses?: string,
  containerClasses?: string,
  /**
  * classes for styling the clear button
  */
  clearClasses?: string
  /**
  * flag for disabling the input
  */
  disableInput?: boolean,
  /**
  * flag to show error below the input switch component
  */
  displayErrors?: boolean,
  value: string,
  styles?: any,
  /**
  * the handler function called on input change
  */
  onFieldChange?: ((value: string) => void),
  /**
   * The column model representing this field in the form.
   */
  columnModel: RecordeditColumnModel,
  /**
   * The reference that is used for the form
   */
  parentReference?: any,
};

const FileField = ({
  name,
  placeholder = 'No file selected',
  classes,
  inputClasses,
  clearClasses,
  disableInput,
  displayErrors,
  value,
  containerClasses,
  styles,
  onFieldChange,
  columnModel,
  parentReference,
}: FileFieldProps): JSX.Element => {

  const { addAlert } = useAlert();
  const fileInputRef = useRef(null);

  const { setValue, control, clearErrors } = useFormContext();

  const registerOptions = {
    required: false
  };

  const formInput = useController({
    name,
    control,
    rules: registerOptions,
  });

  const field = formInput?.field;
  const fieldValue = field?.value;
  const [showClear, setShowClear] = useState<boolean>(fieldValue.url && fieldValue.url !== '');
  const [fileObject, setFileObject] = useState<FileObject | null>(null);

  const fieldState = formInput?.fieldState;
  const { error, isTouched } = fieldState;

  const fileElementId = 'fileInput' + Math.round(Math.random() * 100000);
  const fileExtensionFilter = columnModel.column.filenameExtFilter;
  // needs to be a comma separated list, i.e. ".jpg", ".png", ...
  const fileExtensions = fileExtensionFilter.join(",");

  useEffect(() => {
    if (onFieldChange) {
      onFieldChange(fieldValue);
    }
    if (showClear != Boolean(fieldValue)) {
      setShowClear(Boolean(fieldValue.url && fieldValue.url !== ''));
    }
  }, [fieldValue]);

  useEffect(() => {
    if (value === undefined) return;
    setValue(name, value);
  }, [value]);

  useEffect(() => {
    fireCustomEvent('input-switch-error-update', `.input-switch-container-${name}`, { inputFieldName: name, msgCleared: !Boolean(error?.message) });
  }, [error?.message]);

  const handleChange = (e: any) => {
    const fileInput = e.target as HTMLInputElement;
    if (fileInput.files?.length && fileInput.files?.length > 0) {
      let filename = '';

      if (fileExtensionFilter.length > 0) {
        let validFileExtension = false;
        // loop through the array, if any of the extensions in the array match the extension in the current filename, validates as true
        for (var j = 0; j < fileExtensionFilter.length; j++) {
          filename = fileInput.files[0].name;
          if (filename.slice(filename.length - fileExtensionFilter[j].length, filename.length) == fileExtensionFilter[j]) {
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
      const tempFileObject: any = {};
      tempFileObject.file = fileInput.files[0];
      tempFileObject.url = tempFileObject.filename = tempFileObject.file.name;
      tempFileObject.filesize = tempFileObject.file.size;

      setFileObject(tempFileObject);

      field.onChange(tempFileObject);
      field.onBlur();
    }
  };

  const clearInput = (e: MouseEvent) => {
    // don't click the input
    e.stopPropagation();
    e.preventDefault();

    const tempFileObject: FileObject = {
      url: '',
      filename: '',
      filesize: 0
    }

    setFileObject(tempFileObject);

    setValue(name, '');
    clearErrors(name);
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

  const renderInput = () => {
    return (
      <div className={`chaise-input-control has-feedback ${classes} ${disableInput ? ' input-disabled' : ''}`} onClick={openFilePicker}>
        {isStringAndNotEmpty(fieldValue.filename) ?
          <DisplayValue value={{ value: fieldValue.filename, isHTML: true }} /> :
          <span className='chaise-input-placeholder'>{placeholder}</span>
        }
        <ClearInputBtn btnClassName={`${clearClasses} input-switch-clear`} clickCallback={clearInput} show={showClear} />
      </div>
    )
  }

  const renderInputWithTooltip = () => {
    if (!fileObject) return renderInput();

    return (
      <ChaiseTooltip placement='bottom-start' tooltip={fileTooltip(fileObject)}>
        {renderInput()}
      </ChaiseTooltip>
    )
  }

  return (
    <div className={`${containerClasses} input-switch-file input-switch-container-${name}`} style={styles}>
      <div className='chaise-input-group'>
        {renderInputWithTooltip()}
        <ChaiseTooltip placement='bottom' tooltip='Select File'>
          <div className='chaise-input-group-append' tabIndex={0}>
            <label className='chaise-btn chaise-btn-secondary' role='button' htmlFor={fileElementId}>
              <span className='fa-solid fa-folder-open'></span>
              <span className='button-text'>Select file</span>
            </label>
          </div>
        </ChaiseTooltip>
      </div>
      <input
        id={fileElementId}
        className='chaise-input-hidden'
        name={name}
        type='file'
        accept={fileExtensions}
        tabIndex={-1}
        onChange={handleChange}
        ref={fileInputRef}
      />
      <input className={inputClasses} {...field} type='hidden' />
      {displayErrors && isTouched && error?.message && <span className='input-switch-error text-danger'>{error.message}</span>}
    </div >
  );
};

export default FileField;
