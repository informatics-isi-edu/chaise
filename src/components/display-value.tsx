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
  internal?: boolean,
  /**
   * set the wrapper element that should be used.
   * if not defined, we will use a span.
   */
  as?: React.ElementType,
  /**
   * the extra props that we should add to the element
   */
  props?: any,
};

const DisplayValue = ({
  addClass,
  value,
  specialNullEmpty,
  className,
  styles,
  as = 'span',
  props
}: DisplayValueProps): JSX.Element => {

  const Wrapper = as;

  // handle tooltips that might be in the value
  const spanRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!spanRef.current) return;
    createChaiseTooltips(spanRef.current);
  }, []);

  if (specialNullEmpty) {
    if (value?.value === '') {
      return <Wrapper dangerouslySetInnerHTML={{ __html: DEFAULT_DISPLAYNAME.empty }} style={styles} {...props}></Wrapper>;
    }

    if (value?.value == null) {
      return <Wrapper dangerouslySetInnerHTML={{ __html: DEFAULT_DISPLAYNAME.null }} style={styles} {...props}></Wrapper>;
    }
  }

  const usedClassNames: string[] = [];
  if (className) usedClassNames.push(className);
  if (addClass) usedClassNames.push('markdown-container');

  const usedClassName = usedClassNames.length > 0 ? usedClassNames.join(' ') : undefined;

  if (value?.isHTML && value?.value) {
    return (
      <Wrapper
        ref={spanRef}
        style={styles}
        dangerouslySetInnerHTML={{ __html: value.value }}
        className={usedClassName}
        // for foreign-key inputs display value
        contentEditable={false}
        {...props}
      >
      </Wrapper>
    )
  }
  return <Wrapper style={styles} className={usedClassNames.join(' ')} {...props}>{value?.value}</Wrapper>
}

export default DisplayValue;
