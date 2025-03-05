import { MouseEvent, MouseEventHandler, useRef, useState, type JSX } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// components
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// utilities
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import {
  MenuOption, MenuOptionTypes, canEnable, canShow,
  menuItemClasses, onDropdownToggle,
  onLinkClick, renderName
} from '@isrd-isi-edu/chaise/src/utils/menu-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

export enum DropdownSubmenuDisplayTypes {
  NAVBAR = 'navbar',
  PROFILE_MENU = 'profile',
  GENERAL = 'general'
}

interface DropdownSubmenuProps {
  menu: MenuOption[],
  openProfileCb?: MouseEventHandler,
  /**
   * Property to capture parent menu's alignment.
   * submenu takes alginRight prop and makes decision whether to align right or left
   * based on parent's alignment. (eg: if parent alignment is right, child will continue to align
   * right till it reaches end of the screen)
   */
  alignRight?: boolean,
  /**
   * whether this is on navbar or not
   */
  displayType: DropdownSubmenuDisplayTypes,
  parentDropdown: any // TODO: useRef wrapper type
}

/**
 * react-bootstrap doesn't support recursive dropdowns by default. that's why we created this component to handle that.
 *
 * if you're planning to use this inside a NavDropdown make sure `renderMenuOnMount` is included (otherwise the positioning might be wrong)
 *
 * ```
 * <NavDropDown renderMenuOnMount ... >
 *  <DropdownSubmenu ... />
 * </NavDropDown>
 * ```
 *
 * And if you're using this inside a Dropdown, make sure to include `renderOnMount` and  dynamic `align`:
 *
 * ```
 * <Dropdown>
 *   ...
 *   <Dropdown.Menu renderOnMount align={{ sm: 'start' }} ... >
 *     <DropdownSubmenu ... />
 *   </Dropdown.Menu>
 * </Dropdown>
 * ```
 *
 * The custom logic that we have for positioning the submenu only works when react-bootstrap is handling it. By defining
 * dynamic alignment we're making sure that's the case (otherwise react-bootstrap is delegating that to popper).
 */
const DropdownSubmenu = ({
  menu, openProfileCb, alignRight, displayType
}: DropdownSubmenuProps): JSX.Element => {
  const { logout, session } = useAuthn();

  const dropdownWrapper = useRef<any>(null); // TODO: type the useRef wrapped element

  /**
   * Keeps track of most recently opened dropdown
   * We track this to make sure only one dropdown is open at a time.
   * For more details, see #2363
   */
  const [openedDropDownIndex, setOpenedDropDownIndex] = useState<number>();

  /**
   * State variables to align submenu/dropdown to right or left
   * subMenuStyle.fromTop represents top: position
   * subMenuStyle.fromLeft represents left: position
   * subMenuStyle.dropEnd represents whether submenu should be left or right (might be redudant to set this
   * state variable, but bootstrap might be using this dropEnd or dropStart class internally)
   */
  const [subMenuStyle, setSubMenuStyle] = useState<any>({
    fromTop: 0,
    fromLeft: 0,
    dropEnd: true
  });

  /**
   * Function is responsible for aligning submenu to left or right based on the available right space
   * Based on the threshold, it aligns submenu.
   * @param event clickEvent when user clicks on menu item
   * It will check for currentTarget's x, y, width and calculate top, left position of submenu.
   */
  const alignDropDown = (event: any) => {
    event.preventDefault();
    const winHeight = windowRef.innerHeight;
    const padding = 30;
    const threshold = windowRef.innerWidth;

    if (event.currentTarget) {

      let fromTop = 0;
      let fromLeft = 0;
      let dropEnd = true;

      const parentMenuEleRect = event.currentTarget.getBoundingClientRect();

      const x = parentMenuEleRect.x;
      const y = parentMenuEleRect.y;
      const parentWidth = parentMenuEleRect.width;

      // This is necessary because getBoundingClientRect() will give 0, if div is not present in DOM
      const subMenu = event.currentTarget.getElementsByClassName('dropdown-menu')[0];
      subMenu.style.display = 'block';
      const childWidth = subMenu.getBoundingClientRect().width;

      // NOTE: To fix the issue by assigning submenu’s height to available
      // screen height so that all menu items are visible.
      const childHeight = subMenu.scrollHeight;

      subMenu.style.display = null;

      // NOTE: To fix the issue by assigning submenu’s height to available
      // screen height so that all menu items are visible.
      const availableHeight = winHeight - y;
      if (childHeight > availableHeight) {
        if ((childHeight - availableHeight) > y) {
          fromTop = 0;
        } else {
          fromTop = y - (childHeight - availableHeight);
        }
        subMenu.style.maxHeight = winHeight - padding + 'px';
      } else {
        fromTop = y;
      }

      // If elements' position is greater than threshold, align left
      if (alignRight && (x + parentWidth + childWidth) < threshold) {
        // Align right if parentMenu is right and subMenu is within window screen
        fromLeft = x + parentWidth;
      } else if (!alignRight && (x - childWidth) < 0) {
        // Align right if parentMenu is left and subMenu is within window screen
        fromLeft = x + parentWidth;
      } else {
        // Align left if parentMenu is left and subMenu is within window screen
        dropEnd = false;
        fromLeft = x - childWidth;
      }

      setSubMenuStyle({
        fromLeft,
        fromTop,
        dropEnd
      });
    }
  }

  const handleOnLinkClick = (event: MouseEvent<HTMLElement>, item: MenuOption) => {
    onLinkClick(event, item);
  }

  const handleDropdownSubmenuToggle = (isOpen: boolean, event: any, item: MenuOption, index: number) => {
    /**
     * Update the state to reflect most recently opened dropdown
     */
    setOpenedDropDownIndex(isOpen ? index : undefined);

    let action = item.logAction;
    if (!action) {
      action = displayType === DropdownSubmenuDisplayTypes.PROFILE_MENU ? LogActions.NAVBAR_ACCOUNT_DROPDOWN : LogActions.NAVBAR_MENU_OPEN;
    }
    onDropdownToggle(isOpen, event, action, item);
  }

  const renderHeader = (item: MenuOption, index: number) => <DisplayValue
    key={index}
    as={displayType === DropdownSubmenuDisplayTypes.GENERAL ? Dropdown.Header : NavDropdown.Header}
    className='chaise-dropdown-header'
    value={{ isHTML: true, value: renderName(item) }}
    props={{
      as: 'a'
    }}
  />

  const renderDropdownMenu = (item: MenuOption, index: number) => {
    return (
      <Dropdown
        key={index}
        show={openedDropDownIndex === index} // Display dropdown if it is the most recently opened.
        drop={subMenuStyle.dropEnd ? 'end' : 'start'}
        className='dropdown-submenu'
        ref={dropdownWrapper}
        onClick={alignDropDown}
        onToggle={(isOpen, event) => handleDropdownSubmenuToggle(isOpen, event, item, index)}
      >
        <DisplayValue
          as={Dropdown.Toggle}
          value={{ isHTML: true, value: renderName(item) }}
          className={menuItemClasses(item, session, true)}
          props={{
            as: 'a',
            variant: 'dark'
          }}
        />
        <Dropdown.Menu
          renderOnMount
          align={{ sm: 'start' }}
          style={{
            top: subMenuStyle.fromTop,
            left: subMenuStyle.fromLeft,
          }}
          // Moved inline style position: fixed property to css class
          className='custom-dropdown-submenu'
        >
          <DropdownSubmenu
            menu={item.children || []}
            openProfileCb={openProfileCb}
            alignRight={subMenuStyle.dropEnd}
            parentDropdown={dropdownWrapper}
            displayType={displayType}
          />
        </Dropdown.Menu>
      </Dropdown>)
  }

  const renderUrl = (item: MenuOption, index: number) => <DisplayValue
    key={index}
    as={displayType === DropdownSubmenuDisplayTypes.GENERAL ? Dropdown.Item : NavDropdown.Item}
    className={menuItemClasses(item, session, true)}
    value={{ isHTML: true, value: renderName(item) }}
    props={{
      href: item.url,
      target: item.newTab ? '_blank' : '_self',
      onClick: (event: MouseEvent<HTMLElement>) => handleOnLinkClick(event, item)
    }}
  />


  const renderDropdownOptions = () => menu.map((child: MenuOption, index: number) => {
    if (!canShow(child, session) || !child.isValid) return;

    switch (child.type) {
      case MenuOptionTypes.HEADER:
        return (renderHeader(child, index));
      case MenuOptionTypes.MENU:
        return (renderDropdownMenu(child, index));
      case MenuOptionTypes.URL:
        return (renderUrl(child, index));
      case MenuOptionTypes.MY_PROFILE:
        return (
          <DisplayValue
            key={index}
            as={displayType === DropdownSubmenuDisplayTypes.GENERAL ? Dropdown.Item : NavDropdown.Item}
            value={{ isHTML: true, value: child.nameMarkdownPattern ? renderName(child) : 'My Profile' }}
            props={{
              id: 'profile-link',
              onClick: openProfileCb
            }}
          />
        )
      case MenuOptionTypes.LOGOUT:
        return (
          <DisplayValue
            key={index}
            as={displayType === DropdownSubmenuDisplayTypes.GENERAL ? Dropdown.Item : NavDropdown.Item}
            value={{ isHTML: true, value: child.nameMarkdownPattern ? renderName(child) : 'Log Out' }}
            props={{
              id: 'logout-link',
              onClick: () => logout(LogActions.LOGOUT_NAVBAR)
            }}
          />
        );
      case MenuOptionTypes.CALLBACK:
        return (
          <DisplayValue
            key={index}
            as={displayType === DropdownSubmenuDisplayTypes.GENERAL ? Dropdown.Item : NavDropdown.Item}
            value={{ isHTML: true, value: child.nameMarkdownPattern ? renderName(child) : 'Option' }}
            props={{
              onClick: child.callback
            }}
            className={menuItemClasses(child, session, true)}
          />
        );
      default:
        // create an unclickable header
        if (child.header === true && !child.children && !child.url) {
          return (renderHeader(child, index));
        }

        if ((!child.children && child.url) || !canEnable(child, session)) {
          return (renderDropdownMenu(child, index));
        }

        if (child.children && canEnable(child, session)) {
          return (renderDropdownMenu(child, index));
        }

        return;
    }
  });

  return (<>
    {renderDropdownOptions()}
  </>)
}

export default DropdownSubmenu;
