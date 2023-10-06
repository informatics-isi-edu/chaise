import '@isrd-isi-edu/chaise/src/assets/scss/_array-field.scss';

// components
import { InputFieldProps } from '@isrd-isi-edu/chaise/src/components/input-switch/input-field';

// utils
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { formatDatetime, formatFloat, formatInt, getInputType } from '@isrd-isi-edu/chaise/src/utils/input-utils';
import { useEffect, useRef, useState } from 'react';
import {
  DragDropContext, Draggable, DraggableProvided, Droppable, DroppableProps, DroppableProvided, DropResult
} from 'react-beautiful-dnd';
import { EventType, useFormContext } from 'react-hook-form';
import InputSwitch from '@isrd-isi-edu/chaise/src/components/input-switch/input-switch';

// since we're using strict mode, react-beautiful-dnd misbehaves due to multiple renders caused by strict mode
// this is to guard against it
const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

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
  const [disableAddButton, setDisableAddButton] = useState<boolean>(true);
  const { disableInput, name, baseArrayType } = props;
  const { formState, getValues, setValue, watch, register, unregister, trigger } = useFormContext();

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    // Prevents useEffect from getting invoked twice in dev mode
    if (setupStarted.current) return;
    setupStarted.current = true;

    let defaultValues = getValues(name);

    // getValues() returns the values as a string. we need to parse the array from its string representation
    defaultValues = defaultValues && typeof defaultValues === 'string' ? JSON.parse(defaultValues) : []

    if (defaultValues && defaultValues.length > 0) {// Populate default Values if present
      setDefaultFieldState(defaultValues)
    } else { // create a row with empty value if no default values exist
      setDefaultFieldState([])
    }
  }, [])


  useEffect(() => {

    // Update the array field in the react-hook-form context
    if (itemList.length) {
      updateFormValue(name, itemList.map(item => formatValue(item.value)).filter(value => value?.toString().trim()))
    } else {
      updateFormValue(name, [])
    }
  }, [itemList])

  useEffect(() => {
    setDisableAddButton(Object.keys(formState.errors).includes(`${name}-new-item`) || getValues(`${name}-new-item`) === undefined || getValues(`${name}-new-item`) === '')
  }, [formState])

  useEffect(() => {
    const sub = watch((data, options: Options) => {
      // Clear All fields
      if (options.values && options.values[name] === '') {
        const keysToClear = Object.keys(options.values).filter(keyName => keyName.includes(`${name}-row-`))
        keysToClear.push(`-1-${name.split('-')[1]}`)

        unregister(keysToClear)
        setDefaultFieldState([])
      }
      // Apply All executed
      else if (options.values && options.values[`-1-${name.split('-')[1]}`]) {
        const valuesToWrite = options.values[`-1-${name.split('-')[1]}`]

        setDefaultFieldState(valuesToWrite.length ? valuesToWrite : [])
      }
      // Update component state as per the changes observed in the individual row values in the form context
      else if (options.name?.startsWith(`${name}-row`)) {
        const itemId = parseInt(options.name?.split('-').at(-1) as string)
        onTextEdit(itemId, data[`${name}-row-${itemId}`])
      }

      trigger(`${name}-new-item`);
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
    if (getValues(field) === undefined || getValues(field) === '') {
      register(field)
    }
    setValue(field, value)
  }

  /***
   * Adds a new row at a specified index with a given value.
   * @param index - index at the which new row needs to be created
   * @param formKey ```[optional]``` specify the value that needs to be fetched from the react-hook-form. Empty if no value provided
   */
  const addItem = (index: number, formKey?: string) => () => {

    const elementId = generateId();
    index = typeof index === 'number' && index > -1 ? index + 1 : itemList.length
    const formVal = formKey ? getValues(formKey) : ''

    setItemList([...itemList.slice(0, index),
    {
      id: elementId,
      value: formVal
    },
    ...itemList.slice(index, itemList.length)
    ])

    if (baseArrayType === 'timestamp') {
      const v = formatDatetime(formVal, { outputMomentFormat: dataFormats.timestamp });

      updateFormValue(`${name}-row-${elementId}-date`, formVal === '' ? '' : v?.date)
      updateFormValue(`${name}-row-${elementId}-time`, formVal === '' ? '' : v?.time)
    }
    updateFormValue(`${name}-row-${elementId}`, formVal)
  }

  const setDefaultFieldState = (values: (string | number)[]) => {

    setItemList(
      values.length ?
        values.map((defVal: string, idx: number): RowItem => {

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
        :
        []
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
          return {
            id: id,
            value: fieldValue
          };
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
      <Draggable key={item.id} draggableId={name + "-" + item.id.toString()} index={index} isDragDisabled={disableInput}>
        {
          (provided: DraggableProvided) => {
            return <>
              <li className={`item ${baseArrayType}`} ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <div className='move-icon'>
                  <i className='fa-solid fa-grip-vertical'></i>
                </div>

                <div className='item-input'>
                  <InputSwitch
                    {...props}
                    type={getInputType({ name: baseArrayType })}
                    {...register(`${name}-row-${item.id}`, { value: item.value != undefined ? item.value : '' })}
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
                        onClick={() => { deleteItemWithId(item.id) }}
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
          <>
            <div className="input-items-container-new">
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <StrictModeDroppable droppableId={`${name}-input-items-new`}>
                  {
                    (provided: DroppableProvided) => (
                      <ul
                        className={`input-items-new ${itemList.length ? 'add-margin-bottom' : ''}`}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {itemList.map((item: RowItem, index: number) => draggableItemRenderer(item, index, disableInput))}
                        {provided.placeholder}
                      </ul>
                    )
                  }
                </StrictModeDroppable>
              </DragDropContext>
              <div className={`add-element-container ${baseArrayType}`}>
                <InputSwitch
                  {...props}
                  type={getInputType({ name: baseArrayType })}
                  {...register(`${name}-new-item`)}
                  displayExtraDateTimeButtons={true}
                  displayDateTimeLabels={baseArrayType === 'date' ? false : true}
                />
                <button
                  type='button' className='chaise-btn chaise-btn-secondary chaise-btn-sm add-button'
                  onClick={addItem(-1, `${name}-new-item`)} disabled={disableAddButton}
                >Add</button>
              </div>
            </div>
          </>
        }
      </div>
    </>
  )
}

export default ArrayField;

