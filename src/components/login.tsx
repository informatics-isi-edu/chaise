import { MouseEvent, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@chaise/store/hooks';
import { RootState } from '@chaise/store/store';
import { loginUser } from '@chaise/store/slices/authn';

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
import MenuUtils, { MenuOption } from '@chaise/utils/menu-utils';
import { windowRef } from '@chaise/utils/window-ref';


const ChaiseLogin = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const catalogId = getCatalogId();
  const cc = ConfigService.chaiseConfig;
  const settings = ConfigService.appSettings;

  // get the user from the store
  const authnRes = useAppSelector((state: RootState) => state.authn);

  const [displayName, setDisplayName]             = useState('');
  const [loggedInMenu, setLoggedInMenu]           = useState(cc.loggedInMenu);
  const [oneOption, setOneOption]                 = useState<MenuOption | null>(null);
  const [replaceDropdown, setReplaceDropdown]     = useState(false);
  const [showProfile, setShowProfile]             = useState(false);
  const [userTooltip, setUserTooltip]             = useState('');
  const [enableUserTooltip, setEnableUserTooltip] = useState(false);
  const [showUserTooltip, setShowUserTooltip]     = useState(false);

  const dropdownWrapper = useRef<any>(null);

  function isValueDefined(val: any) {
    return val !== undefined && val !== null;
  }

  useEffect(() => {
    if (TypeUtils.isStringAndNotEmpty(authnRes.client.id)) {
      const userName = authnRes.client.full_name || authnRes.client.display_name || authnRes.client.email || authnRes.client.id
      setDisplayName(userName);
      ConfigService.user = userName;
      if (authnRes.client.full_name) {
        // - some users could have the same full_name for multiple globus identities
        //   having display_name included in tooltip can help differentiate which user is logged in at a glance
        // - display_name should always be defined
        setEnableUserTooltip(true);
        // dropdown isn't open on page load so show
        setShowUserTooltip(true);
        setUserTooltip(authnRes.client.full_name + '\n' + authnRes.client.display_name);
      }

      if (loggedInMenu) {
        if (loggedInMenu.displayNameMarkdownPattern) {
          setDisplayName(ConfigService.ERMrest.renderHandlebarsTemplate(loggedInMenu.displayNameMarkdownPattern, null, { id: catalogId }));
        }

        // if in iframe and we want to force links to open in new tab,
        const forceNewTab = settings.openLinksInTab === true;

        // use newTab property if defined and forceNewTab is false
        const parentNewTab = (loggedInMenu.hasOwnProperty('newTab') && !forceNewTab) ? loggedInMenu.newTab : true;
        const parentAcls = loggedInMenu.hasOwnProperty('acls') ? loggedInMenu.acls : { 'show': ['*'], 'enable': ['*'] };

        const menuConfig: {menuOptions?: MenuOption[] | MenuOption} = {};
        if (loggedInMenu.menuOptions && Array.isArray(loggedInMenu.menuOptions)) {
          menuConfig.menuOptions = MenuUtils.createMenuList(loggedInMenu.menuOptions, parentNewTab, parentAcls, forceNewTab, catalogId);
        } else if (loggedInMenu.menuOptions) {
          // menuOptions is defined but not an array
          const option = loggedInMenu.menuOptions;
          const optionCopy: any = {...option};

          // valid if the "option" is an object that represents type my_profile, logout, header, url
          // check for menu type or children being set, if so ignore the option
          if (option.type === 'menu' || option.children) {
            optionCopy.isValid = false;
          } else {
            
            // might be valid, set all default values on the option assuming it is then verify validity
            if (option.urlPattern && isValueDefined(catalogId)) {
              let url = ConfigService.ERMrest.renderHandlebarsTemplate(option.urlPattern, null, { id: catalogId });

              // only append pcid/ppid if link is to a chaise url
              if (MenuUtils.isChaise(url, cc)) {
                url = MenuUtils.addLogParams(url, ConfigService.contextHeaderParams);
              }
              optionCopy.url = url
            }
            

            optionCopy.isValid = MenuUtils.isOptionValid(optionCopy);
            // no point in setting this if invalid
            if (optionCopy.isValid) {
              // get newTab from the parent
              if (option.newTab === undefined) optionCopy.newTab = parentNewTab;
              // if we have to open in newtab
              if (forceNewTab) optionCopy.newTab = true;

              // get acls settings from the parent
              if (option.acls === undefined) {
                optionCopy.acls = parentAcls;
              } else {
                // acls could be defined with nothing in it, or with only show or only enable
                if (option.acls.show === undefined) optionCopy.acls.show = parentAcls.show;
                if (option.acls.enable === undefined) optionCopy.acls.enable = parentAcls.enable;
              }
            }
          }
          const newOption: MenuOption = {
            acls: optionCopy.acls,
            isValid: optionCopy.isValid,
            nameMarkdownPattern: optionCopy.nameMarkdownPattern,
            newTab: optionCopy.newTab,
            type: optionCopy.type,
            url: optionCopy.url
          }

          menuConfig.menuOptions = newOption;
          setOneOption(newOption);
          setReplaceDropdown(newOption.isValid);
        }

        setLoggedInMenu(menuConfig);
      }
    }
  }, []);

  // click handlers
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

  // TODO: onToggle event type
  const handleLoginDropdownToggle = (isOpen: boolean, event: any) => {
    setShowUserTooltip(!isOpen);
    MenuUtils.onDropdownToggle(isOpen, event, LogActions.NAVBAR_ACCOUNT_DROPDOWN);
  }

  const handleOnLinkClick = (event: MouseEvent<HTMLElement>, item: MenuOption) => {
    MenuUtils.onLinkClick(event, item);
  }

  // render functions
  const renderSignupLink = () => {
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

  // For rendering the tooltip based on the value being set and the dropdown being closed
  const renderDropdownToggle = () => {
    const dropdownToggleComponent = <Dropdown.Toggle className='nav-link' as='a'>{displayName}</Dropdown.Toggle>;

    if (enableUserTooltip && showUserTooltip) {
      return (<OverlayTrigger
        placement='bottom-end'
        overlay={<Tooltip>{userTooltip}</Tooltip>}
      >
        {dropdownToggleComponent}
      </OverlayTrigger>)
    }

    return (dropdownToggleComponent);
  }

  const renderLoginMenu = () => {
    if (!TypeUtils.isStringAndNotEmpty(authnRes.client.id)) {
      return (
        <>
          {renderSignupLink()}
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
              onClick={(event) => handleOnLinkClick(event, oneOption)}
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

  return (
    <Nav className='login-menu-options navbar-right'>
      {renderLoginMenu()}
      <ProfileModal showProfile={showProfile} setShowProfile={setShowProfile}></ProfileModal>
    </Nav>
  );
};

export default ChaiseLogin;
