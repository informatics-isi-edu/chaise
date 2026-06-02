type Props = { className?: string; width?: number };

const RotateRightIcon = ({ className, width = 14 }: Props) => (
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
    {/* Square: 7x7 in lower-right (mirror of rotate-left v6) */}
    <rect x='5.83' y='5.83' width='7' height='7' rx='0.88' />
    {/* Arc shaft: tail at left, curves up and over to apex on the right */}
    <path d='M 2.92 9.33 C 2.92 4.08 3.5 2.33 9.33 2.33' />
    {/* Chevron arrowhead: apex (9.33, 2.33) points right, arms to (7.58, 0.58) and (7.58, 4.08) */}
    <polyline points='7.58 0.58 9.33 2.33 7.58 4.08' />
  </svg>
);

export default RotateRightIcon;
