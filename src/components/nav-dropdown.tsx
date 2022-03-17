// components
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';

// utilities
import MenuUtils from '@chaise/utils/menu-utils';

// TODO: make a menu object interface
const ChaiseNavDropdown = ({
  menu,
}: any): JSX.Element => menu.map((child: any, index: number) => {
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
    // TODO: calculate position and set drop="start" for 
    return (
      <Dropdown key={index} drop='end' className='dropdown-submenu'>
        <Dropdown.Toggle 
          as='a'
          variant='dark' 
          className={MenuUtils.menuItemClasses(child, true)} 
          dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }} 
        />
        <Dropdown.Menu>
          <ChaiseNavDropdown menu={child.children}></ChaiseNavDropdown>
        </Dropdown.Menu>
      </Dropdown>
    );
    // TODO: navbar-header-container
  }

  return;
});

export default ChaiseNavDropdown;
