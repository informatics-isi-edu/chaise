import Dropdown from 'react-bootstrap/Dropdown';
import { useRef, type ElementType, type JSX } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import EllipsisWrapper from '@isrd-isi-edu/chaise/src/components/ellipsis-wrapper';

// models
import type { Displayname } from '@isrd-isi-edu/chaise/src/models/displayname';

type SimpleSearchDropdownOptionProps = {
  /**
   * plain text, or a displayname such as a foreign key's row name, which may be html
   */
  label: string | Displayname;
  isSelected?: boolean;
  disabled?: boolean;
  /**
   * why the option is disabled, shown in its tooltip
   */
  disabledReason?: string;
  /**
   * the element to render, e.g. 'li' in a list; react-bootstrap's anchor by default
   */
  as?: ElementType;
  eventKey?: string;
  onClick?: () => void;
  className?: string;
};

/**
 * an option in a SimpleSearchDropdownMenu: a check mark column, then the label on one line.
 * the check is rendered on every option and hidden unless selected, so all labels start at
 * the same place. the tooltip shows the full label when it's cut off, and a disabled
 * option's reason (in italics) whenever there is one.
 */
const SimpleSearchDropdownOption = ({
  label,
  isSelected,
  disabled,
  disabledReason,
  as,
  eventKey,
  onClick,
  className,
}: SimpleSearchDropdownOptionProps): JSX.Element => {
  const labelRef = useRef<HTMLSpanElement>(null);
  const displayname: Displayname = typeof label === 'string' ? { value: label, isHTML: false } : label;

  const tooltip = (isOverflowing: boolean) => {
    const reason = disabled && disabledReason ? <i>{disabledReason}</i> : null;
    const fullLabel = <DisplayValue value={displayname} />;
    if (isOverflowing && reason) return <>{fullLabel}<br />{reason}</>;
    if (isOverflowing) return fullLabel;
    return reason;
  };

  let usedClassName = 'simple-search-dropdown-option';
  if (isSelected) usedClassName += ' simple-search-dropdown-selected';
  if (className) usedClassName += ` ${className}`;

  return (
    <Dropdown.Item as={as} eventKey={eventKey} onClick={onClick} disabled={disabled} className={usedClassName}>
      <span className={`simple-search-dropdown-check fa-solid fa-check${isSelected ? '' : ' simple-search-dropdown-check-hidden'}`} />
      {/* below, so the first option's tooltip doesn't cover the search box */}
      <EllipsisWrapper tooltip={tooltip} elementRef={labelRef} placement='bottom-start'>
        <span ref={labelRef} className='simple-search-dropdown-label'>
          {/* dropdown-select-value is what recordedit's e2e locators read */}
          <DisplayValue className='dropdown-select-value' value={displayname} />
        </span>
      </EllipsisWrapper>
    </Dropdown.Item>
  );
};

export default SimpleSearchDropdownOption;
