import '@isrd-isi-edu/chaise/src/assets/scss/_array-field.scss';

// components
import { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import { CUSTOM_ERROR_TYPES, ERROR_MESSAGES, formatDatetime, getInputType } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import React, { type JSX } from 'react';
import {
  DragDropContext, Draggable, DraggableProvided, DroppableProvided, DropResult
} from '@hello-pangea/dnd';
import { useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import ChaiseDroppable from '@isrd-isi-edu/chaise/src/components/chaise-droppable';
import { RecordeditColumnModel } from '@isrd-isi-edu/chaise/src/models/recordedit';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';


type ArrayFieldProps = InputFieldProps & {
  /**
   * the type of each element in the array
   */
  baseArrayType: string,
  /**
   * The column model that is used for this input
   */
  columnModel?: RecordeditColumnModel
};

const ArrayField = (props: ArrayFieldProps): JSX.Element => {
  const { disableInput, name, baseArrayType, requiredInput, columnModel } = props;
  const { register, trigger, control, setValue } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    name: name,
    control: control,
    rules: {
      required: requiredInput
    }
  });

  /**
   * We use this to keep track of errors in array field
   */
  const arrayFormState = useFormState({ name: name });

  const addNewValueName = `${name}-new-item`;
  const addNewValueInputClassName = `${props.inputClassName}-new-item`;

  /**
   * We use this to keep track of errors in new value input box
   */
  const formState = useFormState({ name: addNewValueName });
  /**
   * We use this to keep track of value in new value input box
   */
  const addNewValue = useWatch({ name: addNewValueName });

  // register the input that is used for adding new value
  register(addNewValueName, {
    value: '',
    onChange: () => trigger(addNewValueName),
  });

  //-------------------  callbacks:   --------------------//

  const handleOnDragEnd = (result: DropResult) => {
    if (result.destination) {
      move(result.source.index, result.destination.index);
    }
  }

  const addItem = (value: any) => {

    let valueToAdd: any = {
      'val': value
    }

    if (getInputType({ name: baseArrayType }) === 'timestamp') {

      const DATE_TIME_FORMAT = columnModel?.column.type.rootName === 'timestamptz' ? dataFormats.datetime.return : dataFormats.timestamp;
      const v = formatDatetime(value, { outputMomentFormat: DATE_TIME_FORMAT })

      valueToAdd = {
        'val': v?.datetime,
        'val-date': v?.date,
        'val-time': v?.time
      }
    }

    append(valueToAdd)
  }

  const clearAddNewField = () => {
    setValue(addNewValueName, '')
    if (getInputType({ name: baseArrayType }) === 'timestamp') {
      setValue(`${addNewValueName}-date`, '');
      setValue(`${addNewValueName}-time`, '');
    }
    trigger(addNewValueName);
  }

  const addNewInputhasValue = (baseType: any, v: any): boolean => {
    return baseType === 'boolean' ? typeof v === 'boolean' : !!v
  }

  //-------------------  render logic:   --------------------//

  const DraggableItemRenderer = (item: any, index: number, inputClassName: string, disableInput: boolean | undefined) => {
    return <Draggable key={item.id} draggableId={name + '-' + item.id.toString()} index={index} isDragDisabled={disableInput}>
      {
        (provided: DraggableProvided) => {
          const { name: newInputName } = register(`${name}.${index}.val`, {
            value: item.val,
            onChange: () => trigger(`${name}.${index}.val`)
          });

          return (
            <li
              className={`item item-${getInputType({ name: baseArrayType })} ${!disableInput ? 'add-padding-bottom' : ''}`}
              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} key={item.id}
            >

              <div className='move-icon'>
                <i className='fa-solid fa-grip-vertical'></i>
              </div>

              <div className='item-input'>
                <InputSwitch
                  {...props}
                  name={newInputName}
                  inputClassName={`${inputClassName}-${index}-val`}
                  type={getInputType({ name: baseArrayType })}
                  key={item.id}
                  displayExtraDateTimeButtons={true}
                  displayDateTimeLabels={baseArrayType === 'date' ? false : true}
                  requiredInput={true}
                  displayRequiredErrorBeforeSubmit={true}
                />
              </div>

              <div>
                {
                  !disableInput &&
                  <div className='action-buttons'>
                    <button
                      type='button' className='fa-solid fa-trash chaise-btn chaise-btn-tertiary chaise-btn-sm array-remove-button'
                      onClick={() => { remove(index) }}
                    />
                  </div>
                }
              </div>
            </li>
          )
        }
      }
    </Draggable>
  };

  const containerClassName = ['array-input-field-container'];
  // used in scss:
  containerClassName.push(`array-input-field-container-${getInputType({ name: baseArrayType })}`);
  // used in testing:
  containerClassName.push(`array-input-field-container-${props.inputClassName}`);

  const addContainerClassName = ['add-element-container'];
  addContainerClassName.push(`add-element-container-${getInputType({ name: baseArrayType })}`);
  if (!disableInput) {
    addContainerClassName.push('add-padding-bottom');
  }
  if (fields.length) {
    addContainerClassName.push('add-margin-top');
  }

  /**
   * disable the add button if there aren't any valid value in it.
   * we also have to make sure to ignore the ARRAY_ADD_OR_DISCARD_VALUE error
   */
  let disableAddNewBtn = !addNewInputhasValue(baseArrayType, addNewValue);
  if (formState.errors[addNewValueName] && formState.errors[addNewValueName].type !== CUSTOM_ERROR_TYPES.ARRAY_ADD_OR_DISCARD_VALUE) {
    disableAddNewBtn = true;
  }

  return (
    <>
      <div className={containerClassName.join(' ')}>
        <div className='input-items-container-new'>
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <ChaiseDroppable droppableId={`${name}-input-items-new`}>
              {
                (provided: DroppableProvided) => (
                  <ul
                    className={'input-items-new'}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    key={`${name}-list`}
                  >
                    {fields.map((item: object & { id: string }, index: number) => {
                      return DraggableItemRenderer(item, index, props.inputClassName, disableInput)
                    })}
                    {provided.placeholder}
                  </ul>
                )
              }
            </ChaiseDroppable>
          </DragDropContext>
          <div className={addContainerClassName.join(' ')}>
            <InputSwitch
              type={getInputType({ name: baseArrayType })}
              name={addNewValueName}
              inputClassName={addNewValueInputClassName}
              displayExtraDateTimeButtons={true}
              displayDateTimeLabels={baseArrayType === 'date' ? false : true}
              disableInput={disableInput}
              additionalControllerRules={{
                validate: {
                  addOrDiscardValue: (v: any) => {
                    return !addNewInputhasValue(baseArrayType, v) || ERROR_MESSAGES.ARRAY_ADD_OR_DISCARD_VALUE
                  }
                }
              }}
            />
            <button
              type='button' className='chaise-btn chaise-btn-secondary chaise-btn-sm add-button'
              onClick={() => {
                addItem(addNewValue)
                clearAddNewField()
              }}
              disabled={disableAddNewBtn}
            >Add</button>
          </div>
        </div>
        {
          Object.keys(arrayFormState.errors).includes(name) && requiredInput &&
          <DisplayValue
            internal as='span' className='input-switch-error input-switch-error-danger'
            value={{ isHTML: true, value: ERROR_MESSAGES.REQUIRED }}
          />
        }
      </div>
    </>
  )
}

export default React.memo(ArrayField);

