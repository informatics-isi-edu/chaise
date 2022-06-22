import '@isrd-isi-edu/chaise/src/assets/scss/_navbar.scss';

import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';

// components
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

import ChaiseLogin from '@isrd-isi-edu/chaise/src/components/login';
import ChaiseLoginDropdown from '@isrd-isi-edu/chaise/src/components/login-dropdown';
import ChaiseBanner from '@isrd-isi-edu/chaise/src/components/banner';

// services
import AuthnService from '@isrd-isi-edu/chaise/src/services/authn';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { NoRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// utilities
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { getCatalogId, splitVersionFromCatalog } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import {
  MenuOption, NavbarBanner, addLogParams,
  canEnable, canShow, createMenuList, menuItemClasses,
  onDropdownToggle, onLinkClick, renderName
} from '@isrd-isi-edu/chaise/src/utils/menu-utils';
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { debounce } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const ChaiseNavbar = (): JSX.Element => {
  const catalogId: string = getCatalogId();
  const cc = ConfigService.chaiseConfig; // TODO: chaise-config typing
  const ERMrest = ConfigService.ERMrest; // TODO: ERMrestJS typing
  const settings = ConfigService.appSettings;

  const [formModel, setFormModel]           = useState({ ridSearchTerm: '' });
  const [menu, setMenu]                     = useState<MenuOption[] | null>(null);
  const [showRidSpinner, setShowRidSpinner] = useState(false);
  const [topBanners, setTopBanners]         = useState<NavbarBanner[]>([]);
  const [bottomBanners, setBottomBanners]   = useState<NavbarBanner[]>([]);

  const dropdownWrapper = useRef<any>(null);

  const isValueDefined = (val: any): boolean => (val !== undefined && val !== null);

  const isVersioned = (): boolean => (!!catalogId.split('@')[1]);

  useEffect(() => {
    const root = { ...cc.navbarMenu } || {};

    // if in iframe and we want to force links to open in new tab,
    const forceNewTab = settings.openLinksInTab === true;

    // use newTab property if defined and forceNewTab is false
    const parentNewTab = (root.hasOwnProperty('newTab') && !forceNewTab) ? root.newTab : true;
    const parentAcls = root.hasOwnProperty('acls') ? root.acls : { 'show': ['*'], 'enable': ['*'] };

    let menuOptions: MenuOption[] = [];
    if (Array.isArray(root.children)) {
      menuOptions = createMenuList(root.children, parentNewTab, parentAcls, forceNewTab, catalogId);
    }

    setMenu(menuOptions);

    // navbarBanner can be an object or array
    const bannerConfig = Array.isArray(cc.navbarBanner) ? cc.navbarBanner : [cc.navbarBanner];

    const tempTopBanners: NavbarBanner[] = [],
      tempBottomBanners: NavbarBanner[] = [];

    // NOTE: any type until chaise config is typed
    bannerConfig.forEach((conf: any) => {
      if (!isObjectAndNotNull(conf)) return;
      if (!isStringAndNotEmpty(conf.markdownPattern)) return;

      let html = ERMrest.renderHandlebarsTemplate(conf.markdownPattern, null, { id: catalogId });
      html = ERMrest.renderMarkdown(html, false);

      if (!isStringAndNotEmpty(html)) {
        // invalid html, so we shounldn't add it.
        return;
      }

      // if acls.show is defined, process it
      if (isObjectAndNotNull(conf.acls) && Array.isArray(conf.acls.show)) {
        if (!AuthnService.isGroupIncluded(conf.acls.show)) {
          // don't add the banner because of acls
          return;
        }
      }

      const banner: NavbarBanner = {
        dismissible: (conf.dismissible === true),
        hide: false,
        html: html,
        key: isStringAndNotEmpty(conf.key) ? conf.key : ''
      };

      // add the banner to top or bottom based on given position
      if ((conf.position !== 'bottom')) {
        tempTopBanners.push(banner);
      } else {
        tempBottomBanners.push(banner);
      }
    });

    setTopBanners(tempTopBanners);
    setBottomBanners(tempBottomBanners);
  }, []);

  // Register window resize event for navbar menus and submenus
  useEffect(() => {
    // when resize event is called, it will call debounce function with 500ms timeout
    const debouncedFunc = debounce(setHeight, 500);
  
    // Call when there is resize event
    window.addEventListener('resize', debouncedFunc);
  }, []);

  /**
   * Function is responsible for adjusting height of submenus.
   * Function is called when there is resize event or when user opens submenu
   * Set the height of Dropdown.Menu (inline style)
   * 1. Check for subMenuRef. If it is not null get x, y, and width positions
   * 2. calculate the available height (window height - Elements's y position)
   */
   const setHeight = (event: any) => {
    const winHeight = windowRef.innerHeight;
    const padding = 15;

    // When multiple submenus are open on the window, and resize event happens,
    // it should calculate height of all submenus & update.
    // Checking all dropdown menu with show class to recalculate height on resize event
    const menubar = document.getElementById('menubarHeader');
    if (menubar) {
     const allElementswithShow = menubar.getElementsByClassName('dropdown-menu');
     for (let i = 0; i < allElementswithShow.length; i++) {
       const ele: any = allElementswithShow[i];
       const y = ele.getBoundingClientRect().y;
       ele.style.maxHeight = winHeight - y - padding + 'px';
     }
    }
  }

  /**
   * Responsible for adjusting height of navbar based on available height
   * @param event Current target i.e., navbar
   * @returns None
   */
  const adjustNavBarHeight = (event: any) => {
    event.preventDefault();
    const winHeight = windowRef.innerHeight;
    const padding = 15;

    if (event && event.target) {
      // Get Closest div with classname: nav-item
      const parent = event.target.closest('.nav-item.dropdown');
      // Get Menu div from parent
      const menu = parent.querySelector('.dropdown-menu');
      const y = parent.getBoundingClientRect().y;
      const height = parent.getBoundingClientRect().height;
      menu.style.maxHeight = winHeight - y - height - padding + 'px';
    }
  }

  const handleToLiveClick = () => {
    const url = windowRef.location.href.replace(catalogId, catalogId.split('@')[0]);
    windowRef.location = addLogParams(url, ConfigService.contextHeaderParams);
    windowRef.location.reload();
  };

  // TODO: onToggle event type
  const handleNavbarDropdownToggle = (isOpen: boolean, event: any, item: MenuOption) => {
    onDropdownToggle(isOpen, event, LogActions.NAVBAR_MENU_OPEN, item);
  }

  const handleOnLinkClick = (event: MouseEvent<HTMLElement>, item: MenuOption) => onLinkClick(event, item);

  const handleOnBrandingClick = () => LogService.logClientAction({
      action: LogService.getActionString(LogActions.NAVBAR_BRANDING, '', '')
    });


  const handleRidSearchEnter = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleRidSearch();
  };

  const handleRidSearch = () => {
    const resolverId = cc.resolverImplicitCatalog;
    let splitId = {
      catalog: '',
      version: '',
    },
      url = '/id/';

    setShowRidSpinner(true);

    if (isValueDefined(catalogId)) {
      splitId = splitVersionFromCatalog(catalogId);

      // use `/id/catalog/ridSearchTerm` format if:
      //   - resolver id is NaN and !null
      //   - resolver id is a different catalog id than current page
      if (isNaN(resolverId) || resolverId !== catalogId) {
        url += `${splitId.catalog}/`;
      }
    }

    url += formModel.ridSearchTerm;
    // implicitly does the isValueDefined(catalogId) check with how function returns true/false
    if (isValueDefined(catalogId) && isVersioned()) url += `@${splitId.version}`;

    // TODO: LogObject type
    // TODO: headers type?
    const logObj: any = ConfigService.contextHeaderParams,
      headers: any = {};

    logObj.action = LogService.getActionString(LogActions.NAVBAR_RID_SEARCH, '', '');
    logObj.rid = formModel.ridSearchTerm;

    headers[ConfigService.ERMrest.contextHeaderName] = logObj;

    // try to fetch the resolver link to see if the path resolves before sending the user
    ConfigService.http.get(url, { headers: headers }).then(() => {
      setShowRidSpinner(false);
      windowRef.open(url, '_blank');
    }).catch((err: any) => {
      setShowRidSpinner(false);
      if (err.status === 404) {
        err = new NoRecordError({
          filters: [{ column: 'RID', operator: '=', value: formModel.ridSearchTerm }],
        }, '', '', '');
      }
      throw err;
    });
  };

  const handleRidSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormModel((formModel) => ({
      ...formModel,
      ridSearchTerm: event.target.value,
    }));
  };

  const renderBanners = (banners: NavbarBanner[]) => banners.map(
    (banner: NavbarBanner, index: number) => (<ChaiseBanner key={index} banner={banner}></ChaiseBanner>)
  );

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

  const renderLiveButton = () => {
    if (!isVersioned()) return;

    return (<a
      id='live-btn'
      className='nav navbar-nav navbar-right'
      onClick={handleToLiveClick}
    // uib-tooltip="You are viewing snapshotted data. Click here to return to the live data catalog." tooltip-placement="bottom"
    >View Live Data</a>)
  }

  const renderRidSearchIcon = () => {
    if (showRidSpinner) return (<span className='chaise-btn-icon fa-solid fa-rotate fa-spin' />);

    return (<span className='chaise-btn-icon fa-solid fa-share' />);
  };

  const renderRidSearch = () => {
    if (cc.resolverImplicitCatalog === null || cc.hideGoToRID === true) return;

    return (
      <span className='nav navbar-nav navbar-right rid-search'>
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

  const renderDropdownName = (item: MenuOption) => (<span dangerouslySetInnerHTML={{ __html: renderName(item) }} />);

  const renderNavbarMenuDropdowns = () => {
    if (!menu) return;

    return menu.map((item: MenuOption, index: number) => {
      if (!canShow(item)) return;

      if (!item.children || !canEnable(item)) {
        return (
          <Nav.Link
            key={index}
            href={item.url}
            target={item.newTab ? '_blank' : '_self'}
            onClick={(event) => handleOnLinkClick(event, item)}
            className={menuItemClasses(item, false)}
            dangerouslySetInnerHTML={{ __html: renderName(item) }}
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
            onToggle={(isOpen, event) => handleNavbarDropdownToggle(isOpen, event, item)}
            onClick={adjustNavBarHeight}
            renderMenuOnMount
          >
            <ChaiseLoginDropdown menu={item.children} parentDropdown={dropdownWrapper} alignRight={true}></ChaiseLoginDropdown>
          </NavDropdown>
        );
      }

      // NOTE: I don't think it should reach this case
      return (<></>);
    });
  };

  return (
    <header id='navheader'>
      {renderBanners(topBanners)}
      <Navbar collapseOnSelect expand='lg' variant='dark' className='navbar-inverse' id='mainnav' >
        <Navbar.Brand href={(cc.navbarBrandUrl ? cc.navbarBrandUrl : '/')} onClick={handleOnBrandingClick}>
          {renderBrandImage()}
          {' '}
          {renderBrandingHTML()}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls='navbar-dark-example'>Menu</Navbar.Toggle>
        <Navbar.Collapse id='navbar-dark-example'>
          <Nav className='navbar-menu-options nav' id='menubarHeader'>
            {renderNavbarMenuDropdowns()}
          </Nav>
          {/* Since we are using float: right for divs, position for chaise login comes first */}
          <ChaiseLogin />
          {renderRidSearch()}
          {renderLiveButton()} 
        </Navbar.Collapse>
      </Navbar>
      {renderBanners(bottomBanners)}
    </header>
  );
};

export default ChaiseNavbar;
