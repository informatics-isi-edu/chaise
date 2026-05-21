type Props = { className?: string; width?: number };

const CollapseIcon = ({ className, width = 14 }: Props) => (
  <svg
    style={{ width: `${width}px`, paddingBottom: '2px' }}
    className={className}
    viewBox='0 0 14 14'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.25'
    strokeLinecap='round'
    strokeLinejoin='round'
    aria-hidden='true'
  >
    {/* Top arrow (points down): shaft from y=1.17 to apex (7, 5.25), arms above at y=3.5 */}
    <line x1='7' y1='1.17' x2='7' y2='5.25' />
    <polyline points='5.25 3.5 7 5.25 8.75 3.5' />
    {/* Middle divider */}
    <line x1='2.33' y1='7' x2='11.67' y2='7' />
    {/* Bottom arrow (points up): arms below at y=10.5, shaft from apex (7, 8.75) down to y=12.83 */}
    <polyline points='5.25 10.5 7 8.75 8.75 10.5' />
    <line x1='7' y1='8.75' x2='7' y2='12.83' />
  </svg>
);

export default CollapseIcon;
