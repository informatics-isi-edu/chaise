import '@isrd-isi-edu/chaise/src/assets/scss/_range-picker.scss';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import '@isrd-isi-edu/chaise/src/assets/scss/_faceting.scss';

// import { LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
// import { RecordsetConfig, RecordsetDisplayMode, RecordsetSelectMode } from '@isrd-isi-edu/chaise/src/models/recordset';
// import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
// import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import RangeInputs from '@isrd-isi-edu/chaise/src/components/range-inputs';


// components
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import Plot from 'react-plotly.js';
import { ResizeSensor } from 'css-element-queries';

// models
import { LogActions, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import {
  FacetRangePickerProps,
  RangeOptions,
  RangePickerState,
  TimeStamp
} from '@isrd-isi-edu/chaise/src/models/range-picker';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utilities
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getNotNullFilter } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

const FacetRangePicker = ({
  facetColumn,
  index
}: FacetRangePickerProps): JSX.Element => {
  const [ranges, setRanges] = useState<any[]>([]);

  const [compState, setCompState] = useState<RangePickerState>({
    disableZoomIn: false,
    histogramDataStack: [],
    rangeOptions: { absMin: null, absMax: null, model: { min: null, max: null } },
    relayout: false,
    plot: {
      data: [{
        x: [],
        y: [],
        type: 'bar'
      }],
      config: {
        displayModeBar: false,
        responsive: true
      },
      layout: {
        autosize: true,
        height: 150,
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
    }
  })


  const facetContainer = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);

  const numBuckets = facetColumn.histogramBucketCount;

  useLayoutEffect(() => {
    if (!facetContainer.current) return;
    new ResizeSensor(
      facetContainer.current,
      () => {
        if (facetContainer.current && plotlyRef.current) plotlyRef.current.resizeHandler();
      }
    )
  }, []);

  useEffect(() => {
    if (facetColumn.hideNotNullChoice) {
      setRanges([getNotNullFilter(false)]);
    }

    const layout = { ...compState.plot.layout };
    if (isColumnOfType('int')) {
      if (layout.margin && typeof layout.margin === 'object') layout.margin.b = 40;
      if (layout.xaxis && typeof layout.xaxis === 'object') layout.xaxis.tickformat = ',d';
    } else if (isColumnOfType('date')) {
      if (layout.xaxis && typeof layout.xaxis === 'object') layout.xaxis.tickformat = '%Y-%m-%d';
    } else if (isColumnOfType('timestamp')) {
      if (layout.xaxis && typeof layout.xaxis === 'object') layout.xaxis.tickformat = '%Y-%m-%d\n%H:%M';
    }

    setCompState({
      ...compState,
      plot: {
        ...compState.plot,
        layout: layout
      }
    });

    // NOTE: temporary
    updateFacetData();
  }, [facetColumn]);

  useEffect(() => {
    (function (uri, reloadCauses, reloadStartTime) {
      if (compState.relayout) {
        histogramData(compState.rangeOptions.absMin, compState.rangeOptions.absMax, reloadCauses, reloadStartTime)
      }
    })(facetColumn.sourceReference.uri);
    // })(facetColumn.sourceReference.uri, facetModel.reloadCauses, facetModel.reloadStartTime);
  }, [compState.relayout])


  /***** API call functions *****/
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
        if (facetColumn.sourceReference.uri !== uri) {
          // return false to defer.resolve() in .then() callback
          // return false;
        }

        // initiailize the min/max values. Float and timestamp values need epsilon values applied to get a more accurate range
        const minMaxRangeOptions = initializeRangeMinMax(response[0], response[1]);

        // if - the max/min are null
        //    - bar_plot in annotation is 'false'
        //    - histogram not supported for column type
        // since compState might not have been updated, do the showHistogram() check but with the supplied min/max 
        if (!(facetColumn.barPlot && minMaxRangeOptions.absMin !== null && minMaxRangeOptions.absMax !== null)) {
          // TODO: resolve use of defer?
          // return true to defer.resolve() in .then() callback
          setCompState({
            ...compState,
            rangeOptions: minMaxRangeOptions
          });
          return true;
        }

        setCompState({
          ...compState,
          disableZoomIn: disableZoomIn(minMaxRangeOptions.absMin, minMaxRangeOptions.absMax),
          histogramDataStack: [],
          rangeOptions: minMaxRangeOptions,
          relayout: false
        });
        // get initial histogram data
        histogramData(minMaxRangeOptions.absMin, minMaxRangeOptions.absMax, reloadCauses, reloadStartTime);
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

  // NOTE: min and max are passed as parameters since we don't want to rely on state values being set/updated before sending this request
  const histogramData = (min: RangeOptions['absMin'], max: RangeOptions['absMax'], reloadCauses: any, reloadStartTime: any) => {
    // var defer = $q.defer();

    (function (uri) {
      const requestMin = isColumnOfType('timestamp') ? dateTimeToTimestamp(min as TimeStamp) : min,
        requestMax = isColumnOfType('timestamp') ? dateTimeToTimestamp(max as TimeStamp) : max;

      const facetLog = getDefaultLogInfo();
      let action = LogActions.FACET_HISTOGRAM_LOAD;
      // if (reloadCauses.length > 0) {
      //   action = LogActions.FACET_HISTOGRAM_RELOAD;

      //   // add causes
      //   facetLog.stack = LogService.addCausesToStack(facetLog.stack, reloadCauses, reloadStartTime);
      // }

      // facetLog.action = scope.parentCtrl.getFacetLogAction(index, action);
      facetColumn.column.groupAggregate.histogram(numBuckets, requestMin, requestMax).read(facetLog).then((response: any) => {
        if (facetColumn.sourceReference.uri !== uri) {
          // return breaks out of the current callback function
          // defer.resolve(false);
          // return defer.promise;
        }

        let shouldRelayout = compState.relayout;
        // after zooming in, we don't care about displaying values beyond the set the user sees
        // if set is greater than bucketCount, remove last bin (we should only see this when the max+ bin is present)
        if (shouldRelayout && response.x.length > numBuckets) {
          response.x.splice(-1, 1);
          response.y.splice(-1, 1);
          shouldRelayout = false;
        }

        const plotData = [...compState.plot.data] as any[];
        plotData[0].x = response.x;
        plotData[0].y = response.y;

        const plotLayout = { ...compState.plot.layout };
        if (plotLayout.xaxis && typeof plotLayout.xaxis === 'object') plotLayout.xaxis.range = updateHistogramRange(min, max);

        response.min = requestMin;
        response.max = requestMax;

        // push the data on the stack to be used for unzoom and reset
        const histogramDataStack = [...compState.histogramDataStack];
        histogramDataStack.push(response)

        setCompState({
          ...compState,
          disableZoomIn: disableZoomIn(min, max),
          histogramDataStack: histogramDataStack,
          plot: {
            ...compState.plot,
            data: plotData,
            layout: plotLayout
          },
          relayout: shouldRelayout,
          rangeOptions: {
            absMin: min,
            absMax: max,
            model: {
              min: min,
              max: max
            }
          }
        });
        // defer.resolve(true);
      }).catch((err: any) => {
        // defer.reject(err);
        console.log('catch histogram data: ', err);
      });
    })(facetColumn.sourceReference.uri);

    // return defer.promise;
  }


  /***** Helpers and Setter functions *****/
  const isColumnOfType = (columnType: string) => {
    return (facetColumn.column.type.rootName.indexOf(columnType) > -1)
  }

  const getDefaultLogInfo = () => {
    const res = facetColumn.sourceReference.defaultLogInfo;

    // TODO: res.stack for defaultLogInfo
    // res.stack = scope.parentCtrl.getFacetLogStack(index);
    return res;
  }

  const showHistogram = (): boolean => {
    return facetColumn.barPlot && (compState.rangeOptions.absMin !== null && compState.rangeOptions.absMax !== null)
  }

  // floats should truncate to 4 digits always
  const FLOAT_PRECISION = 10000;
  /**
   * Handles the initialization of timestamp and float values to account for potential precision loss. For timestamp[tz],
   * fractional seconds are truncated as part of the query sent to ermrest, so truncate the fractional seconds for min and
   * increase the max by 1 second, then truncate. For float[4,8], calculate an epsilon value for each of min and max based
   * on the float size. Then decrease the min by the min epsilon and increase the max by the max epsilon.
   * @param {string | number} min min value to initialize the inputs with
   * @param {string | number} max max value to initialize the inputs with
   */
  const initializeRangeMinMax = (min: string | number, max: string | number) => {
    const tempRangeOptions: RangeOptions = { ...compState.rangeOptions }
    if (isColumnOfType('timestamp')) {
      if (!min) {
        tempRangeOptions.absMin = null;
      } else {
        // incase of fractional seconds, truncate for min
        const m = windowRef.moment(min).startOf('second');
        tempRangeOptions.absMin = {
          date: m.format(dataFormats.date),
          time: m.format(dataFormats.time24)
        }
      }

      if (!max) {
        tempRangeOptions.absMax = null;
      } else {
        // incase of fractional seconds, add 1 and truncate for max
        const m = windowRef.moment(max).add(1, 'second').startOf('second');
        tempRangeOptions.absMax = {
          date: m.format(dataFormats.date),
          time: m.format(dataFormats.time24)
        }
      }
    } else if (isColumnOfType('float')) {
      // epsilon can be calculated using Math.pow(2, exponent_base + log2(x))
      // check for float cases for extra precision
      let minEps = 0, maxEps = 0,
        tiny = 0, expbase = 0;

      // use the max of tiny and epsilon
      // max(tiny, pow(2, expbase + log2(abs(x))))
      // log2(0) and log2(-x) are undefined so use absolute values
      if (isColumnOfType('float4')) {
        tiny = Math.pow(2, -127); // min exponent -127
        expbase = -23; // 23 bit mantissa
      } else if (isColumnOfType('float8')) {
        tiny = Math.pow(2, -1022); // min exponent -1022
        expbase = -52; // 52 bit mantissa
      }

      // max(tiny, pow(2, expbase + log2(abs(x))))
      // use tiny as the epsilon if min/max are 0
      // for calling log2(x), x has to be a non-negative, non-zero number
      minEps = (min !== null && min !== 0) ? Math.max(tiny, Math.pow(2, expbase + Math.log2(Math.abs(min as number)))) : tiny;
      maxEps = (max !== null && max !== 0) ? Math.max(tiny, Math.pow(2, expbase + Math.log2(Math.abs(max as number)))) : tiny;

      // adjust by epsilon if value is defined and non null
      // NOTE: checking for `typeof x === 'number'` ensures the value is non null
      tempRangeOptions.absMin = (typeof min === 'number') ? formatFloatMin(min - minEps) : null;
      tempRangeOptions.absMax = (typeof max === 'number') ? formatFloatMax(max + maxEps) : null;
    } else {
      tempRangeOptions.absMin = min;
      tempRangeOptions.absMax = max;
    }

    return tempRangeOptions;
  }

  // set the absMin and absMax values
  // all values are in their database returned format
  const updateRangeMinMax = (min: string | number, max: string | number): RangeOptions => {
    const tempRangeOptions: RangeOptions = { ...compState.rangeOptions }
    if (isColumnOfType('timestamp')) {
      // convert and set the values if they are defined.
      tempRangeOptions.absMin = timestampToDateTime(min as string);
      tempRangeOptions.absMax = timestampToDateTime(max as string);
    } else if (isColumnOfType('float')) {
      tempRangeOptions.absMin = formatFloatMin(min as number);
      tempRangeOptions.absMax = formatFloatMax(max as number);
    } else {
      tempRangeOptions.absMin = min;
      tempRangeOptions.absMax = max;
    }

    return tempRangeOptions;
  }

  /**
   * Takes a float value and truncates the string to precision 4
   * @param {number} min the float value to truncate
   * @returns {number} formatted float value
   */
  const formatFloatMin = (min: number) => {
    if (!min) return min;
    return Math.floor(min * FLOAT_PRECISION) / FLOAT_PRECISION;
  }

  /**
   * Takes a float value and truncates the string to precision 4
   * @param {number} max the float value to truncate
   * @returns {number} formatted float value
   */
  const formatFloatMax = (max: number) => {
    if (!max) return max;
    return Math.ceil(max * FLOAT_PRECISION) / FLOAT_PRECISION;
  }

  /**
   * Given an object with `date` and `time`, it will turn it into timestamp reprsentation of datetime.
   * @param  {object} obj The datetime object with `date` and `time` attributes
   * @return {string} timestamp in submission format
   * NOTE might return `null`
   */
  const dateTimeToTimestamp = (obj: TimeStamp) => {
    if (!obj) return null;
    const ts = obj.date + obj.time;
    return windowRef.moment(ts, dataFormats.date + dataFormats.time24).format(dataFormats.datetime.submission);
  }

  /**
   * Given a string representing timestamp will turn it into an object with `date` and `time` attributes
   * @param  {string} ts timestamp
   * @return {object} an object with `date` and `time` attributes
   * NOTE might return `null`
   */
  const timestampToDateTime = (ts: string) => {
    if (!ts) return null;
    const m = windowRef.moment(ts);
    return {
      date: m.format(dataFormats.date),
      time: m.format(dataFormats.time24)
    };
  }

  const updateHistogramRange = (min: RangeOptions['absMin'], max: RangeOptions['absMax']) => {
    if (isColumnOfType('timestamp')) {
      return [dateTimeToTimestamp(min as TimeStamp), dateTimeToTimestamp(max as TimeStamp)];
    } else {
      return [min, max];
    }
  }


  /***** Plot Interaction Functions *****/
  // Zoom the set into the middle 50% of the buckets
  const zoomInPlot = () => {
    // NOTE: x[x.length-1] may not be representative of the absolute max
    // range is based on the index of the bucket representing the max value
    const plotData = compState.plot.data as any[];
    let maxIndex = plotData[0].x.findIndex((value: any) => {
      return compState.rangeOptions.absMax !== null ? value >= compState.rangeOptions.absMax : 0;
    });

    // the last bucket is a value less than the max but includes max in it
    if (maxIndex < 0) {
      maxIndex = plotData[0].x.length;
    }

    // zooming in should increase clarity by 50%
    // range is applied to both min and max so use half of 50%
    const zoomRange = Math.ceil(maxIndex * 0.25);
    // middle bucket rounded down
    const median = Math.floor(maxIndex / 2);
    const minBinIndex = median - zoomRange;
    const maxBinIndex = median + zoomRange;

    const rangeMinMax = updateRangeMinMax(plotData[0].x[minBinIndex], plotData[0].x[maxBinIndex]);
    setCompState({
      ...compState,
      disableZoomIn: disableZoomIn(rangeMinMax.absMin, rangeMinMax.absMax),
      relayout: true,
      rangeOptions: rangeMinMax
    })
    // scope.parentCtrl.updateFacetColumn(scope.index, logService.reloadCauses.FACET_PLOT_RELAYOUT);
  }

  // disable zoom in if histogram has been zoomed 20+ times or the current range is <= the number of buckets
  const disableZoomIn = (min: RangeOptions['absMin'], max: RangeOptions['absMax']) => {
    let limitedRange = false;

    if (min && max) {
      if (isColumnOfType('int')) {
        limitedRange = ((max as number) - (min as number)) <= numBuckets;
      } else if (isColumnOfType('date')) {
        const minMoment = windowRef.moment(min);
        const maxMoment = windowRef.moment(max);

        limitedRange = windowRef.moment.duration((maxMoment.diff(minMoment))).asDays() <= numBuckets;
      } else if (isColumnOfType('timestamp')) {
        const minTS: TimeStamp = min as TimeStamp;
        const maxTS: TimeStamp = max as TimeStamp;

        limitedRange = (minTS.date + minTS.time) === (maxTS.date + maxTS.time);
      } else {
        // handles float for now
        limitedRange = min === max;
      }
    }

    return compState.histogramDataStack.length >= 20 || limitedRange;
  };

  const zoomOutPlot = () => {
    try {
      if (compState.histogramDataStack.length === 1) {
        // setRangeVars();
        throw new Error('No more data to show');
      }

      const histogramDataStack = [...compState.histogramDataStack];
      histogramDataStack.pop();

      const previousData = histogramDataStack[histogramDataStack.length - 1];

      updatePreviousPlotValues(previousData, histogramDataStack);
    } catch (err) {
      if (compState.histogramDataStack.length === 1) {
        $log.warn(err);
      }
    }
  }

  const resetPlot = () => {
    const histogramDataStack = [...compState.histogramDataStack];
    histogramDataStack.splice(1);

    const initialData = histogramDataStack[0];

    updatePreviousPlotValues(initialData, histogramDataStack);
  }

  const updatePreviousPlotValues = (data: any, histogramDataStack: any[]) => {
    const plotData = [...compState.plot.data] as any[];
    plotData[0].x = data.x;
    plotData[0].y = data.y;

    const plotLayout = { ...compState.plot.layout };

    const rangeOptions = updateRangeMinMax(data.min, data.max);
    if (plotLayout.xaxis && typeof plotLayout.xaxis === 'object') {
      plotLayout.xaxis.range = updateHistogramRange(rangeOptions.absMin, rangeOptions.absMax);
    }

    setCompState({
      ...compState,
      disableZoomIn: disableZoomIn(rangeOptions.absMin, rangeOptions.absMax),
      histogramDataStack: histogramDataStack,
      plot: {
        ...compState.plot,
        data: plotData,
        layout: plotLayout
      },
      rangeOptions: {
        absMin: rangeOptions.absMin,
        absMax: rangeOptions.absMax,
        model: {
          min: rangeOptions.absMin,
          max: rangeOptions.absMax
        }
      }
    });
  }

  // this event is triggered when the:
  //      plot is zoomed/double clicked
  //      xaxis is panned/stretched/shrunk
  const plotlyRelayout = (event: any) => {
    try {
      setTimeout(function () {
        let shouldRelayout = true;
        // min/max is value interpretted by plotly by position of range in respect to x axis values
        const min = event['xaxis.range[0]'];
        const max = event['xaxis.range[1]'];

        // This case can happen when:
        //   - the user double clicks the plot
        //   - the relayout event is called because the element was resized (panel stretched or shrunk)
        //   - Plotly.relayout is called to update xaxis.fixedrange
        // if both undefined, don't re-fetch data
        if (typeof min === 'undefined' && typeof max === 'undefined') {
          shouldRelayout = false
          setCompState({ ...compState, relayout: shouldRelayout });
          return;
        }

        const minMaxRangeOptions = { absMin: compState.rangeOptions.absMin, absMax: compState.rangeOptions.absMax };
        // if min is undefined, absMin remains unchanged (happens when xaxis max is stretched)
        // and if not null, update the value
        if (min !== null && typeof min !== 'undefined') {
          if (isColumnOfType('int')) {
            minMaxRangeOptions.absMin = Math.round(min);
          } else if (isColumnOfType('date')) {
            minMaxRangeOptions.absMin = windowRef.moment(min).format(dataFormats.date);
          } else if (isColumnOfType('timestamp')) {
            const minMoment = windowRef.moment(min);
            minMaxRangeOptions.absMin = {
              date: minMoment.format(dataFormats.date),
              time: minMoment.format(dataFormats.time24)
            };
          } else {
            minMaxRangeOptions.absMin = min;
          }
        }

        // if max is undefined, absMax remains unchanged (happens when xaxis min is stretched)
        // and if not null, update the value
        if (max !== null && typeof max !== 'undefined') {
          if (isColumnOfType('int')) {
            minMaxRangeOptions.absMax = Math.round(max);
          } else if (isColumnOfType('date')) {
            minMaxRangeOptions.absMax = windowRef.moment(max).format(dataFormats.date);
          } else if (isColumnOfType('timestamp')) {
            const maxMoment = windowRef.moment(max);
            minMaxRangeOptions.absMax = {
              date: maxMoment.format(dataFormats.date),
              time: maxMoment.format(dataFormats.time24)
            }
          } else {
            minMaxRangeOptions.absMax = max;
          }
        }

        setCompState({
          ...compState,
          relayout: shouldRelayout,
          rangeOptions: {
            ...compState.rangeOptions,
            absMin: minMaxRangeOptions.absMin,
            absMax: minMaxRangeOptions.absMax,
          }
        });

        // scope.parentCtrl.updateFacetColumn(scope.index, logService.reloadCauses.FACET_PLOT_RELAYOUT);
      });
    } catch (err) {
      const plotLayout = { ...compState.plot.layout }
      if (plotLayout.xaxis && typeof plotLayout.xaxis === 'object') {
        plotLayout.xaxis.range = updateHistogramRange(compState.rangeOptions.absMin, compState.rangeOptions.absMax);
      }

      setCompState({
        ...compState,
        plot: {
          ...compState.plot,
          layout: plotLayout
        },
        rangeOptions: {
          ...compState.rangeOptions,
          model: {
            min: compState.rangeOptions.absMin,
            max: compState.rangeOptions.absMax
          }
        },
      })

      $log.warn(err);
    }
  }


  /***** render functions *****/
  const renderPlot = () => {
    const plotData = compState.plot.data as any[];
    if (plotData[0].x.length < 1 || plotData[0].y.length < 1) return;
    return (<Plot
      config={compState.plot.config}
      data={compState.plot.data}
      layout={compState.plot.layout ? compState.plot.layout : {}}
      onRelayout={(event) => plotlyRelayout(event)}
      ref={plotlyRef}
      style={{ 'width': '100%' }}
      useResizeHandler
    />)
  }

  const renderHistogramHelpTooltip = () => {
    // to avoid max line length eslint error
    const splitLine1 = 'Clicking and holding anywhere in the graph display will allow you to zoom into a smaller subset of data. ' +
      'Drag the left or right bound to encapsulate the range of data you want to zoom into to get more clarity.'
    const splitLine2 = 'Clicking and holding in the middle of the x axis of the graph will allow you to pan that axis. ' +
      'By clicking on either end, you can stretch that axis to get a wider range of data.'
    const lineWithApostrophe = 'Interacting with the histogram does not automatically apply the filter, ' +
      'it will fill in the min/max input fields for you based on the histogram\'s current range.'

    return (<>
      <p>You can interact with the histogram in 2 ways: zooming and panning.</p>
      <p>{splitLine1}</p>
      <p>{splitLine2}</p>
      <p>{lineWithApostrophe}</p>
    </>)
  }

  const renderZoomInButton = () => {
    const zoomInButton = <button
      type='button'
      className='zoom-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm'
      disabled={compState.disableZoomIn}
      onClick={zoomInPlot}
    >
      <span className='chaise-icon chaise-zoom-in'></span>
    </button>;

    // if button is disabled, don't attach the OverlayTrigger
    if (compState.disableZoomIn) return (zoomInButton);

    return (<OverlayTrigger
      placement='bottom'
      overlay={<Tooltip>Zoom</Tooltip>}
    >
      {zoomInButton}
    </OverlayTrigger>)
  }

  const renderZoomOutButton = () => {
    const zoomOutButton = <button
      type='button'
      className='unzoom-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm'
      disabled={compState.histogramDataStack.length <= 1}
      onClick={zoomOutPlot}
    >
      <span className='chaise-icon chaise-zoom-out'></span>
    </button>;

    // if button is disabled, don't attach the OverlayTrigger
    if (compState.histogramDataStack.length <= 1) return (zoomOutButton);

    return (<OverlayTrigger
      placement='bottom'
      overlay={<Tooltip>Unzoom</Tooltip>}
    >
      {zoomOutButton}
    </OverlayTrigger>)
  }

  const renderHistogram = () => {
    // if (facetModel.initialized && facetModel.isOpen && facetPanelOpen && showHistogram()) {
    if (showHistogram()) {
      return (<>
        <div className='plotly-actions'>
          <div className='chaise-btn-group' style={{ 'zIndex': 1 }}>
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip>
                  {renderHistogramHelpTooltip()}
                </Tooltip>
              }>
              <button type='button' className='plotly-how-to chaise-btn chaise-btn-tertiary chaise-btn-sm'>
                <span className='chaise-icon chaise-info'></span>
              </button>
            </OverlayTrigger>
            {renderZoomInButton()}
            {renderZoomOutButton()}
            <OverlayTrigger placement='bottom' overlay={<Tooltip>Reset</Tooltip>}>
              <button type='button' className='reset-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm' onClick={resetPlot}>
                <span className='fas fa-undo'></span>
              </button>
            </OverlayTrigger>
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
    <div className='range-picker' ref={facetContainer}>
      <div>
        List goes here
      </div>
      <div>
        <RangeInputs type={0} />
      </div>
      {renderHistogram()}
    </div>
  )
}

export default FacetRangePicker;