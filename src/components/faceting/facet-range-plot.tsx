// customizable method: use your own `Plotly` object to use minified basic distribution of plotlyjs
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

// hooks
import { useImperativeHandle, useRef, type JSX, type RefObject } from 'react';

// models
import { FacetRangePlotHandle, PlotData, PlotlyDataLayoutConfig } from '@isrd-isi-edu/chaise/src/models/range-picker';

type FacetRangePlotProps = {
  /**
   * the plotly data/layout/config for the histogram
   */
  plot: PlotlyDataLayoutConfig,
  /**
   * called when the plot is zoomed/panned/resized
   */
  onRelayout: (event: any) => void,
  /**
   * handle the parent uses to imperatively resize the plot
   */
  plotHandleRef: RefObject<FacetRangePlotHandle | null>,
}

/**
 * isolates the plotly.js-basic-dist-min dependency (~1MB) so it's only fetched when a
 * facet-range-picker histogram actually renders, instead of on every page that has faceting.
 *
 * resizing goes through the exposed handle instead of the graph div: as of react-plotly.js v4
 * a ref resolves to the plain div with no `resizeHandler` on it, and calling `Plotly.Plots.resize`
 * from the parent would pull plotly back out of this lazy chunk.
 */
const FacetRangePlot = ({ plot, onRelayout, plotHandleRef }: FacetRangePlotProps): JSX.Element | null => {
  const graphDivRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(plotHandleRef, () => ({
    resize: () => {
      if (graphDivRef.current) Plotly.Plots.resize(graphDivRef.current);
    }
  }), []);

  // this component mounts before the histogram data arrives, so render nothing until it does
  const plotData = plot.data as PlotData[];
  if (plotData[0].x.length < 1 || plotData[0].y.length < 1) return null;

  return (
    <Plot
      config={plot.config}
      data={plot.data}
      layout={plot.layout ? plot.layout : {}}
      onRelayout={onRelayout}
      ref={graphDivRef}
      style={{ 'width': '100%' }}
      useResizeHandler
    />
  );
};

export default FacetRangePlot;
