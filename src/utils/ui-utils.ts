/**
 * Utility functions related to dom manipulation
 */
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';

/**
 * @param   {Node=} parentContainer - the parent container. if undefined `body` will be used.
 * @param   {Node=} parentContainerSticky - the sticky area of parent. if undefined `#navheader` will be used.
 * @param   {boolean} useDocHeight - whether we should use the doc height even if parentContainer is passed.
 * Call this function once the DOM elements are loaded to attach resize sensors that will fix the height of bottom-panel-container
 * If you don't pass any parentContainer, it will use the body
 * It will assume the following structure in the given parentContainer:
 *  - .app-content-container
 *    - .top-panel-container
 *    - .bottom-panel-container
 * Three ResizeSensors will be created for app-content, top-panel and bottom-panel to watch their size change.
 */
export function attachContainerHeightSensors(parentContainer?: any, parentContainerSticky?: any, useDocHeight?: boolean) {
  try {
    const appRootId = `#${APP_ROOT_ID_NAME}`;

    // get the parentContainer and its usable height
    if (!parentContainer || parentContainer === document.querySelector(appRootId)) {
      useDocHeight = true;
      parentContainer = document.querySelector(appRootId);
    }

    // get the parent sticky
    if (parentContainerSticky == null) {
      parentContainerSticky = document.querySelector('#navheader');
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
  }
}

/**
 * sets the style of domElements.footer
 * @param {number?} index - index pertaining to which dom element to select
 * @return {ResizeSensor} ResizeSensor object that can be used to turn it off.
 **/
export function attachFooterResizeSensor(index?: number) {
  try {
    const usedIndex = typeof index === 'number' ? index : 0;
    const mainContainer = document.querySelectorAll('.main-container')[usedIndex] as HTMLElement;
    if (!mainContainer) return;

    const mainBody = mainContainer.querySelector<HTMLElement>('.main-body');
    if (!mainBody) return;

    let setFooterTimeout: any;
    return new ResizeSensor(mainBody, function () {
      if (setFooterTimeout) clearTimeout(setFooterTimeout);
      setFooterTimeout = setTimeout(function () {
        // the footer definition has to be here.
        // if we move it outside, it will not use the correct footer element
        const footer = mainContainer.querySelector<HTMLElement>('.footer-container');
        if (!footer) return;

        // calculate the inner height of the app content (height of children in main-body + footer)
        if ((mainBody.offsetHeight + footer.offsetHeight + 10) < mainContainer.offsetHeight) {
          footer.classList.remove('position-relative');
        } else {
          footer.classList.add('position-relative');
        }
      }, 50);
    });

  } catch (err) {
    $log.warn(err);
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
  const container = parentContainer ? parentContainer : document.querySelector(`#${APP_ROOT_ID_NAME}`) as HTMLElement;
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
 */
export function addTopHorizontalScroll(parent: HTMLElement) {
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

  // make sure that the length of the scroll is identical to the scroll at the bottom of the table
  new ResizeSensor(scrollableContent, function () {
    // there is no need of a scrollbar, content is not overflowing
    if (scrollableContent!.scrollWidth == scrollableContent!.clientWidth) {
      topScrollElement!.style.width = '0';
      topScrollElementWrapper!.style.height = '0';
    }
    else {
      topScrollElementWrapper!.style.height = '15px';
      topScrollElement!.style.width = scrollableContent!.scrollWidth + 'px';
    }
  });

  // make top scroll visible after adding the handlers to ensure its visible only when working
  topScrollElementWrapper.style.display = 'block';
  // show only if content is overflowing
  if (scrollableContent.scrollWidth == scrollableContent.clientWidth) {
    topScrollElementWrapper.style.height = '15px';
  }
}

export function copyToClipboard(text: string) {
  if (document.execCommand) {
    const dummy = document.createElement('input');
    dummy.setAttribute('visibility', 'hidden');
    dummy.setAttribute('display', 'none');

    document.body.appendChild(dummy);
    dummy.setAttribute('id', 'permalink_copy');
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');

    document.body.removeChild(dummy);
  }
  else if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch((err) => {
      $log.error('failed to copy with the following error:')
      $log.error(err);
    });
  }
}

/**
 *
 * @param callback function that needs to be invoked after the delay
 * @param timeout delay
 * @returns debounced function
 */
export function debounce(callback: Function, timeout: number) {
  let timer: any = null;

  return function(...args: any[]) {

    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      // @ts-ignore:
      callback.apply(this, args);
    }, timeout);
  }
}

/*
  This function is used for firing custom events
  @param {string} eventName - the event name
  @param {string} targetElement - a DOM element from which the event will propogate
  @param {object} detail - a custom object for passing data with the event
  @param {boolean} bubbles - whether the event should be propagated upward to the parent element
  @param {boolean} cancelable - whether the event can be canceled using event.preventDefault
  @param {boolean} composed - whether the event will propagate across the shadow DOM boundary into the standard DOM
 */
export function fireCustomEvent(eventName = 'myEvent', targetElement = 'body', detail = {}, bubbles = true, cancelable = true, composed = false) {
  const customEvent = new CustomEvent(eventName, {
    detail,
    bubbles,
    cancelable,
    composed,
  });

  if (targetElement === 'body') {
    document.querySelector('body')?.dispatchEvent(customEvent);
  } else {
    document.body.querySelector(targetElement)?.dispatchEvent(customEvent);
  }

}

/*
  This function is used to covnvert values in vw units to px units
  @param {number} value - the dimension value in vw units
  @returns {number} the dimension value in px units
*/

export function convertVWToPixel(value: number) {
  const e = document.documentElement;
  const g = document.getElementsByTagName('body')[0];
  const x = window.innerWidth || e.clientWidth || g.clientWidth;

  const result = (x * value) / 100;
  return result;
}
