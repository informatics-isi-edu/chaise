import { useEffect, useRef, useState } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// models
import { RecordsetConfig } from '@isrd-isi-edu/chaise/src/models/recordset';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

type TableRowProps = {
  config: RecordsetConfig,
  rowIndex: number,
  rowValues: any[],
  tuple: any
}

const TableRow = ({
  config, 
  rowIndex,
  rowValues,
  tuple
}: TableRowProps): JSX.Element => {

  const tdPadding = 10, // +10 to account for padding on TD
    moreButtonHeight = 20,
    maxHeight = ConfigService.chaiseConfig.maxRecordsetRowHeight || 160,
    defaultMaxHeightStyle = { 'maxHeight': (maxHeight - moreButtonHeight) + 'px' };

  const [overflow, setOverflow] = useState<{ height: number | null, overflow: boolean }[]>([]);
  const [readMoreObj, setReadMoreObj] = useState<any>({
    hideContent: true,
    linkText: 'more',
    maxHeightStyle: defaultMaxHeightStyle
  })
  // TODO: not sure if needed 
  // const [userClicked, setUserClicked] = useState(false);

  const rowContainer = useRef<any>(null);

  const calculateOverflows = () => {
    // Iterate over each <td> in the <tr>
    const tempOverflow: { height: number | null, overflow: boolean }[] = [];
    for (let i = 0; i < rowContainer.current.children.length; i++) {
      let overflowObj = {height: null, overflow: false}

      const currentElement = rowContainer.current.children[i].querySelector('.markdown-container');
      // currentElement must be defined
      // either the overflow object is not set yet or the previous overflow height is not the same as the current one
      if (currentElement && (!overflow[i] || overflow[i].height !== currentElement.offsetHeight)) {
        // store the height value for comparing against later
        // overflow is true if the content overflows the cell
        overflowObj = { 
          height: currentElement.offsetHeight,
          overflow: (currentElement.offsetHeight + tdPadding) > maxHeight
        };
        
      }
      tempOverflow[i] = overflowObj;
    }

    setOverflow(tempOverflow);
  }

  useEffect(() => {
    calculateOverflows();
  }, [rowValues]);

  const readMore = () => {
    // setUserClicked(true); // avoid triggering resize Sensor logic
    if (readMoreObj.hideContent) {
      setReadMoreObj({
        hideContent: false,
        linkText: 'less',
        maxHeightStyle: {}
      });
    } else {
      setReadMoreObj({
        hideContent: true,
        linkText: 'more',
        maxHeightStyle: defaultMaxHeightStyle
      });
    }
  }

  const renderCells = () => {
    // rowValues is an array of values for each column. Does not include action column
    return rowValues.map((value: any, colIndex: number) => {
      return (
        <td key={rowIndex + '-' + colIndex}>
          <div className={readMoreObj.hideContent === true ? 'hideContent' : 'showContent'} style={readMoreObj.maxHeightStyle}>
            <DisplayValue addClass={true} value={value} />
          </div>
          {(overflow[colIndex+1] && overflow[colIndex+1].overflow) && <div style={{ 'display': 'inline' }}>
            ...
            <span
              className='text-primary readmore'
              style={{ 'display': 'inline-block', 'textDecoration': 'underline', 'cursor': 'pointer' }}
              onClick={readMore}
            >
              {readMoreObj.linkText}
            </span>
          </div>}
        </td>
      )
    });
  }

  return (<tr 
      className='chaise-table-row'
      ref={rowContainer}
      style={{ 'position': 'relative' }}
    >
      <td className='block action-btns'>
        <div className='chaise-btn-group'>
          {config.viewable &&
            <a
              type='button'
              className='view-action-button chaise-btn chaise-btn-tertiary chaise-btn-link icon-btn'
              href={tuple.reference.contextualize.detailed.appLink}
            >
              <span className='chaise-btn-icon chaise-icon chaise-view-details'></span>
            </a>
          }
          {/* TODO edit */}
          {/* TODO delete */}
          {/* TODO select */}
        </div>
      </td>
      {renderCells()}
    </tr>
  )
}

export default TableRow;