import '@isrd-isi-edu/chaise/src/assets/scss/_array-field.scss';

// components
import { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import { formatDatetime, getInputType } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import React from 'react';
import {
  DragDropContext, Draggable, DraggableProvided, DroppableProvided, DropResult
} from 'react-beautiful-dnd';
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
  const addNewValueInputName = `${props.inputName}-new-item`;

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
      setValue(`${addNewValueName}-date`, '')
      setValue(`${addNewValueName}-time`, '')
    }
  }

  //-------------------  render logic:   --------------------//

  const DraggableItemRenderer = (item: any, index: number, inputName: string, disableInput: boolean | undefined) => {
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
                  inputName={`${inputName}-${index}`}
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
  containerClassName.push(`array-input-field-container-${name}`);

  const addContainerClassName = ['add-element-container'];
  addContainerClassName.push(`add-element-container-${getInputType({ name: baseArrayType })}`);
  if (!disableInput) {
    addContainerClassName.push('add-padding-bottom');
  }
  if (fields.length) {
    addContainerClassName.push('add-margin-top');
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
                    {fields.map((item: object & { id: string }, index: number) => DraggableItemRenderer(item, index, props.inputName, disableInput))}
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
              inputName={addNewValueInputName}
              displayExtraDateTimeButtons={true}
              displayDateTimeLabels={baseArrayType === 'date' ? false : true}
              disableInput={disableInput}
            />
            <button
              type='button' className='chaise-btn chaise-btn-secondary chaise-btn-sm add-button'
              onClick={() => {
                addItem(addNewValue)
                clearAddNewField()
              }}
              /**
               * We disable the Add button when -
               * 1. There are validation errors in the addNewValue field.
               * 2. The addNewValue field value is empty
               */
              disabled={Object.keys(formState.errors).includes(addNewValueName) || (typeof addNewValue === 'boolean' ? false : !addNewValue)}
            >Add</button>
          </div>
        </div>
        {Object.keys(arrayFormState.errors).includes(name) && requiredInput &&
          <DisplayValue
            internal as='span' className='input-switch-error text-danger'
            value={{ isHTML: true, value: 'Please enter a value for this Array field' }}
          />
        }
      </div>
    </>
  )
}

export default React.memo(ArrayField);

