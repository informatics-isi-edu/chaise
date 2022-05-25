// import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
// import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
// import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { useState } from 'react';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';

// components
// import Plot from 'react-plotly.js';

type FacetRangePickerProps = {
  facetColumn: any,
  index: number
}

const FacetRangePicker = ({
  facetColumn,
  index
}: FacetRangePickerProps): JSX.Element => {

  const showHistogram = (): boolean => {
    return true;
  }

  const renderHistogram = () => {
    // if (facetModel.initialized && facetModel.isOpen && facetPanelOpen && showHistogram()) {
    if (showHistogram()) {
      return (<>
        <div className='plotly-actions'>
          <div className='chaise-btn-group' style={{ 'zIndex': 1 }}>
            {/* tooltip-placement="right" uib-tooltip-html="'<p>You can interact with the histogram in 2 ways: zooming and panning.</p><p>Clicking and holding anywhere in the graph display will allow you to zoom into a smaller subset of data. Drag the left or right bound to encapsulate the range of data you want to zoom into to get more clarity.</p><p>Clicking and holding in the middle of the x axis of the graph will allow you to pan that axis. By clicking on either end, you can stretch that axis to get a wider range of data.</p><p>Interacting with the histogram does not automatically apply the filter, it will fill in the min/max input fields for you based on the histogram\'s current range.</p>'"*/}
            <button type='button' className='plotly-how-to chaise-btn chaise-btn-tertiary chaise-btn-sm'>
              <span className='chaise-icon chaise-info'></span>
            </button>
            {/* ng-disabled="disableZoomIn()" tooltip-placement="bottom" uib-tooltip="Zoom" */}
            <button type='button' className='zoom-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm" ng-click="zoomInPlot()'>
              <span className='chaise-icon chaise-zoom-in'></span>
            </button>
            {/*  ng-click="zoomOutPlot()" ng-disabled="histogramDataStack.length <= 1" tooltip-placement="bottom" uib-tooltip="Unzoom" */}
            <button type='button' className='unzoom-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm'>
              <span className='chaise-icon chaise-zoom-out'></span>
            </button>
            {/*  ng-click="resetPlot()" tooltip-placement="bottom" uib-tooltip="Reset" */}
            <button type='button' className='reset-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm'>
              <span className='fas fa-undo'></span>
            </button>
          </div>
        </div>
        <div>
          Plotly goes here
          {/* <Plot
            data={[
              {
                x: [1, 2, 3],
                y: [2, 6, 3],
                type: 'scatter',
                mode: 'lines+markers',
                marker: { color: 'red' },
              },
              { type: 'bar', x: [1, 2, 3], y: [2, 5, 3] },
            ]}
            layout={{ width: 320, height: 240, title: 'A Fancy Plot' }}
          /> */}
        </div>
      </>)
    }

    return;
  }

  return (
    <div className='range-picker'>
      <div>
        List goes here
      </div>
      <div>
        Range inputs here
      </div>
      {renderHistogram()}
    </div>
  )
}

export default FacetRangePicker;