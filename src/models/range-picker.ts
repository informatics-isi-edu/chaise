import { PlotData, PlotlyDataLayoutConfig } from 'plotly.js'

export type FacetRangePickerProps = {
  /** 
   * model for this specific facet with column attached to it 
   */
  facetColumn: any,
  /** 
   * index of this facet in the list of facets
   */
  index: number
}

export type RangePickerState = {
  /**
   * boolean that is recomputed each time the absMin/absMax change
   */
  disableZoomIn: boolean,
  /**
   * current and previous histogram data used for zoom out and reset buttons
   */
  histogramDataStack: PlotData[],
  /**
   * object that has all the properties and their values needed for plotly
   */
  plot: PlotlyDataLayoutConfig,
  /**
   * object that has the information about the minimum and maximum values
   */
  rangeOptions: RangeOptions,
  /**
   * boolean used to signal if new histogram data should be fetched
   */
  relayout: boolean
}

/**  
 * min and max types for the following column types:
 *   float, integer - number
 *   date           - string
 *   timestamp[tz]  - {date: string, time: string}
 **/
 export type RangeOptions = {
  /**
   * the minimum value of the set of data based on all facet criteria
   */
  absMin: number | string | TimeStamp | null,
  /**
   * the maximum value of the set of data based on all facet criteria
   */
  absMax: number | string | TimeStamp | null,
  model: {
    /**
     * the value of the min input
     */
    min: number | string | TimeStamp | null,
    /**
     * the value of the max input
     */
    max: number | string | TimeStamp | null
  }
}

export type TimeStamp = { 
  /**
   * the date value for the timestamp[tz]
   */
  date: string, 
  /**
   * the time value for the timestamp[tz]
   */
  time: string 
}