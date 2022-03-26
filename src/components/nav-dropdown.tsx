import { useRef } from 'react';

// components
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';

// services
import {LogService } from '@chaise/services/log';

// utilities
import { LogActions } from '@chaise/models/log';
import MenuUtils from '@chaise/utils/menu-utils';
import { windowRef } from '@chaise/utils/window-ref';

// TODO: make a menu object interface
// NOTE: this component should be eventually deprecated in favor of ChaiseLoginDropdown
const ChaiseNavDropdown = ({
  menu, parentDropdown
}: any): JSX.Element => {
  const dropdownWrapper = useRef<any>(null);

  const handleOnLinkClick = (event: any, item: any) => {
    MenuUtils.onLinkClick(event, item);
  }

  const handleNavbarDropdownToggle = (isOpen: boolean, event: any, item: any) => {
    MenuUtils.onDropdownToggle(isOpen, event, item, LogActions.NAVBAR_MENU_OPEN);
  }

  return menu.map((child: any, index: number) => {
    if (!MenuUtils.canShow(child)) return;

    // create an unclickable header
    if (child.header == true && !child.children && !child.url) {
      return (
        <NavDropdown.Header
          key={index}
          className='chaise-dropdown-header'
          dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
        />
      );
    }

    if ((!child.children && child.url) || !MenuUtils.canEnable(child)) {
      return (
        <NavDropdown.Item
          key={index}
          href={child.url}
          target={child.newTab ? '_blank' : '_self'}
          onClick={(event) => handleOnLinkClick(event, child)}
          className={MenuUtils.menuItemClasses(child, true)}
          dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
        />
      );
    }

    if (child.children && MenuUtils.canEnable(child)) {
      let dropEnd = true;
      const winWidth = windowRef.innerWidth;

      // parentDropdown.current is the parent menu option that toggles open the menu below
      // this menu is generated when the parent dropdown is opened so we don't know how wide the child will be on open
      // check if opening the menu twice would push off the screen to have the next dropdown open left instead
      if (parentDropdown && (Math.round(winWidth - parentDropdown.current.getBoundingClientRect().right) < parentDropdown.current.offsetWidth * 2)) dropEnd = false;

      return (
        <Dropdown 
          key={index} 
          drop={dropEnd ? 'end' : 'start'} 
          className='dropdown-submenu' 
          ref={dropdownWrapper}
          onToggle={(isOpen, event) => handleNavbarDropdownToggle(isOpen, event, child)}
        >
          <Dropdown.Toggle
            as='a'
            variant='dark'
            className={MenuUtils.menuItemClasses(child, true)}
            dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
          />
          <Dropdown.Menu>
            <ChaiseNavDropdown menu={child.children} parentDropdown={dropdownWrapper}></ChaiseNavDropdown>
          </Dropdown.Menu>
        </Dropdown>
      );
      // TODO: navbar-header-container
    }

    return;
  });
}

export default ChaiseNavDropdown;
