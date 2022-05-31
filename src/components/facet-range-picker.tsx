import '@isrd-isi-edu/chaise/src/assets/scss/_range-picker.scss';
// import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
// import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { useEffect, useState } from 'react';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';

// components
import Plot from 'react-plotly.js';
import Plotly from 'plotly.js';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { getNotNullFilter } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';


type FacetRangePickerProps = {
  facetColumn: any,
  index: number
}

type RangeOptions = {
  absMin: number | null,
  absMax: number | null,
  model: {
    min: number | null,
    max: number | null
  }
}

const FacetRangePicker = ({
  facetColumn,
  index
}: FacetRangePickerProps): JSX.Element => {

  const [histogramDataStack, setHistogramDataStack] = useState<any[]>([]);
  const [rangeOptions, setRangeOptions] = useState<RangeOptions>({ absMin: null, absMax: null, model: {min: null, max: null} });
  const [ranges, setRanges] = useState<any[]>([]);
  const [relayout, setRelayout] = useState(false);
  const [plot, setPlot] = useState<any>({
    data: [{
      x: [],
      y: [],
      type: 'bar'
    }],
    options: {
      displayModeBar: false
    },
    layout: {
      margin: {
        l: 40,
        r: 0,
        b: 80,
        t: 20,
        pad: 2
      },
      xaxis: {
        fixedrange: false,
        ticks: 'inside',
        tickangle: 45,
        // set to "linear" for int/float graphs
        // set to "date" for date/timestamp graphs
        type: '-'
        // NOTE: setting the range currently to unzoom the graph because auto-range wasn't working it seemed
        // autorange: true // default is true. if range is provided, set to false.
        // rangemode: "normal"/"tozero"/"nonnegative"
      },
      yaxis: {
        fixedrange: true,
        zeroline: true,
        tickformat: ',d'
      },
      bargap: 0
    }
  });

  const numBuckets = facetColumn.histogramBucketCount;

  const isColumnOfType = (columnType: string) => {
    return (facetColumn.column.type.rootName.indexOf(columnType) > -1)
  }

  useEffect(() => {
    if (facetColumn.hideNotNullChoice) {
      setRanges([getNotNullFilter(false)]);
    }

    const tempPlot = { ...plot };
    if (isColumnOfType('int')) {
      tempPlot.layout.margin.b = 40;
      tempPlot.layout.xaxis.tickformat = ',d';
    } else if (isColumnOfType('date')) {
      tempPlot.layout.xaxis.tickformat = '%Y-%m-%d';
    } else if (isColumnOfType('timestamp')) {
      tempPlot.layout.xaxis.tickformat = '%Y-%m-%d\n%H:%M';
    }

    setPlot(tempPlot)

    updateFacetData();
  }, [facetColumn]);

  const updateFacetData = () => {
    // var defer = $q.defer();

    (function (uri, reloadCauses, reloadStartTime) {
      // if (!scope.relayout) {
      // the captured uri is not the same as the initial data uri so we need to refetch the min/max
      // this happens when another facet adds a filter that affects the facett object in the uri
      const agg = facetColumn.column.aggregate;
      const aggregateList = [
        agg.minAgg,
        agg.maxAgg
      ];

      const facetLog = getDefaultLogInfo();
      let action = LogActions.FACET_RANGE_LOAD;
      // if (reloadCauses.length > 0) {
      //   action = LogActions.FACET_RANGE_RELOAD;
      //   // add causes
      //   facetLog.stack = LogService.addCausesToStack(facetLog.stack, reloadCauses, reloadStartTime);
      // }
      // facetLog.action = scope.parentCtrl.getFacetLogAction(index, action);
      facetColumn.sourceReference.getAggregates(aggregateList, facetLog).then((response: any) => {
        console.log('facet data: ', response);
        if (facetColumn.sourceReference.uri !== uri) {
          // return false to defer.resolve() in .then() callback
          // return false;
        }
        // initiailize the min/max values
        updateRangeOptions(response[0], response[1]);

        // if - the max/min are null
        //    - bar_plot in annotation is 'false'
        //    - histogram not supported for column type
        if (!showHistogram()) {
          // return true to defer.resolve() in .then() callback
          return true;
        }

        setRelayout(false);
        setHistogramDataStack([]);

        // get initial histogram data
        histogramData(response[0], response[1], reloadCauses, reloadStartTime);
      }).then((response: any) => {

        // facetModel.reloadCauses = [];
        // facetModel.reloadStartTime = -1;

        // defer.resolve(response);
      }).catch((err: any) => {
        console.log('catch facet data: ', err);
        // defer.reject(err);
      });
      // relayout case
      // } else {
      //     histogramData(reloadCauses, reloadStartTime).then(function (response) {
      //         defer.resolve(response);
      //     }).catch(function (err) {
      //         defer.reject(err);
      //     });
      // }
    })(facetColumn.sourceReference.uri);
    // })(facetColumn.sourceReference.uri, facetModel.reloadCauses, facetModel.reloadStartTime);

    // // so we can check if the getAggregates request needs to be remade or we can just call histogramData
    // scope.initialDataUri = scope.facetColumn.sourceReference.uri;

    // return defer.promise;
  };

  const histogramData = (min: any, max: any, reloadCauses: any, reloadStartTime: any) => {
    // var defer = $q.defer();

    (function (uri) {
      // const requestMin = isColumnOfType('timestamp') ? dateTimeToTimestamp(rangeOptions.absMin) : rangeOptions.absMin,
      //   requestMax = isColumnOfType('timestamp') ? dateTimeToTimestamp(rangeOptions.absMax) : rangeOptions.absMax;

      const requestMin = min,
        requestMax = max;

      const facetLog = getDefaultLogInfo();
      let action = LogActions.FACET_HISTOGRAM_LOAD;
      // if (reloadCauses.length > 0) {
      //   action = LogActions.FACET_HISTOGRAM_RELOAD;

      //   // add causes
      //   facetLog.stack = LogService.addCausesToStack(facetLog.stack, reloadCauses, reloadStartTime);
      // }

      // facetLog.action = scope.parentCtrl.getFacetLogAction(index, action);
      facetColumn.column.groupAggregate.histogram(numBuckets, requestMin, requestMax).read(facetLog).then((response: any) => {
        console.log('histogram data: ', response)
        if (facetColumn.sourceReference.uri !== uri) {
          // return breaks out of the current callback function
          // defer.resolve(false);
          // return defer.promise;
        }

        // after zooming in, we don't care about displaying values beyond the set the user sees
        // if set is greater than bucketCount, remove last bin (we should only see this when the max+ bin is present)
        if (relayout && response.x.length > numBuckets) {
          // no need to splice off labels because they are used for lookup
          // i.e. response.labels.(min/max)
          response.x.splice(-1, 1);
          response.y.splice(-1, 1);
          setRelayout(false);
        }

        const tempPlot = { ...plot }
        tempPlot.data[0].x = response.x;
        tempPlot.data[0].y = response.y;

        tempPlot.labels = response.labels;

        setPlot(tempPlot);

        setRangeVars();

        // response.min = isColumnOfType('timestamp') ? dateTimeToTimestamp(rangeOptions.absMin) : rangeOptions.absMin;
        // response.max = isColumnOfType('timestamp') ? dateTimeToTimestamp(rangeOptions.absMax) : rangeOptions.absMax;

        response.min = rangeOptions.absMin;
        response.max = rangeOptions.absMax;

        // push the data on the stack to be used for unzoom and reset
        const tempStackData = [...histogramDataStack]
        tempStackData.push(response)
        setHistogramDataStack(tempStackData);

        // data in plot, relayout
        // var plotEl = element[0].getElementsByClassName("js-plotly-plot")[0];
        // if (plotEl) {
        //   Plotly.relayout(plotEl, { 'xaxis.fixedrange': scope.disableZoomIn() });
        // }

        // defer.resolve(true);
      }).catch((err: any) => {
        // defer.reject(err);
        console.log('catch histogram data: ', err);
      });
    })(facetColumn.sourceReference.uri);

    // return defer.promise;
  }

  const getDefaultLogInfo = () => {
    const res = facetColumn.sourceReference.defaultLogInfo;

    // TODO: res.stack for defaultLogInfo
    // res.stack = scope.parentCtrl.getFacetLogStack(index);
    return res;
  }

  // sets both the range and the inputs
  const setRangeVars = () => {
    // setHistogramRange();
    updateInputModels();

    // TODO: relayout plot
    // let plotEl = element[0].getElementsByClassName("js-plotly-plot")[0];
    // if (plotEl) {
    //   Plotly.relayout(plotEl, { 'xaxis.fixedrange': scope.disableZoomIn() });
    // }
  }

  const showHistogram = (): boolean => {
    return facetColumn.barPlot;
    // return facetColumn.barPlot && (rangeOptions.absMin !== null && rangeOptions.absMax !== null)
  }

  // set the absMin and absMax values
  // all values are in their database returned format
  const updateRangeOptions = (min: number, max: number) => {
    let tempRangeOptions: RangeOptions = { ...rangeOptions }
    // if (isColumnOfType('timestamp')) {
      // convert and set the values if they are defined.
      // TODO: implement moment
      // tempRangeOptions.absMin = timestampToDateTime(min);
      // tempRangeOptions.absMax = timestampToDateTime(max);
    // } else {
      tempRangeOptions.absMin = min;
      tempRangeOptions.absMax = max;
    // }

    setRangeOptions(tempRangeOptions);
  }

  /**
   * Given an object with `date` and `time`, it will turn it into timestamp reprsentation of datetime.
   * @param  {object} obj The datetime object with `date` and `time` attributes
   * @return {string} timestamp in submission format
   * NOTE might return `null`
   */
  // const dateTimeToTimestamp = (obj: any) => {
  //   if (!obj) return null;
  //   const ts = obj.date + obj.time;
  //   // return moment(ts, dataFormats.date + dataFormats.time24).format(dataFormats.datetime.submission);
  // }

  /**
   * Given a string representing timestamp will turn it into an object with `date` and `time` attributes
   * @param  {string} ts timestamp
   * @return {object} an object with `date` and `time` attributes
   * NOTE might return `null`
   */
  // const timestampToDateTime = (ts: string) {
  //   if (!ts) return null;
  //   var m = moment(ts);
  //   return {
  //     date: m.format(dataFormats.date),
  //     time: m.format(dataFormats.time24)
  //   };
  // }

  // const setHistogramRange = () => {
  //   const tempPlot = { ...plot };
  //   if (isColumnOfType('timestamp')) {
  //     tempPlot.layout.xaxis.range = [dateTimeToTimestamp(rangeOptions.absMin), dateTimeToTimestamp(rangeOptions.absMax)];
  //   } else {
  //     tempPlot.layout.xaxis.range = [rangeOptions.absMin, rangeOptions.absMax];
  //   }
  // }

  // update the min/max model values to the min/max represented by the histogram
  const updateInputModels = () => {
    rangeOptions.model.min = rangeOptions.absMin;
    rangeOptions.model.max = rangeOptions.absMax;
  }

  const renderPlot = () => {
    if (plot.data[0].x.length < 1 || plot.data[0].y.length < 1) return;
    return(<Plot
      data={plot.data}
      layout={plot.layout}
      config={plot.options}
    // plotly events have their own prop names
    />)
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
            {/* ng-click='zoomInPlot()' ng-disabled="disableZoomIn()" tooltip-placement="bottom" uib-tooltip="Zoom" */}
            <button type='button' className='zoom-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm'>
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
          {renderPlot()}
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