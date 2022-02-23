import '@chaise/assets/scss/_navbar.scss';

import React from 'react'
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import { ConfigService } from '@chaise/services/config';
import { MenuUtils } from '@chaise/utils/utils';
import { windowRef } from "@chaise/utils/window-ref";
import { getCatalogId } from "@chaise/legacy/src/utils/uri-utils";

import Login from '@chaise/components/login';

const ChaiseNavbar = (): JSX.Element => {
  var cc = ConfigService.chaiseConfig;
  var settings = ConfigService.appSettings;

  var root = cc.navbarMenu || {};
  var catalogId = getCatalogId();

  let ERMrest = ConfigService.ERMrest;

  function isValueDefined(val: any) {
    return val != undefined && val != null;
  }

  // if in iframe and we want to force links to open in new tab,
  var forceNewTab = settings.openLinksInTab === true;

  // Set default newTab property at root node
  if (!root.hasOwnProperty('newTab') || forceNewTab) {
    root.newTab = true;
  }

  // Set default ACLs property at root node
  if (!root.hasOwnProperty('acls')) {
    root.acls = {
      "show": ["*"],
      "enable": ["*"]
    };
  }

  var q = [root];
  while (q.length > 0) {
    var obj = q.shift();
    var parentNewTab = obj.newTab;
    var parentAcls = obj.acls;
    var parentNames = obj.names;
    // template the url
    // TODO: This is done here to prevent writing a recursive function (again) in `setConfigJSON()`
    if (obj.url && isValueDefined(catalogId)) {
      obj.url = ERMrest.renderHandlebarsTemplate(obj.url, null, { id: catalogId });

      // only append pcid/ppid if link is to a chaise url
      if (MenuUtils.isChaise(obj.url, ConfigService.chaiseConfig)) {
        obj.url = MenuUtils.addLogParams(obj.url, ConfigService.contextHeaderParams);
      }
    }
    // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
    // used to set ACLs for each child as well
    if (Array.isArray(obj.children)) {
      obj.children.forEach(function (child: any) {
        // get newTab from the parent
        if (child.newTab === undefined) child.newTab = parentNewTab;

        // if we have to open in newtab
        if (forceNewTab) child.newTab = true;

        // get acls settings from the parent
        if (child.acls === undefined) {
          child.acls = parentAcls;
        } else {
          // acls could be defined with nothing in it, or with only show or only enable
          if (child.acls.show === undefined) child.acls.show = parentAcls.show;
          if (child.acls.enable === undefined) child.acls.enable = parentAcls.enable;
        }

        // create the names array that will be used for logging
        if (!Array.isArray(parentNames)) {
          if (!obj.name) {
            parentNames = [];
          } else {
            parentNames = obj.name;
          }
        }
        child.names = parentNames.concat(child.name);

        q.push(child);
      });
    }
  }

  // relies on navbarMenu processing to finish, setting this updates the DOM
  const menu = cc.navbarMenu ? cc.navbarMenu.children : [];
  console.log(menu);

  const renderBrandImage = () => {
    if (!cc.navbarBrandImage) return;

    return (<img id="brand-image" alt="" src={cc.navbarBrandImage}></img>)
  }

  const renderBrandingHTML = () => {
    if (!cc.navbarBrandText) return;

    return (<>
      <span id="brand-text">{cc.navbarBrandText}</span>
    </>)
  }

  const renderDropdownName = (item: any) => {
    return (<span dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(item) }}></span>)
  }

  const renderMenuChildren = (children: any) => {
    return children.map((child: any, index: number) => {
      if (!MenuUtils.canShow(child)) return;

      // create an unclickable header
      if (child.header == true && !child.children && !child.url) {
        return (<NavDropdown.Header key={index} className="chaise-dropdown-header">{child.name}</NavDropdown.Header>);
      }

      // TODO: onClick logging
      if ((!child.children && child.url) || !MenuUtils.canEnable(child)) {
        return (<NavDropdown.Item
          key={index}
          href={child.url}
          target={child.newTab ? '_blank' : '_self'}
          className={MenuUtils.menuItemClasses(child, true)}
          dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}
        >
        </NavDropdown.Item>);
      }

      if (child.children && MenuUtils.canEnable(child)) {
        return (<Dropdown key={index} drop='end'>
          <Dropdown.Toggle as='a' variant="dark" className={MenuUtils.menuItemClasses(child, true)} dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(child) }}></Dropdown.Toggle>
          <Dropdown.Menu>
            {renderMenuChildren(child.children)}
          </Dropdown.Menu>
        </Dropdown>)
        // TODO: navbar-header-container
      }

      return (<></>);
    });
  }

  // TODO: onClick logging
  const renderMenuItem = (item: any, idx: number) => {
    if (!item.children || !MenuUtils.canEnable(item)) {
      return (<Nav.Link
        key={idx}
        href={item.url}
        target={item.newTab ? '_blank' : '_self'}
        className={MenuUtils.menuItemClasses(item, false)}
        dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(item) }}
      >
      </Nav.Link>)
    }

    // NOTE: this conditional might be unnecessary
    if (item.children) {
      return (<NavDropdown
        key={idx}
        id="nav-dropdown-dark-example"
        title={renderDropdownName(item)}
        menuVariant="dark"
      >
        {renderMenuChildren(item.children)}
      </NavDropdown>)
    }

    // NOTE: I don't it should reach this case
    return (<></>)
  }

  // const renderNavbarMenu = () => {
  //   if (!menu) return;

  //   return menu.map((item: any, index: number) => {
  //     if (!MenuUtils.canShow(item)) return

  //     // TODO: onToggle
  //     return (<li key={index} className="dropdown">
  //       {renderMenuItem(item)}
  //     </li>)
  //   });
  // }

  const renderNavbarMenuDropdowns = () => {
    if (!menu) return;

    return menu.map((item: any, index: number) => {
      if (!MenuUtils.canShow(item)) return

      return (<>
        {renderMenuItem(item, index)}
      </>)
    });
  }

  // TODO: add banner above <nav>
  // TODO: navbar toggle button when it shrinks
  // TODO: log branding
  // return (<header id="navheader" className="row">
  //   <nav id="mainnav" className="navbar navbar-inverse" role="navigation">
  //     <div className="navbar-header">
  //       <a className="navbar-brand" href={(brandHref())}>{renderBrandingHTML()}</a>
  //     </div>
  //     <div className="navbar-collapse navbar-inverse" id="fb-navbar-main-collapse">
  //       <ul id="navbar-menu" className="nav navbar-nav">
  //         {renderNavbarMenu()}
  //       </ul>
  //       <Login />
  //     </div>
  //   </nav>
  // </header>)
  return (<Navbar variant="dark" bg="dark" expand="lg">
    <Container fluid>
      <Navbar.Brand href={(cc.navbarBrandUrl ? cc.navbarBrandUrl : "/")}>
        {renderBrandImage()}{' '}
        {renderBrandingHTML()}
      </Navbar.Brand>
      <Navbar.Toggle aria-controls="navbar-dark-example" />
      <Navbar.Collapse id="navbar-dark-example">
        <Nav>
          {renderNavbarMenuDropdowns()}
        </Nav>
      </Navbar.Collapse>
    </Container>
  </Navbar>)

}

export default ChaiseNavbar;
