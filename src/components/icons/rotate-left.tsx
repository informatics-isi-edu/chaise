type Props = { className?: string; width?: number };

const RotateLeftIcon = ({ className, width = 14 }: Props) => (
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
    <rect x='1.17' y='5.83' width='7' height='7' rx='0.88' />
    <path d='M 11.08 9.33 C 11.08 4.08 10.5 2.33 4.67 2.33' />
    <polyline points='6.42 0.58 4.67 2.33 6.42 4.08' />
  </svg>
);

export default RotateLeftIcon;
