import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import { useEffect, useState } from 'react';
import { simpleDeepCopy } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { makeSafeIdAttr } from '@isrd-isi-edu/chaise/src/utils/string-utils';

const generateInitialHMap = (columns) => {
  const hMap = {};
  columns.forEach(c => {
    const colname = makeSafeIdAttr(c?.displayname?.value);
    hMap[colname] = -1;
  });
  return hMap;
}

const updateColumnHeight = (hMap, colName, value) => {
  const hMapCopy = simpleDeepCopy(hMap);
  hMapCopy[colName] = value;
  return hMapCopy;
}

const Columns = ({ columns }) => {
  const [hMap, setHMap] = useState(generateInitialHMap(columns));

  console.log(hMap);

  const handleHeightUpdate = (event) => {
    console.log('handleHeightUpdate', event.detail);
    const colName = event.detail.colName;
    const height = event.detail.height;

    console.log(hMap[colName], height, 'here here');

    setHMap(hMap => {
      return updateColumnHeight(hMap, colName, height);
    });
    
  }

  useEffect(() => {
    const columnContainer = document.querySelector('.record-edit-column') as HTMLElement;
    columnContainer.addEventListener('update-record-column-height', handleHeightUpdate);

    return () => {
      columnContainer.removeEventListener('update-record-column-height', handleHeightUpdate);
    }
  }, []);

  return (
    <div className='record-edit-column'>
      {columns.map(c => {
        const colName = makeSafeIdAttr(c?.displayname?.value);

        const height = hMap[colName];

        const heightparam = height == -1 ? 'auto' : `${height}px`;

        return <DisplayValue styles={{'height' : heightparam}} key={colName} value={c?.displayname} className='column-cell'/>;
      })}
    </div>
  );
}

export default Columns;