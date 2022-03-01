import '@chaise/assets/scss/_navbar.scss';

import React, { useState } from 'react'

import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import Form from 'react-bootstrap/Form';  
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';

import FontAwesome from '@chaise/services/fontawesome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ConfigService } from '@chaise/services/config';
import { MenuUtils, UriUtils } from '@chaise/utils/utils';
import { windowRef } from "@chaise/utils/window-ref";
import { getCatalogId } from "@chaise/legacy/src/utils/uri-utils";
import { NoRecordError } from "@chaise/models/errors";

import ChaiseLogin from '@chaise/components/login';

const ChaiseNavbar = (): JSX.Element => {
  const [formModel, setFormModel] = useState({ ridSearchTerm: "" });
  const [showRidSpinner, setShowRidSpinner] = useState(false);

  var cc = ConfigService.chaiseConfig;
  var settings = ConfigService.appSettings;

  var root = cc.navbarMenu || {};
  var catalogId = getCatalogId();

  let ERMrest = ConfigService.ERMrest;

  FontAwesome.addNavbarFonts();

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

  const isVersioned = () => {
    return catalogId.split("@")[1] ? true : false;
  }

  const toLive = () => {
    // windowRef.location = MenuUtils.addLogParams(windowRef.location.href.replace(catalogId, catalogId.split("@")[0]), ConfigService.getContextHeaderParams());
  }

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
        title={renderDropdownName(item)}
      >
        {renderMenuChildren(item.children)}
      </NavDropdown>)
    }

    // NOTE: I don't it should reach this case
    return (<></>)
  }

  const renderNavbarMenuDropdowns = () => {
    if (!menu) return;

    return menu.map((item: any, index: number) => {
      if (!MenuUtils.canShow(item)) return

      return (<>
        {renderMenuItem(item, index)}
      </>)
    });
  }

  const renderRidSearchIcon = () => {
    if (showRidSpinner) return (<FontAwesomeIcon className="chaise-btn-icon fa-spin" icon="sync-alt" />);

    return (<FontAwesomeIcon className="chaise-btn-icon" icon="share" />)
  }
  
  const handleRidSearchEnter = (e: any) => {
    if (e.key === 'Enter') handleRidSearch();
  }

  const handleRidSearch = () => {
    var resolverId = cc.resolverImplicitCatalog,
      splitId = {
        catalog: "",
        version: ""
      },
      url = "/id/", catId;

    setShowRidSpinner(true);

    if (isValueDefined(catalogId)) {
      splitId = UriUtils.splitVersionFromCatalog(catalogId);

      // use `/id/catalog/ridSearchTerm` format if:
      //   - resolver id is NaN and !null
      //   - resolver id is a different catalog id than current page
      if (isNaN(resolverId) || resolverId != catalogId) {
        url += splitId.catalog + "/"
      }
    }

    url += formModel.ridSearchTerm;
    // implicitly does the isValueDefined(catalogId) check with how function returns true/false
    if (isValueDefined(catalogId) && isVersioned()) url += "@" + splitId.version;

    // TODO: RID button logging
    // var logObj = ConfigUtils.getContextHeaderParams(), headers = {};

    // logObj.action = logService.getActionString(logService.logActions.NAVBAR_RID_SEARCH, "", "");
    // logObj.rid = scope.ridSearchTerm;

    // headers[ERMrest.contextHeaderName] = logObj;


    // try to fetch the resolver link to see if the path resolves before sending the user
    ConfigService.http.get(url, { headers: {} }).then(function () {
      setShowRidSpinner(false);
      windowRef.open(url, '_blank');
    }).catch(function (err: any) {
      setShowRidSpinner(false);
      if (err.status == 404) {
        err = new NoRecordError({ 
          filters: [{ column: "RID", operator: "=", value: formModel.ridSearchTerm }]
        }, "", "", "");
      }
      throw err;
    });
  }

  const handleRidSearchChange = (event: any) => {
    setFormModel(formModel => ({
      ...formModel,
      "ridSearchTerm": event.target.value
    }));
  }

  const renderRidSearch = () => {
    if (cc.resolverImplicitCatalog === null || cc.hideGoToRID === true) return;

    return (<span className="rid-search" style={{"marginLeft": "auto"}}>
      <div className="chaise-search-box chaise-input-group">
        <input 
          id="rid-search-input" 
          className="chaise-input-control chaise-input-control-sm has-feedback" 
          type="text" 
          placeholder="Go to RID" 
          onChange={handleRidSearchChange}
          onKeyDown={handleRidSearchEnter}
        />
        <div className="chaise-input-group-append">
          <button className="chaise-search-btn chaise-btn chaise-btn-sm chaise-btn-primary" onClick={handleRidSearch} role="button">
            {renderRidSearchIcon()}
          </button>
        </div>
      </div>
    </span>)
  }

  // TODO: add banner above <nav>
  // TODO: navbar toggle button when it shrinks
  // TODO: log branding
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
        {renderRidSearch()}
        <ChaiseLogin />
      </Navbar.Collapse>
    </Container>
  </Navbar>)

}

export default ChaiseNavbar;
