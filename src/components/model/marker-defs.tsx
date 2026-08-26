import { type JSX } from 'react';

// utilities
import { ERD_MARKERS, erdMarkerId, type ERDMarkerShape } from '@isrd-isi-edu/chaise/src/utils/model-utils';
import { getCssVariable } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

/**
 * one crow's foot marker def (see ERD_MARKERS in model-utils.ts for the shapes).
 * markerUnits=userSpaceOnUse keeps the symbol the same size when the focus
 * highlight thickens the path stroke, and auto-start-reverse makes the same
 * def usable as a markerStart (it flips to face the node the path starts at).
 */
const ErdMarker = ({ shape, highlighted, color }: {
  shape: ERDMarkerShape;
  highlighted?: boolean;
  color: string;
}): JSX.Element => {
  const spec = ERD_MARKERS.SHAPES[shape];
  return (
    <marker
      id={erdMarkerId(shape, highlighted)}
      viewBox={`0 0 ${ERD_MARKERS.WIDTH} ${ERD_MARKERS.HEIGHT}`}
      refX={ERD_MARKERS.WIDTH}
      refY={ERD_MARKERS.REF_Y}
      markerWidth={ERD_MARKERS.WIDTH}
      markerHeight={ERD_MARKERS.HEIGHT}
      markerUnits='userSpaceOnUse'
      orient='auto-start-reverse'
    >
      {'circle' in spec && (
        <circle
          cx={spec.circle.cx}
          cy={spec.circle.cy}
          r={spec.circle.r}
          fill='none'
          stroke={color}
          strokeWidth={1.5}
        />
      )}
      {spec.paths.map((d) => (
        <path key={d} d={d} fill='none' stroke={color} strokeWidth={1.5} />
      ))}
    </marker>
  );
};

/**
 * hidden svg carrying the crow's foot marker defs the ERD display mode
 * references by url. rendered once inside the model canvas; url(#id) markers
 * resolve document-wide, react-flow doesn't need to know about them.
 */
const ErdMarkerDefs = (): JSX.Element => {
  const shapes = Object.keys(ERD_MARKERS.SHAPES) as ERDMarkerShape[];
  // same color-map value (and fallback) the focus highlight uses in model.tsx
  const highlightColor = getCssVariable(
    'primary',
    document.querySelector('.model-container') ?? undefined,
    '#4674a7'
  );
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden='true'>
      <defs>
        {shapes.map((shape) => (
          <ErdMarker key={shape} shape={shape} color={ERD_MARKERS.COLOR} />
        ))}
        {shapes.map((shape) => (
          <ErdMarker key={`${shape}-hl`} shape={shape} highlighted color={highlightColor} />
        ))}
      </defs>
    </svg>
  );
};

export default ErdMarkerDefs;
