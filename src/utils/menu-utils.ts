// constants
import { BUILD_VARIABLES } from '@chaise/utils/constants';
import { LogActions } from '@chaise/models/log';

// services
import AuthnService from '@chaise/services/authn';
import { ConfigService } from '@chaise/services/config';
import { LogService } from '@chaise/services/log';

// utilities
import { isSameOrigin } from '@chaise/utils/uri-utils';

export default class MenuUtils {
  //   /* ===== Private Functions and variables ===== */
  static _path: string;

  // TODO: fix param types
  private static _getPath = (dcctx: any): string => {
    if (!MenuUtils._path) {
      let path = '/chaise/';
      if (dcctx && typeof BUILD_VARIABLES === 'object' && typeof BUILD_VARIABLES.CHAISE_BASE_PATH === 'string') {
        path = BUILD_VARIABLES.CHAISE_BASE_PATH;
        // append "/" if not present
        if (path[path.length - 1] !== '/') path += '/';
      }

      MenuUtils._path = window.location.host + path;
    }

    return MenuUtils._path;
  };

  /* Function to calculate the left of the toggleSubMenu */
  // TODO: fix param types (HTMLElement)
  private static _getOffsetValue = (element: any) => {
    let offsetLeft = 0;
    let tempEl = element;
    while (tempEl) {
      offsetLeft += tempEl.offsetLeft;
      tempEl = tempEl.offsetParent;
    }
    return offsetLeft;
  };

  // TODO: fix param types
  private static _getNextSibling = (elem: Element, selector: any) => {
    let sibling: any = elem.nextElementSibling;
    if (!selector) return sibling;
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.nextElementSibling;
    }
    return null;
  };

  // Function to open the menu on the left if not enough space on right
  private static _checkWidth = (ele: HTMLElement, winWidth: number) => {
    // we're intentionally reassigning the param, so make sure eslinst allows it
    /* eslint no-param-reassign: 0 */

    // revert to defaults
    ele.classList.remove('dropdown-menu-right');
    ele.style.width = 'max-content';

    // If dropdown is spilling over
    if (Math.round(ele.getBoundingClientRect().right) < winWidth) {
      ele.style.width = 'max-content';
    } else {
      const visibleContent = winWidth - ele.getBoundingClientRect().left;
      // hard-coded limit of width for opening on the left hand side
      if (Math.round(visibleContent) < 200) {
        ele.classList.add('dropdown-menu-right');
      } else {
        ele.style.width = `${visibleContent}px`;
      }
    }
  };

  /* ===== Public Functions attached to return object ===== */

  // ele - dropdown ul element
  static checkHeight = (ele: HTMLElement, winHeight: number) => {
    // no dropdown is open
    if (!ele) return;

    const dropdownHeight = ele.offsetHeight;
    const fromTop = ele.offsetTop;
    const footerBuffer = 50;

    if ((dropdownHeight + fromTop) > winHeight) {
      const newHeight = winHeight - fromTop - footerBuffer;
      ele.style.height = `${newHeight}px`;
    }
  };

  static isChaise = (link: string, dcctx: any) => {
    if (!link) return false;

    const appNames = ['record', 'recordset', 'recordedit', 'login', 'help'];

    // parses the url into a location object
    const eleUrl = document.createElement('a');
    eleUrl.href = link;

    for (let i = 0; i < appNames.length; i++) {
      const name = appNames[i];
      // path/appName exists in our url
      if (eleUrl.href.indexOf(MenuUtils._getPath(dcctx) + name) !== -1) return true;
    }

    return false;
  };

  static addLogParams = (url: string, contextHeaderParams: any) => {
    // if `?` already in the url, use &
    const paramChar = url.lastIndexOf('?') !== -1 ? '&' : '?';

    let pcid = 'navbar';
    // if not navbar app, append appname
    if (contextHeaderParams.cid !== 'navbar') {
      pcid += `/${contextHeaderParams.cid}`;
    }
    // ppid should be the pid for the current page
    return `${url + paramChar}pcid=${pcid}&ppid=${contextHeaderParams.pid}`;
  };

  static resetHeight = (event: any) => {
    const menuTarget = MenuUtils._getNextSibling(event.target, '.dropdown-menu');
    if (menuTarget) menuTarget.style.height = 'unset';
    return '';
  };

  static isOptionValid = (option: any) => {
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
        } else if (option.url) {
          option.type = 'url';
        } else {
          isValid = false;
        }
        break;
    }

    return isValid;
  };

  static onDropdownToggle = (isOpen: boolean, event: any, menuObject: any | null, action: string) => {
    if (isOpen) {
      let actionObj: any = { action: LogService.getActionString(action, '', '') }

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
  static onLinkClick = (event: any, menuObject: any) => {
    event.stopPropagation();

    // NOTE: if link goes to a chaise app, client logging is not necessary (we're using ppid, pcid instead)
    if (!MenuUtils.isChaise(menuObject.url, ConfigService.chaiseConfig)) {
      // check if external or internal resource page
      let action = isSameOrigin(menuObject.url) ? LogActions.NAVBAR_MENU_INTERNAL : LogActions.NAVBAR_MENU_EXTERNAL;
      LogService.logClientAction({
          action: LogService.getActionString(action, '', ''),
          names: menuObject.names
      });
    }
  };

  static menuItemClasses = (option: any, checkHeader: boolean): string => {
    let classes = '';
    if (!MenuUtils.canEnable(option)) classes += 'disable-link ';
    if (checkHeader && option.header === true) classes += 'chaise-dropdown-header';
    return classes;
  };

  // make sure to use dangerouslySetInnerHTML when calling renderName
  static renderName = (option: any) => {
    // new syntax will always use nameMarkdownPattern
    if (option.nameMarkdownPattern) {
      return ConfigService.ERMrest.renderMarkdown(ConfigService.ERMrest.renderHandlebarsTemplate(option.nameMarkdownPattern, null), { inline: true });
    }

    // support markdownName backwards compatibility for navbarMenu
    if (option.markdownName) {
      return ConfigService.ERMrest.renderMarkdown(option.markdownName, { inline: true });
    }

    // support name backwards compatibility for navbarMenu
    return option.name;
  };

  // item - navbar menu object form children array
  // session - Session factory
  static canShow = (option: any) => option.acls && AuthnService.isGroupIncluded(option.acls.show);

  // item - navbar menu object form children array
  // session - Session factory
  static canEnable = (option: any) => option.acls && AuthnService.isGroupIncluded(option.acls.enable);

  // NOTE: hard coded action
  static openProfileModal = () => {
    LogService.logClientAction({
      action: LogService.getActionString(LogActions.NAVBAR_PROFILE_OPEN, '', '')
    });
  };

  // NOTE: hard coded action
  static logout = () => {
    AuthnService.logout(LogActions.LOGOUT_NAVBAR);
  };
}
