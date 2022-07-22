import { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { ConditionalWrapper } from '@isrd-isi-edu/chaise/src/components/cond-wrapper';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

type FilterChicletIdentifier = 'filters' | 'cfacets' | number;
type FilterChicletProps = {
  /**
   * The type of chiclet (if number, it's a facet)
   * the identifier is passed to the onRemove function as well as onFocus
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
  value: JSX.Element | JSX.Element[] | string,
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

  // if defined as string, transform them to a proper displayname
  const usedTitle: Displayname | undefined = typeof title === 'string' ? { isHTML: false, value: title } : title;
  const usedValue: JSX.Element | JSX.Element[] = typeof value === 'string' ? <DisplayValue value={{ isHTML: false, value: value }} /> : value;

  return (
    <div className='filter-chiclet chaise-btn-group'>
      {/* icon */}
      <OverlayTrigger
        placement='bottom-start'
        overlay={<Tooltip>{iconTooltip}</Tooltip>}
      >
        <IconTag
          className={`filter-chiclet-remove chaise-btn chaise-btn-secondary ${removeClass}`}
          {...(onRemove && { onClick: () => onRemove(identifier) })}
        >
          <i className={onRemove ? 'fa-solid fa-xmark' : 'fa-solid fa-filter'}></i>
        </IconTag>
      </OverlayTrigger>
      {/* title */}
      {title &&
        <ConditionalWrapper
          condition={titleTooltip !== undefined}
          wrapper={children => (
            <OverlayTrigger placement='bottom-start' overlay={<Tooltip>{titleTooltip}</Tooltip>}>
              {children}
            </OverlayTrigger>
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
      <OverlayTrigger
        placement='bottom-start'
        overlay={<Tooltip>{valueTooltip ? valueTooltip : usedValue}</Tooltip>}
      >
        <span className='filter-chiclet-value chaise-btn chaise-btn-secondary'>{usedValue}</span>
      </OverlayTrigger>
    </div>
  )
}

export default FilterChiclet;
