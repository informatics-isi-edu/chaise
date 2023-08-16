import React, { useEffect, useRef } from 'react';
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import Tooltip from 'bootstrap/js/dist/tooltip';

type DisplayValueProps = {
  value?: Displayname,
  specialNullEmpty?: boolean,
  addClass?: boolean,
  className?: string,
  styles?: object,
  /**
   * Whether this is something that we're doing internally,
   * or is based on annotation-provided values.
   */
  internal?: boolean
};

const DisplayValue = ({
  addClass,
  value,
  specialNullEmpty,
  className,
  styles,
}: DisplayValueProps): JSX.Element => {
  /**
   * see if there's a data-chaise-tooltip in the displayed value, and turn them into proper tooltips.
   *
   * NOTE:
   * I'm using bootstrap.js for this feature. this has added around 30KB to our bundles. I couldn't find a way to do this
   * directly with react-bootstrap. but there might be a way and we should investigate later
   */
  const spanRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!spanRef.current) return;

    const tooltipTriggerList = document.querySelectorAll('[data-chaise-tooltip]');
    if (tooltipTriggerList && tooltipTriggerList.length > 0) {
      tooltipTriggerList.forEach((el) => {
        const title = el.getAttribute('data-chaise-tooltip');
        const placement = el.getAttribute('data-chaise-tooltip-placement') || 'bottom';
        const noIcon = el.hasAttribute('data-chaise-tooltip-no-icon');
        if (!title) return;
        if (!noIcon) {
          // adding space between content and the icon is how we're making sure spacing between the two is correct.
          // should we come up with a better solution instead?
          el.innerHTML = el.innerHTML + ' ';
          el.classList.add('chaise-icon-for-tooltip');
        }
        new Tooltip(el, {
          title,
          // @ts-ignore ts doesn't understand that we're actually sanitizing the value.
          placement: ['auto', 'top', 'bottom', 'left', 'right'].indexOf(placement) !== -1 ? placement : 'bottom'
        })
      });
    }
  });

  if (specialNullEmpty) {
    if (value?.value === '') {
      return <span dangerouslySetInnerHTML={{ __html: DEFAULT_DISPLAYNAME.empty }} style={styles}></span>;
    }

    if (value?.value == null) {
      return <span dangerouslySetInnerHTML={{ __html: DEFAULT_DISPLAYNAME.null }} style={styles}></span>;
    }
  }

  const usedClassNames: string[] = [];
  if (className) usedClassNames.push(className);
  if (addClass) usedClassNames.push('markdown-container');

  const usedClassName = usedClassNames.length > 0 ? usedClassNames.join(' ') : undefined;

  if (value?.isHTML && value?.value) {
    return (
      <span
        ref={spanRef}
        style={styles}
        dangerouslySetInnerHTML={{ __html: value.value }}
        className={usedClassName}
        // for foreign-key inputs display value
        contentEditable={false}
      >
      </span>
    )
  }
  return <span style={styles} className={usedClassNames.join(' ')}>{value?.value}</span>
}

export default DisplayValue;
