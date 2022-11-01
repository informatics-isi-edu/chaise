import { MouseEvent, useEffect, useRef, useState } from 'react';

// components
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';
import NavbarDropdown from '@isrd-isi-edu/chaise/src/components/navbar/navbar-dropdown';
import ProfileModal from '@isrd-isi-edu/chaise/src/components/modals/profile-modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { getCatalogId } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import {
  MenuOption, addLogParams, createMenuList,
  isChaise, isOptionValid,
  onDropdownToggle, onLinkClick, openProfileModal,
  renderName
} from '@isrd-isi-edu/chaise/src/utils/menu-utils';


const ChaiseLogin = (): JSX.Element => {
  const catalogId = getCatalogId();
  const cc = ConfigService.chaiseConfig;
  const settings = ConfigService.appSettings;

  // get the user from the session service (assumption: it's populated by the app wrapper)
  const { logout, popupLogin, session } = useAuthn();

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
    if (session) {
      const userName = session.client.full_name || session.client.display_name || session.client.email || session.client.id
      setDisplayName(userName);
      if (session.client.full_name) {
        // - some users could have the same full_name for multiple globus identities
        //   having display_name included in tooltip can help differentiate which user is logged in at a glance
        // - display_name should always be defined
        setEnableUserTooltip(true);
        // dropdown isn't open on page load so show
        setShowUserTooltip(true);
        setUserTooltip(session.client.full_name + '\n' + session.client.display_name);
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
          menuConfig.menuOptions = createMenuList(loggedInMenu.menuOptions, parentNewTab, parentAcls, forceNewTab, catalogId);
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
              if (isChaise(url, cc)) {
                url = addLogParams(url, ConfigService.contextHeaderParams);
              }
              optionCopy.url = url
            }


            optionCopy.isValid = isOptionValid(optionCopy);
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
  }, [session]);

  // click handlers
  const handleLoginClick = () => {
    popupLogin(LogActions.LOGIN_NAVBAR);
  };

  const handleOpenProfileClick = () => {
    setShowProfile(true);
    openProfileModal();
  }

  // TODO: onToggle event type
  const handleLoginDropdownToggle = (isOpen: boolean, event: any) => {
    setShowUserTooltip(!isOpen);
    onDropdownToggle(isOpen, event, LogActions.NAVBAR_ACCOUNT_DROPDOWN);
  }

  const handleOnLinkClick = (event: MouseEvent<HTMLElement>, item: MenuOption) => {
    onLinkClick(event, item);
  }

  // render functions
  const renderSignupLink = () => {
    if (!cc.signUpURL) return;

    return (<Nav.Link id='signup-link' className='navbar-nav' href={cc.signUpURL}>Sign Up</Nav.Link>);
  };

  const renderMenuChildren = () => {
    if (loggedInMenu.menuOptions) {
      return (<NavbarDropdown
        menu={loggedInMenu.menuOptions}
        openProfileCb={handleOpenProfileClick}
        parentDropdown={dropdownWrapper}
      />)
    }

    return (
      <>
        <NavDropdown.Item id='profile-link' onClick={handleOpenProfileClick}>My Profile</NavDropdown.Item>
        <NavDropdown.Item id='logout-link' onClick={() => logout(LogActions.LOGOUT_NAVBAR)}>Log Out</NavDropdown.Item>
      </>
    );
  }

  // For rendering the tooltip based on the value being set and the dropdown being closed
  const renderDropdownToggle = () => {
    const dropdownToggleComponent = <Dropdown.Toggle className='nav-link' as='a'>{displayName}</Dropdown.Toggle>;

    if (enableUserTooltip && showUserTooltip) {
      return (<OverlayTrigger
        placement='bottom-end'
        trigger='hover'
        overlay={<Tooltip>{userTooltip}</Tooltip>}
      >
        {dropdownToggleComponent}
      </OverlayTrigger>)
    }

    return (dropdownToggleComponent);
  }

  const renderLoginMenu = () => {
    if (!session) {
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
              dangerouslySetInnerHTML={{ __html: renderName(oneOption) }}
            />
          );
        case 'url':
          return (
            <Nav.Link
              href={oneOption.url}
              target={oneOption.newTab ? '_blank' : '_self'}
              onClick={(event) => handleOnLinkClick(event, oneOption)}
              dangerouslySetInnerHTML={{ __html: renderName(oneOption) }}
            />
          );
        case 'my_profile':
          return (
            <Nav.Link
              id='profile-link'
              onClick={handleOpenProfileClick}
              dangerouslySetInnerHTML={{ __html: oneOption.nameMarkdownPattern ? renderName(oneOption) : 'My Profile' }}
            />
          )
        case 'logout':
          return (
            <Nav.Link
              id='logout-link'
              onClick={() => logout(LogActions.LOGOUT_NAVBAR)}
              dangerouslySetInnerHTML={{ __html: oneOption.nameMarkdownPattern ? renderName(oneOption) : 'Log Out' }}
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
        <Dropdown.Menu align='end'>{renderMenuChildren()}</Dropdown.Menu>
      </Dropdown>
    );
  }

  return (
    <Nav className='login-menu-options nav navbar-nav navbar-right'>
      {renderLoginMenu()}
      <ProfileModal showProfile={showProfile} setShowProfile={setShowProfile}></ProfileModal>
    </Nav>
  );
};

export default ChaiseLogin;
