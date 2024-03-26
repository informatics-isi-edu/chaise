import '@isrd-isi-edu/chaise/src/assets/scss/_array-field.scss';

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
import { dataFormats } from '../../utils/constants';
import ChaiseDroppable from '../chaise-droppable';


type ArrayFieldProps = InputFieldProps & {
  /**
   * the type of each element in the array
   */
  baseArrayType: string,
  /**
   * represents the presence of timezone in case of TimeStamp field
   */
  hasTimezone?: boolean
  /**
   * represents the presence of timezone in case of TimeStamp field
   */
  hasTimezone?: boolean
};

const ArrayField = (props: ArrayFieldProps): JSX.Element => {
  const { disableInput, name, baseArrayType } = props;
  const { register, trigger, control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ name: name, control: control });
  /**
   * We use this to keep track of errors in new value input box
   */
  const formState = useFormState({ name: `${name}-new-item` });
  const addNewValue = useWatch({ name: `${name}-new-item` });


  const handleOnDragEnd = (result: DropResult) => {
    if (result.destination) {
      move(result.source.index, result.destination.index);
    }
  }

  const addItem = (value: any) => {

    let valueToAdd: any = {
      "val": value
    }

    if (getInputType({ name: baseArrayType }) === `timestamp`) {
      const DATE_TIME_FORMAT = props.hasTimezone ? dataFormats.datetime.return : dataFormats.timestamp;
      const v = formatDatetime(value, { outputMomentFormat: DATE_TIME_FORMAT })

      valueToAdd["val-date"] = v?.date
      valueToAdd["val-time"] = v?.time
    }

    append(valueToAdd)
  }


  const DraggableItemRenderer = (item: any, index: number, disableInput: boolean | undefined) => {

    return <Draggable key={item.id} draggableId={name + '-' + item.id.toString()} index={index} isDragDisabled={disableInput}>
      {
        (provided: DraggableProvided) => {
          return <li className={`item ${baseArrayType}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} key={item.id}>
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
      <div className={`array-input-field-container ${name}`}>
        {name.includes('array_disabled') ?
          <InputSwitch
            {...props}
            type={'text'}
            name={name}
          />
          :

          <div className='input-items-container-new'>
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <ChaiseDroppable droppableId={`${name}-input-items-new`}>
                {
                  (provided: DroppableProvided) => (
                    <ul
                      className={`input-items-new ${fields.length ? 'add-margin-bottom' : ''}`}
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
            <div className={`add-element-container ${baseArrayType}`}>
              <InputSwitch
                {...props}
                type={getInputType({ name: baseArrayType })}
                {...register(`${name}-new-item`, { value: '', onChange: () => trigger(`${name}-new-item`) })}
                displayExtraDateTimeButtons={true}
                displayDateTimeLabels={baseArrayType === 'date' ? false : true}
              />
              <button
                type='button' className='chaise-btn chaise-btn-secondary chaise-btn-sm add-button'
                onClick={() => addItem(addNewValue)}
                /**
                 * We disable the Add button when -
                 * 1. There are validation errors in the addNewValue field.
                 * 2. The addNewValue field value is empty
                 */
                disabled={Object.keys(formState.errors).includes(`${name}-new-item`) || (typeof addNewValue === 'boolean' ? false : !addNewValue)}
              >Add</button>
            </div>
          </div>

        }
      </div>
    </>
  )
}

export default React.memo(ArrayField);

