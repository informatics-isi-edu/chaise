import { MouseEvent, MouseEventHandler, useEffect, useLayoutEffect, useRef, useState } from 'react';

// components
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';

// utilities
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import {
  MenuOption, canEnable, canShow,
  logout, menuItemClasses, onDropdownToggle,
  onLinkClick, renderName
} from '@isrd-isi-edu/chaise/src/utils/menu-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

interface ChaiseLoginDropdownProps {
  menu: MenuOption[],
  openProfileCb?: MouseEventHandler,
  parentDropdown: any // TODO: useRef wrapper type
  alignRight: boolean
}

// NOTE: this dropdown should eventually replace ChaiseNavDropdown but that syntax
//       hasn't been updated to use the "types" or set default types on menu ingest
const ChaiseLoginDropdown = ({
  menu, openProfileCb, parentDropdown, alignRight
}: ChaiseLoginDropdownProps): JSX.Element => {
  const dropdownWrapper = useRef<any>(null); // TODO: type the useRef wrapped element

  /**
   * State variables to align submenu/dropdown to right or left
   * @fromTop represents top: position
   * @fromLeft represents left: position
   * @dropEnd represents whether submenu should be left or right (might be redudant to set this 
   * state variable, but bootstrap might be using this dropEnd or dropStart class internally)
   */ 
  const [fromTop, setFromTop] = useState<number>();
  const [fromLeft, setFromLeft] = useState<number>();
  const [dropEnd, setDropEnd] = useState<boolean>(true);

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
        setFromTop(y - (childHeight - availableHeight))
        subMenu.style.maxHeight = winHeight - padding + 'px';
      } else {
        setFromTop(y);
      }
  
      // If elements' position is greater than threshold, align left
      if (alignRight && (x + parentWidth + childWidth) < threshold) {
        // Align right if parentMenu is right and subMenu is within window screen
        setDropEnd(true);
        setFromLeft(x + parentWidth);
      } else if (!alignRight && (x - childWidth) < 0) {
        // Align right if parentMenu is left and subMenu is within window screen
        setDropEnd(true);
        setFromLeft(x + parentWidth)
      } else {
        // Align left if parentMenu is left and subMenu is within window screen
        setDropEnd(false);
        setFromLeft(x - childWidth);
      }
    }
  }

  const handleOnLinkClick = (event: MouseEvent<HTMLElement>, item: MenuOption) => {
    onLinkClick(event, item);
  }

  // TODO: onToggle event type
  const handleNavbarDropdownToggle = (isOpen: boolean, event: any, item: MenuOption) => {
    onDropdownToggle(isOpen, event, LogActions.NAVBAR_ACCOUNT_DROPDOWN, item);
  }

  const renderHeader = (item: MenuOption, index: number) => <NavDropdown.Header
    key={index}
    className='chaise-dropdown-header'
    dangerouslySetInnerHTML={{ __html: renderName(item) }}
  />

  const renderDropdownMenu = (item: MenuOption, index: number) => {
  
    return (
      <Dropdown
        key={index}
        drop={dropEnd ? 'end' : 'start'}
        className='dropdown-submenu'
        ref={dropdownWrapper}
        onClick={alignDropDown}
        onToggle={(isOpen, event) => handleNavbarDropdownToggle(isOpen, event, item)}
      >
        <Dropdown.Toggle
          as='a'
          variant='dark'
          className={menuItemClasses(item, true)}
          dangerouslySetInnerHTML={{ __html: renderName(item) }}
        />
        <Dropdown.Menu 
          // renderOnMount prop is required to get submenu's width that can be 
          // used to align submenu to left or right
          renderOnMount
          style={{ 
            top: fromTop, 
            left: fromLeft, 
          }}
          // Moved inline style position: fixed property to css class
          className='custom-dropdown-submenu'
        >
          <ChaiseLoginDropdown
            menu={item.children || []}
            openProfileCb={openProfileCb}
            parentDropdown={dropdownWrapper}
            alignRight={dropEnd}
          />
        </Dropdown.Menu>
      </Dropdown>)
  }

  const renderUrl = (item: MenuOption, index: number) => <NavDropdown.Item
    key={index}
    href={item.url}
    target={item.newTab ? '_blank' : '_self'}
    onClick={(event) => handleOnLinkClick(event, item)}
    className={menuItemClasses(item, true)}
    dangerouslySetInnerHTML={{ __html: renderName(item) }}
  />

  const renderDropdownOptions = () => menu.map((child: MenuOption, index: number) => {
    if (!canShow(child) || !child.isValid) return;

    switch (child.type) {
      case 'header':
        return (renderHeader(child, index));
      case 'menu':
        return (renderDropdownMenu(child, index));
      case 'url':
        return (renderUrl(child, index));
      case 'my_profile':
        return (
          <NavDropdown.Item
            id='profile-link'
            key={index}
            onClick={openProfileCb}
            dangerouslySetInnerHTML={{ __html: child.nameMarkdownPattern ? renderName(child) : 'My Profile' }}
          />
        )
      case 'logout':
        return (
          <NavDropdown.Item
            id='logout-link'
            key={index}
            onClick={logout}
            dangerouslySetInnerHTML={{ __html: child.nameMarkdownPattern ? renderName(child) : 'Log Out' }}
          />
        )
      default:
        // create an unclickable header
        if (child.header === true && !child.children && !child.url) {
          return (renderHeader(child, index));
        }

        if ((!child.children && child.url) || !canEnable(child)) {
          return (renderDropdownMenu(child, index));
        }

        if (child.children && canEnable(child)) {
          return (renderDropdownMenu(child, index));
        }

        return;
    }
  });

  return (<>
    {renderDropdownOptions()}
  </>)
}

export default ChaiseLoginDropdown;
