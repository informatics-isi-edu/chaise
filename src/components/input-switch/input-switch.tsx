import '@isrd-isi-edu/chaise/src/assets/scss/_input-switch.scss';

// components
import ArrayField from '@isrd-isi-edu/chaise/src/components/input-switch/array-field';
import BooleanField from '@isrd-isi-edu/chaise/src/components/input-switch/boolean-field';
import ColorField from '@isrd-isi-edu/chaise/src/components/input-switch/color-field';
import DateField from '@isrd-isi-edu/chaise/src/components/input-switch/date-field';
import DateTimeField from '@isrd-isi-edu/chaise/src/components/input-switch/date-time-field';
import FileField from '@isrd-isi-edu/chaise/src/components/input-switch/file-field';
import ForeignkeyField from '@isrd-isi-edu/chaise/src/components/input-switch/foreignkey-field';
import ForeignkeyDropdownField from '@isrd-isi-edu/chaise/src/components/input-switch/foreignkey-dropdown-field';
import JsonField from '@isrd-isi-edu/chaise/src/components/input-switch/json-field';
import LongtextField from '@isrd-isi-edu/chaise/src/components/input-switch/longtext-field';
import NumericField from '@isrd-isi-edu/chaise/src/components/input-switch/numeric-field';
import TextField from '@isrd-isi-edu/chaise/src/components/input-switch/text-field';
import IframeField from '@isrd-isi-edu/chaise/src/components/input-switch/iframe-field';

// models
import { RecordeditColumnModel, RecordeditForeignkeyCallbacks } from '@isrd-isi-edu/chaise/src/models/recordedit';
import React, { type JSX } from 'react';

export type InputSwitchProps = {
  /**
   * the type of input :
   * int
   * float
   * numeric
   * date
   * timestamp
   */
  type: string,
  /**
   *  the name of the field for react hook form (with no special characters)
   */
  name: string,
  /**
   *  the name of the field for attaching a specific class to input-switch-container and the input
   */
  inputClassName: string,
  /**
   * placeholder text for numeric and date fields
   */
  placeholder?: string,
  /**
   * classes for styling the numeric and date input element
   */
  classes?: string,
  /**
   * Optional string of classes to attach to the input/textarea etc element
   */
  inputClasses?: string,
  containerClasses?: string,
  /**
   * classes for styling the time input element
   */
  timeClasses?: string,
  /**
   * classes for styling the clear button
   */
  clearClasses?: string
  /**
   * classes for styling the clear button for time field
   */
  clearTimeClasses?: string
  /**
   * whether this input is required or not
   */
  requiredInput?: boolean,
  /**
   * flag for disabling the input
   */
  disableInput?: boolean,
  /**
   * flag to show error below the input switch component
   */
  displayErrors?: boolean,
  /**
   * display required error regardless of whether the form has been submitted or not.
   */
  displayRequiredErrorBeforeSubmit?: boolean
  /**
   * the handler function called on input change
   */
  onFieldChange?: ((value: string) => void),
  /**
   * inline styling for the input switch component
   */
  styles?: object,
  /**
   * The column model that is used for this input
   * (usd in boolean and foreignkey inputs)
   */
  columnModel?: RecordeditColumnModel,
  /**
   * the app mode that this input is used in
   * (used in foreignkey input)
   */
  appMode?: string,
  /**
   * the "formNumber" that this input belongs to
   * (used in foreignkey input)
   */
  formNumber?: number,
  /**
   * The reference that is used for the form
   * (used in foreignkey input)
   */
  parentReference?: any,
  /**
   * The tuple representing the row.
   * Available only in edit mode.
   * (used for foreignkey input)
   */
  parentTuple?: any,
  /**
   * the log stack of the form
   */
  parentLogStack?: any,
  /**
   * the log stack path of the form
   */
  parentLogStackPath?: string,
  /**
   * the ref used to capture the foreignkey data
   */
  foreignKeyData?: React.MutableRefObject<any>,
  /**
   * whether we're still waiting for foreignkey data
   */
  waitingForForeignKeyData?: boolean,
  /**
   * customize the foreignkey callbacks
   */
  foreignKeyCallbacks?: RecordeditForeignkeyCallbacks,
  /**
   * whether we should offer the extra now/today buttons
   */
  displayExtraDateTimeButtons?: boolean,
  /**
   * whether we should display the date/time labels
   */
  displayDateTimeLabels?: boolean
  /**
   * `optional`additional controller rules for the input field.
   *  Check allowed rules here - https://react-hook-form.com/docs/useform/register#options
   */
  additionalControllerRules?: {
    [key: string]: (string | number | boolean | RegExp | Function | object) | RuleWithMessage
  }
};

export type RuleWithMessage = {
  value: (boolean | number | RegExp),
  message: string
};

const InputSwitch = ({
  type,
  name,
  inputClassName,
  placeholder,
  classes = '',
  inputClasses = '',
  containerClasses = '',
  timeClasses = '',
  clearClasses,
  clearTimeClasses,
  disableInput,
  requiredInput,
  displayErrors = true,
  displayRequiredErrorBeforeSubmit = false,
  styles = {},
  columnModel,
  appMode,
  formNumber,
  parentReference,
  parentTuple,
  parentLogStack,
  parentLogStackPath,
  foreignKeyData,
  waitingForForeignKeyData,
  displayExtraDateTimeButtons,
  displayDateTimeLabels,
  additionalControllerRules,
  foreignKeyCallbacks
}: InputSwitchProps ): JSX.Element | null => {


  return (() => {
    switch (type) {
      case 'iframe':
        if (!columnModel) {
          throw new Error('columnModel is needed for iframe inputs.');
        }
        return <IframeField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          placeholder={placeholder as string}
          columnModel={columnModel}
          appMode={appMode}
          formNumber={formNumber}
          parentReference={parentReference}
          parentTuple={parentTuple}
        />;
      case 'array':
        return <ArrayField
          baseArrayType={columnModel?.column.type.baseType.name}
          type={type}
          name={name}
          inputClassName={inputClassName}
          columnModel={columnModel?.column.type.rootName === 'timestamptz' ? columnModel : undefined}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          allowEnter={true}
        />;
      case 'popup-select':
        if (!columnModel) {
          throw new Error('columnModel is needed for popup-select inputs.');
        }
        return <ForeignkeyField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          columnModel={columnModel}
          appMode={appMode}
          formNumber={formNumber}
          parentReference={parentReference}
          parentTuple={parentTuple}
          parentLogStack={parentLogStack}
          parentLogStackPath={parentLogStackPath}
          foreignKeyData={foreignKeyData}
          waitingForForeignKeyData={waitingForForeignKeyData}
          additionalControllerRules={additionalControllerRules}
          foreignKeyCallbacks={foreignKeyCallbacks}
        />
      case 'dropdown-select':
        if (!columnModel) {
          throw new Error('columnModel is needed for popup-select inputs.');
        }
        return <ForeignkeyDropdownField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          columnModel={columnModel}
          appMode={appMode}
          formNumber={formNumber}
          parentReference={parentReference}
          parentTuple={parentTuple}
          parentLogStack={parentLogStack}
          parentLogStackPath={parentLogStackPath}
          foreignKeyData={foreignKeyData}
          waitingForForeignKeyData={waitingForForeignKeyData}
          foreignKeyCallbacks={foreignKeyCallbacks}
        />
      case 'file':
        if (!columnModel) {
          throw new Error('columnModel is needed for file inputs.');
        }
        return <FileField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          columnModel={columnModel}
          additionalControllerRules={additionalControllerRules}
        />
      case 'timestamp':
        return <DateTimeField
          timeClasses={timeClasses}
          clearTimeClasses={clearTimeClasses}
          type={type}
          hasTimezone={columnModel?.column.type.rootName === 'timestamptz'}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          displayExtraDateTimeButtons={displayExtraDateTimeButtons}
          displayDateTimeLabels={displayDateTimeLabels}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'date':
        return <DateField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          displayExtraDateTimeButtons={displayExtraDateTimeButtons}
          displayDateTimeLabels={displayDateTimeLabels}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'integer2':
      case 'integer4':
      case 'integer8':
      case 'number':
        return <NumericField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'boolean':
        return <BooleanField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          columnModel={columnModel}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'markdown':
      case 'longtext':
        return <LongtextField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          allowEnter={true}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'json':
      case 'jsonb':
        return <JsonField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          allowEnter={true}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'color':
        return <ColorField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          additionalControllerRules={additionalControllerRules}
        />;
      case 'text':
      default:
        return <TextField
          type={type}
          name={name}
          inputClassName={inputClassName}
          classes={classes}
          inputClasses={inputClasses}
          containerClasses={containerClasses}
          clearClasses={clearClasses}
          disableInput={disableInput}
          requiredInput={requiredInput}
          styles={styles}
          displayErrors={displayErrors}
          displayRequiredErrorBeforeSubmit={displayRequiredErrorBeforeSubmit}
          placeholder={placeholder as string}
          additionalControllerRules={additionalControllerRules}
        />
    }
  })();
};

export default React.memo(InputSwitch);
