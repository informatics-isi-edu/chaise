import { useRef } from 'react';

// components
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';

// utilities
import MenuUtils from '@chaise/utils/menu-utils';
import { windowRef } from '@chaise/utils/window-ref';

// TODO: make a menu object interface
// NOTE: this dropdown should eventually replace ChaiseNavDropdown but that syntax 
//       hasn't been updated to use the "types" or set default types on menu ingest
const ChaiseLoginDropdown = ({
  menu, openProfileCb,
}: any): JSX.Element => menu.map((child: any, index: number) => {
  if (!MenuUtils.canShow(child) || !child.isValid) return;

  const dropdownWrapper = useRef<any>(null);

  switch (child.type) {
    case 'header':
      return (
        <NavDropdown.Header
          key={index}
          className='chaise-dropdown-header'
          dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
        />
      );
    case 'menu':
      let dropEnd = true;
      const openDropdowns = document.querySelectorAll('.dropdown.show .dropdown-menu');
      const winWidth = windowRef.innerWidth;
      console.log(openDropdowns);

      console.log(dropdownWrapper);

      // [].forEach.call(openDropdowns, (el: any) => {
      //   // MenuUtils.checkHeight(el, window.innerHeight);

      //   console.log(el.getBoundingClientRect())
      //   console.log(winWidth)
      //   // If dropdown is spilling over
      //   if (Math.round(el.getBoundingClientRect().right) < winWidth) {
      //     console.log("first if")
      //     el.style.width = 'max-content';
      //   } else {
      //     const visibleContent = winWidth - el.getBoundingClientRect().left;
      //     console.log("2nd if: ", visibleContent);
      //     // hard-coded limit of width for opening on the left hand side
      //     if (Math.round(visibleContent) < 200) {
      //       el.classList.add('dropdown-menu-right');
      //     } else {
      //       dropEnd = false;
      //     }
      //   }
      // });

      return (
        <Dropdown key={index} drop={dropEnd ? 'end' : 'start'} className='dropdown-submenu'>
          <Dropdown.Toggle
            as='a'
            variant='dark'
            className={MenuUtils.menuItemClasses(child, true)}
            dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
          />
          <Dropdown.Menu ref={dropdownWrapper}>
            <ChaiseLoginDropdown menu={child.children}></ChaiseLoginDropdown>
          </Dropdown.Menu>
        </Dropdown>
      );
    case 'url':
      return (
        <NavDropdown.Item
          key={index}
          href={child.url}
          target={child.newTab ? '_blank' : '_self'}
          className={MenuUtils.menuItemClasses(child, true)}
          dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
        />
      );
    case 'my_profile':
      return (
        <NavDropdown.Item
          id='profile-link'
          key={index}
          onClick={openProfileCb}
          dangerouslySetInnerHTML={{ __html: child.nameMarkdownPattern ? MenuUtils.renderName(child) : 'My Profile' }}
        />
      )
    case 'logout':
      return (
        <NavDropdown.Item
          id='logout-link'
          key={index}
          onClick={MenuUtils.logout}
          dangerouslySetInnerHTML={{ __html: child.nameMarkdownPattern ? MenuUtils.renderName(child) : 'Log Out' }}
        />
      )
    default:
      return;
  }
});

export default ChaiseLoginDropdown;