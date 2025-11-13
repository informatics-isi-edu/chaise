import { useLayoutEffect, useRef, useState } from 'react';

import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

type ScrollToTopProps = {
  /**
   * A callback function that is called when the user clicks the scroll-to-top button.
   */
  onClick: () => void;

  /**
   * An optional HTMLElement that represents the scroll container.
   * If not provided, the component will attempt to find the closest ancestor with the class 'main-container'.
   */
  scrollContainer?: HTMLElement | null;
};

const ScrollToTopButton = ({ onClick, scrollContainer }: ScrollToTopProps) => {
  const [showScrollToTopBtn, setShowScrollToTopBtn] = useState(false);

  const wrapper = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!wrapper.current) return;

    const parent = scrollContainer ? scrollContainer : (wrapper.current!.closest('.main-container') as HTMLElement);
    if (!parent) return;

    const toggleScrollToTopBtn = () => {
      if (!parent) return;
      const shouldShow = parent.scrollTop > 300;
      setShowScrollToTopBtn(shouldShow);
    };

    parent.addEventListener('scroll', toggleScrollToTopBtn);

    return () => parent.removeEventListener('scroll', toggleScrollToTopBtn);
  });

  return (
    <div className='scroll-to-top-container' ref={wrapper}>
      {showScrollToTopBtn && (
        <ChaiseTooltip placement='left' tooltip='Scroll to top of the page.'>
          <div className='chaise-btn chaise-btn-primary back-to-top-btn' onClick={onClick}>
            <i className='fa-solid fa-caret-up'></i>
          </div>
        </ChaiseTooltip>
      )}
    </div>
  );
};

export default ScrollToTopButton;
