import React from 'react';
import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';
import { DEFAULT_DISPLAYNAME } from '@isrd-isi-edu/chaise/src/utils/constants';

type DisplayValueProps = {
  value?: Displayname,
  specialNullEmpty?: boolean,
  addClass?: boolean,
  className?: string,
};

const DisplayValue = ({
  addClass,
  value,
  specialNullEmpty,
  className,
}: DisplayValueProps): JSX.Element => {
  if (specialNullEmpty) {
    if (value?.value === '') {
      return <span dangerouslySetInnerHTML={{ __html: DEFAULT_DISPLAYNAME.empty }}></span>;
    }

    if (value?.value == null) {
      return <span dangerouslySetInnerHTML={{ __html: DEFAULT_DISPLAYNAME.null }}></span>;
    }
  }

  const usedClassName = className ? className : (addClass ? 'markdown-container': '');

  if (value?.isHTML && value?.value) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: value.value }}
        className={usedClassName}>
      </span>
    )
  }
  return <span>{value?.value}</span>
}

export default DisplayValue;
