import React from 'react'

import { ConfigService } from '@chaise/services/config';
import { MenuUtils } from '@chaise/utils/utils';
import { windowRef } from "@chaise/utils/window-ref";
import { getCatalogId } from "@chaise/legacy/src/utils/uri-utils";

import Login from '@chaise/components/login';

const Navbar = (): JSX.Element => {
  var cc = ConfigService.chaiseConfig;
  var settings = ConfigService.appSettings;

  var root = cc.navbarMenu || {};
  var catalogId = getCatalogId();

  let ERMrest = ConfigService.ERMrest;

  function isValueDefined(val: any) {
    return val != undefined && val != null;
  }

  // if in iframe and we want to force links to open in new tab,
  var forceNewTab = settings.openLinksInTab === true;

  // Set default newTab property at root node
  if (!root.hasOwnProperty('newTab') || forceNewTab) {
    root.newTab = true;
  }

  // Set default ACLs property at root node
  if (!root.hasOwnProperty('acls')) {
    root.acls = {
      "show": ["*"],
      "enable": ["*"]
    };
  }

  var q = [root];
  while (q.length > 0) {
    var obj = q.shift();
    var parentNewTab = obj.newTab;
    var parentAcls = obj.acls;
    var parentNames = obj.names;
    // template the url
    // TODO: This is done here to prevent writing a recursive function (again) in `setConfigJSON()`
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
      obj.children.forEach(function (child: any) {
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

  // relies on navbarMenu processing to finish, setting this updates the DOM
  const menu = cc.navbarMenu ? cc.navbarMenu.children : [];
  console.log(menu);

  const brandHref = () => {
    return cc.navbarBrandUrl || "/";
  }

  const renderBrandImage = () => {
    if (!cc.navbarBrandImage) return;

    return (<span>
      <img id="brand-image" src={cc.navbarBrandImage}></img>
    </span>)
  }

  const renderBrandingHTML = () => {
    return (<>
      {renderBrandImage()}
      <span id="brand-text">{cc.navbarBrandText}</span>
    </>)
  }

  const renderDropdownName = (item: any) => {
    if (!MenuUtils.canEnable(item)) return;

    return(<a className="dropdown-toggle" onClick={MenuUtils.resetHeight}>
      <span dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(item) }}></span>
    </a>)
  }

  // TODO: onClick logging
  const renderMenuItem = (item: any) => {
    if (!item.children || !MenuUtils.canEnable(item)) {
      return (<a href={item.url} target={item.newTab ? '_blank' : '_self'} className={!MenuUtils.canEnable(item) ? 'disable-link' : ''} dangerouslySetInnerHTML={{ __html: MenuUtils.renderName(item) }}></a>)
    }

    if (item.children) {
      return (<>
        {renderDropdownName(item)}
        {/* <NavbarMenu></NavbarMenu> */}
      </>)
    }
    return (<></>)
  }

  const renderNavbarMenu = () => {
    return menu.map((item: any, index: number) => {
      if (!MenuUtils.canShow(item)) return

      // TODO: onToggle
      return (<li key={index} className="dropdown">
        {renderMenuItem(item)}
      </li>)
      // <li className="dropdown" on-toggle="onToggle(open, item)" ng-if="canShow(item)" uib-dropdown>
      //   <a ng-if="!item.children || !canEnable(item)" ng-href="{{item.url}}" target="{{item.newTab ? '_blank' : '_self'}}" ng-class="{'disable-link': !canEnable(item)}" ng-click="::onLinkClick($event, item)" ng-bind-html="renderName(item)"></a>
      //   <a ng-if="item.children && canEnable(item)" class="dropdown-toggle" uib-dropdown-toggle ng-click="::resetHeight($event)"><span ng-bind-html="renderName(item)"></span> <span class="caret"></span></a>
      //   <ul ng-if="item.children" navbar-menu menu="item.children" class="dropdown-menu"></ul>
      // </li>
    });
  }

  // TODO: add banner above <nav>
  // TODO: navbar toggle button when it shrinks
  // TODO: log branding
  return (<header id="navheader" className="row">
    <nav id="mainnav" className="navbar navbar-inverse" role="navigation">
      <div className="navbar-header">
        <a className="navbar-brand" href={(brandHref())}>{renderBrandingHTML()}</a>
      </div>
      <div className="navbar-collapse navbar-inverse" id="fb-navbar-main-collapse">
        <ul id="navbar-menu" className="nav navbar-nav">
          {renderNavbarMenu()}
        </ul>
        <Login />
      </div>
    </nav>
  </header>)

}

export default Navbar;
