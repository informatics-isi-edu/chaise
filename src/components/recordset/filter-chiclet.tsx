import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname'
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

import type { JSX } from 'react';

type FilterChicletIdentifier = 'filters' | 'cfacets' | number;
type FilterChicletProps = {
  /**
   * The type of chiclet (if number, it's a facet).
   *
   * the identifier is passed to the onRemove and onTitleClick functions
   */
  identifier: FilterChicletIdentifier,
  /**
   * The title of chiclet
   */
  title?: Displayname | string,
  /**
   * tooltip for the title
   */
  titleTooltip?: JSX.Element | string,
  /**
   * The displayed value
   */
  value: JSX.Element | JSX.Element[] | string | Displayname,
  /**
   * the tooltip for the value (is missing, the value itself will be used)
   */
  valueTooltip?: JSX.Element | JSX.Element[],
  /**
   * the remove callback
   */
  onRemove?: (identifier: FilterChicletIdentifier) => void,
  /**
   * tooltip displayed on the icon
   */
  iconTooltip: JSX.Element | string,
  /**
   * class that will be added to the remove button
   */
  removeClass?: string
  /**
   * on click of the title will be called
   */
  onTitleClick?: (identifier: FilterChicletIdentifier) => void,
};

const FilterChiclet = ({
  identifier,
  title,
  titleTooltip,
  value,
  onRemove,
  iconTooltip,
  removeClass = '',
  onTitleClick,
  valueTooltip
}: FilterChicletProps): JSX.Element => {

  // if callbacks are defined, we have to use button
  const IconTag = onRemove ? 'button' : 'span';
  const TitleTag = onTitleClick ? 'button' : 'span';

  // make sure the title and value are proper types so later we can just use them.
  const usedTitle: Displayname | undefined = typeof title === 'string' ? { isHTML: false, value: title } : title;
  let usedValue : JSX.Element | JSX.Element[];
  if (typeof value === 'string') {
    usedValue = <DisplayValue value={{ isHTML: false, value: value }} />;
  } else if (typeof value === 'object' && ('value' in value)) {
    usedValue = <DisplayValue value={value} />
  } else {
    usedValue = value;
  }

  return (
    <div className='filter-chiclet chaise-btn-group'>
      {/* icon */}
      <ChaiseTooltip
        placement='bottom-start'
        tooltip={iconTooltip}
      >
        <IconTag
          className={`filter-chiclet-remove chaise-btn chaise-btn-secondary ${removeClass}`}
          {...(onRemove && { onClick: () => onRemove(identifier) })}
        >
          <i className={onRemove ? 'fa-solid fa-xmark' : 'fa-solid fa-filter'}></i>
        </IconTag>
      </ChaiseTooltip>
      {/* title */}
      {title &&
        <ConditionalWrapper
          condition={titleTooltip !== undefined}
          wrapper={children => (
            <ChaiseTooltip placement='bottom-start' tooltip={titleTooltip!}>
              {children}
            </ChaiseTooltip>
          )}
        >
          <TitleTag
            className='filter-chiclet-title chaise-btn chaise-btn-secondary'
            {...(onTitleClick && { onClick: () => onTitleClick(identifier) })}
          >
            <DisplayValue value={usedTitle} />
          </TitleTag>
        </ConditionalWrapper>
      }
      {/* value */}
      <ChaiseTooltip
        placement='bottom-start'
        tooltip={<>{valueTooltip ? valueTooltip : usedValue}</>}
      >
        <span className='filter-chiclet-value chaise-btn chaise-btn-secondary'>{usedValue}</span>
      </ChaiseTooltip>
    </div>
  )
}

export default FilterChiclet;
