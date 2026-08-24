// customizable method: use your own `Plotly` object to use minified basic distribution of plotlyjs
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

// hooks
import { type JSX, type RefObject } from 'react';

// models
import { HTMLPlotElement, PlotData, PlotlyDataLayoutConfig } from '@isrd-isi-edu/chaise/src/models/range-picker';

type FacetRangePlotProps = {
  /**
   * the plotly data/layout/config/labels for the histogram
   */
  plot: PlotlyDataLayoutConfig,
  /**
   * called when the plot is zoomed/panned/resized
   */
  onRelayout: (event: any) => void,
  /**
   * ref to the underlying plotly instance, used by the parent for imperative resize calls
   */
  plotlyRef: RefObject<HTMLPlotElement | null>,
}

/**
 * isolates the plotly.js-basic-dist-min dependency (~1MB) so it's only fetched when a
 * facet-range-picker histogram actually renders, instead of on every page that has faceting
 */
const FacetRangePlot = ({ plot, onRelayout, plotlyRef }: FacetRangePlotProps): JSX.Element | null => {
  // this component mounts before the histogram data arrives, so render nothing until it does
  const plotData = plot.data as PlotData[];
  if (plotData[0].x.length < 1 || plotData[0].y.length < 1) return null;

  return (
    <Plot
      config={plot.config}
      data={plot.data}
      layout={plot.layout ? plot.layout : {}}
      labels={plot.labels}
      onRelayout={onRelayout}
      ref={plotlyRef}
      style={{ 'width': '100%' }}
      useResizeHandler
    />
  );
};

export default FacetRangePlot;
