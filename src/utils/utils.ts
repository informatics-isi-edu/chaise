import { BUILD_VARIABLES } from "@chaise/utils/constants";
import { ConfigService } from '@chaise/services/config';
import AuthnService from "@chaise/services/authn";
import { isSameOrigin } from "@chaise/legacy/src/utils/uri-utils";

export class UriUtils {
  static fixedEncodeURIComponent = (str: string) => {
    return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }

  static queryStringToJSON = (queryString: string) => {
    queryString = queryString || window.location.search;
    if (queryString.indexOf('?') > -1) {
      queryString = queryString.split('?')[1];
    }
    var pairs = queryString.split('&');
    var result = {} as any;
    pairs.forEach(function (pair) {
      var pairList = pair.split('=');
      result[pairList[0]] = decodeURIComponent(pairList[1] || '');
    });
    return result;
  }

  static splitVersionFromCatalog = (id: string) => {
    var split = id.split('@');

    return {
      catalog: split[0],
      version: split[1]
    }
  }
}

export class TypeUtils {

  /**
   * Return true if the input is string, otherwise false.
   * @param inp
   * @returns
   */
  static isStringAndNotEmpty = (inp: any) => {
    return typeof inp === "string" && inp.length > 0;
  }
}

export class MathUtils {
  static getRandomInt = (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Generates a unique uuid
   * @returns {String} a string of length 24
   */
  static uuid = (): string => {
    const s4 = MathUtils.uuidS4;
    return s4() + s4() + s4() + s4() + s4() + s4();
  }

  /**
   * @returns a random string of a deterministic length of 4
   * @private
   */
  private static uuidS4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(36);
  }
}

export class MenuUtils {
  //   /* ===== Private Functions and variables ===== */
  static _path: string;
  // TODO: fix param types
  private static _getPath = (dcctx: any): string => {
    if (!MenuUtils._path) {
      var path = "/chaise/";
      if (dcctx && typeof BUILD_VARIABLES === "object" && typeof BUILD_VARIABLES.CHAISE_BASE_PATH === "string") {
        var path: string = BUILD_VARIABLES.CHAISE_BASE_PATH;
        // append "/" if not present
        if (path[path.length - 1] !== "/") path += "/";
      }

      MenuUtils._path = window.location.host + path;
    }

    return MenuUtils._path;
  }

  /* Function to calculate the left of the toggleSubMenu*/
  // TODO: fix param types (HTMLElement)
  private static _getOffsetValue = (element: any) => {
    var offsetLeft = 0
    while (element) {
      offsetLeft += element.offsetLeft;
      element = element.offsetParent;
    }
    return offsetLeft;
  }

  // TODO: fix param types
  private static _getNextSibling = (elem: Element, selector: any) => {
    var sibling: any = elem.nextElementSibling;
    if (!selector) return sibling;
    while (sibling) {
      if (sibling.matches(selector)) return sibling;
      sibling = sibling.nextElementSibling;
    }
  }

  // Function to open the menu on the left if not enough space on right
  private static _checkWidth = (ele: HTMLElement, winWidth: number) => {
    //revert to defaults
    ele.classList.remove("dropdown-menu-right");
    ele.style.width = "max-content";

    // If dropdown is spilling over
    if (Math.round(ele.getBoundingClientRect().right) < winWidth) {
      ele.style.width = "max-content";
    } else {
      var visibleContent = winWidth - ele.getBoundingClientRect().left;
      //hard-coded limit of width for opening on the left hand side
      if (Math.round(visibleContent) < 200) {
        ele.classList.add("dropdown-menu-right");
      }
      else {
        ele.style.width = visibleContent + "px";
      }
    }
  }

  /* ===== Public Functions attached to return object ===== */

  // ele - dropdown ul element
  static checkHeight = (ele: HTMLElement, winHeight: number) => {
    // no dropdown is open
    if (!ele) return;

    var dropdownHeight = ele.offsetHeight;
    var fromTop = ele.offsetTop;
    var footerBuffer = 50;

    if ((dropdownHeight + fromTop) > winHeight) {
      var newHeight = winHeight - fromTop - footerBuffer;
      ele.style.height = newHeight + "px";
    }
  }

  /**
   * It will toggle the dropdown submenu that this event is based on. If we're going to open it,
   * it will close all the other dropdowns and also will return `true`.
   * @return{boolean} if true, it means that we opened the menu
   */
  //
  static toggleMenu = ($event: any) => {
    $event.stopPropagation();
    $event.preventDefault();

    var target = $event.target;
    // added markdownName support allows for inline template to be defined like :span:TEXT:/span:{.class-name}
    if ($event.target.localName != "a") {
      target = $event.target.parentElement;
    }

    var menuTarget = MenuUtils._getNextSibling(target, ".dropdown-menu"); // dropdown submenu <ul>
    menuTarget.style.width = "max-content";
    var immediateParent = target.offsetParent; // parent, <li>
    var parent = immediateParent.offsetParent; // parent's parent, dropdown menu <ul>
    var posValues = MenuUtils._getOffsetValue(immediateParent);

    // calculate the position the submenu should open from the top fo the viewport
    menuTarget.style.top = parseInt(immediateParent.getBoundingClientRect().y) + 5 + 'px';

    menuTarget.style.left = parseInt(posValues + immediateParent.offsetWidth) + 'px';

    var open = !menuTarget.classList.contains("show");

    // if we're opening this, close all the other dropdowns on navbar.
    if (open) {
      target.closest(".dropdown-menu").querySelectorAll('.show').forEach(function (el: any) {
        el.parentElement.classList.remove("child-opened");
        el.classList.remove("show");
      });
    }

    menuTarget.classList.toggle("show"); // toggle the class
    menuTarget.style.height = "unset"; // remove height in case it was set for a different position
    immediateParent.classList.toggle("child-opened"); // used for setting highlight color

    if (open) {
      // recalculate the height for each open submenu, <ul>
      var openSubmenus = document.querySelectorAll(".dropdown-menu.show");
      [].forEach.call(openSubmenus, function (el) {
        MenuUtils.checkHeight(el, window.innerHeight);
      });
    }

    // If not enough space to expand on right
    var widthOfSubMenu = menuTarget.offsetWidth;
    var submenuEndOnRight = (posValues + immediateParent.offsetWidth + widthOfSubMenu);

    if (submenuEndOnRight > window.innerWidth) {
      var submenuEndOnLeft = posValues + immediateParent.offsetWidth;
      var visibleContent = window.innerWidth - submenuEndOnLeft;

      if (visibleContent < 200) {
        menuTarget.style.left = parseInt(posValues - widthOfSubMenu + "") + 4 + 'px';
      }
      else {
        menuTarget.style.width = visibleContent + "px";
      }
    }
    else {
      // if vertical scrollbar then offset a bit more to make scrollbar visible
      if (parent.scrollHeight > parent.clientHeight) {
        menuTarget.style.left = parseInt(posValues + immediateParent.offsetWidth) + 15 + 'px';
      }
    }

    return open;
  }

  static isChaise = (link: string, dcctx: any) => {
    if (!link) return false;

    var appNames = ["record", "recordset", "recordedit", "login", "help"];

    // parses the url into a location object
    var eleUrl = document.createElement('a');
    eleUrl.href = link;

    for (var i = 0; i < appNames.length; i++) {
      var name = appNames[i];
      // path/appName exists in our url
      if (eleUrl.href.indexOf(MenuUtils._getPath(dcctx) + name) !== -1) return true;
    }

    return false;
  }

  static addLogParams = (url: string, contextHeaderParams: any) => {
    // if `?` already in the url, use &
    var paramChar = url.lastIndexOf("?") !== -1 ? "&" : "?";

    var pcid = "navbar";
    // if not navbar app, append appname
    if (contextHeaderParams.cid !== "navbar") {
      pcid += "/" + contextHeaderParams.cid;
    }
    // ppid should be the pid for the current page
    return url + paramChar + "pcid=" + pcid + "&ppid=" + contextHeaderParams.pid;
  }

  static resetHeight = (event: any) => {
    var menuTarget = MenuUtils._getNextSibling(event.target, ".dropdown-menu");
    if (menuTarget) menuTarget.style.height = "unset";
    return "";
  }

  static isOptionValid = (option: any) => {
    // if no nameMarkdownPattern, we can't show anything
    if (!option.nameMarkdownPattern) return false;

    var isValid = true;
    switch (option.type) {
      case "menu":
        // must have children to be considered a valid menu
        isValid = option.children && option.children.length > 0;
        break;
      case "url":
        // accepts "urlPattern"
        isValid = option.url ? true : false;
        break;
      case "header":
      case "logout":
      case "my_profile":
        // ignore "children", "urlPattern"
        break;
      default:
        // if option has both children and url defined, prefer to use the children and ignore the url
        // if neither are defined, either the type is not supported or type was not defined
        if (option.children && option.children.length > 0) {
          option.type = "menu"
        } else if (option.url) {
          option.type = "url";
        } else {
          isValid = false;
        }
        break;
    }

    return isValid;
  }

  // triggered when top level menu is opened/closed
  static onToggle = (open: boolean) => {
    var elems = document.querySelectorAll(".dropdown-menu.show");
    [].forEach.call(elems, function (el: any) {
      el.classList.remove("show");
    });

    // whenever a dropdown menu is closed, remove the child-opened class that adds highlight color
    var highlightedParents = document.querySelectorAll(".dropdown-submenu.child-opened");
    [].forEach.call(highlightedParents, function (el: any) {
      el.classList.remove("child-opened");
    });

    // calculate height for each open dropdown menu
    if (open) {
      var openDropdowns = document.querySelectorAll(".dropdown.open ul");
      [].forEach.call(openDropdowns, function (el) {
        MenuUtils.checkHeight(el, window.innerHeight);
        MenuUtils._checkWidth(el, window.innerWidth);
      });
    }
  }

  /**
   * Just to make sure browsers are not ignoring the ng-click, we are first
   * preventing the default behavior of link, then logging the client action
   * and then changing the location without waiting for the request,
   * This will ensure that we're at least sending the log to server.
   */
  static onLinkClick = () => {
    return function ($event: any, menuObject: any) {
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
        return;
      }
    };
  }

  static menuItemClasses = (option: any, checkHeader: boolean): string => {
    var classes = "";
    if (!MenuUtils.canEnable(option)) classes += 'disable-link ';
    if (checkHeader && option.header === true) classes += 'chaise-dropdown-header';
    return classes;
  }

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
  }

  // item - navbar menu object form children array
  // session - Session factory
  static canShow = (option: any) => {
    return option.acls && AuthnService.isGroupIncluded(option.acls.show);
  }

  // item - navbar menu object form children array
  // session - Session factory
  static canEnable = (option: any) => {
    return option.acls && AuthnService.isGroupIncluded(option.acls.enable);
  }

  // NOTE: hard coded action
  // TODO: implement modal popup for profile view
  static openProfileModal = () => {
    console.log("open profile modal")
    // logService.logClientAction({
    //   action: logService.logActions.NAVBAR_PROFILE_OPEN
    // });

    // modalUtils.showModal({
    //   templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/profile.modal.html",
    //   controller: "profileModalDialogController",
    //   controllerAs: "ctrl",
    //   windowClass: "profile-popup"
    // }, false, false, false);
  }

  // NOTE: hard coded action
  static logout = () => {
    console.log("logout")
    // AuthnService.logout(logService.logActions.LOGOUT_NAVBAR);
    // AuthnService.logout("");
  }
}
