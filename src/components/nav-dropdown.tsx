import { useRef } from 'react';

// components
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';

// utilities
import MenuUtils from '@chaise/utils/menu-utils';
import { windowRef } from '@chaise/utils/window-ref';

// TODO: make a menu object interface
const ChaiseNavDropdown = ({
  menu, parentDropdown
}: any): JSX.Element => menu.map((child: any, index: number) => {
  if (!MenuUtils.canShow(child)) return;

  const dropdownWrapper = useRef<any>(null);

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

  // TODO: onClick logging
  if ((!child.children && child.url) || !MenuUtils.canEnable(child)) {
    return (
      <NavDropdown.Item
        key={index}
        href={child.url}
        target={child.newTab ? '_blank' : '_self'}
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
    // check if opening the menu twice would push off the screen to have the next dropdowns open left instead
    if (parentDropdown && (Math.round(winWidth - parentDropdown.current.getBoundingClientRect().right) < parentDropdown.current.offsetWidth*2) ) dropEnd = false;

    return (
      <Dropdown key={index} drop={dropEnd ? 'end' : 'start'} className='dropdown-submenu' ref={dropdownWrapper}>
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

export default ChaiseNavDropdown;
