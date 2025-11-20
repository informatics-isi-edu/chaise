import '@isrd-isi-edu/chaise/src/assets/scss/_range-picker.scss';

import React from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import FacetCheckList from '@isrd-isi-edu/chaise/src/components/faceting/facet-check-list';
import RangeInputs from '@isrd-isi-edu/chaise/src/components/range-inputs';


// customizable method: use your own `Plotly` object to use minified basic distribution of plotlyjs
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

// hooks
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';
import useVarRef from '@isrd-isi-edu/chaise/src/hooks/var-ref';

// models
import { LogActions, LogReloadCauses } from '@isrd-isi-edu/chaise/src/models/log';
import { FacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/models/recordset';
import {
  FacetRangePickerProps,
  HTMLPlotElement,
  PlotData,
  PlotlyLayout,
  RangeOptions,
  RangePickerState,
  TimeStamp
} from '@isrd-isi-edu/chaise/src/models/range-picker';


// services
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { dataFormats } from '@isrd-isi-edu/chaise/src/utils/constants';
import { getNotNullFacetCheckBoxRow, getNullFacetCheckBoxRow } from '@isrd-isi-edu/chaise/src/utils/faceting-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { ResizeSensor } from 'css-element-queries';
import { getInputType } from '@isrd-isi-edu/chaise/src/utils/input-utils';

const FacetRangePicker = ({
  dispatchFacetUpdate,
  facetColumn,
  facetIndex,
  facetModel,
  facetPanelOpen,
  register,
  updateRecordsetReference,
  getFacetLogAction,
  getFacetLogStack,
}: FacetRangePickerProps): JSX.Element => {
  const [ranges, setRanges, rangesRef] = useStateRef<FacetCheckBoxRow[]>(() => {
    const res: FacetCheckBoxRow[] = [];
    if (!facetColumn.hideNotNullChoice) {
      res.push(getNotNullFacetCheckBoxRow(facetColumn.hasNotNullFilter));
    }
    if (!facetColumn.hideNullChoice) {
      res.push(getNullFacetCheckBoxRow(facetColumn.hasNullFilter));
    }
    return res;
  });

  /**
   * We must create references for the state and local variables that
   * are used in the flow-control related functions. This is to ensure the
   * functions are using their latest values.
   */
  const facetColumnRef = useVarRef(facetColumn);

  const isColumnOfType = (columnType: string) => {
    return (facetColumnRef.current.column.type.rootName.indexOf(columnType) > -1)
  }

  const createChoiceDisplay = (filter: any, selected: boolean) => {
    return {
      uniqueId: filter.uniqueId,
      displayname: { value: filter.toString(), isHTML: false },
      selected: selected,
      metaData: {
        min: filter.min,
        minExclusive: filter.minExclusive,
        max: filter.max,
        maxExclusive: filter.maxExclusive
      }
    }
  };

  const [compState, setCompState] = useState<RangePickerState>(() => {
    const defaultPlotLayout: PlotlyLayout = {
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
        // when set to `-`, plotly tries to figure out the type of data and automatically set the type
        type: '-'
      },
      yaxis: {
        fixedrange: true,
        zeroline: true
        // removed tickformat: ',d' since it would cause small data sets to show [0, 1, 1, 2, 2]
        // when the yaxis labels were really [0, 0.5, 1, 1.5, 2] by rounding non whole numbers
      },
      bargap: 0
    }

    // isColumnOfType relies on `facetColumn` being defined. This component won't load unles there's a facetColumn
    if (isColumnOfType('int')) {
      defaultPlotLayout.margin.b = 40;
      defaultPlotLayout.xaxis.tickformat = ',d';
    } else if (isColumnOfType('date')) {
      defaultPlotLayout.xaxis.tickformat = '%Y-%m-%d';
    } else if (isColumnOfType('timestamp')) {
      defaultPlotLayout.xaxis.tickformat = '%Y-%m-%d\n%H:%M';
    }

    return {
      disableZoomIn: false,
      histogramDataStack: [],
      rangeOptions: { absMin: '', absMax: '', model: { min: '', max: '' } },
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
        layout: defaultPlotLayout
      }
    }
  })

  const rangePickerContainer = useRef<HTMLDivElement>(null);
  const listContainer = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<HTMLPlotElement>(null);

  const numBuckets = facetColumn.histogramBucketCount;

  // set the resize sensor to call the plot resize fucntion
  useLayoutEffect(() => {
    if (!rangePickerContainer.current) return;
    const rs = new ResizeSensor(
      rangePickerContainer.current,
      () => {
        if (rangePickerContainer.current && plotlyRef.current) plotlyRef.current.resizeHandler();
      }
    )

    return () => {
      rs.detach();
    }
  }, []);

  useEffect(() => {
    if (compState.relayout) {
      // make sure the callbacks with latest scope are used
      callRegister();

      $log.debug(`faceting: request for facet (index=${facetIndex} update. relayout triggered`);

      // ask the parent to update the facet column
      dispatchFacetUpdate(facetIndex, true, LogReloadCauses.FACET_PLOT_RELAYOUT);
    }
  }, [compState.relayout])

  /**
   * register the flow-control related functions for the facet
   * this will ensure the functions are registerd based on the latest facet changes
   */
  useEffect(() => {
    callRegister();
  }, [facetModel, ranges]);

  //-------------------  flow-control related functions:   --------------------//
  /**
   * register the callbacks (this should be called after related state variables changed)
   */
  const callRegister = () => {
    register(facetIndex, processFacet, preProcessFacet, getAppliedFilters, removeAppliedFilters);
  };

  /**
   * The registered callback to pre-process facets
   */
  const preProcessFacet = async () => {
    // if we have the not-null filter, other filters are not important and can be ignored
    if (facetColumnRef.current.hasNotNullFilter) {
      setRanges(() => {
        const res = [getNotNullFacetCheckBoxRow(true)];
        if (!facetColumn.hideNullChoice) {
          res.push(getNullFacetCheckBoxRow(facetColumn.hasNullFilter));
        }
        return res;
      });
      return true;
    } else {
      // default value of ranges already handles whether null and notNull option should be present
      const updatedRows: FacetCheckBoxRow[] = [...rangesRef.current];

      for (let i = 0; i < facetColumnRef.current.rangeFilters.length; i++) {
        const filter = facetColumnRef.current.rangeFilters[i];

        const rowIndex = rangesRef.current.findIndex(function (obj) {
          return obj.uniqueId === filter.uniqueId;
        });

        // if the row is not in the set of choices, add it
        if (rowIndex === -1) {
          updatedRows.push(createChoiceDisplay(filter, true));
        }
      }

      setRanges(updatedRows);
      return true;
    }
  };

  /**
   * The registered callback to process and update facets
   */
  const processFacet = (reloadCauses: string[], reloadStartTime: number) => {
    return new Promise((resolve, reject) => {
      updateFacetData(reloadCauses, reloadStartTime).then((result: any) => {
        resolve(result);
      }).catch(function (err: any) {
        reject(err);
      });
    });
  };

  /**
   * The registered callback to get the selected filters
   */
  const getAppliedFilters = () => {
    return rangesRef.current.filter((cbr: FacetCheckBoxRow) => cbr.selected);
  };

  /**
   * The registered callback to remove all the selected filters
   */
  const removeAppliedFilters = () => {
    setRanges((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => {
        return { ...curr, selected: false }
      });
    });
  }

  /***** UI related callbacks *****/
  const addFilter = (min: RangeOptions['absMin'], max: RangeOptions['absMin']) => {
    // TODO: export types in ermrestJS
    // let res: {filter: RangeFacetFilter, reference: Reference};
    let res: { filter: any, reference: any };
    const cause = LogReloadCauses.FACET_SELECT;
    if (isColumnOfType('float')) {
      res = facetColumn.addRangeFilter(formatFloatMin(min as number), false, formatFloatMax(max as number), false);
    } else {
      res = facetColumn.addRangeFilter(min || null, false, max || null, false);
    }

    if (!res) {
      return; // duplicate filter
    }

    // this function checks the URL length as well and might fail
    if (!updateRecordsetReference(res.reference, facetIndex, cause)) {
      $log.debug('faceting: URL limit reached. Reverting the change.');
      return;
    }

    const rowIndex = ranges.findIndex(function (obj: any) {
      return obj.uniqueId === res.filter.uniqueId;
    });

    $log.debug('faceting: request for facet (index=' + facetIndex + ') range add. min=' + min + ', max=' + max);

    const updatedRows: FacetCheckBoxRow[] = [...ranges];

    if (rowIndex === -1) {
      // we should create a new filter
      updatedRows.push(createChoiceDisplay(res.filter, true))
    } else {
      // filter already exists, we should just change it to selected
      updatedRows[rowIndex].selected = true;
    }

    setRanges(updatedRows);
  }

  const onRowClick = (row: FacetCheckBoxRow, rowIndex: number, event: any) => {
    const checked = !row.selected;

    const cause = checked ? LogReloadCauses.FACET_SELECT : LogReloadCauses.FACET_DESELECT;
    // get the new reference based on the operation
    let res: { filter: any, reference: any } = { filter: {}, reference: {} };
    if (row.isNotNull) {
      if (checked) {
        res.reference = facetColumn.addNotNullFilter();
      } else {
        res.reference = facetColumn.removeNotNullFilter();
      }
      $log.debug(`faceting: request for facet (index=${facetIndex}) choice add. Not null filter.`);
    }
    else if (row.metaData) {
      if (checked) {
        res = facetColumn.addRangeFilter(row.metaData.min, row.metaData.minExclusive, row.metaData.max, row.metaData.maxExclusive);
      } else {
        res = facetColumn.removeRangeFilter(row.metaData.min, row.metaData.minExclusive, row.metaData.max, row.metaData.maxExclusive);
      }
      $log.debug(`faceting: request for facet (index=${facetColumn.index}) range ${row.selected ? 'add' : 'remove'}.
      min=${row.metaData.min}, max=${row.metaData.max}`);
    }
    // this is the null filter
    else {
      if (checked) {
        res.reference = facetColumn.addChoiceFilters([row.uniqueId]);
      } else {
        res.reference = facetColumn.removeChoiceFilters([row.uniqueId]);
      }
      $log.debug(`faceting: request for facet (index=${facetIndex}) range ${row.selected ? 'add' : 'remove'}. uniqueId='${row.uniqueId}`);
    }

    // this function checks the URL length as well and might fails
    if (!updateRecordsetReference(res.reference, facetIndex, cause)) {
      $log.debug('faceting: URL limit reached. Reverting the change.');
      event.preventDefault();
      return;
    }

    setRanges((prev: FacetCheckBoxRow[]) => {
      return prev.map((curr: FacetCheckBoxRow) => {
        if (curr === row) return { ...curr, selected: checked };
        // if not-null is selected, remove all the other filters
        else if (row.isNotNull && checked) return { ...curr, selected: false }
        else return curr;
      });
    });
  }

  /***** API call functions *****/
  const updateFacetData = (reloadCauses: string[], reloadStartTime: number) => {
    return new Promise((resolve, reject) => {

      (function (uri, reloadCauses, reloadStartTime) {
        if (!compState.relayout) {
          // the captured uri is not the same as the initial data uri so we need to refetch the min/max
          // this happens when another facet adds a filter that affects the facett object in the uri
          const agg = facetColumnRef.current.column.aggregate;
          const aggregateList = [
            agg.minAgg,
            agg.maxAgg
          ];

          const facetLog = getDefaultLogInfo();
          let action = LogActions.FACET_RANGE_LOAD;
          if (reloadCauses.length > 0) {
            action = LogActions.FACET_RANGE_RELOAD;
            // add causes
            facetLog.stack = LogService.addCausesToStack(facetLog.stack, reloadCauses, reloadStartTime);
          }
          facetLog.action = getFacetLogAction(facetIndex, action);
          $log.debug('fetch aggregates')
          facetColumnRef.current.sourceReference.getAggregates(aggregateList, facetLog).then((response: any) => {
            if (facetColumnRef.current.sourceReference.uri !== uri) {
              resolve(false);
              return;
            }

            // initiailize the min/max values. Float and timestamp values need epsilon values applied to get a more accurate range
            const minMaxRangeOptions = initializeRangeMinMax(response[0], response[1]);

            // if - the max/min are null or empty string (empty string is used for the timestamp)
            //    - bar_plot in annotation is 'false'
            //    - histogram not supported for column type
            // since compState might not have been updated, do the showHistogram() check but with the supplied min/max
            const hasValue = minMaxRangeOptions.absMin !== null && minMaxRangeOptions.absMax !== null &&
              minMaxRangeOptions.absMin !== '' && minMaxRangeOptions.absMax !== '';

            if (!(facetColumnRef.current.barPlot && hasValue)) {
              setCompState({
                ...compState,
                rangeOptions: minMaxRangeOptions
              });
              resolve(true);
              return;
            }

            setCompState({
              ...compState,
              disableZoomIn: disableZoomIn(minMaxRangeOptions.absMin, minMaxRangeOptions.absMax),
              histogramDataStack: [],
              rangeOptions: minMaxRangeOptions,
              relayout: false
            });
            // get initial histogram data

            return histogramData(minMaxRangeOptions.absMin, minMaxRangeOptions.absMax, reloadCauses, reloadStartTime);
          }).then((response: any) => {

            resolve(response);
            return;
          }).catch((err: any) => {
            console.log('catch facet data: ', err);
            reject(err);
            return;
          });
          // relayout case
        } else {
          histogramData(compState.rangeOptions.absMin, compState.rangeOptions.absMax, reloadCauses, reloadStartTime).then((response: any) => {
            resolve(response);
            return;
          }).catch(function (err: any) {
            reject(err);
            return;
          });
        }
      })(facetColumnRef.current.sourceReference.uri, reloadCauses, reloadStartTime);
    });
  };

  // NOTE: min and max are passed as parameters since we don't want to rely on state values being set/updated before sending this request
  const histogramData = (min: RangeOptions['absMin'], max: RangeOptions['absMax'], reloadCauses: any, reloadStartTime: any) => {
    return new Promise((resolve, reject) => {

      (function (uri) {
        const requestMin = min, requestMax = max;
        const facetLog = getDefaultLogInfo();
        let action = LogActions.FACET_HISTOGRAM_LOAD;
        if (reloadCauses.length > 0) {
          action = LogActions.FACET_HISTOGRAM_RELOAD;

          // add causes
          facetLog.stack = LogService.addCausesToStack(facetLog.stack, reloadCauses, reloadStartTime);
        }

        facetLog.action = getFacetLogAction(facetIndex, action);
        $log.debug('fetch histogram data')
        facetColumnRef.current.column.groupAggregate.histogram(numBuckets, requestMin, requestMax).read(facetLog).then((response: any) => {
          if (facetColumn.sourceReference.uri !== uri) {
            // return breaks out of the current callback function
            resolve(false);
            return;
          }

          let shouldRelayout = compState.relayout;
          // after zooming in, we don't care about displaying values beyond the set the user sees
          // if set is greater than bucketCount, remove last bin (we should only see this when the max+ bin is present)
          if (shouldRelayout && response.x.length > numBuckets) {
            response.x.splice(-1, 1);
            response.y.splice(-1, 1);
            shouldRelayout = false;
          }

          const plotData = [...compState.plot.data] as PlotData[];
          plotData[0].x = response.x;
          plotData[0].y = response.y;

          const plotLayout = { ...compState.plot.layout };
          // set xaxis range
          if (plotLayout.xaxis && typeof plotLayout.xaxis === 'object') {
            plotLayout.xaxis.range = updateHistogramXRange(min, max);
            plotLayout.xaxis.fixedrange = disableZoomIn(min, max);
          }

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
              layout: plotLayout,
              labels: response.labels
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
          resolve(true);
          return;
        }).catch((err: any) => {
          reject(err);
          $log.error('catch histogram data: ', err);
          return;
        });
      })(facetColumnRef.current.sourceReference.uri);

    });
  }


  /***** Helpers and Setter functions *****/

  /**
   * Generate the object that we want to be logged alongside the action
   * This function does not attach action, after calling this function
   * we should attach the action.
   */
  const getDefaultLogInfo = () => {
    const res = facetColumnRef.current.sourceReference.defaultLogInfo;
    res.stack = getFacetLogStack(facetIndex);
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
      let format = dataFormats.timestamp;
      if (facetColumnRef.current.column.type.rootName === 'timestamptz') format = dataFormats.datetime.return;

      if (!min) {
        tempRangeOptions.absMin = '';
      } else {
        // incase of fractional seconds, truncate for min
        const m = windowRef.moment(min).startOf('second');
        tempRangeOptions.absMin = m.format(format);
      }

      if (!max) {
        tempRangeOptions.absMax = '';
      } else {
        // incase of fractional seconds, add 1 and truncate for max
        const m = windowRef.moment(max).add(1, 'second').startOf('second');
        tempRangeOptions.absMax = m.format(format)
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
    if (!min) return null;
    return Math.floor(min * FLOAT_PRECISION) / FLOAT_PRECISION;
  }

  /**
   * Takes a float value and truncates the string to precision 4
   * @param {number} max the float value to truncate
   * @returns {number} formatted float value
   */
  const formatFloatMax = (max: number) => {
    if (!max) return null;
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
    if (!ts) return '';
    let format = dataFormats.timestamp;
    if (facetColumnRef.current.column.type.rootName === 'timestamptz') format = dataFormats.datetime.return;

    return windowRef.moment(ts).format(format);
  }

  // if the date range is very small, the labels on the plot are repeated and the bars stretch across a few dates
  // pad either side of min/max with 2 extra labels being shown so the content is centered
  const updateHistogramXRange = (min: RangeOptions['absMin'], max: RangeOptions['absMax']) => {
    if (isColumnOfType('timestamp')) {
      return [dateTimeToTimestamp(min as TimeStamp), dateTimeToTimestamp(max as TimeStamp)];
    } else if (isColumnOfType('date')) {
      const minDate = windowRef.moment(min);
      const maxDate = windowRef.moment(max);
      const limitedRange = windowRef.moment.duration((maxDate.diff(minDate))).asDays();

      if (limitedRange <= 4) {
        const minDateDisplay = minDate.subtract(2, 'days').format(dataFormats.date);
        const maxDateDisplay = maxDate.add(2, 'days').format(dataFormats.date);
        return [minDateDisplay, maxDateDisplay];
      }
    } else if (isColumnOfType('int')) {
      const intMax = max as number;
      const intMin = min as number;
      if ((intMax - intMin) <= 4) return [intMin - 2, intMax + 2];
    }

    return [min, max];
  }


  /***** Plot Interaction Functions *****/
  // Zoom the set into the middle 50% of the buckets
  const zoomInPlot = () => {
    // NOTE: x[x.length-1] may not be representative of the absolute max
    // range is based on the index of the bucket representing the max value
    const plotData = compState.plot.data as PlotData[];
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
    });
  }

  function _isValueDefined(val: any) {
    return val !== undefined && val !== null;
  }

  // disable zoom in if histogram has been zoomed 20+ times or the current range is <= the number of buckets
  const disableZoomIn = (min: RangeOptions['absMin'], max: RangeOptions['absMax']) => {
    let limitedRange = false;

    if (_isValueDefined(min) && _isValueDefined(max)) {
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

  const updatePreviousPlotValues = (data: PlotData, histogramDataStack: PlotData[]) => {
    const plotData = [...compState.plot.data] as PlotData[];
    plotData[0].x = data.x;
    plotData[0].y = data.y;

    const plotLayout = { ...compState.plot.layout };

    const rangeOptions = updateRangeMinMax(data.min, data.max);
    if (plotLayout.xaxis && typeof plotLayout.xaxis === 'object') {
      plotLayout.xaxis.range = updateHistogramXRange(rangeOptions.absMin, rangeOptions.absMax);
      plotLayout.xaxis.fixedrange = disableZoomIn(rangeOptions.absMin, rangeOptions.absMax)
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

        let format = dataFormats.date;
        if (facetColumnRef.current.column.type.rootName === 'timestamp') format = dataFormats.timestamp;
        if (facetColumnRef.current.column.type.rootName === 'timestamptz') format = dataFormats.datetime.return;

        const minMaxRangeOptions = { absMin: compState.rangeOptions.absMin, absMax: compState.rangeOptions.absMax };
        // if min is undefined, absMin remains unchanged (happens when xaxis max is stretched)
        // and if not null, update the value
        if (min !== null && typeof min !== 'undefined') {
          if (isColumnOfType('int')) {
            minMaxRangeOptions.absMin = Math.round(min);
          } else if (isColumnOfType('date') || isColumnOfType('timestamp')) {
            minMaxRangeOptions.absMin = windowRef.moment(min).format(format);
          } else {
            minMaxRangeOptions.absMin = min;
          }
        }

        // if max is undefined, absMax remains unchanged (happens when xaxis min is stretched)
        // and if not null, update the value
        if (max !== null && typeof max !== 'undefined') {
          if (isColumnOfType('int')) {
            minMaxRangeOptions.absMax = Math.round(max);
          } else if (isColumnOfType('date') || isColumnOfType('timestamp')) {
            minMaxRangeOptions.absMax = windowRef.moment(max).format(format);
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
      });
    } catch (err) {
      const plotLayout = { ...compState.plot.layout }
      if (plotLayout.xaxis && typeof plotLayout.xaxis === 'object') {
        plotLayout.xaxis.range = updateHistogramXRange(compState.rangeOptions.absMin, compState.rangeOptions.absMax);
        plotLayout.xaxis.fixedrange = disableZoomIn(compState.rangeOptions.absMin, compState.rangeOptions.absMax);
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
  const renderPickerContainer = () => {
    return (
      <div className='picker-container'>
        <div ref={listContainer}>
          <FacetCheckList
            hasNotNullFilter={facetColumn.hasNotNullFilter}
            onRowClick={onRowClick}
            rows={ranges}
            setHeight={false}
          />
        </div>
      </div>
    )
  };

  const renderPlot = () => {
    const plotData = compState.plot.data as PlotData[];
    if (plotData[0].x.length < 1 || plotData[0].y.length < 1) return;
    return (<Plot
      config={compState.plot.config}
      data={compState.plot.data}
      layout={compState.plot.layout ? compState.plot.layout : {}}
      labels={compState.plot.labels}
      onRelayout={(event: any) => plotlyRelayout(event)}
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

    // if button is disabled, don't attach the tooltip
    if (compState.disableZoomIn) return (zoomInButton);

    return <ChaiseTooltip placement='bottom' tooltip='Zoom'>{zoomInButton}</ChaiseTooltip>;
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

    // if button is disabled, don't attach the tooltip
    if (compState.histogramDataStack.length <= 1) return (zoomOutButton);

    return <ChaiseTooltip placement='bottom' tooltip='Unzoom'>{zoomOutButton}</ChaiseTooltip>;
  }

  const renderHistogram = () => {
    if (facetModel.initialized && facetModel.isOpen && facetPanelOpen && showHistogram()) {
      return (<>
        <div className='plotly-actions'>
          <div className='chaise-btn-group' style={{ 'zIndex': 1 }}>
            <ChaiseTooltip
              placement='right'
              tooltip={renderHistogramHelpTooltip()}
            >
              <button type='button' className='plotly-how-to chaise-btn chaise-btn-tertiary chaise-btn-sm'>
                <span className='chaise-icon chaise-info'></span>
              </button>
            </ChaiseTooltip>
            {renderZoomInButton()}
            {renderZoomOutButton()}
            <ChaiseTooltip placement='bottom' tooltip='Reset'>
              <button type='button' className='reset-plotly-button chaise-btn chaise-btn-primary chaise-btn-sm' onClick={resetPlot}>
                <span className='fas fa-undo'></span>
              </button>
            </ChaiseTooltip>
          </div>
        </div>
        {renderPlot()}
      </>)
    }

    return;
  }

  return (
    <div className='range-picker' ref={rangePickerContainer}>
      {!facetModel.facetHasTimeoutError && renderPickerContainer()}
      <RangeInputs
        name={`chaise-${facetColumn.column.RID}`}
        inputType={getInputType(facetColumn.column.type)}
        classes='facet-range-input'
        addRange={addFilter}
        rangeOptions={compState.rangeOptions}
        disabled={facetColumn.hasNotNullFilter}
      />
      {renderHistogram()}
    </div>
  );
}

/**
 * avoid unnecessary re-renders: when facets are rearranged or other facets are updated
 */
export default React.memo(FacetRangePicker);
