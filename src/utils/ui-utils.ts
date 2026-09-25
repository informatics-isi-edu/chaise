/**
 * Utility functions related to dom manipulation
 */
import ResizeSensor from 'css-element-queries/src/ResizeSensor';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import Tooltip from 'bootstrap/js/dist/tooltip';

import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { CLASS_NAMES, CSS_VARIABLES, ID_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { isFilePreviewType } from '@isrd-isi-edu/chaise/src/utils/file-utils';
import { stringToNumber } from '@isrd-isi-edu/chaise/src/utils/string-utils';

// temporary height used while measuring a scrollbar; just has to exceed any platform's
const SCROLLBAR_PROBE_SIZE = 30;

/**
 * Height for a scrollbar that takes no layout space, so the browser can still paint it.
 * Can't be measured (overlay scrollbars report 0), so this is roughly what macOS draws.
 */
const OVERLAY_SCROLLBAR_PAINT_SIZE = 12;

export type ContainerHeightSensorDimensions = {
  /**
   * stores 'top' of the container calculated by height of top panel
   */
  top: number;
};

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
export function attachContainerHeightSensors(
  parentContainer?: any,
  parentContainerSticky?: any,
  useDocHeight?: boolean
) {
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
      appContent.style.height = (parentUsableHeight / windowRef.innerHeight) * 100 + 'vh';
      container.style.height = 'unset';
      appContent.classList.add(CLASS_NAMES.SCROLLABLE_APP_CONTENT_CONTAINER);
    };

    let tm: any;
    // used to ensure we're not calling the setContainerHeightFn multiple times
    const setContainerHeight = function () {
      if (tm) clearTimeout(tm);

      tm = setTimeout(function () {
        setContainerHeightFn();
      }, 200);
    };

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
        appContent.classList.remove(CLASS_NAMES.SCROLLABLE_APP_CONTENT_CONTAINER);

        // set the container's height
        container.style.height = containerHeight + 'vh';

        // now check based on actual pixel size
        if (container.offsetHeight < 300) {
          resetHeight();
        }
      }
    };

    // used to capture the old values of height
    let cache: any;

    // make sure the main-container has initial height
    setContainerHeightFn();
    cache = {
      appContentHeight: appContent.offsetHeight,
      parentContainerStickyHeight: parentContainerSticky.offsetHeight,
      containerStickyHeight: containerSticky.offsetHeight,
    };

    //watch for the parent container height (this act as resize event)
    const appContentSensor = new ResizeSensor(appContent, function (dimension) {
      if (appContent.offsetHeight != cache.appContentHeight) {
        cache.appContentHeight = appContent.offsetHeight;
        setContainerHeight();
      }
    });

    // watch for size of the parent sticky section
    const parentContaienrStickySensor = new ResizeSensor(parentContainerSticky, function (
      dimension
    ) {
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
 * @return {ResizeObserver} ResizeObserver object that can be used to turn it off.
 *
 * Make sure the `.top-right-panel` and `.main-container` are aligned.
 * They can be missaligned if the scrollbar is visible and takes space.
 */
export function attachMainContainerPaddingSensor(parentContainer?: HTMLElement) {
  const container = parentContainer
    ? parentContainer
    : (document.querySelector(`#${ID_NAMES.APP_ROOT}`) as HTMLElement);
  const mainContainer = container.querySelector('.main-container') as HTMLElement;
  const topRightPanel = container.querySelector('.top-right-panel') as HTMLElement;

  // the last value we applied, so we don't write the same padding twice (see the note below)
  let appliedPadding: number | null = null;
  let scheduledFrame: number | null = null;

  const setPadding = () => {
    scheduledFrame = null;
    if (!mainContainer.isConnected) return;

    try {
      const padding = mainContainer.clientWidth - topRightPanel.clientWidth;
      if (padding === appliedPadding) return;
      appliedPadding = padding;
      mainContainer.style.paddingRight = padding + 'px';
    } catch {
      /* silent failure */
    }
  };

  /**
   * Writing the padding can toggle the scrollbar we're measuring. Doing that inside the
   * observer callback keeps the cycle in one frame, which the browser reports as
   * "ResizeObserver loop completed with undelivered notifications".
   */
  const schedulePadding = () => {
    if (scheduledFrame !== null) return;
    scheduledFrame = windowRef.requestAnimationFrame(setPadding);
  };

  /**
   * Must stay on the default `content-box`: a scrollbar appearing changes only the
   * content box, so `border-box` would never fire for the case this function exists for.
   * Both elements are watched because either one's scrollbar affects the difference.
   */
  const observer = new ResizeObserver(schedulePadding);
  observer.observe(mainContainer);
  observer.observe(topRightPanel);

  return observer;
}

/**
 * Some of the tables can be very long and the horizontal scroll only sits at the very bottom by default
 * A fixed horizontal scroll is added here that sticks to the top as we scroll vertically and horizontally
 * @param {DOMElement} parent - the parent element
 * @param {boolean?} fixedPos - whether the scrollbar is fixed position or not (if so, we will attach extra rules)
 * @param {HTMLElement?} extraSensorTarget - if we want to trigger the logic based on changes to another element
 * @return {ResizeObserver} ResizeObserver object that can be used to turn it off.
 */
export function addTopHorizontalScroll(
  parent: HTMLElement,
  fixedPos = false,
  extraSensorTarget?: HTMLElement,
  reservedSizeTarget?: HTMLElement
) {
  if (!parent) return;

  const topScrollElementWrapper = parent.querySelector<HTMLElement>(
      '.chaise-table-top-scroll-wrapper'
    ),
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

  /**
   * How much layout space the scrollbar takes: a positive value where scrollbars sit
   * beside the content, 0 where they're overlays. Cached because the probe writes to the
   * wrapper, and doing that on every resize would perturb the layout we're observing.
   */
  let scrollbarHeight: number | null = null;
  const getScrollbarHeight = () => {
    if (scrollbarHeight !== null) return scrollbarHeight;

    // the scrollbar is the gap between the border and content boxes, but a zero-height
    // box reports no gap, so give it a temporary height first
    const previousHeight = topScrollElementWrapper!.style.height;
    topScrollElementWrapper!.style.height = `${SCROLLBAR_PROBE_SIZE}px`;
    const probedHeight = topScrollElementWrapper!.offsetHeight;
    const measured = probedHeight - topScrollElementWrapper!.clientHeight;
    topScrollElementWrapper!.style.height = previousHeight;

    /**
     * The probe had no effect, so the element is hidden. Related tables mount that way
     * (`Accordion.Body` renders while closed), so don't cache it or a merely collapsed
     * table would never get a scrollbar. Expanding resizes the content and we retry.
     */
    if (probedHeight === 0) return 0;

    scrollbarHeight = measured;
    return scrollbarHeight;
  };

  // publish the room needed, so layout that makes space for it reads one measured value
  const setReservedSize = (size: number) => {
    (reservedSizeTarget || parent).style.setProperty(CSS_VARIABLES.TOP_SCROLL_SIZE, `${size}px`);
  };

  const setTopScrollStyles = () => {
    if (fixedPos) {
      topScrollElementWrapper!.style.width = `${scrollableContent.clientWidth}px`;
    }

    // there is no need of a scrollbar, content is not overflowing
    if (scrollableContent!.scrollWidth === scrollableContent!.clientWidth) {
      topScrollElement!.style.width = '0';
      topScrollElementWrapper!.style.height = '0';
      topScrollElementWrapper!.style.marginBottom = '0';
      topScrollElementWrapper!.style.backgroundColor = '';
      setReservedSize(0);
      return;
    }

    // widen the inner element first, so the wrapper overflows and can render a scrollbar
    topScrollElement!.style.width = scrollableContent!.scrollWidth + 'px';

    // overlay scrollbars reserve nothing, so the wrapper still needs a height to paint
    // into but must not take up any space
    const scrollbarSize = getScrollbarHeight();
    const takesSpace = scrollbarSize > 0;
    const paintHeight = takesSpace ? scrollbarSize : OVERLAY_SCROLLBAR_PAINT_SIZE;

    topScrollElementWrapper!.style.height = `${paintHeight}px`;

    /**
     * A horizontal scrollbar is painted along the BOTTOM edge of its scroll container, so
     * wherever the wrapper ends is where the bar shows up.
     *
     * In flow, the wrapper sits above the content and the bar lands right on its top
     * edge, which is what we want. Out of flow (fixedPos) the caller reserves the room
     * instead, via the custom property published below.
     *
     * With overlay scrollbars we can't reserve that room, so the wrapper is pulled out of
     * flow with a negative margin and then shifted up by its own height. The transform is
     * deliberate: it moves where the bar paints without moving anything else, so the bar
     * still lines up with the top of the content rather than sitting across it.
     */
    /**
     * `fixedPos` is out of flow so it already reserves nothing. Either way the bar draws
     * over the first few pixels of the content, since a horizontal scrollbar paints along
     * the BOTTOM edge of its container and there's no room above for that edge. Shifting
     * it up clips it in recordset and covers the Clone button in recordedit.
     */
    topScrollElementWrapper!.style.marginBottom = takesSpace || fixedPos ? '0' : `-${paintHeight}px`;

    // the opaque background hides content scrolling under the stuck wrapper, but would
    // paint over the content it now overlaps
    topScrollElementWrapper!.style.backgroundColor = takesSpace ? '' : 'transparent';

    setReservedSize(takesSpace ? paintHeight : 0);
  };

  // see the note in attachMainContainerPaddingSensor about why the write is deferred
  let scheduledFrame: number | null = null;
  const scheduleTopScrollStyles = () => {
    if (scheduledFrame !== null) return;
    scheduledFrame = windowRef.requestAnimationFrame(() => {
      scheduledFrame = null;
      if (!scrollableContent!.isConnected) return;
      setTopScrollStyles();
    });
  };

  // make top scroll visible after adding the handlers to ensure its visible only when working
  topScrollElementWrapper.style.display = 'block';
  setTopScrollStyles();

  // make sure that the length of the scroll is identical to the scroll at the bottom of the table
  const observer = new ResizeObserver(scheduleTopScrollStyles);
  observer.observe(scrollableContent);

  if (extraSensorTarget) {
    observer.observe(extraSensorTarget);
  }

  return observer;
}

/**
 * add the given text to clipboard
 * @param text the text that should be copied to clipboard
 */
export function copyToClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        resolve();
      })
      .catch((err) => {
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
  };
}

/**
 * create a timeout that can be used in async/await fns
 * @param ms how long we should wait
 */
export function asyncTimeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
export function fireCustomEvent<T>(
  eventName = 'myEvent',
  targetElement: string | Element = 'body',
  detail: T,
  bubbles = true,
  cancelable = true,
  composed = false
) {
  const customEvent = new CustomEvent<T>(eventName, { detail, bubbles, cancelable, composed });

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
  return new Promise((resolve) => {
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
      subtree: true,
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
    tooltipTriggerList.forEach((el) => createChaiseTooltip(el));
  }
}

/**
 * turn a single element with a `data-chaise-tooltip` attribute into a bootstrap tooltip.
 * useful when the element is created/updated imperatively (outside the markdown render pass)
 * and so isn't covered by createChaiseTooltips.
 * @param el the element to attach the tooltip to (must have the `data-chaise-tooltip` attribute)
 */
export function createChaiseTooltip(el: Element) {
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
  // reuse any existing instance so we don't stack duplicate tooltips on re-application
  Tooltip.getOrCreateInstance(el, {
    title,
    placement:
      ['auto', 'top', 'bottom', 'left', 'right'].indexOf(placement) !== -1
        ? (placement as Tooltip.PopoverPlacement)
        : 'bottom',
  });
}

/**
 * see if there's a data-chaise-file-preview in the children of the given element,
 * and render FilePreview React components into those placeholders.
 *
 * NOTE: This function uses ReactDOM to mount React components into DOM elements that were
 * created by the markdown renderer. Each placeholder div gets its own React root.
 */
export async function createChaiseFilePreviews(container: Element) {
  const placeholders = container.querySelectorAll('[data-chaise-file-preview]');
  if (placeholders && placeholders.length > 0) {
    // dynamic import to avoid circular dependencies and load React
    Promise.all([
      import('react'),
      import('react-dom/client'),
      import('@isrd-isi-edu/chaise/src/components/file-preview'),
    ])
      .then(([React, ReactDOM, FilePreviewModule]) => {
        const FilePreview = FilePreviewModule.default;

        placeholders.forEach((el) => {
          const url = el.getAttribute('data-file-url');
          if (!url) return;

          const filename = el.getAttribute('data-filename');
          const previewType = el.getAttribute('data-preview-type');
          const prefetchBytesStr = el.getAttribute('data-prefetch-bytes');
          const prefetchMaxFileSizeStr = el.getAttribute('data-prefetch-max-file-size');
          const hideDownloadBtnStr = el.getAttribute('data-hide-download-btn') === 'true';
          const downloadBtnClass = el.getAttribute('data-download-btn-class');
          const downloadBtnCaption = el.getAttribute('data-download-btn-caption');

          const prefetchBytes = stringToNumber(prefetchBytesStr || '');
          const maxSize = stringToNumber(prefetchMaxFileSizeStr || '');

          // Create a React root and render the FilePreview component using React.createElement
          const root = ReactDOM.createRoot(el);
          root.render(
            React.createElement(FilePreview, {
              url,
              filename: filename ? filename : undefined,
              addDownloadBtn: !hideDownloadBtnStr,
              downloadBtnClassName: downloadBtnClass ? downloadBtnClass : undefined,
              forcedDownloadBtnCaption: downloadBtnCaption ? downloadBtnCaption : undefined,
              forcedPreviewType: isFilePreviewType(previewType) ? previewType : undefined,
              forcedPrefetchBytes: prefetchBytes !== null ? prefetchBytes : undefined,
              forcedPrefetchMaxFileSize: maxSize !== null ? maxSize : undefined,
            })
          );
        });
      })
      .catch((error) => {
        $log.error('Error loading FilePreview component:', error);
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
  link.remove();
}

/**
 * force all links within the given wrapper to open in a new tab
 * @param {HTMLElement} wrapper the element within which we should force links to open in new tab
 *
 * NOTE: if wrapper is not provided, document.body will be used
 */
export function openLinksInTab(wrapper?: HTMLElement) {
  const wrapperEl = wrapper ?? document.querySelector('body');
  if (!wrapperEl) return;
  const listener = addClickListener(wrapperEl, 'a[href]', (e: Event, element: any) => {
    element.target = '_blank';
  });

  return {
    remove: () => {
      wrapperEl.removeEventListener('click', listener);
    },
  };
}

/**
 * Will call the handler function upon clicking on the elements represented by selector
 * @param {HTMLElement} wrapper the element within which we should listen for clicks (e.g. document.body)
 * @param {string} selector the selector string
 * @param {function} handler  the handler callback function.
 * handler parameters are:
 *  - Event object that is returned.
 *  - The target (element that is described by the selector)
 * NOTE since we're checking the closest element to the target, the e.target might
 * be different from the actual target that we want. That's why we have to send the target too.
 * We observed this behavior in Firefox where clicking on an image wrapped by a link (a tag), returned
 * the image as the value of e.target and not the link
 */
export function addClickListener(
  wrapper: HTMLElement,
  selector: string,
  handler: (e: Event, target: any) => void
) {
  const listener = (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.closest(selector)) {
      handler(e, target.closest(selector));
    }
  };
  wrapper.addEventListener('click', listener);
  return listener;
}

/**
 * read a css custom property (e.g. one emitted by a scss `@each` loop over
 * `$color-map`, see `_model.scss`) from an element's computed styles. lets code
 * that can't use scss directly (svg/canvas export, etc.) stay in sync with
 * `_color-map.scss` instead of hardcoding colors that can drift from it.
 * @param name the custom property name, without the leading `--`
 * @param element the element to read computed styles from, defaults to `<html>`
 * @param fallback returned if the property isn't set (e.g. missing/typo'd)
 */
export function getCssVariable(name: string, element: Element = document.documentElement, fallback = ''): string {
  const value = getComputedStyle(element).getPropertyValue(`--${name}`).trim();
  return value || fallback;
}
