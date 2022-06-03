import { MouseEvent, MouseEventHandler, useLayoutEffect, useRef, useState } from 'react';

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
import { debounce } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

interface ChaiseLoginDropdownProps {
  menu: MenuOption[],
  openProfileCb?: MouseEventHandler,
  parentDropdown: any // TODO: useRef wrapper type
}

// NOTE: this dropdown should eventually replace ChaiseNavDropdown but that syntax
//       hasn't been updated to use the "types" or set default types on menu ingest
const ChaiseLoginDropdown = ({
  menu, openProfileCb, parentDropdown
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
  
  useLayoutEffect(() => {
    
    // when resize event is called, it will call debounce function with 500ms timeout
    const debouncedFunc = debounce(setHeight, 500);
    
    // This will be called when there is a DOM Mutation
    setHeight();

    // Call when there is resize event
    window.addEventListener('resize', debouncedFunc);
  })

  /**
   * Function is responsible for adjusting height of submenus.
   * Function is called when there is resize event or when user opens submenu
   * Set the height of Dropdown.Menu (inline style)
   * 1. Check for subMenuRef. If it is not null get x, y, and width positions
   * 2. calculate the available height (window height - Elements's y position)
   */
   const setHeight = () => {
     const winHeight = windowRef.innerHeight;
     const padding = 15;

     // When multiple submenus are open on the window, and resize event happens,
     // it should calculate height of all submenus & update.
     // Checking all dropdown menu with show class to recalculate height on resize event
     const allElementswithShow =
       document.getElementsByClassName('dropdown-menu show');
     for (let i = 0; i < allElementswithShow.length; i++) {
       const ele = allElementswithShow[i];
       const y = ele.getBoundingClientRect().y;
       ele.style.maxHeight = winHeight - y - padding + 'px';
     }
   }

  /**
   * Function is responsible for aligning submenu to left or right based on the available right space
   * Based on the threshold, it aligns submenu.
   * @param event clickEvent when user clicks on menu item
   * It will check for currentTarget's x, y, width and calculate top, left position of submenu.
   */
  const alignDropDown = (event: any) => {
    event.preventDefault();

    const threshold = 0.75 * windowRef.innerWidth;

    if (event.currentTarget) {

      const x = event.currentTarget.getBoundingClientRect().x;
      const y = event.currentTarget.getBoundingClientRect().y;
      const parentWidth = event.currentTarget.getBoundingClientRect().width;

      // This is necessary because getBoundingClientRect() will give 0, if div is not present in DOM
      event.currentTarget.getElementsByClassName('dropdown-menu')[0].style.display = 'block';
      const childWidth = event.currentTarget.getElementsByClassName('dropdown-menu')[0].getBoundingClientRect().width;
      event.currentTarget.getElementsByClassName('dropdown-menu')[0].style.display = null;

      setFromTop(y);
  
      // If elements' position is greater than threshold, align left
      if ((x + parentWidth) > threshold) {
        setDropEnd(false);
        setFromLeft(x - childWidth);
      } else {
        setDropEnd(true);
        setFromLeft(x + parentWidth);
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
