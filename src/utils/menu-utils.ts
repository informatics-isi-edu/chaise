// constants
import { BUILD_VARIABLES } from '@chaise/utils/constants';
import { LogActions } from '@chaise/models/log';

// services
import AuthnService from '@chaise/services/authn';
import { ConfigService } from '@chaise/services/config';
import { LogService } from '@chaise/services/log';

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

  /**
   * It will toggle the dropdown submenu that this event is based on. If we're going to open it,
   * it will close all the other dropdowns and also will return `true`.
   * @return{boolean} if true, it means that we opened the menu
   */
  //
  static toggleMenu = ($event: any) => {
    $event.stopPropagation();
    $event.preventDefault();

    let { target } = $event;
    // added markdownName support allows for inline template to be defined like :span:TEXT:/span:{.class-name}
    if ($event.target.localName !== 'a') {
      target = $event.target.parentElement;
    }

    const menuTarget = MenuUtils._getNextSibling(target, '.dropdown-menu'); // dropdown submenu <ul>
    menuTarget.style.width = 'max-content';
    const immediateParent = target.offsetParent; // parent, <li>
    const parent = immediateParent.offsetParent; // parent's parent, dropdown menu <ul>
    const posValues = MenuUtils._getOffsetValue(immediateParent);

    // calculate the position the submenu should open from the top fo the viewport
    menuTarget.style.top = `${parseInt(immediateParent.getBoundingClientRect().y, 10) + 5}px`;

    menuTarget.style.left = `${parseInt(posValues + immediateParent.offsetWidth, 10)}px`;

    const open = !menuTarget.classList.contains('show');

    // if we're opening this, close all the other dropdowns on navbar.
    if (open) {
      target.closest('.dropdown-menu').querySelectorAll('.show').forEach((el: any) => {
        el.parentElement.classList.remove('child-opened');
        el.classList.remove('show');
      });
    }

    menuTarget.classList.toggle('show'); // toggle the class
    menuTarget.style.height = 'unset'; // remove height in case it was set for a different position
    immediateParent.classList.toggle('child-opened'); // used for setting highlight color

    if (open) {
      // recalculate the height for each open submenu, <ul>
      const openSubmenus = document.querySelectorAll('.dropdown-menu.show');
      [].forEach.call(openSubmenus, (el) => {
        MenuUtils.checkHeight(el, window.innerHeight);
      });
    }

    // If not enough space to expand on right
    const widthOfSubMenu = menuTarget.offsetWidth;
    const submenuEndOnRight = (posValues + immediateParent.offsetWidth + widthOfSubMenu);

    if (submenuEndOnRight > window.innerWidth) {
      const submenuEndOnLeft = posValues + immediateParent.offsetWidth;
      const visibleContent = window.innerWidth - submenuEndOnLeft;

      if (visibleContent < 200) {
        menuTarget.style.left = `${parseInt(`${posValues - widthOfSubMenu}`, 10) + 4}px`;
      } else {
        menuTarget.style.width = `${visibleContent}px`;
      }

    // if vertical scrollbar then offset a bit more to make scrollbar visible
    } else if (parent.scrollHeight > parent.clientHeight) {
      menuTarget.style.left = `${parseInt(posValues + immediateParent.offsetWidth, 10) + 15}px`;
    }

    return open;
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

  // triggered when top level menu is opened/closed
  static onToggle = (open: boolean) => {
    const elems = document.querySelectorAll('.dropdown-menu.show');
    [].forEach.call(elems, (el: any) => {
      el.classList.remove('show');
    });

    // whenever a dropdown menu is closed, remove the child-opened class that adds highlight color
    const highlightedParents = document.querySelectorAll('.dropdown-submenu.child-opened');
    [].forEach.call(highlightedParents, (el: any) => {
      el.classList.remove('child-opened');
    });

    // calculate height for each open dropdown menu
    if (open) {
      const openDropdowns = document.querySelectorAll('.dropdown.open ul');
      [].forEach.call(openDropdowns, (el) => {
        MenuUtils.checkHeight(el, window.innerHeight);
        MenuUtils._checkWidth(el, window.innerWidth);
      });
    }
  };

  /**
   * Just to make sure browsers are not ignoring the ng-click, we are first
   * preventing the default behavior of link, then logging the client action
   * and then changing the location without waiting for the request,
   * This will ensure that we're at least sending the log to server.
   */
  static onLinkClick = () => function ($event: any, menuObject: any) {
    $event.stopPropagation();

    // NOTE: if link goes to a chaise app, client logging is not necessary (we're using ppid, pcid instead)
    if (!MenuUtils.isChaise(menuObject.url, ConfigService.chaiseConfig)) {
      // check if external or internal resource page

      // TODO: logging
      // var action = isSameOrigin(menuObject.url) ? logService.logActions.NAVBAR_MENU_INTERNAL : logService.logActions.NAVBAR_MENU_EXTERNAL;
      // logService.logClientAction({
      //     action: logService.getActionString(action, "", ""),
      //     names: menuObject.names
      // });

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
  // TODO: implement modal popup for profile view
  static openProfileModal = () => {
    console.log('open profile modal');
    LogService.logClientAction({
      action: LogActions.NAVBAR_PROFILE_OPEN
    });

    // TODO: attach modal somewhere (or show it?)


    // modalUtils.showModal({
    //   templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/profile.modal.html",
    //   controller: "profileModalDialogController",
    //   controllerAs: "ctrl",
    //   windowClass: "profile-popup"
    // }, false, false, false);
  };

  // NOTE: hard coded action
  static logout = () => {
    AuthnService.logout(LogActions.LOGOUT_NAVBAR);
  };
}
