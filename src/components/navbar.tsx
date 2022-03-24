import '@chaise/assets/scss/_navbar.scss';

import { useEffect, useRef, useState } from 'react';

// components
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import ChaiseLogin from '@chaise/components/login';
import ChaiseNavDropdown from '@chaise/components/nav-dropdown';

// services
import { ConfigService } from '@chaise/services/config';
import { windowRef } from '@chaise/utils/window-ref';
import { NoRecordError } from '@chaise/models/errors';

// utilities
import { getCatalogId, splitVersionFromCatalog } from '@chaise/legacy/src/utils/uri-utils';
import MenuUtils from '@chaise/utils/menu-utils';

const ChaiseNavbar = (): JSX.Element => {
  const catalogId = getCatalogId();
  const cc = ConfigService.chaiseConfig;
  const ERMrest = ConfigService.ERMrest;
  const settings = ConfigService.appSettings;

  const [configInitialized, setConfigInitialized] = useState<boolean>(false);
  const [formModel, setFormModel] = useState({ ridSearchTerm: '' });
  const [menu, setMenu] = useState<any>(null); // TODO: type is null or an array of menuOptions
  const [showRidSpinner, setShowRidSpinner] = useState<boolean>(false);

  const dropdownWrapper = useRef<any>(null);

  function isValueDefined(val: any) {
    return val != undefined && val != null;
  }

  useEffect(() => {
    const root = cc.navbarMenu || {};

    // if in iframe and we want to force links to open in new tab,
    const forceNewTab = settings.openLinksInTab === true;

    // Set default newTab property at root node
    if (!root.hasOwnProperty('newTab') || forceNewTab) {
      root.newTab = true;
    }

    // Set default ACLs property at root node
    if (!root.hasOwnProperty('acls')) {
      root.acls = {
        show: ['*'],
        enable: ['*'],
      };
    }

    const q = [root];
    while (q.length > 0) {
      let obj = q.shift();
      let parentNewTab = obj.newTab;
      let parentAcls = obj.acls;
      let parentNames = obj.names;
      // template the url
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
        obj.children.forEach((child: any) => {
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

    // root is an object with acls, newTab, and children (optional) as key value pairs
    setMenu(root.children || []);
    setConfigInitialized(true);
  }, []);

  const isVersioned = () => (!!catalogId.split('@')[1]);

  const toLive = () => {
    // windowRef.location = MenuUtils.addLogParams(windowRef.location.href.replace(catalogId, catalogId.split("@")[0]), ConfigService.getContextHeaderParams());
  };

  const renderBrandImage = () => {
    if (!cc.navbarBrandImage) return;

    return (<img id='brand-image' alt='' src={cc.navbarBrandImage} />);
  };

  const renderBrandingHTML = () => {
    if (!cc.navbarBrandText) return;

    return (
      <span id='brand-text'>{cc.navbarBrandText}</span>
    );
  };

  const renderDropdownName = (item: any) => (<span dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(item) }} />);

  // TODO: onClick logging
  const renderNavbarMenuDropdowns = () => {
    if (!menu) return;

    return menu.map((item: any, index: number) => {
      if (!MenuUtils.canShow(item)) return;

      if (!item.children || !MenuUtils.canEnable(item)) {
        return (
          <Nav.Link
            key={index}
            href={item.url}
            target={item.newTab ? '_blank' : '_self'}
            className={MenuUtils.menuItemClasses(item, false)}
            dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(item) }}
          />
        );
      }

      // NOTE: this conditional might be unnecessary
      if (item.children) {
        return (
          <NavDropdown
            key={index}
            ref={dropdownWrapper}
            title={renderDropdownName(item)}
          >
            <ChaiseNavDropdown menu={item.children} parentDropdown={dropdownWrapper}></ChaiseNavDropdown>
          </NavDropdown>
        );
      }

      // NOTE: I don't it should reach this case
      return (<></>);
    });
  };

  // RID search
  const renderRidSearchIcon = () => {
    if (showRidSpinner) return (<span className='chaise-btn-icon fa-solid fa-rotate fa-spin' />);

    return (<span className='chaise-btn-icon fa-solid fa-share' />);
  };

  const handleRidSearchEnter = (e: any) => {
    if (e.key === 'Enter') handleRidSearch();
  };

  const handleRidSearch = () => {
    const resolverId = cc.resolverImplicitCatalog;
    let splitId = {
      catalog: '',
      version: '',
    },
      url = '/id/', catId;

    setShowRidSpinner(true);

    if (isValueDefined(catalogId)) {
      splitId = splitVersionFromCatalog(catalogId);

      // use `/id/catalog/ridSearchTerm` format if:
      //   - resolver id is NaN and !null
      //   - resolver id is a different catalog id than current page
      if (isNaN(resolverId) || resolverId != catalogId) {
        url += `${splitId.catalog}/`;
      }
    }

    url += formModel.ridSearchTerm;
    // implicitly does the isValueDefined(catalogId) check with how function returns true/false
    if (isValueDefined(catalogId) && isVersioned()) url += `@${splitId.version}`;

    // TODO: RID button logging
    // var logObj = ConfigUtils.getContextHeaderParams(), headers = {};

    // logObj.action = logService.getActionString(logService.logActions.NAVBAR_RID_SEARCH, "", "");
    // logObj.rid = scope.ridSearchTerm;

    // headers[ERMrest.contextHeaderName] = logObj;

    // try to fetch the resolver link to see if the path resolves before sending the user
    ConfigService.http.get(url, { headers: {} }).then(() => {
      setShowRidSpinner(false);
      windowRef.open(url, '_blank');
    }).catch((err: any) => {
      setShowRidSpinner(false);
      if (err.status == 404) {
        err = new NoRecordError({
          filters: [{ column: 'RID', operator: '=', value: formModel.ridSearchTerm }],
        }, '', '', '');
      }
      throw err;
    });
  };

  const handleRidSearchChange = (event: any) => {
    setFormModel((formModel) => ({
      ...formModel,
      ridSearchTerm: event.target.value,
    }));
  };

  const renderRidSearch = () => {
    if (cc.resolverImplicitCatalog === null || cc.hideGoToRID === true) return;

    return (
      <span className='rid-search'>
        <div className='chaise-search-box chaise-input-group'>
          <input
            id='rid-search-input'
            className='chaise-input-control chaise-input-control-sm has-feedback'
            type='text'
            placeholder='Go to RID'
            onChange={handleRidSearchChange}
            onKeyDown={handleRidSearchEnter}
          />
          <div className='chaise-input-group-append'>
            <button className='chaise-search-btn chaise-btn chaise-btn-sm chaise-btn-primary' onClick={handleRidSearch} role='button'>
              {renderRidSearchIcon()}
            </button>
          </div>
        </div>
      </span>
    );
  };

  // TODO: add banner above <nav>
  // TODO: navbar toggle button when it shrinks
  // TODO: log branding
  return (
    <Navbar id='navheader' variant='dark' bg='dark' expand='lg'>
      <Navbar.Brand href={(cc.navbarBrandUrl ? cc.navbarBrandUrl : '/')}>
        {renderBrandImage()}
        {' '}
        {renderBrandingHTML()}
      </Navbar.Brand>
      <Navbar.Toggle aria-controls='navbar-dark-example' />
      <Navbar.Collapse id='navbar-dark-example'>
        <Nav className='navbar-menu-options'>
          {renderNavbarMenuDropdowns()}
        </Nav>
        {renderRidSearch()}
        <ChaiseLogin />
      </Navbar.Collapse>
    </Navbar>
  );
};

export default ChaiseNavbar;
