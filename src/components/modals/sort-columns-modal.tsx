import { DragDropContext, Draggable, Droppable, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

import Dropdown from 'react-bootstrap/Dropdown';


import React, { useEffect, useState, useRef, MouseEvent, MouseEventHandler } from 'react';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import useRecordset from '@isrd-isi-edu/chaise/src/hooks/recordset';

const SortColumns = (props: any): JSX.Element => {
  const { update } = useRecordset();

  const [thenByColumns, setThenByColumns] = useState<any>([]);
  const [currIndex, setCurrIndex] = useState(1);
  const [thenByOrders, setThenByOrders] = useState<Array<{ order: string }>>([{ order: 'desc' }]);
  const columns = props?.reference?.columns;

  const lastRowRef = useRef<any>(null);
 
  useEffect(() => {
    setThenByColumns([columns[0]])
  }, [])

  useEffect(() => {
    if (thenByColumns.length === 1) {
      setCurrIndex(1)
    }
  }, [thenByColumns])

  const handleAddColumn = () => {
    setThenByColumns((prevColumns: any): any => [...prevColumns, columns[currIndex]]);
    const setOrder: any = [...thenByOrders];
    setOrder[currIndex] = { order: 'desc' };
    setThenByOrders(setOrder);
    setCurrIndex(currIndex + 1)
    setTimeout(() => {
      if (lastRowRef.current) {
        lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
      }
    }, 100);
  };

  const handleThenByColumnChange = (option: any, index: any, evt:any) => {
    console.log(evt)
    const updatedColumns: any = [...thenByColumns];
    updatedColumns[index] = option;
    setThenByColumns(updatedColumns);
  };

  const handleThenByOrderChange = (event: any, index: any) => {
    const updatedOrders: any = [...thenByOrders];
    updatedOrders[index] = { order: event };
    setThenByOrders(updatedOrders);
  };


  const handleRemoveColumn = (index: any) => {
    setThenByColumns((prevColumns: any) => prevColumns.filter((_: any, i: any) => i !== index));
  };

  const handleCloseModal = () => {
    props.onClose()
  };

  const handleSortRange = () => {
    const sortCriteria: any = [];
    thenByColumns.forEach((column: any, index: number) => {
      const order = thenByOrders[index]?.order || 'asc'; // Default to 'asc' if order is not set
      sortCriteria.push({
        'column': column.name,
        'descending': order === 'desc'
      });
    });

    // Perform sort operation based on sortCriteria
    const ref = props.reference.sort(sortCriteria);
    update({ updateResult: true }, { reference: ref }, { cause: LogReloadCauses.SORT });

    // Close the modal
    handleCloseModal();
  };

  const handleResetSort = () => {
    setThenByColumns([columns[0]]);
    const setOrder: any = [...thenByOrders];
    setOrder[0] = { order: 'desc' };
    setThenByOrders(setOrder);
  }
  const handleColumnReorder = (result: any) => {
    if (!result.destination) return;

    const reorderedColumns = Array.from(thenByColumns);
    const [reorderedColumn] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, reorderedColumn);

    setThenByColumns(reorderedColumns);
  };
  const filterBy = (option: any, state: any) => {
    if (state.selected.length) {
      return true;
    }
    return option.displayname.value.toLowerCase().indexOf(state.text.toLowerCase()) > -1;
  }
  // Common function to generate the arrow icon
  const getArrowIcon = () => (
    <span className="fa-solid fa-arrow-right"></span>
  );

  // Updated getCustomLabel function
  const getCustomLabel = (column: any, isDescending = false, order = 'asc') => {
    switch (column.type.rootName) {
      case 'timestamp':
      case 'timestamptz':
        return isDescending
          ? (
            <>
              Earliest {getArrowIcon()} Latest
            </>
          )
          : (
            <>
              Latest {getArrowIcon()} Earliest
            </>
          )

      case 'int2':
      case 'int4':
      case 'int8':
        return isDescending
          ? (
            <>
              Max {getArrowIcon()} Min
            </>
          )
          : (
            <>
              Min {getArrowIcon()} Max
            </>
          )

      default:
        return isDescending
          ? (
            <>
              Z {getArrowIcon()} A
            </>
          )
          : (
            <>
              A {getArrowIcon()} Z
            </>
          )
    }
  };

  const ToggleButton = ({ isOpen, onClick }: any) => (
    <button
      className='chaise-btn chaise-btn-secondary toggle-button'
      onClick={onClick}
      onMouseDown={(e) => {
        // Prevent input from losing focus.
        e.preventDefault();
      }}>
      {isOpen ? <i className='fas fa-chevron-up'></i> : <i className='fas fa-chevron-down'></i>}
    </button>
  );
  const draggableItemRenderer = (column: any, index: number) => {
    return <>
      <Draggable key={column.name} draggableId={column.name} index={index}>
        {(provided: DraggableProvided) => {
          return <>
            <li
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className='then-by-row'
            >
              <div className='left-section' ref={index === thenByColumns.length - 1 ? lastRowRef : null}>
                <div className='move-icon'>
                  <i className='fa-solid fa-grip-vertical'></i>
                </div>
                <Dropdown className='sort-menu' >
                  <Dropdown.Toggle
                    disabled={false}
                    className='chaise-btn chaise-btn-secondary column-toggle'
                  >
                    <span className='toggle-name'>{column.displayname.value}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {columns.map((option: any, colindex: any) => (
                      <Dropdown.Item
                        as={'li'}
                        className={`sort-menu-item sort-${makeSafeIdAttr(column.displayname.value)}`}
                        key={`sort-${colindex}`}
                        onClick={(evt: React.MouseEvent<HTMLElement>) => handleThenByColumnChange(option, index, evt)}
                      >
                        {option?.displayname.value}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div className='right-section'>
                <Dropdown className='sort-menu'>
                  <Dropdown.Toggle
                    disabled={false}
                    className='chaise-btn chaise-btn-secondary'
                  >
                    <span className='chaise-btn-icon chaise-btn-secondary' />
                    {getCustomLabel(column, thenByOrders[index]?.order !== 'asc')}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item
                      as={'li'}
                      className={`sort-menu-item sort-${makeSafeIdAttr(column.displayname.value)}`}
                      key={`sort-${index}`}
                      onClick={() => handleThenByOrderChange('asc', index)}
                    >
                      {getCustomLabel(column, false, 'asc')}
                    </Dropdown.Item>
                    <Dropdown.Item
                      as={'li'}
                      className={`sort-menu-item sort-${makeSafeIdAttr(column.displayname.value)}`}
                      key={`sort-${index + 1}`}
                      onClick={() => handleThenByOrderChange('desc', index)}
                    >
                      {getCustomLabel(column, true, 'desc')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                <button className='remove-btn chaise-btn chaise-btn-tertiary fa fa-trash' onClick={() => handleRemoveColumn(index)}></button>
              </div>
            </li>
          </>
        }
        }
      </Draggable>
    </>
  }

  return (
    <div className='modal-sort-columns'>
      <div className='dropdown-wrapper'>
        <DragDropContext onDragEnd={handleColumnReorder}>
          <StrictModeDroppable droppableId='column-sort'>
            {(provided: DroppableProvided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className='column-sort'
              >

                {thenByColumns.map((item: any, index: number) => draggableItemRenderer(item, index))}
                {provided.placeholder}
              </ul>
            )}
          </StrictModeDroppable>
        </DragDropContext>

      </div>
      <button disabled={columns.length === currIndex} className='chaise-btn chaise-btn-secondary add-more'
        onClick={handleAddColumn}>+ Add another sort column</button>
      <div className='modal-actions'>
        <button className='chaise-btn chaise-btn-primary' onClick={handleSortRange}>
          <span className='fa fa-sort chaise-btn-icon'></span>
          <span>Sort</span>
        </button>
        <button className='chaise-btn chaise-btn-secondary' onClick={handleResetSort}>
          <span className='fas fa-undo chaise-btn-icon'></span>
          <span>Reset</span>
        </button>
        <button
          className='chaise-btn chaise-btn-secondary modal-close'
          onClick={() => handleCloseModal()}
        >
          <strong className='chaise-btn-icon'>X</strong>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}
const StrictModeDroppable = ({ children, ...props }: any) => {
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
export default SortColumns;