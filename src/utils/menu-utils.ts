import { MouseEvent } from 'react';

// constants
import { BUILD_VARIABLES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import AuthnService from '@isrd-isi-edu/chaise/src/services/authn';
import { ConfigService, ContextHeaderParams } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

// utilities
import { isSameOrigin } from '@isrd-isi-edu/chaise/src/utils/uri-utils';

/* ===== Interfaces ===== */
export interface MenuOption {
  acls: MenuAcls,
  children?: MenuOption[],
  header?: boolean, // for old navbarMenu support, should be deprecated
  isValid: boolean,
  nameMarkdownPattern: string,
  name?: string, // TODO: remove
  markdownName?: string, // TODO: remove
  names?: string[],
  newTab: boolean,
  type?: string, // TODO: enum ['header', 'logout', 'menu', 'my_profile', 'url']
  url?: string
}

export interface MenuAcls {
  show: string[],
  enable: string[]
}

export interface NavbarBanner {
  dismissible: boolean,
  hide: boolean,
  html: string,
  key: string
}

/* ===== Private Functions and variables ===== */
let _path: string;

function _getPath(cc: any): string {
  if (!_path) {
    let path = '/chaise/';
    if (cc && typeof BUILD_VARIABLES === 'object' && typeof BUILD_VARIABLES.CHAISE_BASE_PATH === 'string') {
      path = BUILD_VARIABLES.CHAISE_BASE_PATH;
      // append "/" if not present
      if (path[path.length - 1] !== '/') path += '/';
    }

    _path = window.location.host + path;
  }

  return _path;
}

function _isValueDefined(val: any): boolean {
  return val !== undefined && val !== null;
}

/* ===== Exported Functions ===== */
export function isChaise(link: string, cc: any): boolean {
  if (!link) return false;

  const appNames = ['record', 'recordset', 'recordedit', 'login', 'help'];

  // parses the url into a location object
  const eleUrl = document.createElement('a');
  eleUrl.href = link;

  for (let i = 0; i < appNames.length; i++) {
    const name = appNames[i];
    // path/appName exists in our url
    if (eleUrl.href.indexOf(_getPath(cc) + name) !== -1) return true;
  }

  return false;
}

export function addLogParams(url: string, contextHeaderParams: ContextHeaderParams): string {
  // if `?` already in the url, use &
  const paramChar = url.lastIndexOf('?') !== -1 ? '&' : '?';

  let pcid = 'navbar';
  // if not navbar app, append appname
  if (contextHeaderParams.cid !== 'navbar') {
    pcid += `/${contextHeaderParams.cid}`;
  }
  // ppid should be the pid for the current page
  return `${url + paramChar}pcid=${pcid}&ppid=${contextHeaderParams.pid}`;
}

// option from configuration document before making it a MenuOption
// NOTE: change any when cc is typed
export function isOptionValid(option: any): boolean {
  // if no nameMarkdownPattern, we can't show anything
  if (!option.nameMarkdownPattern) return false;

  let isValid = true;
  switch (option.type) {
    case 'menu':
      // must have children to be considered a valid menu
      isValid = option.children && option.children.length > 0;
      break;
    case 'url':
      // accepts "urlPattern"
      isValid = !!option.url;
      break;
    case 'header':
    case 'logout':
    case 'my_profile':
      // ignore "children", "urlPattern"
      break;
    default:

      // if option has both children and url defined, prefer to use the children and ignore the url
      // if neither are defined, either the type is not supported or type was not defined
      if (option.children && option.children.length > 0) {
        option.type = 'menu';
      } else if (option.urlPattern || option.url) {
        option.type = 'url';
      } else if (option.header) {
        option.type = 'header';
      } else {
        isValid = false;
      }
      break;
  }

  return isValid;
}

export function createMenuList(menu: any, parentNewTab: boolean, parentAcls: MenuAcls, forceNewTab: boolean, catalogId: string): MenuOption[] {
  const recurseMenuOption = (menuOpt: any, newTab?: boolean, acls?: MenuAcls) => {
    const openNewTab = forceNewTab ? true : (menuOpt.newTab !== undefined ? menuOpt.newTab : newTab);
    const option: MenuOption = {
      acls: menuOpt.acls || acls,
      isValid: false,
      nameMarkdownPattern: menuOpt.nameMarkdownPattern || menuOpt.markdownPattern || menuOpt.name,
      newTab: openNewTab,
      type: menuOpt.type,
      ...menuOpt
    }

    if (Array.isArray(menuOpt.children)) {
      const childrenArr: MenuOption[] = [];
      // NOTE: any type until chaiseConfig is typed
      menuOpt.children.forEach((child: any) => {
        const childCopy = { ...child };
        if (child.newTab === undefined) childCopy.newTab = option.newTab;
        // if we have to open in newtab
        if (forceNewTab) childCopy.newTab = true;

        // get acls settings from the parent
        if (child.acls === undefined) {
          childCopy.acls = option.acls;
        } else {
          // acls could be defined with nothing in it, or with only show or only enable
          if (child.acls.show === undefined) childCopy.acls.show = option.acls.show;
          if (child.acls.enable === undefined) childCopy.acls.enable = option.acls.enable;
        }

        // TODO: names

        // set values and recurse
        childrenArr.push(recurseMenuOption(childCopy));
      });

      option.children = childrenArr;
    } else if ((menuOpt.urlPattern || menuOpt.url) && _isValueDefined(catalogId)) {
      let url = menuOpt.urlPattern || menuOpt.url;
      // template the url
      url = ConfigService.ERMrest.renderHandlebarsTemplate(url, null, { id: catalogId });

      // only append pcid/ppid if link is to a chaise url
      if (isChaise(url, ConfigService.chaiseConfig)) {
        url = addLogParams(url, ConfigService.contextHeaderParams);
      }

      option.url = url;
    }

    option.isValid = isOptionValid(option);

    return option;
  }

  const newMenu: MenuOption[] = []
  // NOTE: any type until chaiseConfig is typed
  menu.forEach((option: any) => {
    newMenu.push(recurseMenuOption(option, parentNewTab, parentAcls));
  });

  return newMenu;
}

// TODO: type the toggle event
export function onDropdownToggle(isOpen: boolean, event: any, action: string, menuObject?: MenuOption) {
  if (isOpen) {
    const actionObj: {
      action: string,
      names?: string[]
    } = { action: LogService.getActionString(action, '', '') }

    if (menuObject) actionObj.names = menuObject.names;
    LogService.logClientAction(actionObj);
  }

  if (event.originalEvent.persist) event.originalEvent.persist();
}

/**
 * Just to make sure browsers are not ignoring the ng-click, we are first
 * preventing the default behavior of link, then logging the client action
 * and then changing the location without waiting for the request,
 * This will ensure that we're at least sending the log to server.
 */
export function onLinkClick(event: MouseEvent<HTMLElement>, menuObject: MenuOption) {
  event.stopPropagation();

  // NOTE: if link goes to a chaise app, client logging is not necessary (we're using ppid, pcid instead)
  if (!isChaise(menuObject.url || '', ConfigService.chaiseConfig)) {
    // check if external or internal resource page
    const action = isSameOrigin(menuObject.url || '') ? LogActions.NAVBAR_MENU_INTERNAL : LogActions.NAVBAR_MENU_EXTERNAL;
    LogService.logClientAction({
      action: LogService.getActionString(action, '', ''),
      names: menuObject.names
    });
  }
}

export function menuItemClasses(option: MenuOption, checkHeader: boolean): string {
  let classes = '';
  if (!canEnable(option)) classes += 'disable-link ';
  if (checkHeader && option.header === true) classes += 'chaise-dropdown-header';
  return classes;
}

// make sure to use dangerouslySetInnerHTML when calling renderName
export function renderName(option: MenuOption): string {
  return ConfigService.ERMrest.renderMarkdown(ConfigService.ERMrest.renderHandlebarsTemplate(option.nameMarkdownPattern, null), { inline: true });
}

// option - navbar menu object form children array
export function canShow(option: MenuOption): boolean {
  return option.acls && AuthnService.isGroupIncluded(option.acls.show);
}

// option - navbar menu object form children array
// session - Session factory
export function canEnable(option: MenuOption): boolean {
  return option.acls && AuthnService.isGroupIncluded(option.acls.enable);
}

// NOTE: hard coded action
export function openProfileModal() {
  LogService.logClientAction({
    action: LogService.getActionString(LogActions.NAVBAR_PROFILE_OPEN, '', '')
  });
}

// NOTE: hard coded action
export function logout() {
 AuthnService.logout(LogActions.LOGOUT_NAVBAR);
}

