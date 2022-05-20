import { useEffect, useRef, useState } from 'react';

// components
import DisplayValue from '@chaise/components/display-value';

// providers
import useRecordset from '@chaise/hooks/recordset';

// services
import { ConfigService } from '@chaise/services/config';

type TableRowProps = {
  rowIndex: number,
  tuple: any
}

const TableRow = ({
  rowIndex,
  tuple
}: TableRowProps): JSX.Element => {
  const { colValues, config } = useRecordset();

  const tdPadding = 10, // +10 to account for padding on TD
    moreButtonHeight = 20,
    maxHeight = ConfigService.chaiseConfig.maxRecordsetRowHeight || 160,
    defaultMaxHeightStyle = { 'maxHeight': (maxHeight - moreButtonHeight) + 'px' };

  const [hideContent, setHideContent] = useState(true);
  const [linkText, setLinkText] = useState('more');
  const [maxHeightStyle, setMaxHeightStyle] = useState<any>(defaultMaxHeightStyle)
  const [overflow, setOverflow] = useState<{ height: number | null, overflow: boolean }[]>([]);
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
    console.log('colValues change');
    calculateOverflows();
  }, [colValues]);

  const readMore = () => {
    // setUserClicked(true); // avoid triggering resize Sensor logic
    if (hideContent) {
      setHideContent(false);
      setLinkText('less');
      setMaxHeightStyle({});
    } else {
      setHideContent(true);
      setLinkText('more');
      setMaxHeightStyle(defaultMaxHeightStyle);
    }
  }

  const renderCells = () => {
    // colValues is an array or arrays. Does not include action column
    // colVal is an array of all values for one column (1 per row)
    return colValues.map((colVal: any, colIndex: number) => {
      return (
        <td key={rowIndex + '-' + colIndex}>
          <div className={hideContent === true ? 'hideContent' : 'showContent'} style={maxHeightStyle}>
            <DisplayValue addClass={true} value={colVal[rowIndex]} />
          </div>
          {(overflow[colIndex+1] && overflow[colIndex+1].overflow) && <div style={{ 'display': 'inline' }}>
            ...
            <span
              className='text-primary readmore'
              style={{ 'display': 'inline-block', 'textDecoration': 'underline', 'cursor': 'pointer' }}
              onClick={readMore}
            >
              {linkText}
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