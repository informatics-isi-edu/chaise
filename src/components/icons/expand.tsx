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
    {/* Up arrow */}
    <line x1='7' y1='1' x2='7' y2='4.25' />
    <polyline points='5.25 2.75 7 1 8.75 2.75' />
    {/* Middle divider */}
    <line x1='2.33' y1='7' x2='11.67' y2='7' />
    {/* Down arrow */}
    <line x1='7' y1='9.75' x2='7' y2='13' />
    <polyline points='5.25 11.25 7 13 8.75 11.25' />
  </svg>
);

export default ExpandIcon;
