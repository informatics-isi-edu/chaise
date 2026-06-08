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
    {/* Top arrow (points down) */}
    <line x1='7' y1='1' x2='7' y2='4.25' />
    <polyline points='5.25 2.5 7 4.25 8.75 2.5' />
    {/* Middle divider */}
    <line x1='2.33' y1='7' x2='11.67' y2='7' />
    {/* Bottom arrow (points up) */}
    <polyline points='5.25 11.5 7 9.75 8.75 11.5' />
    <line x1='7' y1='9.75' x2='7' y2='13' />
  </svg>
);

export default CollapseIcon;
