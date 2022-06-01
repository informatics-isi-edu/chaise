import { MouseEvent, MouseEventHandler, useEffect, useRef, useState } from 'react';

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
}

// NOTE: this dropdown should eventually replace ChaiseNavDropdown but that syntax
//       hasn't been updated to use the "types" or set default types on menu ingest
const ChaiseLoginDropdown = ({
  menu, openProfileCb, parentDropdown
}: ChaiseLoginDropdownProps): JSX.Element => {
  const dropdownWrapper = useRef<any>(null); // TODO: type the useRef wrapped element

  const [fromTop, setFromTop] = useState<number>();
  const [fromLeft, setFromLeft] = useState<number>();
  const [dropEnd, setDropEnd] = useState<boolean>(true);

  const alignDropDown = (event) => {
    event.preventDefault();

    if (event.currentTarget) {
      const x = event.currentTarget.getBoundingClientRect().x;
      const y = event.currentTarget.getBoundingClientRect().y;
      const width = event.currentTarget.getBoundingClientRect().width;

      setFromTop(y);
  
      if ((x + width) > 0.75 * windowRef.innerWidth) {
        setDropEnd(false);
        // setFromLeft(x);

        // Temporary aliging submenu always to right
        setFromLeft(x + width);
      } else {
        setDropEnd(true);
        setFromLeft(x + width);
      }
      
      // Code below is to adjust submenu to stay within the screen
      // Only one case needs to be handled i.e., aligning submenu to the left
      // Calculating left is pending...
      // setTimeout(() => {
      //   if (!dropEnd && dropdownWrapper.current && dropdownWrapper.current.getElementsByClassName('dropdown-menu')[0]) {
      //     let x1 = dropdownWrapper.current.getElementsByClassName('dropdown-menu')[0].getBoundingClientRect().width;
      //     setFromLeft(x - x1);
      //   }
      // }, 50)
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
          style={{ 
            display: 'hidden',
            position: 'fixed', 
            top: fromTop, 
            left: fromLeft, 
            right: 'unset'
          }}
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
