// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { CustomError, LimitedBrowserSupport, MultipleRecordError } from '@isrd-isi-edu/chaise/src/models/errors';
import { LogActions, LogAppModes, LogStackTypes } from '@isrd-isi-edu/chaise/src/models/log';
import { ViewerAnnotationModal } from '@isrd-isi-edu/chaise/src/models/viewer';
import { RecordeditDisplayMode, RecordeditProps, appModes } from '@isrd-isi-edu/chaise/src/models/recordedit';

// providers
import { ChaiseAlertType } from '@isrd-isi-edu/chaise/src/providers/alerts';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import ViewerConfigService from '@isrd-isi-edu/chaise/src/services/viewer-config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';
import ViewerAnnotationService from '@isrd-isi-edu/chaise/src/services/viewer-annotation';

// utils
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import {
  ReadAllAnnotationResultType, fetchZPlaneList, fetchZPlaneListByZIndex, getOSDViewerIframe,
  hasURLQueryParam, initializeOSDParams, loadImageMetadata, readAllAnnotations, updateChannelConfig
} from '@isrd-isi-edu/chaise/src/utils/viewer-utils';
import { HELP_PAGES, VIEWER_CONSTANT, errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { OSDViewerDeploymentPath, fixedEncodeURIComponent, getHelpPageURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { MESSAGE_MAP } from '@isrd-isi-edu/chaise/src/utils/message-map';

export const ViewerContext = createContext<{
  /**
   * the reference object of the Image table.
   */
  reference: any,
  /**
   * whether the page is initialized and we can start showing the elements
   */
  initialized: boolean,
  /**
   * The title of the page
   */
  pageTitle: string,
  /**
   * whether to show the annotation sidebar or not
   */
  hideAnnotationSidebar: boolean,
  /**
   * call this function to toggle the annotation sidebar
   */
  toggleAnnotationSidebar: () => void,
  /**
   * whether the channel list is currently displayed or not.
   */
  showChannelList: boolean,
  /**
   * call this function to toggle the channel list
   */
  toggleChannelList: () => void,

  /**
   * annotations
   */
  annotationModels: ViewerAnnotationModal[],
  loadingAnnotations: boolean,
  canCreateAnnotation: boolean,

  switchToCreateMode: (event: any) => void,
  annotationFormProps: RecordeditProps | null,
  closeAnnotationForm: () => void,

} | null>(null);

type ViewerProviderProps = {
  children: JSX.Element;
  queryParams: any;
  reference: any;
  logInfo: {
    logObject?: any;
    logStack: any;
    logStackPath: string;
  }
};

export default function ViewerProvider({
  children,
  queryParams,
  reference,
  logInfo
}: ViewerProviderProps): JSX.Element {
  const { addAlert, removeAllAlerts } = useAlert();
  const { validateSessionBeforeMutation } = useAuthn();
  const { dispatchError } = useError();

  /**
   * whether we've initialized the page or not
   */
  const [initialized, setInitialized] = useState(false);

  const [pageTitle, setPageTitle] = useState('Image');

  const [showChannelList, setShowChannelList] = useState(false);

  /**
   * whether we're waiting for annotations or not
   */
  const [loadingAnnotations, setLoadingAnnotations] = useState(true);

  const [canCreateAnnotation, setCanCreateAnnotation] = useState(false);

  const [hideAnnotationSidebar, setHideAnnotationSidebar] = useState(true);

  const [annotationModels, setAnnotationModels, annotationModelsRef] = useStateRef<ViewerAnnotationModal[]>([]);

  const [annotationFormProps, setAnnotationFormProps] = useState<RecordeditProps | null>(null)

  const imageID = useRef<string>();
  /**
   * if default z-index is missing, we're using 0
   */
  const defaultZIndex = useRef<number>(0);

  const osdViewerParameters = useRef<any>();
  const mainImageLoaded = useRef(false);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);
  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    initializeViewerApp();

    windowRef.addEventListener('message', recieveIframeMessage);
  }, []);


  const initializeViewerApp = () => {
    ViewerConfigService.configure();

    const imageConfig = ViewerConfigService.imageConfig;
    const osdConstant = VIEWER_CONSTANT.OSD_VIEWER;

    let imageTuple: any, imageURI: string;
    let headTitleDisplayname: any;

    // if the main image request didnt return any rows
    let noImageData = false;

    // if there are svgs in query param, we should just use it and shouldn't get it from db.
    let hasAnnotationQueryParam = false

    // if there are any svg files in the query params, ignore the annotation table.
    // (added here because we want to hide the sidebar as soon as we can)
    if (hasURLQueryParam(queryParams, true)) {
      setHideAnnotationSidebar(false);
      setLoadingAnnotations(true);
      hasAnnotationQueryParam = true;
    }

    // read the image
    reference.contextualize.detailed.read(1, logInfo.logObject, false, true, false, true).then((imagePage: any) => {

      const tableDisplayName = imagePage.reference.displayname.value;

      if (imagePage.length > 1) {
        const recordSetLink = imagePage.reference.contextualize.compact.appLink;
        throw new MultipleRecordError(tableDisplayName, recordSetLink);
      }

      if (imagePage.length === 1) {
        imageTuple = imagePage.tuples[0];

        imageID.current = imageTuple.data.RID;

        if (imageConfig.legacy_osd_url_column_name) {
          imageURI = imageTuple.data[imageConfig.legacy_osd_url_column_name];
          if (!imageURI) {
            $log.log(`The ${imageConfig.legacy_osd_url_column_name} value is empty in Image table.`);
          }
        }

        // TODO this feels hacky
        // get the default zindex value
        if (imageConfig.default_z_index_column_name && imageConfig.default_z_index_column_name in imageTuple.data) {
          defaultZIndex.current = imageTuple.data[imageConfig.default_z_index_column_name];
        }

        /**
         * page title logic:
         * - if iframe, don't show it.
         * - otherwise, compute the markdown_pattern in constant, if it didn't work, use the tuple.rowName.
         *   if there wasn't any links in the computed value, add a link to the row.
         *
         * head title link:
         *  - if iframe, not applicable.
         *  - otherwise, compute the markdown_pattern in constant, if it didn't work, use the tuple.displayname.
         */
        if (windowRef.self === windowRef.parent) {
          // page title:

          // get it from the constant
          let pageTitleCaption = ConfigService.ERMrest.processMarkdownPattern(
            imageConfig.page_title_markdown_pattern,
            imageTuple.data,
            reference.table,
            'detailed',
            { templateEngine: 'handlebars' }
          );
          // use the tuple rowName
          if (!isStringAndNotEmpty(pageTitleCaption.value)) {
            pageTitleCaption = imageTuple.rowName;
          }

          //attach link if it doesn't have any
          if (!pageTitleCaption.isHTML || !pageTitleCaption.value.match(/<a\b.+href=/)) {
            setPageTitle(`<a href='${imageTuple.reference.contextualize.detailed.appLink}'>${pageTitleCaption.value}</a>`);
          } else {
            setPageTitle(pageTitleCaption.value);
          }

          // head title:

          // get it from the constant
          headTitleDisplayname = ConfigService.ERMrest.processMarkdownPattern(
            imageConfig.head_title_markdown_pattern,
            imageTuple.data,
            reference.table,
            'detailed',
            { templateEngine: 'handlebars' }
          );
          // use the tuple rowName
          if (!isStringAndNotEmpty(headTitleDisplayname.value)) {
            headTitleDisplayname = imageTuple.displayname;
          }
        }

      } else {
        noImageData = true;
      }


      // properly merge the query parameter and ImageURI
      const res = initializeOSDParams(queryParams, imageURI);

      osdViewerParameters.current = res.osdViewerParams;

      // fetch the missing parameters from database
      let watermark = null;
      if (imageTuple) {
        // add meterScaleInPixels query param if missing
        if (imageConfig.pixel_per_meter_column_name) {
          const val = parseFloat(imageTuple.data[imageConfig.pixel_per_meter_column_name]);
          const qParamName = osdConstant.PIXEL_PER_METER_QPARAM;
          if (!(qParamName in osdViewerParameters.current) && !isNaN(val)) {
            osdViewerParameters.current[qParamName] = val;
          }
        }

        // add waterMark query param if missing
        if (
          imageConfig.watermark_column_name &&
          isStringAndNotEmpty(imageConfig.watermark_column_name)
        ) {
          // get it from the vis columns
          watermark = imageTuple.data[imageConfig.watermark_column_name]
        } else if (
          imageConfig.watermark_foreign_key_visible_column_name &&
          isStringAndNotEmpty(imageConfig.watermark_foreign_key_visible_column_name)
        ) {
          // get it from foreign key relationship
          const val = imageTuple.linkedData[imageConfig.watermark_foreign_key_visible_column_name];
          if (isObjectAndNotNull(val) && imageConfig.watermark_foreign_key_data_column_name) {
            watermark = val[imageConfig.watermark_foreign_key_data_column_name];
          }
        }

        // properly set the mainImage acls
        osdViewerParameters.current.acls.mainImage = {
          canUpdateDefaultZIndex: imageTuple.canUpdate && imageTuple.checkPermissions('column_update', imageConfig.default_z_index_column_name)
        };
      }

      const qParamName = osdConstant.WATERMARK_QPARAM;
      if (!(qParamName in osdViewerParameters.current) && isStringAndNotEmpty(watermark)) {
        osdViewerParameters.current[qParamName] = watermark;
      }

      // if channel info was avaibale on queryParams or imageURI, don't fetch it from DB.
      if (noImageData || !res.loadImageMetadata) {
        return [];
      }

      return loadImageMetadata(osdViewerParameters, imageID.current!, defaultZIndex.current);

    }).then(() => {
      // dont fetch annotation from db if:
      // - we have annotation query params
      // - or main image request didn't return any rows
      if (hasAnnotationQueryParam || noImageData || !imageID.current) {
        return {
          annotationTuples: [],
          annotationURLs: [],
          canUpdateAnnotation: false,
          canCreateAnnotation: false
        }
      }

      // read the annotation reference
      return readAllAnnotations(true, imageID.current, defaultZIndex.current);
    }).then((res: ReadAllAnnotationResultType) => {
      ViewerAnnotationService.setAnnotations(
        res.annotationTuples,
        res.annotationURLs,
        res.annotationEditReference,
        res.annotationCreateReference
      );

      if (res.canCreateAnnotation) {
        setCanCreateAnnotation(true);
      }

      // view <table displayname>: tuple displayname
      let headTitle = `View ${getDisplaynameInnerText(reference.displayname)}`;
      if (headTitleDisplayname) {
        headTitle += `:  ${getDisplaynameInnerText(headTitleDisplayname)}`;
      }
      updateHeadTitle(headTitle);

      if (res.annotationTuples.length > 0) {
        setLoadingAnnotations(true);
      }

      if (!isObjectAndNotNull(osdViewerParameters.current) || osdViewerParameters.current.mainImage.info.length === 0) {
        $log.log('there wasn\'t any parameters that we could send to OSD viewer');
        throw new ConfigService.ERMrest.MalformedURIError('Image information is missing.');
      }

      /**
       * Some features are not working properly in safari, so we should let them know
       *
       * since the issues are only related to annotaion, we're only showing this error if
       * there are some annotations, or user can create or edit annotations.
       */
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const hasOrCanHaveAnnot = (res.annotationTuples.length > 0 || res.canUpdateAnnotation || res.canCreateAnnotation);
      if (isSafari && hasOrCanHaveAnnot) {
        const errorMessage = [
          'You are using a browser that has limited support for this application.',
          '<br/><br/>',
          'The following features related to the annotation tool might not work as expected:',
          '<ul><br/>',
          '<li style=\'list - style - type: inherit\'><strong>Arrow line</strong>: The arrowheads might not be visible on high-resolution images.</li>',
          '<li style=\'list - style - type: inherit\'><strong>Text</strong>: The text box cannot be resized during drawing.</li>',
          '<br/></ul>',
          'We recommend using <a target=\'_blank\' href=\'https://www.google.com/chrome/\'>Google Chrome</a> ',
          'or <a target=\'_blank\' href=\'https://www.mozilla.org/en-US/firefox/new/\'>Mozilla Firefox</a> ',
          'for full annotation support.'
        ].join('');

        dispatchError({ error: new LimitedBrowserSupport(errorMessage, undefined, true), isDismissible: true });
      }

      getOSDViewerIframe().setAttribute('src', `${windowRef.location.origin}${OSDViewerDeploymentPath()}mview.html`);

      // NOTE if we move displayReady and displayIframe to be after the osdLoaded,
      //      the scalebar value doesn't properly display. the viewport must be visible
      //      before initializing the osd viewer (and its scalebar)
      // show the page while the image info will be loaded by osd viewer
      setInitialized(true);

    }).catch((error: any) => {
      dispatchError({ error })
    });
  };

  const recieveIframeMessage = (event: any) => {
    if (event.origin !== windowRef.location.origin) return;

    const data = event.data.content;
    const messageType = event.data.messageType;
    const iframe = getOSDViewerIframe().contentWindow!;

    switch (messageType) {
      case 'osdLoaded':
        // called when osd iframe has been fully loaded.

        // initialize viewer
        if (isObjectAndNotNull(osdViewerParameters.current)) {
          iframe.postMessage({ messageType: 'initializeViewer', content: osdViewerParameters.current }, origin);
        }
        break;
      case 'mainImageLoadFailed':
        // called if the main image didnt properly load

        addAlert(errorMessages.viewerOSDFailed, ChaiseAlertType.ERROR);
        break;
      case 'mainImageLoaded':
        mainImageLoaded.current = true;

        /**
         * called when the main images is loaded. we should now ask osd to load annotations if we already have
         * fetched the URLs from database or have them based on query parameteres.
         */
        if (ViewerAnnotationService.annotationsRecieved) {
          ViewerAnnotationService.loadAnnotations();
        }
        break;
      case 'updateMainImage':
        /**
         * called when the main image has changed in the multi-z support.
         * we need to update the information associated with the image.
         */
        mainImageLoaded.current = false;

        // change the default z-index
        defaultZIndex.current = data.zIndex;

        // TODO
        // make sure it's not in edit/create mode
        // if (vm.editingAnatomy != null) {
        //   vm.closeAnnotationForm();
        // }

        // clear the annotations
        setAnnotationModels([]);
        ViewerAnnotationService.clearPreviousAnnotations();

        // show the loading indicator
        setLoadingAnnotations(true);

        // read the annotations
        (function (currZIndex) {
          readAllAnnotations(false, imageID.current!, currZIndex).then((res) => {
            // if main image changed while fetching annotations, ignore it
            if (currZIndex !== defaultZIndex.current) return;

            ViewerAnnotationService.setAnnotations(
              res.annotationTuples,
              res.annotationURLs,
              res.annotationEditReference,
              res.annotationCreateReference
            );

            if (res.annotationTuples.length > 0) {
              // ask osd to load the annotation
              if (mainImageLoaded.current) {
                ViewerAnnotationService.loadAnnotations();
              }
            } else {
              setLoadingAnnotations(false);
            }

          }).catch((err) => {
            // if main image changed while fetching annotations, ignore it
            if (currZIndex !== defaultZIndex.current) return;

            setLoadingAnnotations(false);

            // fail silently
            $log.error('error while updating annotations');
            $log.error(err);
          });
        })(data.zIndex)

        break;
      case 'annotationsLoaded':
        // called when osd-viewer read all the annotations.
        // TODO we should technically keep showing the loader until updateAnnotationList is called
        setLoadingAnnotations(false);
        break;
      case 'errorAnnotation':
        addAlert('Couldn\'t parse the given annotation.', ChaiseAlertType.WARNING);
        $log.warn(data);
        break;
      case 'updateAnnotationList':
        // called whens osd-viewer has finished parsing annotaitons files.
        updateAnnotaionList(data);
        break;
      case 'onClickChangeSelectingAnnotation':
        // TODO
        break;
      case 'onChangeStrokeScale':
        // TODO
        break;
      case 'saveGroupSVGContent':
        // TODO
        break;
      case 'fetchZPlaneList':
        fetchZPlaneList(data.requestID, data.pageSize, data.before, data.after, data.reloadCauses).then((res) => {
          iframe.postMessage({ messageType: 'updateZPlaneList', content: res });
        }).catch((error: any) => {
          dispatchError({ error });
        })
        break;
      case 'fetchZPlaneListByZIndex':
        fetchZPlaneListByZIndex(data.requestID, data.pageSize, data.zIndex, data.source).then((res) => {
          iframe.postMessage({ messageType: 'updateZPlaneList', content: res });
        }).catch((error: any) => {
          dispatchError({ error });
        })
        break;
      case 'openDrawingHelpPage':
        windowRef.open(getHelpPageURL(HELP_PAGES.VIEWER_ANNOTATION), '_blank');
        break
      case 'hideChannelList':
        // osd-viewer sends this so we can update the button state
        setShowChannelList(false);
        break;
      case 'showChannelList':
        // osd-viewer sends this so we can update the button state
        setShowChannelList(true);
        break;
      case 'updateChannelConfig':
        updateChannelConfig(data, imageID.current!).then((res) => {
          // the alerts are disaplyed by the updateChannelConfig function
          // let osd viewer know that the process is done
          iframe.postMessage({ messageType: 'updateChannelConfigDone', content: { channels: data, success: res } }, origin);
        }).catch((error) => {
          // let osd viewer know that the process is done
          iframe.postMessage({ messageType: 'updateChannelConfigDone', content: { channels: data, success: false } }, origin);

          // show the error
          dispatchError({ error })
        });
        break;
      case 'downloadViewDone':
        // TODO
        break;
      case 'downloadViewError':
        // TODO
        break;
      case 'showAlert':
        addAlert(data.message, data.type);
        break;
      case 'showPopupError':
        const err = new CustomError(data.header, data.message, undefined, data.clickActionMessage, data.isDismissible);
        dispatchError({ error: err, isDismissible: data.isDismissible });
        break;
    }
  };

  const updateAnnotaionList = (items: any) => {
    let newItems: ViewerAnnotationModal[] = [];

    const annotConfig = ViewerConfigService.annotationConfig;

    items.forEach((item: any) => {
      const groupID = item.groupID;
      const svgID = item.svgID;

      // TODO why osd viewer is sending this event?
      if (svgID === 'NEW_SVG' || groupID === 'NEW_GROUP') {
        return;
      }

      // TODO how can this happen? does it makes sense?
      if (annotationModelsRef.current.find((el) => el.groupID === groupID)) {
        return;
      }

      /**
       * support these cases:
       * - id,name
       * - ,name
       * - id
       */
      let anatomyID = groupID, anatomyName = '';
      if (groupID.indexOf(',') !== -1) {
        anatomyID = groupID.split(',')[0];
        if (anatomyID.length === 0) anatomyID = '';
        anatomyName = groupID.split(',')[1];
      }

      // TODO improve supporting only anatomyID or anatomyName
      const tuple = (!anatomyID) ? undefined : ViewerAnnotationService.annotationTuples.find((t: any) => {
        return (t.data && t.data[annotConfig.annotated_term_column_name] === anatomyID);
      });

      const encode = fixedEncodeURIComponent;
      const qParams = `pcid=${ConfigService.contextHeaderParams.cid}&ppid=${ConfigService.contextHeaderParams.pid}`;
      const url = !anatomyID ? '' : [
        `chaiseDeploymentPath()/record/#${ConfigService.catalogID}`,
        encode(annotConfig.annotated_term_table_schema_name) + ':' + encode(annotConfig.annotated_term_table_name),
        encode(annotConfig.annotated_term_id_column_name) + '=' + anatomyID + '?' + qParams
      ].join('/');

      newItems.push({
        id: anatomyID,
        name: anatomyName,
        groupID,
        svgID,
        tuple,
        colors: Array.isArray(item.stroke) ? item.stroke : [],
        isStoredInDB: !!tuple,
        anatomy: item.anatomy,
        url,
        canUpdate: tuple ? tuple.canUpdate : false,
        canDelete: tuple ? tuple.canDelete : false,
        logStackNode: LogService.getStackNode(
          LogStackTypes.ANNOTATION,
          tuple ? tuple.reference.table : undefined,
          tuple ? tuple.reference.filterLogInfo : { file: 1 },
        )
      });
    });

    setAnnotationModels((prev) => [...prev, ...newItems]);
  };

  // ---------------------- UI callbacks ------------------- //
  const toggleAnnotationSidebar = () => {
    setHideAnnotationSidebar((prev: boolean) => {
      const action = prev ? LogActions.VIEWER_ANNOT_PANEL_SHOW : LogActions.VIEWER_ANNOT_PANEL_HIDE;
      LogService.logClientAction({
        action: LogService.getActionString(action, null, ''),
        stack: LogService.getStackObject()
      }, reference.defaultLogInfo);
      return !prev;
    })
  };

  const toggleChannelList = () => {
    setShowChannelList((prev: boolean) => {
      const action = prev ? LogActions.VIEWER_CHANNEL_HIDE : LogActions.VIEWER_CHANNEL_SHOW;

      getOSDViewerIframe().contentWindow!.postMessage({ messageType: 'toggleChannelList' }, origin);

      // log the click
      // app mode will change by annotation controller, this one should be independent of that
      LogService.logClientAction({
        action: LogService.getActionString(action, null, ''),
        stack: LogService.getStackObject()
      }, reference.defaultLogInfo);

      return !prev;
    });
  };

  const onSubmitAnnotationSuccess = () => {
    // TODO
  }

  const switchToCreateMode = () => {
    // TODO should be changed and added just for testing
    setAnnotationFormProps({
      appMode: appModes.CREATE,
      config: { displayMode: RecordeditDisplayMode.VIEWER_ANNOTATION },
      onSubmitSuccess: onSubmitAnnotationSuccess,
      reference: ViewerAnnotationService.annotationCreateReference,
      logInfo: {
        logAppMode: LogAppModes.CREATE,
        logStack: ViewerAnnotationService.getAnnotationLogStack(),
        logStackPath: ViewerAnnotationService.getAnnotationLogStackPath()
      },
      queryParams: {}
    })


    // Notify OSD to create a new svg and group for annotations
    ViewerAnnotationService.startAnnotationCreate({
      svgID: 'NEW_SVG',
      groupID: 'NEW_GROUP',
      anatomy: '',
      description: ''
    });

    // log the client action
    ViewerAnnotationService.logAnnotationClientAction(LogActions.ADD_INTEND);
  };

  const closeAnnotationForm = () => {
    // TODO
    setAnnotationFormProps(null);
  }

  const providerValue = useMemo(() => {
    return {
      reference,
      initialized,
      pageTitle,
      hideAnnotationSidebar,
      toggleAnnotationSidebar,
      showChannelList,
      toggleChannelList,
      annotationModels,
      loadingAnnotations,
      canCreateAnnotation,
      annotationFormProps,
      closeAnnotationForm,
      switchToCreateMode
    }
  }, [
    initialized,
    pageTitle,
    hideAnnotationSidebar,
    showChannelList,
    annotationModels,
    loadingAnnotations,
    canCreateAnnotation,
    annotationFormProps,
    closeAnnotationForm
  ]);

  return (
    <ViewerContext.Provider value={providerValue}>
      {children}
    </ViewerContext.Provider>
  )
}
