import '@isrd-isi-edu/chaise/src/assets/scss/_array-field.scss';

// components
import { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { formatDatetime, formatFloat, formatInt } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, DraggableProvided, Droppable, DroppableProvided } from 'react-beautiful-dnd';
import { useFormContext } from 'react-hook-form';
import InputSwitch from './input-switch';

type ArrayFieldProps = InputFieldProps & {
  /* the type of each element in the array */
  baseArrayType: string,
};

const ArrayField = (props: ArrayFieldProps): JSX.Element => {
  const [itemList, setItemList] = useState<{ id: number, value: string }[]>([])
  let [counter, setCounter] = useState(0);
  const { disableInput, name, baseArrayType } = props;
  const { getValues, setValue, watch } = useFormContext();


  useEffect(() => {

    let defaultValues = getValues(name);

    defaultValues = typeof defaultValues == 'object' || !defaultValues ? defaultValues : JSON.parse(defaultValues)

    if (defaultValues && defaultValues.length > 0) {// Populate default Values if present

      setItemList(
        defaultValues.map((defVal: string | number, idx: number) => {

          if (baseArrayType === 'timestamp') {
            const v = formatDatetime(defVal, { outputMomentFormat: dataFormats.timestamp })

            setValue(`${name}-row-${idx}-date`, v?.date);
            setValue(`${name}-row-${idx}-time`, v?.time);
          }
          setValue(`${name}-row-${idx}`, defVal)

          return {
            id: idx,
            value: defVal
          }
        })
      )
      setCounter(defaultValues.length)

    } else { // create a row with empty value if no default values exist

      setItemList([
        {
          id: 0,
          value: ''
        }
      ])
      setCounter(1);
    }
  }, [])


  useEffect(() => {

    // Update the array field in the react-hook-form context
    if (itemList.length) {
      setValue(name, itemList.map(item => formatValue(item.value)).filter(value => value?.toString().trim()))
    }
  }, [itemList])

  useEffect(() => {

    const sub = watch((data, options) => {

      // Update component state as per the changes observed in the individual row values in the form context
      if (options.name?.startsWith(`${name}-row`)) {

        const itemId = parseInt(options.name.split('-')[3])
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

  /***
   * Adds a new row at a specified index with a given value.
   * @param index - index at the which new row needs to be created
   * @param value [optional] specify the placeholder value at the newly created row. Empty if no value provided
   */
  const addItem = (index: number, value?: number[] | string[]) => () => {
    const elementId = generateId();
    index = typeof index == "number" && index > -1 ? index + 1 : itemList.length

    setItemList([...itemList.slice(0, index),
    {
      id: elementId,
      value: ''
    },
    ...itemList.slice(index, itemList.length)
    ])

    setValue(
      `${name}-row-${elementId}`,
      value ? value : '',
      { shouldValidate: true, shouldDirty: true, shouldTouch: true }
    )

  }

  /**
   * Delete row with a specific ID
   * @param itemId id of row to be deleted
   */
  const deleteItemWithId = (itemId: number) => {
    setItemList([...itemList.filter((item: any) => item.id !== itemId)])
  }

  /**
   * Updates the state value of a given row
   * @param id specify the row id
   * @param fieldValue new value for the row
   */
  const onTextEdit = (id: number, fieldValue: any) => {
    setItemList((prev: any) => {
      return [...prev.map((el: any) => {
        if (el.id === id) {
          el.value = fieldValue;
          return el;
        }
        return el;
      })
      ]
    })
  }

  const handleOnDragEnd = (result: any) => {
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

  const draggableItemRenderer = (item: any, index: number, disableInput: boolean) => {

    return <>
      <Draggable key={item.id} draggableId={item.id.toString()} index={index} isDragDisabled={disableInput}>
        {
          (provided: DraggableProvided) => (
            <>

              <li className={`item ${baseArrayType}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <div className="move-icon">
                  <i className="fa-solid fa-grip-vertical"></i>
                </div>

                <InputSwitch
                  {...props}
                  type={baseArrayType}
                  name={`${name}-row-${item.id}`}

                  displayExtraDateTimeButtons={true}
                  displayDateTimeLabels={baseArrayType === 'date' ? false : true}
                />

                <div>
                  {
                    !disableInput &&
                    <div className="action-buttons">
                      <button type="button" className="fa-solid fa-minus chaise-btn chaise-btn-tertiary chaise-btn-sm" onClick={() => { deleteItemWithId(item.id) }} disabled={disableInput || itemList.length == 1}></button>
                      <button type="button" className="fa-solid fa-plus chaise-btn chaise-btn-tertiary chaise-btn-sm" onClick={addItem(index)} disabled={disableInput}></button>
                    </div>
                  }
                </div>
              </li>
            </>
          )
        }
      </Draggable>
    </>
  }

  return (
    <>
      <div className='fieldInputContainer'>
        {name.includes('array_disabled') ?
          <InputSwitch
            {...props}
            type={'text'}
            name={name}
          />
          :
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId={`input-items`}>
              {
                (provided: DroppableProvided) => (
                  <ul className="input-items" {...provided.droppableProps} ref={provided.innerRef}>
                    {itemList.map((item: any, index: number) => draggableItemRenderer(item, index, disableInput!))}
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

