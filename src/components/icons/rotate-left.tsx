type Props = { className?: string; width?: number };

const RotateLeftIcon = ({ className, width = 14 }: Props) => (
  // <svg
  //   style={{ width: '23px', paddingBottom: '2px' }}
  //   className={className}
  //   viewBox='0 0 24 24'
  //   fill='none'
  //   stroke='currentColor'
  //   strokeWidth='2'
  //   strokeLinecap='round'
  //   strokeLinejoin='round'
  //   aria-hidden='true'
  // >
  //   {/* version 01 */}
  //   {/* Object being rotated */}
  //   {/* <rect x='2' y='10' width='12' height='12' rx='1.5' /> */}
  //   {/* Arc: cubic Bezier — longer vertical run on the right, larger radius at the top transition */}
  //   {/* <path d='M 17 16 C 17 8 18 6 8 6' /> */}
  //   {/* Stretched chevron unchanged */}
  //   {/* <polyline points='13 4 8 6 13 8' /> */}

  //   {/* version 02 */}
  //   {/* Object being rotated */}
  //   {/* <rect x='2' y='10' width='12' height='12' rx='1.5' /> */}
  //   {/* Arc: tail further right (19), head further up (y=4), larger gap to the square in both directions */}
  //   {/* <path d='M 19 16 C 19 7 18 4 8 4' /> */}
  //   {/* Chevron raised to (8, 4), arms shifted up */}
  //   {/* <polyline points='13 2 8 4 13 6' /> */}

  //   {/* version 03 */}
  //   {/* Object being rotated */}
  //   {/* <rect x='2' y='10' width='12' height='12' rx='1.5' /> */}
  //   {/* Arc shaft */}
  //   {/* <path d='M 19 16 C 19 7 18 4 8 4' /> */}
  //   {/* Chevron with 90° spread (±45°) — wider so three lines stay distinct at small sizes */}
  //   {/* <polyline points='11 1 8 4 11 7' /> */}

  //   {/* version 04 */}
  //   {/* Object being rotated */}
  //   <rect x='2' y='10' width='12' height='12' rx='1.5' />
  //   {/* Arc shaft: terminates at the back of the triangle (x=12) */}
  //   <path d='M 19 16 C 19 8 17 4 12 4' />
  //   {/* Filled triangle arrowhead: tip at (8, 4), base from (12, 1) to (12, 7) */}
  //   <polygon points='8 4 12 1 12 7' fill='currentColor' stroke='none' />
  // </svg>

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
