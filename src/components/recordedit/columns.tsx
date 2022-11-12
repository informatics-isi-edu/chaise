import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { useEffect, useState } from 'react';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

const generateInitialHMap = (columns: any[]) => {
  const hMap: any = {};
  columns.forEach(c => {
    const colname = makeSafeIdAttr(c?.displayname?.value);
    hMap[colname] = -1;
  });
  return hMap;
}

const updateColumnHeight = (hMap: any, colName: string, value: string) => {
  const hMapCopy = simpleDeepCopy(hMap);
  hMapCopy[colName] = value;
  return hMapCopy;
}

const Columns = ({ columns }: { columns: any }) => {
  const [hMap, setHMap] = useState<any>(generateInitialHMap(columns));

  const handleHeightUpdate = (event: any) => {
    const colName = event.detail.colName;
    const height = event.detail.height;

    setHMap((hMap: any) => {
      return updateColumnHeight(hMap, colName, height);
    });
  }

  useEffect(() => {
    const columnContainer = document.querySelector('.entity-key-column') as HTMLElement;
    columnContainer.addEventListener('update-record-column-height', handleHeightUpdate);

    return () => {
      columnContainer.removeEventListener('update-record-column-height', handleHeightUpdate);
    }
  }, []);

  const renderColumnHeader = (column: any) => {
    const headerClassName = `column-displayname${column.comment ? ' chaise-icon-for-tooltip' : ''}`;
    return (
      <span className={headerClassName}>
        <DisplayValue value={column.displayname} />
        {column.comment ? ' ' : ''}
      </span>
    )
  }

  return (
    <div className='entity-key-column'>
      <span className='form-header entity-key'>Record Number</span>
      {columns.map((c: any, idx: number) => {
        const colName = makeSafeIdAttr(c?.displayname?.value);
        const height = hMap[colName];
        const heightparam = height == -1 ? 'auto' : `${height}px`;

        return (
          <span key={colName} className='entity-key' style={{ 'height': heightparam }}>
            {!c.nullok && !c.inputDisabled && <span className='text-danger'><b>*</b> </span>}
            {c.comment ?
              <ChaiseTooltip
                placement='right'
                tooltip={c.comment}
              >
                {renderColumnHeader(c)}
              </ChaiseTooltip> :
              renderColumnHeader(c)
            }
          </span>
        )
      })}

    </div>
  );
}

export default Columns;