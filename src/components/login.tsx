import { useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@chaise/store/hooks';
import { RootState } from '@chaise/store/store';
import { ClientState, loginUser } from '@chaise/store/slices/authn';

// components
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';
import ChaiseLoginDropdown from '@chaise/components/login-dropdown';
import ProfileModal from '@chaise/components/profile-modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

// services
import { ConfigService } from '@chaise/services/config';
import AuthnService from '@chaise/services/authn';

// utilities
import { LogActions } from '@chaise/models/log';
import TypeUtils from '@chaise/utils/type-utils';
import { getCatalogId } from '@chaise/legacy/src/utils/uri-utils';
import MenuUtils from '@chaise/utils/menu-utils';
import { windowRef } from '@chaise/utils/window-ref';


const ChaiseLogin = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const catalogId = getCatalogId();
  const cc = ConfigService.chaiseConfig;
  const settings = ConfigService.appSettings;

  // get the user from the store
  const authnRes = useAppSelector((state: RootState) => state.authn);

  const [displayName, setDisplayName] = useState<string>('');
  const [loggedInMenu, setLoggedInMenu] = useState(cc.loggedInMenu);
  const [oneOption, setOneOption] = useState<any>(null);
  const [replaceDropdown, setReplaceDropdown] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [userTooltip, setUserTooltip] = useState('');
  const [showUserTooltip, setShowUserTooltip] = useState<boolean>(false);

  const dropdownWrapper = useRef<any>(null);

  function isValueDefined(val: any) {
    return val != undefined && val != null;
  }

  useEffect(() => {
    if (TypeUtils.isStringAndNotEmpty(authnRes.client.id)) {
      let userName = authnRes.client.full_name || authnRes.client.display_name || authnRes.client.email || authnRes.client.id
      setDisplayName(userName);
      ConfigService.user = userName;
      if (authnRes.client.full_name) {
        // - some users could have the same full_name for multiple globus identities
        //   having display_name included in tooltip can help differentiate which user is logged in at a glance
        // - display_name should always be defined
        // if no dropdown, show tooltip
        // TODO: function = () => {
        //   let dropdownEl = document.querySelector('.navbar-nav.login-menu-options .username-display.dropdown.show');
        //   return !dropdownEl;
        // }
        setShowUserTooltip(true);
        setUserTooltip(authnRes.client.full_name + '\n' + authnRes.client.display_name);
      }

      if (loggedInMenu) {
        let menuConfig = loggedInMenu;
        if (menuConfig.displayNameMarkdownPattern) setDisplayName(ConfigService.ERMrest.renderHandlebarsTemplate(menuConfig.displayNameMarkdownPattern, null, { id: catalogId }));

        // if in iframe and we want to force links to open in new tab,
        const forceNewTab = settings.openLinksInTab === true;

        // Set default newTab property at root node
        if (!menuConfig.hasOwnProperty('newTab') || forceNewTab) {
          menuConfig.newTab = true;
        }

        // Set default ACLs property at root node
        if (!menuConfig.hasOwnProperty('acls')) {
          menuConfig.acls = {
            'show': ['*'],
            'enable': ['*']
          };
        }

        if (menuConfig.menuOptions && Array.isArray(menuConfig.menuOptions)) {
          // iterate over menuOptions and check to see if profile and logout need to be replaced
          let q = [menuConfig];
          while (q.length > 0) {
            let option = q.shift();

            const parentNewTab = option.newTab;
            const parentAcls = option.acls;

            // template the url
            // NOTE: Like in navbar.js, this is done here to prevent writing a recursive function (again) in `setConfigJSON()`
            if (option.urlPattern && isValueDefined(catalogId)) {
              option.url = ConfigService.ERMrest.renderHandlebarsTemplate(option.urlPattern, null, { id: catalogId });

              // only append pcid/ppid if link is to a chaise url
              if (MenuUtils.isChaise(option.url, cc)) {
                option.url = MenuUtils.addLogParams(option.url, ConfigService.contextHeaderParams);
              }
            }

            // If current node has children, set each child's newTab to its own existing newTab or parent's newTab
            // used to set ACLs for each child as well
            // check for isArray still since this iterates over menuOptions too
            if (Array.isArray(option.menuOptions) || Array.isArray(option.children)) {
              let arr = option.menuOptions || option.children;
              arr.forEach(function (child: any) {
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

                q.push(child);
              });
            }
            option.isValid = MenuUtils.isOptionValid(option);
          }
        } else if (menuConfig.menuOptions) {
          // menuOptions is defined but not an array
          let option = menuConfig.menuOptions;
          // valid if the "option" is an object that represents type my_profile, logout, header, url
          // check for menu type or children being set, if so ignore the option
          if (option.type === 'menu' || option.children) {
            option.isValid = false;
          } else {
            // might be valid, set all default values on the option assuming it is then verify validity
            if (option.urlPattern && isValueDefined(catalogId)) {
              option.url = ConfigService.ERMrest.renderHandlebarsTemplate(option.urlPattern, null, { id: catalogId });

              // only append pcid/ppid if link is to a chaise url
              if (MenuUtils.isChaise(option.url, cc)) {
                option.url = MenuUtils.addLogParams(option.url, ConfigService.contextHeaderParams);
              }
            }

            option.isValid = MenuUtils.isOptionValid(option);
            // no point in setting this if invalid
            if (option.isValid) {
              // TODO: refactor to a function so it can be reused
              // get newTab from the parent
              if (option.newTab === undefined) option.newTab = menuConfig.newTab;
              // if we have to open in newtab
              if (forceNewTab) option.newTab = true;

              // get acls settings from the parent
              if (option.acls === undefined) {
                option.acls = menuConfig.acls;
              } else {
                // acls could be defined with nothing in it, or with only show or only enable
                if (option.acls.show === undefined) option.acls.show = menuConfig.acls.show;
                if (option.acls.enable === undefined) option.acls.enable = menuConfig.acls.enable;
              }
            }
          }

          setOneOption(option);
          setReplaceDropdown(option.isValid);
        }
        setLoggedInMenu(menuConfig);
      }
    }
  }, []);

  const handleLoginClick = () => {
    AuthnService.popupLogin(LogActions.LOGIN_NAVBAR, () => {
      if (!AuthnService.shouldReloadPageAfterLogin()) {
        // fetches the session of the user that just logged in
        AuthnService.getSession('').then((response: any) => {
          // if (modalInstance) modalInstance.close();
          // update the user without reloading
          if (response) dispatch(loginUser(response));
        });
      } else {
        windowRef.location.reload();
      }
    });
  };

  const handleOpenProfileClick = () => {
    setShowProfile(true);
    MenuUtils.openProfileModal();
  }

  const logDropdownOpen = () => {
    // TODO: log dropdown opened
    console.log('dropdown opened');
  };

  const showSignupLink = () => {
    if (!cc.signUpURL) return;

    return (<Nav.Link id='signup-link' className='navbar-nav' href={cc.signUpUrl}>Sign Up</Nav.Link>);
  };

  const renderMenuChildren = () => {
    if (loggedInMenu.menuOptions) {
      return (<ChaiseLoginDropdown
        menu={loggedInMenu.menuOptions}
        openProfileCb={handleOpenProfileClick}
        parentDropdown={dropdownWrapper}
      />)
    }

    return (
      <>
        <NavDropdown.Item id='profile-link' onClick={handleOpenProfileClick}>My Profile</NavDropdown.Item>
        <NavDropdown.Item id='logout-link' onClick={MenuUtils.logout}>Log Out</NavDropdown.Item>
      </>
    );
  }

  const renderDropdownToggle = () => {
    const dropdownToggleComponent = <Dropdown.Toggle className='nav-link' as='a'>{displayName}</Dropdown.Toggle>;

    if (showUserTooltip) {
      return (<OverlayTrigger
        placement='bottom-end'
        overlay={<Tooltip>{userTooltip}</Tooltip>}
      >
        {dropdownToggleComponent}
      </OverlayTrigger>)
    }

    return (dropdownToggleComponent);
  }

  const handleLoginDropdownToggle = (isOpen: boolean, event: any)=> {
    setShowUserTooltip(!isOpen);
    
    if (event.originalEvent.persist) event.originalEvent.persist();
  }

  const renderLoginMenu = () => {
    if (!TypeUtils.isStringAndNotEmpty(authnRes.client.id)) {
      return (
        <>
          {showSignupLink()}
          <Nav.Link id='login-link' className='navbar-nav' onClick={handleLoginClick}>Log In</Nav.Link>
        </>
      );
    }

    if (replaceDropdown && oneOption) {
      switch (oneOption.type) {
        case 'header':
          return (
            <Nav.Item
              className='chaise-dropdown-header'
              dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(oneOption) }}
            />
          );
        case 'url':
          return (
            <Nav.Link
              href={oneOption.url}
              target={oneOption.newTab ? '_blank' : '_self'}
              dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(oneOption) }}
            />
          );
        case 'my_profile':
          return (
            <Nav.Link
              id='profile-link'
              onClick={handleOpenProfileClick}
              dangerouslySetInnerHTML={{ __html: oneOption.nameMarkdownPattern ? MenuUtils.renderName(oneOption) : 'My Profile' }}
            />
          )
        case 'logout':
          return (
            <Nav.Link
              id='logout-link'
              onClick={MenuUtils.logout}
              dangerouslySetInnerHTML={{ __html: oneOption.nameMarkdownPattern ? MenuUtils.renderName(oneOption) : 'Log Out' }}
            />
          )
        default:
          return;
      }
    }

    return (
      <Dropdown
        ref={dropdownWrapper}
        className='username-display nav-item'
        onToggle={handleLoginDropdownToggle}
        style={{ marginLeft: (cc.resolverImplicitCatalog === null || cc.hideGoToRID === true) ? 'auto' : '' }}
      >
        {renderDropdownToggle()}
        <Dropdown.Menu>{renderMenuChildren()}</Dropdown.Menu>
      </Dropdown>
    );
  }

  // TODO: fix onClick={logDropdownOpen}
  return (
    <Nav className='login-menu-options'>
      {renderLoginMenu()}
      <ProfileModal showProfile={showProfile} setShowProfile={setShowProfile}></ProfileModal>
    </Nav>
  );
};

export default ChaiseLogin;
