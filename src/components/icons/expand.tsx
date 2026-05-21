type Props = { className?: string; width?: number };

const ExpandIcon = ({ className, width = 14 }: Props) => (
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
    {/* Up arrow: apex (7, 1.17), arms at y=2.92, tail extends to y=5.25 */}
    <line x1='7' y1='1.17' x2='7' y2='5.25' />
    <polyline points='5.25 2.92 7 1.17 8.75 2.92' />
    {/* Middle divider */}
    <line x1='2.33' y1='7' x2='11.67' y2='7' />
    {/* Down arrow: shaft from y=8.75, arms at y=11.08, apex (7, 12.83) */}
    <line x1='7' y1='8.75' x2='7' y2='12.83' />
    <polyline points='5.25 11.08 7 12.83 8.75 11.08' />
  </svg>
);

export default ExpandIcon;
