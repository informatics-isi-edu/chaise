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
  /**
   * We use this to keep track of errors in new value input box
   */
  const formState = useFormState({ name: `${name}-new-item` });
  /**
   * We use this to keep track of value in new value input box
   */
  const addNewValue = useWatch({ name: `${name}-new-item` });


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
    setValue(`${name}-new-item`, '')

    if (getInputType({ name: baseArrayType }) === 'timestamp') {
      setValue(`${name}-new-item-date`, '')
      setValue(`${name}-new-item-time`, '')
    }
  }


  const DraggableItemRenderer = (item: any, index: number, disableInput: boolean | undefined) => {

    return <Draggable key={item.id} draggableId={name + '-' + item.id.toString()} index={index} isDragDisabled={disableInput}>
      {
        (provided: DraggableProvided) => {
          return <li className={`item ${getInputType({ name: baseArrayType })} ${!disableInput ? 'add-padding-bottom' : ''}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} key={item.id}>

            <div className='move-icon'>
              <i className='fa-solid fa-grip-vertical'></i>
            </div>


            <div className='item-input'>
              <InputSwitch
                {...props}
                type={getInputType({ name: baseArrayType })}
                key={item.id}
                {...register(`${name}.${index}.val`, {
                  value: item.val,
                  onChange: () => trigger(`${name}.${index}.val`)
                })}
                displayExtraDateTimeButtons={true}
                displayDateTimeLabels={baseArrayType === 'date' ? false : true}
                requiredInput={true}
                isArrayElement={true}
              />
            </div>

            <div>
              {
                !disableInput &&
                <div className='action-buttons'>
                  <button
                    type='button' className='fa-solid fa-trash chaise-btn chaise-btn-tertiary chaise-btn-sm'
                    onClick={() => { remove(index) }}
                  />
                </div>
              }
            </div>
          </li>
        }
      }
    </Draggable>

  }

  return (
    <>
      <div className={`array-input-field-container ${name} ${getInputType({ name: baseArrayType })}`}>
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
                    {fields.map((item: object & { id: string }, index: number) => DraggableItemRenderer(item, index, disableInput))}
                    {provided.placeholder}
                  </ul>
                )
              }
            </ChaiseDroppable>
          </DragDropContext>
          <div className={`add-element-container ${getInputType({ name: baseArrayType })} ${!disableInput ? 'add-padding-bottom' : ''} ${fields.length ? 'add-margin-top' : ''}`}>
            <InputSwitch
              type={getInputType({ name: baseArrayType })}
              {...register(`${name}-new-item`, {
                value: '',
                onChange: () => trigger(`${name}-new-item`),
              })}
              displayExtraDateTimeButtons={true}
              displayDateTimeLabels={baseArrayType === 'date' ? false : true}

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
              disabled={Object.keys(formState.errors).includes(`${name}-new-item`) || (typeof addNewValue === 'boolean' ? false : !addNewValue)}
            >Add</button>
          </div>
        </div>
        {Object.keys(arrayFormState.errors).includes(name) && requiredInput &&
          <DisplayValue internal as='span' className='input-switch-error text-danger' value={{ isHTML: true, value: 'Please enter a value for this Array field' }} />
        }
      </div>
    </>
  )
}

export default React.memo(ArrayField);

