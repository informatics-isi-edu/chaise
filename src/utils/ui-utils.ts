/**
 * Utility functions related to dom manipulation
 */
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import Tooltip from 'bootstrap/js/dist/tooltip';

/**
 * @param   {Node=} parentContainer - the parent container. if undefined `body` will be used.
 * @param   {Node=} parentContainerSticky - the sticky area of parent. if undefined `.app-header-container` will be used.
 * @param   {boolean} useDocHeight - whether we should use the doc height even if parentContainer is passed.
 * Call this function once the DOM elements are loaded to attach resize sensors that will fix the height of bottom-panel-container
 * If you don't pass any parentContainer, it will use the body
 * It will assume the following structure in the given parentContainer:
 *  - .app-content-container
 *    - .top-panel-container
 *    - .bottom-panel-container
 * Three ResizeSensors will be created for app-content, top-panel and bottom-panel to watch their size change.
 *
 * TODO offsetHeight is a rounded integer, should we use getBoundingClientRect().height in this function instead?
 */
export function attachContainerHeightSensors(parentContainer?: any, parentContainerSticky?: any, useDocHeight?: boolean) {
  try {
    const appRootId = `#${ID_NAMES.APP_ROOT}`;

    // get the parentContainer and its usable height
    if (!parentContainer || parentContainer === document.querySelector(appRootId)) {
      useDocHeight = true;
      parentContainer = document.querySelector(appRootId);
    }

    // get the parent sticky
    if (parentContainerSticky == null) {
      parentContainerSticky = document.querySelector('.app-header-container');
    }

    let parentUsableHeight: number;
    // the container that we might set height for if container height is too small
    // the content that we should make scrollable if the content height is too small
    const appContent = parentContainer.querySelector('.app-content-container');

    // the container that we want to set the height for
    const container = appContent.querySelector('.bottom-panel-container');

    // the sticky part of the container (top-panel-container)
    const containerSticky = appContent.querySelector('.top-panel-container');

    // if the size of content is way too small, make the whole app-content-container scrollable
    const resetHeight = function () {
      appContent.style.overflowY = 'auto';
      appContent.style.height = ((parentUsableHeight / windowRef.innerHeight) * 100) + 'vh';
      container.style.height = 'unset';
      appContent.classList.add('app-content-container-scrollable');
    }

    let tm: any;
    // used to ensure we're not calling the setContainerHeightFn multiple times
    const setContainerHeight = function () {
      if (tm) clearTimeout(tm);

      tm = setTimeout(function () {
        setContainerHeightFn();
      }, 200);
    }

    // the actual function that will change the container height.
    const setContainerHeightFn = function () {
      parentUsableHeight = useDocHeight ? windowRef.innerHeight : parentContainer.offsetHeight;

      // subtract the parent sticky from usable height
      parentUsableHeight -= parentContainerSticky.offsetHeight;

      // the sticky part of the container
      let stickyHeight = 0;
      if (containerSticky) {
        stickyHeight = containerSticky.offsetHeight;
      }

      const containerHeight = ((parentUsableHeight - stickyHeight) / windowRef.innerHeight) * 100;
      if (containerHeight < 15) {
        resetHeight();
      } else {
        //remove the styles that might have been added to appContent
        appContent.style.overflowY = 'unset';
        appContent.style.height = 'unset';
        appContent.classList.remove('app-content-container-scrollable');

        // set the container's height
        container.style.height = containerHeight + 'vh';

        // now check based on actual pixel size
        if (container.offsetHeight < 300) {
          resetHeight();
        }
      }
    }


    // used to capture the old values of height
    let cache: any;

    // make sure the main-container has initial height
    setContainerHeightFn();
    cache = {
      appContentHeight: appContent.offsetHeight,
      parentContainerStickyHeight: parentContainerSticky.offsetHeight,
      containerStickyHeight: containerSticky.offsetHeight
    };

    //watch for the parent container height (this act as resize event)
    const appContentSensor = new ResizeSensor(appContent, function (dimension) {
      if (appContent.offsetHeight != cache.appContentHeight) {
        cache.appContentHeight = appContent.offsetHeight;
        setContainerHeight();
      }
    });

    // watch for size of the parent sticky section
    const parentContaienrStickySensor = new ResizeSensor(parentContainerSticky, function (dimension) {
      if (parentContainerSticky.offsetHeight != cache.parentContainerStickyHeight) {
        cache.parentContainerStickyHeight = parentContainerSticky.offsetHeight;
        setContainerHeight();
      }
    });

    // watch for size of the sticky section
    const containerStickySensor = new ResizeSensor(containerSticky, function (dimension) {
      if (containerSticky.offsetHeight != cache.containerStickyHeight) {
        cache.containerStickyHeight = containerSticky.offsetHeight;
        setContainerHeight();
      }
    });

    return [appContentSensor, parentContaienrStickySensor, containerStickySensor];

  } catch (err) {
    $log.warn(err);
    return [];
  }
}

/**
 * @param  {DOMElement} parentContainer - the container that we want the alignment for
 * @return {ResizeSensor} ResizeSensor object that can be used to turn it off.
 *
 * Make sure the `.top-right-panel` and `.main-container` are aligned.
 * They can be missaligned if the scrollbar is visible and takes space.
 */
export function attachMainContainerPaddingSensor(parentContainer?: HTMLElement) {
  const container = parentContainer ? parentContainer : document.querySelector(`#${ID_NAMES.APP_ROOT}`) as HTMLElement;
  const mainContainer = container.querySelector('.main-container') as HTMLElement;
  const topRightPanel = container.querySelector('.top-right-panel') as HTMLElement;
  let mainContainerPaddingTimeout: any;

  // timeout makes sure we're not calling this more than we should
  const setPadding = () => {
    if (mainContainerPaddingTimeout) clearTimeout(mainContainerPaddingTimeout);
    mainContainerPaddingTimeout = setTimeout(function () {
      try {
        const padding = mainContainer.clientWidth - topRightPanel.clientWidth;
        mainContainer.style.paddingRight = padding + 'px';
      } catch (exp) { }
    }, 10);
  }

  // watch the size of mainContainer
  // (if width of topRightPanel changes, the mainContainer changes too, so just watching mainContainer is enough)
  return new ResizeSensor(mainContainer, setPadding);
}

/**
 * Some of the tables can be very long and the horizontal scroll only sits at the very bottom by default
 * A fixed horizontal scroll is added here that sticks to the top as we scroll vertically and horizontally
 * @param {DOMElement} parent - the parent element
 * @param {boolean?} fixedPos - whether the scrollbar is fixed position or not (if so, we will attach extra rules)
 * @param {HTMLElement?} extraSensorTarget - if we want to trigger the logic based on changes to another element
 */
export function addTopHorizontalScroll(parent: HTMLElement, fixedPos = false, extraSensorTarget?: HTMLElement) {
  if (!parent) return;

  const topScrollElementWrapper = parent.querySelector<HTMLElement>('.chaise-table-top-scroll-wrapper'),
    topScrollElement = parent.querySelector<HTMLElement>('.chaise-table-top-scroll'),
    scrollableContent = parent.querySelector<HTMLElement>('.chaise-hr-scrollable');

  if (!topScrollElementWrapper || !topScrollElement || !scrollableContent) {
    return;
  }

  // these 2 flags help us prevent cascading scroll changes back and forth across the 2 elements
  let isSyncingTopScroll = false;
  let isSyncingTableScroll = false;
  // keep scrollLeft equal when scrolling from either the scrollbar or mouse/trackpad
  topScrollElementWrapper.addEventListener('scroll', function () {
    if (!isSyncingTopScroll) {
      isSyncingTableScroll = true;
      scrollableContent!.scrollLeft = topScrollElementWrapper!.scrollLeft;
    }
    isSyncingTopScroll = false;
  });

  scrollableContent.addEventListener('scroll', function () {
    if (!isSyncingTableScroll) {
      isSyncingTopScroll = true;
      topScrollElementWrapper!.scrollLeft = scrollableContent!.scrollLeft;
    }
    isSyncingTableScroll = false;
  });

  const setTopScrollStyles = () => {
    if (fixedPos) {
      topScrollElementWrapper!.style.width = `${scrollableContent.clientWidth}px`;
      topScrollElementWrapper!.style.marginTop = '-15px';
    }

    // there is no need of a scrollbar, content is not overflowing
    if (scrollableContent!.scrollWidth == scrollableContent!.clientWidth) {
      topScrollElement!.style.width = '0';
      topScrollElementWrapper!.style.height = '0';
    }
    else {
      topScrollElementWrapper!.style.height = '15px';
      topScrollElement!.style.width = scrollableContent!.scrollWidth + 'px';
    }
  }

  const sensors = [];

  // make sure that the length of the scroll is identical to the scroll at the bottom of the table
  sensors.push(new ResizeSensor(scrollableContent, setTopScrollStyles));

  if (extraSensorTarget) {
    sensors.push(new ResizeSensor(extraSensorTarget, setTopScrollStyles));
  }

  // make top scroll visible after adding the handlers to ensure its visible only when working
  topScrollElementWrapper.style.display = 'block';
  // show only if content is overflowing
  if (scrollableContent.scrollWidth == scrollableContent.clientWidth) {
    topScrollElementWrapper.style.height = '15px';
  }

  return sensors;
}

/**
 * add the given text to clipboard
 * @param text the text that should be copied to clipboard
 */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    navigator.clipboard.writeText(text).then(() => {
      resolve();
    }).catch((err) => {
      reject(err);
    });
  });

}

/**
 *
 * @param callback function that needs to be invoked after the delay
 * @param timeout delay
 * @returns debounced function
 */
export function debounce(callback: Function, timeout: number) {
  let timer: any = null;

  return function (...args: any[]) {

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      // @ts-ignore:
      callback.apply(this, args);
    }, timeout);
  }
}

/**
 * create a timeout that can be used in async/await fns
 * @param ms how long we should wait
 */
export function asyncTimeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * This function is used for firing custom events
 * @param {string} eventName - the event name
 * @param {string|Element} targetElement - a DOM element from which the event will propogate
 * @param {object} detail - a custom object for passing data with the event
 * @param {boolean} bubbles - whether the event should be propagated upward to the parent element
 * @param {boolean} cancelable - whether the event can be canceled using event.preventDefault
 * @param {boolean} composed - whether the event will propagate across the shadow DOM boundary into the standard DOM
 */
export function fireCustomEvent(eventName = 'myEvent', targetElement: string | Element = 'body', detail = {},
  bubbles = true, cancelable = true, composed = false) {
  const customEvent = new CustomEvent(eventName, { detail, bubbles, cancelable, composed });

  if (targetElement === 'body') {
    document.querySelector('body')?.dispatchEvent(customEvent);
  } else if (typeof targetElement === 'string') {
    document.body.querySelector(targetElement)?.dispatchEvent(customEvent);
  } else {
    targetElement.dispatchEvent(customEvent);
  }

}

/**
 * This function is used to covnvert values in vw units to px units
 * @param {number} value - the dimension value in vw units
 * @returns {number} the dimension value in px units
 */
export function convertVWToPixel(value: number) {
  const e = document.documentElement;
  const g = document.getElementsByTagName('body')[0];
  const x = windowRef.innerWidth || e.clientWidth || g.clientWidth;

  const result = (x * value) / 100;
  return result;
}

/**
 * mimic the same behavior as clicking on a link and opening it in a new tab
 * @param href the link
 * @param isDownload whether we should add the download attribute
 */
export function clickHref(href: string, isDownload?: boolean) {
  // fetch the file for the user
  const dummyLink = document.createElement('a');
  dummyLink.setAttribute('href', href);
  if (isDownload) dummyLink.setAttribute('download', '');
  dummyLink.setAttribute('visibility', 'hidden');
  dummyLink.setAttribute('display', 'none');
  dummyLink.setAttribute('target', '_blank');
  // Append to page
  document.body.appendChild(dummyLink);
  dummyLink.click();
  document.body.removeChild(dummyLink);
}

/**
 * wait for an element to load
 * NOTE: this might have some affects on the element, so use it with caution.
 *
 * based on https://stackoverflow.com/a/61511955/1662057
 * @param selector the selector of the element
 */
export function waitForElementToLoad(selector: string) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body ? document.body : document, {
      childList: true,
      subtree: true
    });
  });
}

/**
 * see if there's a data-chaise-tooltip in the chidren of the given element, and turn them into proper tooltips.
 *
 * NOTE:
 * I'm using bootstrap.js for this feature. this has added around 30KB to our bundles. I couldn't find a way to do this
 * directly with react-bootstrap. but there might be a way and we should investigate later
 */
export function createChaiseTooltips(container: Element) {
  const tooltipTriggerList = container.querySelectorAll('[data-chaise-tooltip]');
  if (tooltipTriggerList && tooltipTriggerList.length > 0) {
    tooltipTriggerList.forEach((el) => {
      const title = el.getAttribute('data-chaise-tooltip');
      const placement = el.getAttribute('data-chaise-tooltip-placement') || 'bottom';
      const noIcon = el.hasAttribute('data-chaise-tooltip-no-icon');
      if (!title) return;
      if (!noIcon) {
        // adding space between content and the icon is how we're making sure spacing between the two is correct.
        // should we come up with a better solution instead?
        el.innerHTML = el.innerHTML + ' ';
        el.classList.add('chaise-icon-for-tooltip');
      }
      new Tooltip(el, {
        title,
        // @ts-ignore ts doesn't understand that we're actually sanitizing the value.
        placement: ['auto', 'top', 'bottom', 'left', 'right'].indexOf(placement) !== -1 ? placement : 'bottom'
      })
    });
  }
}

/**
 * trigger form submission. should only be used when we don't have access to the handleSubmit function.
 * for example in viewer annotation form, we're calling this from viewer provider which is outside of recordedit component.
 * borrowed from here: https://github.com/react-hook-form/react-hook-form/issues/566#issuecomment-730077495
 */
export function manuallyTriggerFormSubmit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

/**
 * given an object, stringify it and prompt a download
 */
export function saveObjectAsJSONFile(obj: any, filename: string) {
  const str = JSON.stringify(obj, null, '  ');

  const blob = new Blob([str], { type: 'text/json' });
  const link = document.createElement('a');

  link.download = filename;
  link.href = window.URL.createObjectURL(blob);
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

  const evt = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  link.dispatchEvent(evt);
  link.remove()
}
