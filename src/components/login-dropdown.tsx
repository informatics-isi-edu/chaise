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
import { debounce } from '../utils/ui-utils';

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
  const subMenuRef = useRef<any>(null);

  // state variable to define left, top, dropEnd or dropStart positions...
  const [fromTop, setFromTop] = useState<number>();
  const [fromLeft, setFromLeft] = useState<number>();
  const [dropEnd, setDropEnd] = useState<boolean>(true);

  useLayoutEffect(() => {
    
    // when resize event is called, it will call debounce function with 500ms timeout
    const debouncedFunc = debounce(setHeight, 500);
    
    // First time it will be called diretly
    setHeight();

    window.addEventListener('resize', debouncedFunc);
  })

  const setHeight = () => {
    const winHeight = windowRef.innerHeight;
    const padding = 15;

    if (subMenuRef && subMenuRef.current) {
      // This logic will run when there is no resize event, but called on click of menu item
      const y = subMenuRef.current.getBoundingClientRect().y;
      const available = winHeight - y;

      subMenuRef.current.style.maxHeight = available - padding + 'px';
    } else {

      // Checking all dropdown menu with show class to recalculate height on resize event
      const allElementswithShow = document.getElementsByClassName('dropdown-menu show');
      for (let i = 0; i < allElementswithShow.length; i++) {
        const ele = allElementswithShow[i];
        const y = ele.getBoundingClientRect().y;
        ele.style.maxHeight = winHeight - y - padding + 'px';
      }
    }
  }

  const alignDropDown = (event: any) => {
    event.preventDefault();

    if (event.currentTarget) {

      const x = event.currentTarget.getBoundingClientRect().x;
      const y = event.currentTarget.getBoundingClientRect().y;
      const parentWidth = event.currentTarget.getBoundingClientRect().width;

      // This is necessary because getBoundingClientRect() will give 0, if div is not present in DOM
      event.currentTarget.getElementsByClassName('dropdown-menu')[0].style.display = 'block';
      const childWidth = event.currentTarget.getElementsByClassName('dropdown-menu')[0].getBoundingClientRect().width;
      event.currentTarget.getElementsByClassName('dropdown-menu')[0].style.display = null;

      setFromTop(y);
  
      if ((x + parentWidth) > 0.75 * windowRef.innerWidth) {
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
          renderOnMount
          style={{ 
            position: 'fixed', 
            top: fromTop, 
            left: fromLeft, 
            right: 'unset'
          }}
          ref={subMenuRef}
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
