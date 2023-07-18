import '@isrd-isi-edu/chaise/src/assets/scss/_array-field.scss';

// components
import { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { formatDatetime, formatFloat, formatInt } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { useEffect, useState } from 'react';
import {
  DragDropContext, Draggable, DraggableProvided,
  DraggableStateSnapshot, DraggingStyle, Droppable, DroppableProvided, DropResult
} from 'react-beautiful-dnd';
import { EventType, useFormContext } from 'react-hook-form';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';

type ArrayFieldProps = InputFieldProps & {
  /* the type of each element in the array */
  baseArrayType: string,
};

type RowItem = {
  id: number,
  value: string
}

type Options = {
  name?: string,
  type?: EventType,
  value?: unknown
  values?: {
    [x: string]: any
  }
}

const ArrayField = (props: ArrayFieldProps): JSX.Element => {
  const [itemList, setItemList] = useState<RowItem[]>([])
  const [counter, setCounter] = useState(0);
  const { disableInput, name, baseArrayType } = props;
  const { getValues, setValue, watch, register, unregister } = useFormContext();




  useEffect(() => {
    let defaultValues = getValues(name);

    defaultValues = typeof defaultValues === 'object' || !defaultValues ? defaultValues : JSON.parse(defaultValues)

    if (defaultValues && defaultValues.length > 0) {// Populate default Values if present
      setDefaultFieldState(defaultValues)
    } else { // create a row with empty value if no default values exist
      setDefaultFieldState([''])
    }
  }, [])


  useEffect(() => {

    // Update the array field in the react-hook-form context
    if (itemList.length) {
      updateFormValue(name, itemList.map(item => formatValue(item.value)).filter(value => value?.toString().trim()))
    }
  }, [itemList])

  useEffect(() => {

    const sub = watch((data, options: Options) => {

      // Apply All executed
      if (options.values && options.values[`-1-${name.split('-')[1]}`]) {
        const valuesToWrite = options.values[`-1-${name.split('-')[1]}`]

        setDefaultFieldState(valuesToWrite.length ? valuesToWrite : [''])
      }
      //-----------------------

      // Clear All fields
      if (options.values && options.values[name] === '') {

        const keysToClear = Object.keys(options.values).filter(keyName => keyName.includes(`${name}-row-`))
        keysToClear.push(`-1-${name.split('-')[1]}`)

        unregister(keysToClear)
        setDefaultFieldState([''])
      }
      // Update component state as per the changes observed in the individual row values in the form context
      else if (options.name?.startsWith(`${name}-row`)) {
        const itemId = parseInt(options.name?.split('-').at(-1) as string)
        onTextEdit(itemId, data[`${name}-row-${itemId}`])
      }
    })

    return () => sub.unsubscribe();
  }, [watch])

  const generateId = () => {
    const curr = counter;
    setCounter(prev => prev + 1);
    return curr;
  }

  const formatValue = (value: string) => {
    switch (baseArrayType) {
      case 'int4':
        return formatInt(value);
      case 'float4':
        return formatFloat(value);
      default:
        return value;
    }
  }

  const updateFormValue = (field: string, value: any) => {
    if (!getValues(field)) {
      register(field)
    }
    setValue(field, value)
  }

  /***
   * Adds a new row at a specified index with a given value.
   * @param index - index at the which new row needs to be created
   * @param value [optional] specify the placeholder value at the newly created row. Empty if no value provided
   */
  const addItem = (index: number, value?: string) => () => {
    const elementId = generateId();
    index = typeof index === 'number' && index > -1 ? index + 1 : itemList.length

    setItemList([...itemList.slice(0, index),
    {
      id: elementId,
      value: value ? value : ''
    },
    ...itemList.slice(index, itemList.length)
    ])

    updateFormValue(`${name}-row-${elementId}`, value ? value : '')
  }

  const setDefaultFieldState = (values: (string)[]) => {

    setItemList(
      values.map((defVal: string , idx: number): RowItem => {

        if (baseArrayType === 'timestamp') {
          const v = formatDatetime(defVal, { outputMomentFormat: dataFormats.timestamp });

          updateFormValue(`${name}-row-${idx}-date`, defVal === '' ? '' : v?.date)
          updateFormValue(`${name}-row-${idx}-time`, defVal === '' ? '' : v?.time)
        }
        updateFormValue(`${name}-row-${idx}`, defVal)

        return {
          id: idx,
          value: defVal
        }
      })
    )
    setCounter(values.length)
  }

  /**
   * Delete row with a specific ID
   * @param itemId id of row to be deleted
   */
  const deleteItemWithId = (itemId: number) => {
    unregister(`${name}-row-${itemId}`)
    setItemList([...itemList.filter((item: RowItem) => item.id !== itemId)])
  }

  /**
   * Updates the state value of a given row
   * @param id specify the row id
   * @param fieldValue new value for the row
   */
  const onTextEdit = (id: number, fieldValue: string) => {
    setItemList((prev: RowItem[]) => {
      return [...prev.map((el: RowItem) => {
        if (el.id === id) {
          el.value = fieldValue;
          return el;
        }
        return el;
      })
      ]
    })
  }

  const handleOnDragEnd = (result: DropResult) => {
    const items = Array.from(itemList);

    if (!result.destination) {
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(itemList.length - 1, 0, reorderedItem);
    } else {
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
    }

    setItemList(items);
  }

  const draggableItemRenderer = (item: RowItem, index: number, disableInput: boolean | undefined) => {

    return <>
      <Draggable key={item.id} draggableId={item.id.toString()} index={index} isDragDisabled={disableInput}>
        {
          (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {
            if (snapshot.isDragging) {

              provided.draggableProps.style = {
                ...provided.draggableProps.style,
                left: 5,
                top: index * (baseArrayType === 'timestamp' ? 111 : 50)
              } as DraggingStyle
            }

            return <>
              <li className={`item ${baseArrayType}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <div className='move-icon'>
                  <i className='fa-solid fa-grip-vertical'></i>
                </div>

                <InputSwitch
                  {...props}
                  type={baseArrayType}
                  // name={`${name}-row-${item.id}`}
                  {...register(`${name}-row-${item.id}`, { value: item.value ? item.value : '' })}

                  displayExtraDateTimeButtons={true}
                  displayDateTimeLabels={baseArrayType === 'date' ? false : true}
                />

                <div>
                  {
                    !disableInput &&
                    <div className='action-buttons'>
                      <button
                        type='button' className='fa-solid fa-minus chaise-btn chaise-btn-tertiary chaise-btn-sm'
                        onClick={() => { deleteItemWithId(item.id) }} disabled={disableInput || itemList.length === 1}
                      />
                      <button
                        type='button' className='fa-solid fa-plus chaise-btn chaise-btn-tertiary chaise-btn-sm'
                        onClick={addItem(index)} disabled={disableInput}
                      />
                    </div>
                  }
                </div>
              </li>
            </>
          }
        }
      </Draggable>
    </>
  }

  return (
    <>
      <div className='array-input-field-container'>
        {name.includes('array_disabled') ?
          <InputSwitch
            {...props}
            type={'text'}
            name={name}
          />
          :
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId={'input-items'}>
              {
                (provided: DroppableProvided) => (
                  <ul className='input-items' {...provided.droppableProps} ref={provided.innerRef}>
                    {itemList.map((item: RowItem, index: number) => draggableItemRenderer(item, index, disableInput))}
                    {provided.placeholder}
                  </ul>
                )
              }
            </Droppable>
          </DragDropContext>
        }
      </div>
    </>
  )
}

export default ArrayField;

