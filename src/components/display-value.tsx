// components
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

// hooks
import { useEffect, useRef } from 'react';

// utils
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import { createChaiseTooltips } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

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

  // handle tooltips that might be in the value
  const spanRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!spanRef.current) return;
    createChaiseTooltips(spanRef.current);
  }, []);

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
