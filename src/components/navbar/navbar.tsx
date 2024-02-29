import '@isrd-isi-edu/chaise/src/assets/scss/_navbar.scss';

import { ChangeEvent, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from 'react';

// components
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Spinner from 'react-bootstrap/Spinner';

import ChaiseLogin from '@isrd-isi-edu/chaise/src/components/navbar/login';
import NavbarDropdown from '@isrd-isi-edu/chaise/src/components/navbar/navbar-dropdown';
import ChaiseBanner from '@isrd-isi-edu/chaise/src/components/navbar/banner';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { NoRecordRidError } from '@isrd-isi-edu/chaise/src/models/errors';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

// utilities
import { isGroupIncluded } from '@isrd-isi-edu/chaise/src/utils/authn-utils';
import { splitVersionFromCatalog } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import {
  MenuOption, NavbarBanner, addLogParams,
  canEnable, canShow, createMenuList, menuItemClasses,
  onDropdownToggle, onLinkClick, renderName
} from '@isrd-isi-edu/chaise/src/utils/menu-utils';
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { debounce } from '@isrd-isi-edu/chaise/src/utils/ui-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

const ChaiseNavbar = (): JSX.Element => {
  const catalogId: string = ConfigService.catalogID;
  const cc = ConfigService.chaiseConfig; // TODO: chaise-config typing
  const ERMrest = ConfigService.ERMrest; // TODO: ERMrestJS typing
  const settings = ConfigService.appSettings;

  const { dispatchError } = useError();
  const { session } = useAuthn();

  const [formModel, setFormModel] = useState({ ridSearchTerm: '' });
  const [menu, setMenu] = useState<MenuOption[] | null>(null);
  const [showRidSpinner, setShowRidSpinner] = useState(false);
  const [topBanners, setTopBanners] = useState<NavbarBanner[]>([]);
  const [bottomBanners, setBottomBanners] = useState<NavbarBanner[]>([]);
  /**
   * Keeps track of most recently opened dropdown
   */
  const [openDropDown, setOpenDropDown] = useState<number |undefined>(undefined);

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
        if (!isGroupIncluded(conf.acls.show, session)) {
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
    windowRef.addEventListener('resize', debouncedFunc);
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
  const handleNavbarDropdownToggle = (isOpen: boolean, event: any, item: MenuOption,index:number) => {
    /**
     * Update the state to reflect most recently opened dropdown
     */
    if(isOpen){
      setOpenDropDown(index)
    }else{
      setOpenDropDown(undefined)
    }

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
        err = new NoRecordRidError();
      }

      dispatchError({ error: err, isDismissible: true });
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

    return (<ChaiseTooltip placement='bottom' tooltip={MESSAGE_MAP.tooltip.liveData}>
      <a
        id='live-btn'
        className='nav navbar-nav navbar-right'
        onClick={handleToLiveClick}
      >View Live Data</a>
    </ChaiseTooltip>)
  }

  const renderRidSearchIcon = () => {
    if (showRidSpinner) return <Spinner size='sm' animation='border' />;

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

  const renderDropdownName = (item: MenuOption) => (<DisplayValue value={{isHTML: true, value: renderName(item)}} />);

  const renderNavbarMenuDropdowns = () => {
    if (!menu) return;

    return menu.map((item: MenuOption, index: number) => {
      if (!canShow(item, session)) return;

      if (!item.children || !canEnable(item, session)) {
        return (
          <DisplayValue
            key={index}
            as={Nav.Link}
            value={{isHTML: true, value: renderName(item)}}
            className={'chaise-nav-item ' + menuItemClasses(item, session, false)}
            props={{
              href: item.url,
              target: item.newTab ? '_blank' : '_self',
              onClick: (event: MouseEvent<HTMLElement>) => handleOnLinkClick(event, item)
            }}
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
            show={openDropDown == index} // Display dropdown if it is the most recently opened.
            onToggle={(isOpen, event) => handleNavbarDropdownToggle(isOpen, event, item,index)}
            onClick={adjustNavBarHeight}
            renderMenuOnMount
            className='chaise-nav-item'
          >
            <NavbarDropdown menu={item.children} parentDropdown={dropdownWrapper} alignRight={true}></NavbarDropdown>
          </NavDropdown>
        );
      }

      // NOTE: I don't think it should reach this case
      return (<></>);
    });
  };

  return (
    <header id='navheader'>
      {!ConfigService.appSettings.hideNavbar &&
        <>
          {renderBanners(topBanners)}
          <Navbar collapseOnSelect expand='lg' variant='dark' className='navbar-inverse' id='mainnav' >
            <Navbar.Brand href={(cc.navbarBrandUrl ? cc.navbarBrandUrl : '/')} onClick={handleOnBrandingClick}>
              {renderBrandImage()}
              {' '}
              {renderBrandingHTML()}
            </Navbar.Brand>
            <Navbar.Toggle aria-controls='chaise-navbar-collapse-btn'>Menu</Navbar.Toggle>
            <Navbar.Collapse id='chaise-navbar-collapse-btn'>
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
        </>
      }
    </header>
  );
};

export default ChaiseNavbar;
