import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

  const tdPadding = 10, // +10 to account for padding on <td>
    moreButtonHeight = 20,
    maxHeight = ConfigService.chaiseConfig.maxRecordsetRowHeight || 160,
    defaultMaxHeightStyle = { 'maxHeight': (maxHeight - moreButtonHeight) + 'px' };

  const [overflow, setOverflow] = useState<boolean[]>([]);
  const [readMoreObj, setReadMoreObj] = useState<any>({
    hideContent: true,
    linkText: 'more',
    maxHeightStyle: defaultMaxHeightStyle
  })

  const rowContainer = useRef<any>(null);

  const initializeOverflows = () => {
    // Iterate over each <td> in the <tr>
    const tempOverflow: boolean[] = [];
    for (let i = 0; i < rowContainer.current.children.length; i++) {
      let hasOverflow = overflow[i] || false;

      const currentElement = rowContainer.current.children[i].querySelector('.markdown-container');

      // currentElement must be defined and the previous overflow was false so check again to make sure it hasn't changed
      if (currentElement && !hasOverflow) {
        // overflow is true if the content overflows the cell
        hasOverflow = (currentElement.offsetHeight + tdPadding) > maxHeight;
      }
      tempOverflow[i] = hasOverflow;
    }

    setOverflow(tempOverflow);
  }

  useEffect(() => {
    setOverflow([])
  }, [tuple]);

  useLayoutEffect(() => {
    initializeOverflows();
  }, [rowValues]);

  const readMore = () => {
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
          {overflow[colIndex+1] && <div style={{ 'display': 'inline' }}>
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