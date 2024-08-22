// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';

// models
import { CustomError, DifferentUserConflictError, LimitedBrowserSupport, MultipleRecordError } from '@isrd-isi-edu/chaise/src/models/errors';
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
  hasURLQueryParam, initializeOSDParams, loadImageMetadata, readAllAnnotations, updateChannelConfig, updateDefaultZIndex
} from '@isrd-isi-edu/chaise/src/utils/viewer-utils';
import { HELP_PAGES, ID_NAMES, VIEWER_CONSTANT, errorMessages } from '@isrd-isi-edu/chaise/src/utils/constants';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { isSafari, windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { OSDViewerDeploymentPath, chaiseDeploymentPath, fixedEncodeURIComponent, getHelpPageURL } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { generateUUID } from '@isrd-isi-edu/chaise/src/utils/math-utils';
import { manuallyTriggerFormSubmit } from '@isrd-isi-edu/chaise/src/utils/ui-utils';


type DeleteAnnotationConfirmProps = {
  onConfirm: () => void,
  onCancel: () => void,
  message: JSX.Element
};

type AnnotationFormProps = RecordeditProps & {
  /**
   * whether the annotation can be deleted or not.
   */
  canDelete: boolean
};

export const ViewerContext = createContext<{
  /**
   * if defined, returns the RID value of image record
   */
  imageID?: string,
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
   * annotations
   */
  annotationModels: ViewerAnnotationModal[],
  /**
   * whether we should show the annotation spinner
   */
  loadingAnnotations: boolean,
  /**
   * whether the user can create new annotations
   */
  canCreateAnnotation: boolean,
  /**
   * callback for closing the annotation form
   */
  closeAnnotationForm: () => void,
  /**
   * callback for starting the create mode
   */
  startAnnotationCreate: (event: any) => void,
  /**
   * callback for starting the edit mode for a given annotation
   */
  startAnnotationEdit: (index: number, event: any) => void,

  deleteAnnotationConfirmProps: DeleteAnnotationConfirmProps | null,
  /**
   * -1 in the first parameter means the current annotation form
   */
  startAnnotationDelete: (index: number, event: any) => void,
  /**
   * if defined, it has the props that should be passed to recordedit to display a form
   */
  annotationFormProps: AnnotationFormProps | null,
  submitAnnotationForm: () => void,
  /**
   * indicator for showing the spinner on top of the form
   */
  showAnnotationFormSpinner: boolean,
  /**
   * whether we should display the drawing required error or not
   */
  displayDrawingRequiredError: boolean,
  /**
   * toggle drawing mode
   */
  toggleDrawingMode: (event?: any) => void,
  /**
   * whether we are in drawing mode or not
   */
  isInDrawingMode: boolean,
  /**
   * toggle the visibility of an annotation.
   *
   */
  toggleAnnotationDisplay: (index: number, event?: any) => void,
  changeAllAnnotationVisibility: (show: boolean) => void,
  /**
   * the highlighted annotation.
   * if -1, we should not highlight any annotations.
   */
  highlightedAnnotationIndex: number,
  /**
   * toggle the highlight status of an annotation.
   * (we highlight only one annotation at a time)
   */
  toggleHighlightAnnotation: (index: number, event?: any, fromOSD?: boolean, forceHighlight?: boolean) => void,
  /**
   * log the client action
   */
  logViewerClientAction: (action: LogActions, isAnnotation: boolean, item?: ViewerAnnotationModal, extraInfo?: any) => void,
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
  const { validateSessionBeforeMutation, validateSession } = useAuthn();
  const { dispatchError } = useError();

  /**
   * whether we've initialized the page or not
   */
  const [initialized, setInitialized] = useState(false);

  /**
   * the title. if empty we shouldn't show any title
   */
  const [pageTitle, setPageTitle] = useState('');

  /**
   * whether we're waiting for annotations or not
   */
  const [loadingAnnotations, setLoadingAnnotations] = useState(true);

  /**
   * whether users can create new annotations or not.
   */
  const [canCreateAnnotation, setCanCreateAnnotation] = useState(false);

  /**
   * whether to show or hide the sidebar
   */
  const [hideAnnotationSidebar, setHideAnnotationSidebar] = useState(true);

  /**
   * the displayed annotaitons
   */
  const [annotationModels, setAnnotationModels, annotationModelsRef] = useStateRef<ViewerAnnotationModal[]>([]);

  /**
   * the props used for the form.
   */
  const [annotationFormProps, setAnnotationFormProps] = useState<AnnotationFormProps | null>(null);

  /**
   * whether we should show the spinner. used for create/update and delete.
   */
  const [showAnnotationFormSpinner, setShowAnnotationFormSpinner] = useState(false);

  /**
   * the confirmation modal props for deleteing an annotaiton. delete is called from multiple places that's why
   * this is part of the provider
   */
  const [deleteAnnotationConfirmProps, setDeleteAnnotationConfirmProps] = useState<DeleteAnnotationConfirmProps | null>(null);

  /**
   * whether we should show the required error or not. used in create mode
   */
  const [displayDrawingRequiredError, setDisplayDrawingRequiredError] = useState(false);

  /**
   * whether draw mode is on or off. we need this for the toggle button in annotation form.
   */
  const [isInDrawingMode, setIsInDrawingMode, isInDrawingModeRef] = useStateRef(false);

  /**
   * the index of highlighted annotation. -1 should be used if we don't want to highlight any annotations.
   */
  const [highlightedAnnotationIndex, setHighlightedAnnotationIndex, highlightedAnnotationIndexRef] = useStateRef(-1);

  /**
   * the RID value of the image. it's mostly used internally, but since it was needed for screenshot filename I had to
   * add it to the state
   */
  const [imageID, setImageID, imageIDRef] = useStateRef<string | undefined>();
  /**
   * if default z-index is missing, we're using 0
   */
  const defaultZIndex = useRef<number>(0);

  /**
   * used throughout the provider to find the current state of the form.
   */
  const currentAnnotationFormState = useRef<{
    model: ViewerAnnotationModal,
    isEditMode: boolean,
    index?: number,
    svgAnnotationData?: any
  } | null>(null)

  // passed to osd-viewer
  const osdViewerParameters = useRef<any>();

  /**
   * whether the main image is loaded or not.
   * when users switch from one image to another (in z-plane), we need to show the new image and fetch the annotations.
   * this boolean and ViewerAnnotationService.annotationsRecieved are used so we can coordinate these two events.
   */
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

  /**
   * send the initial requests
   */
  const initializeViewerApp = () => {
    ViewerConfigService.configure();
    ViewerAnnotationService.setViewerLogInfo(logInfo.logStack, logInfo.logStackPath);

    const imageConfig = ViewerConfigService.imageConfig;
    const osdConstant = VIEWER_CONSTANT.OSD_VIEWER;

    let imageTuple: any, imageURI: string, mainImageID: string | undefined;
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

    const logParams = logInfo.logObject ? logInfo.logObject : {};
    logParams.action = LogService.getActionString(LogActions.LOAD, logInfo.logStackPath);
    logParams.stack = logInfo.logStack;

    // read the image
    reference.contextualize.detailed.read(1, logParams, false, true, false, true).then((imagePage: any) => {

      const tableDisplayName = imagePage.reference.displayname.value;

      if (imagePage.length > 1) {
        const recordSetLink = imagePage.reference.contextualize.compact.appLink;
        throw new MultipleRecordError(tableDisplayName, recordSetLink);
      }

      if (imagePage.length === 1) {
        imageTuple = imagePage.tuples[0];

        mainImageID = imageTuple.data.RID;
        setImageID(imageTuple.data.RID);

        // TODO added for backwards compatibility and should eventually be removed
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
        setPageTitle('Image');
      }


      // properly merge the query parameter and ImageURI
      const res = initializeOSDParams(queryParams, imageURI, defaultZIndex.current);

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

      return loadImageMetadata(osdViewerParameters, logInfo.logStack, logInfo.logStackPath, mainImageID!, defaultZIndex.current);

    }).then(() => {
      // dont fetch annotation from db if:
      // - we have annotation query params
      // - or main image request didn't return any rows
      if (hasAnnotationQueryParam || noImageData || !mainImageID) {
        return {
          annotationTuples: [],
          annotationURLs: [],
          canUpdateAnnotation: false,
          canCreateAnnotation: false
        }
      }

      // read the annotation reference
      return readAllAnnotations(true, mainImageID, defaultZIndex.current);
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
        setHideAnnotationSidebar(false);
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
      const hasOrCanHaveAnnot = (res.annotationTuples.length > 0 || res.canUpdateAnnotation || res.canCreateAnnotation);
      if (isSafari() && hasOrCanHaveAnnot) {
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

        // make sure it's not in edit/create mode
        if (currentAnnotationFormState.current) {
          closeAnnotationForm();
        }

        // clear the annotations
        setAnnotationModels([]);
        // this will also set the annotationsRecieved to false
        ViewerAnnotationService.clearPreviousAnnotations();

        // show the loading indicator
        setLoadingAnnotations(true);

        // read the annotations
        (function (currZIndex) {
          readAllAnnotations(false, imageIDRef.current!, currZIndex).then((res) => {
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
        // TODO we should technically keep showing the loader until updateAnnotationList is called for all the annotations
        // but that requires changes in osd-viewer as well.
        setLoadingAnnotations(false);
        break;
      case 'errorAnnotation':
        addAlert('Couldn\'t parse the given annotation.', ChaiseAlertType.WARNING);
        if (data) $log.warn(data);
        break;
      case 'updateAnnotationList':
        // called whens osd-viewer has finished parsing annotaitons files.
        updateAnnotaionList(data);
        break;
      case 'onClickChangeSelectingAnnotation':
        const index = annotationModelsRef.current.findIndex((item) => item.svgID === data.svgID && item.groupID === data.groupID);

        // if user highlights while drawing
        if (index === -1) return;

        // make sure the sidebar is displayed
        setHideAnnotationSidebar(false);

        // TOOD
        // scrollIntoView(item.svgID + item.groupID);
        toggleHighlightAnnotation(index, undefined, true);
        break;
      case 'saveGroupSVGContent':
        if (!currentAnnotationFormState.current) return;
        const hasValidSVG = data.length > 0 && data[0].svg !== '' && data[0].numOfAnnotations > 0;
        if (!hasValidSVG) {
          setDisplayDrawingRequiredError(true);
          const invalidMessage = 'Sorry, the data could not be submitted without any drawings. Please draw annotation on the image.';
          addAlert(invalidMessage, ChaiseAlertType.ERROR);
          return;
        }
        currentAnnotationFormState.current.svgAnnotationData = data;

        // submit the form
        manuallyTriggerFormSubmit(document.querySelector(`#${ID_NAMES.VIEWER_ANNOTATION_FORM}`) as HTMLFormElement);
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
      case 'updateDefaultZIndex':
        validateSessionBeforeMutation(() => {
          updateDefaultZIndex(reference, imageIDRef.current!, defaultZIndex.current).then(() => {
            addAlert('Default Z index value has been updated.', ChaiseAlertType.SUCCESS);
          }).catch((error: any) => {
            validateSession().then((session) => {
              if (!session && error instanceof ConfigService.ERMrest.ConflictError) {
                // login in a modal should show (Session timed out)
                dispatchError({ error: new ConfigService.ERMrest.UnauthorizedError() });
                return;
              }

              if (error instanceof ConfigService.ERMrest.NoDataChangedError) {
                // TODO should we show a warning or something?
                // do nothing
              } else if (error instanceof DifferentUserConflictError) {
                dispatchError({ error, isDismissible: true });
              } else {
                addAlert(error.message, ChaiseAlertType.ERROR);
              }

            });
          }).finally(() => {
            // let osd viewer know that the process is done
            iframe.postMessage({ messageType: 'updateDefaultZIndexDone', content: { 'zIndex': data.zIndex } }, origin);
          })
        })
        break;
      case 'openDrawingHelpPage':
        windowRef.open(getHelpPageURL(HELP_PAGES.VIEWER_ANNOTATION), '_blank');
        break
      case 'updateChannelConfig':
        validateSessionBeforeMutation(() => {
          updateChannelConfig(data, imageIDRef.current!).then((res) => {
            addAlert('Channel settings have been updated.', ChaiseAlertType.SUCCESS);
            // let osd viewer know that the process is done
            iframe.postMessage({ messageType: 'updateChannelConfigDone', content: { channels: data, success: res } }, origin);
          }).catch((error) => {
            // let osd viewer know that the process is done
            iframe.postMessage({ messageType: 'updateChannelConfigDone', content: { channels: data, success: false } }, origin);

            validateSession().then((session) => {
              if (!session && error instanceof ConfigService.ERMrest.ConflictError) {
                // login in a modal should show (Session timed out)
                dispatchError({ error: new ConfigService.ERMrest.UnauthorizedError() });
                return;
              }

              if (error instanceof ConfigService.ERMrest.NoDataChangedError) {
                // TODO should we show a warning or something?
                // do nothing
              } else if (error instanceof DifferentUserConflictError) {
                dispatchError({ error, isDismissible: true });
              } else {
                addAlert(error.message, ChaiseAlertType.ERROR);
              }
            });
          });
        });
        break;
      case 'showAlert':
        addAlert(data.message, data.type);
        break;
      case 'showPopupError':
        const err = new CustomError(data.header, data.message, undefined, data.clickActionMessage, data.isDismissible);
        dispatchError({ error: err, isDismissible: data.isDismissible, skipLogging: true });
        break;
    }
  };

  const getAnnotURL = (id: string) => {
    const encode = fixedEncodeURIComponent;
    const annotConfig = ViewerConfigService.annotationConfig;
    const qParams = `pcid=${ConfigService.contextHeaderParams.cid}&ppid=${ConfigService.contextHeaderParams.pid}`;
    return [
      `${chaiseDeploymentPath()}/record/#${ConfigService.catalogID}`,
      encode(annotConfig.annotated_term_table_schema_name) + ':' + encode(annotConfig.annotated_term_table_name),
      encode(annotConfig.annotated_term_id_column_name) + '=' + encode(id) + '?' + qParams
    ].join('/');
  }

  const updateAnnotaionList = (items: any) => {
    const newItems: ViewerAnnotationModal[] = [];

    const annotConfig = ViewerConfigService.annotationConfig;

    items.forEach((item: any) => {
      const groupID = item.groupID;
      const svgID = item.svgID;

      // TODO why osd viewer is sending this event?
      if (svgID === VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.SVG_ID || groupID === VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.GROUP_ID) {
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

      const url = !anatomyID ? '' : getAnnotURL(anatomyID);

      newItems.push({
        isDisplayed: true,
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

  /**
   * when the annotated term changes,
   *  - call osd-viewer to update the annotated term attached to annotations.
   *  - make sure it's not the same as one of the existing annotations
   */
  const onAnnotatedTermInputChange = (column: any, data: any) => {
    const annotConfig = ViewerConfigService.annotationConfig;

    const formState = currentAnnotationFormState.current;
    if (!formState) return true;

    if (column.name !== annotConfig.annotated_term_visible_column_name || !data) {
      return true;
    }

    const idColName = annotConfig.annotated_term_id_column_name;
    const nameColName = annotConfig.annotated_term_name_column_name;

    // allow itself to be selected, but there's no reason to update the info
    if (data[idColName] === formState.model.id) {
      return true;
    }

    // manually make sure the ID doesn't exist in the list,
    // because some of the annotations might not be stored in the database
    if (annotationModelsRef.current.find((row) => { return row.id === data[idColName] })) {
      return `An annotation already exists for this ${ViewerConfigService.annotationConfig.annotated_term_displayname}, please select other terms.`;
    }

    // Update the new Anatomy name and ID at openseadragon viewer
    const newGroupID = data[idColName] + ',' + data[nameColName];
    const newAnatomy = data[nameColName] + ' (' + data[idColName] + ')';

    // ask osd-viewer to update teh annotation groupID and anatomy
    ViewerAnnotationService.changeGroupInfo({
      svgID: formState.model.svgID,
      groupID: formState.model.groupID,
      newGroupID,
      newAnatomy
    });

    // update the form state props
    formState.model = {
      ...formState.model,
      url: getAnnotURL(data[idColName]),
      groupID: newGroupID,
      anatomy: newAnatomy,
      name: data[nameColName],
      id: data[idColName]
    }


    return true;
  };

  /**
   * the callback passed to recordedit to make sure we're not allowing users
   * to select terms that already have an annotation.
   */
  const getAnnotatedTermDisabledTuples = (
    page: any, pageLimit: number, logStack: any,
    logStackPath: string, requestCauses?: any, reloadStartTime?: any
  ): Promise<{ page: any, disabledRows?: any }> => {
    return new Promise((resolve, reject) => {

      const annotConfig = ViewerConfigService.annotationConfig;
      const tableName = annotConfig.annotated_term_table_name;
      const schemaName = annotConfig.annotated_term_table_schema_name;
      const idColName = annotConfig.annotated_term_id_column_name;

      // we only want to do this for the anatomy popup
      if (!page || page.reference.table.name !== tableName || page.reference.table.schema.name !== schemaName) {
        resolve({ page });
        return;
      }

      // facet will be based on image ID and the default z-index
      const facet: any = {
        and: [
          {
            source: [{ 'inbound': annotConfig.annotated_term_foreign_key_constraint }, annotConfig.reference_image_column_name],
            choices: [imageIDRef.current]
          },
        ]
      };

      if (defaultZIndex.current !== null && defaultZIndex.current !== undefined) {
        facet.and.push({
          source: [{ 'inbound': annotConfig.annotated_term_foreign_key_constraint }, annotConfig.z_index_column_name],
          choices: [defaultZIndex.current]
        })
      }

      const url = [
        `${ConfigService.chaiseConfig.ermrestLocation}/catalog/${ConfigService.catalogID}/entity`,
        `${fixedEncodeURIComponent(schemaName)}:${fixedEncodeURIComponent(tableName)}`,
        `*::facets::${ConfigService.ERMrest.encodeFacet(facet)}`
      ].join('/');

      ConfigService.ERMrest.resolve(url, ConfigService.contextHeaderParams).then((ref: any) => {
        let action = LogActions.LOAD, stack = logStack;
        if (Array.isArray(requestCauses) && requestCauses.length > 0) {
          action = LogActions.RELOAD;
          stack = LogService.addCausesToStack(logStack, requestCauses, reloadStartTime);
        }
        const logObj = {
          action: LogService.getActionString(action, logStackPath),
          stack
        }

        return ref.contextualize.compactSelect.setSamePaging(page).read(pageLimit, logObj, false, true);
      }).then((disabeldPage: any) => {
        const disabledRows: any = [];

        disabeldPage.tuples.forEach((disabledTuple: any) => {
          // currently selected value should not be disabled
          if (currentAnnotationFormState.current?.model.id === disabledTuple.data[idColName]) {
            return;
          }
          const index = page.tuples.findIndex((tuple: any) => {
            return tuple.uniqueId === disabledTuple.uniqueId;
          });
          if (index > -1) disabledRows.push(page.tuples[index]);
        });

        resolve({ page, disabledRows });

      }).catch((err: any) => reject(err));

    });
  };

  /**
 * called when the anntoation form successfully was submitted and saved in db.
 */
  const onSubmitAnnotationSuccess = (response: any) => {
    const formState = currentAnnotationFormState.current;
    if (!formState) return;

    // since we're just ceate/editting one we can assume it's just succesful
    let resultTuple = response.successful.tuples[0];

    // update the stackNode
    formState.model.logStackNode = LogService.getStackNode(
      LogStackTypes.ANNOTATION,
      resultTuple.reference.table,
      resultTuple.reference.filterLogInfo
    );

    const logObj = {
      action: ViewerAnnotationService.getAnnotationLogAction(LogActions.VIEWER_ANNOT_FETCH, formState.model),
      stack: ViewerAnnotationService.getAnnotationLogStack(formState.model)
    }

    // read the currently saved data, so we can capture the tuple in correct context
    // arguments that are true:
    //  - dontCorrect page
    //  - getTCRS: since we're using this tuple for getting the update/delete permissions and also populating edit form
    resultTuple.reference.contextualize.entryEdit.read(1, logObj, false, true, false, true).then((page: any) => {
      if (page.length !== 1) {
        $log.log('the currently added row was not visible.');
      }
      resultTuple = page.length == 1 ? page.tuples[0] : resultTuple;
    }).catch((err: any) => {
      $log.log('error while reading after create/update:', err);
    }).finally(() => {

      // update SVG ID (NEW_SVG) after successfully created
      let newSvgID = formState.model.svgID;
      if (!formState.isEditMode && newSvgID === VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.SVG_ID) {
        // old logic:
        // newSvgID = new Date().getTime().toString() + Math.floor(Math.random() * 10000)
        newSvgID = generateUUID();
      }
      if (formState.model.svgID !== newSvgID) {
        ViewerAnnotationService.changeSVGId({
          svgID: formState.model.svgID,
          newSvgID: newSvgID,
        });
        formState.model.svgID = newSvgID;
      }

      // update the tuple
      formState.model.tuple = resultTuple;
      formState.model.canUpdate = resultTuple.canUpdate;
      formState.model.canDelete = resultTuple.canDelete;
      formState.model.isStoredInDB = true;

      // update the color
      formState.model.colors = formState.svgAnnotationData[0].stroke;

      // update the annotationModels
      const rowIndex = formState.index;
      if (typeof rowIndex === 'number') { // it's part of the form
        setAnnotationModels((prev) => {
          return prev.map((annot, i) => {
            if (i !== rowIndex) return annot;
            return { ...formState.model };
          });
        });
      } else { // should be added to the form
        setAnnotationModels((prev) => [...prev, { ...formState.model }]);
      }

      setShowAnnotationFormSpinner(false);
      closeAnnotationForm();
      addAlert('Your data has been saved.', ChaiseAlertType.SUCCESS);
    });
  };

  /**
   * this callback will be fired when users try to navigate away from the page
   * NOTE custom message is not supported by modern browsers anymore, but
   *      for consistency I've added it.
   */
  const annotationFormLeaveAlertEvent = (e: any) => {
    // make sure annotation panel is open
    if (currentAnnotationFormState.current !== null) {
      e.returnValue = 'Any unsaved change will be discarded. Do you want to continue?';
    }
  }

  /**
   * can be used to switch between create, edit, and view mode.
   */
  const changeAnnotationFormState = (item?: ViewerAnnotationModal, index?: number, event?: any) => {
    const annotConfig = ViewerConfigService.annotationConfig;

    // avoid calling the parent (highlight) action
    if (event) {
      event.stopPropagation();
    }

    // if item is null, we just wanted to switch away from edit/create mode
    if (!item) {
      // remove the form props so the form disappears
      setAnnotationFormProps(null);

      // clear the state
      currentAnnotationFormState.current = null;

      // we don't need the warning event listener anymore
      windowRef.removeEventListener('beforeunload', annotationFormLeaveAlertEvent);

      // change back the app mode
      LogService.changeAppMode(LogAppModes.DEFAULT);
      return;
    }

    // make sure users are warned that data might be lost
    windowRef.addEventListener('beforeunload', annotationFormLeaveAlertEvent);

    // make sure none of the annotations are highlighted
    const hIndex = highlightedAnnotationIndexRef.current;
    if (hIndex !== -1) {
      const hAnnot = annotationModelsRef.current[hIndex];
      if (hAnnot) {
        ViewerAnnotationService.highlightAnnotation({
          svgID: hAnnot.svgID,
          groupID: hAnnot.groupID,
        });
      }
      setHighlightedAnnotationIndex(-1);
    }

    /**
     *
     * this is supporting a case when users attempt to edit an annotation
     * that is not saved in database. which means the annotation is coming
     * from file. but we don't even allow users to edit an annotation that
     * is coming from file (and not db).
     * that being said, I left this create-preselect mode here anyways in case we wanted to allow this later.
     */
    const hasDrawnAnnotation = typeof index === 'number';
    const isEditMode = hasDrawnAnnotation && isObjectAndNotNull(item.tuple);
    let preselectedAnatomy: any, logAppMode = isEditMode ? LogAppModes.EDIT : LogAppModes.CREATE;
    if (hasDrawnAnnotation && !item.tuple) {
      logAppMode = LogAppModes.CREATE_PRESELECT;
      preselectedAnatomy = {};
      preselectedAnatomy[annotConfig.annotated_term_column_name] = item.id;
    }

    // set the state
    currentAnnotationFormState.current = { model: { ...item }, index: index, isEditMode };

    // change the app mode
    LogService.changeAppMode(logAppMode);

    // send a message to osd viewer to signal the start of edit (used for discarding changes)
    if (hasDrawnAnnotation) {
      ViewerAnnotationService.startAnnotationChange({ svgID: item.svgID, groupID: item.groupID });
    }

    // switch to drawing mode
    toggleDrawingMode(undefined, true);

    // set the form props so it shows up
    const usedReference = isEditMode ? ViewerAnnotationService.annotationEditReference : ViewerAnnotationService.annotationCreateReference;
    setAnnotationFormProps({
      canDelete: item.canDelete,
      appMode: isEditMode ? appModes.EDIT : appModes.CREATE,
      config: { displayMode: RecordeditDisplayMode.VIEWER_ANNOTATION },
      reference: usedReference,
      logInfo: {
        logAppMode,
        logStack: ViewerAnnotationService.getAnnotationLogStack(isEditMode ? item : undefined),
        logStackPath: ViewerAnnotationService.getAnnotationLogStackPath(isEditMode ? item : undefined)
      },
      queryParams: {},
      hiddenColumns: [
        annotConfig.overlay_column_name,
        annotConfig.reference_image_visible_column_name,
        annotConfig.z_index_column_name,
        annotConfig.channels_column_name
      ],
      foreignKeyCallbacks: {
        getDisabledTuples: getAnnotatedTermDisabledTuples,
        onChange: onAnnotatedTermInputChange
      },
      prefillRowData: preselectedAnatomy ? [preselectedAnatomy] : undefined,
      initialTuples: isEditMode ? [item.tuple] : undefined,
      onSubmitSuccess: onSubmitAnnotationSuccess,
      onSubmitError: () => {
        setShowAnnotationFormSpinner(false);
        return true;
      },
      modifySubmissionRows: (submissionRows: any[]) => {
        const formState = currentAnnotationFormState.current;

        // these are sanity checks to get rid of ts errors and won't happen
        if (!Array.isArray(submissionRows) || submissionRows.length === 0 || !formState || !formState.svgAnnotationData) return;

        // this is called on the success, so we can just show the
        setShowAnnotationFormSpinner(true);

        // add the image value
        submissionRows[0][annotConfig.reference_image_column_name] = imageIDRef.current;

        // add the default z index value
        if (defaultZIndex.current !== null && defaultZIndex.current !== undefined) {
          submissionRows[0][annotConfig.z_index_column_name] = defaultZIndex.current;
        }

        // add the file
        // <Image_RID>_<Anatomy_ID>_z<Z_Index>.svg
        let fileName = `${imageIDRef.current}_${submissionRows[0][annotConfig.annotated_term_column_name]}`;
        if (defaultZIndex.current !== null && defaultZIndex.current !== undefined) {
          fileName += `_z${defaultZIndex.current}.svg`;
        }
        const file = new File([formState.svgAnnotationData[0].svg], fileName, { type: 'image/svg+xml' });
        submissionRows[0][annotConfig.overlay_column_name] = {
          uri: fileName,
          file: file,
          fileName: fileName,
          fileSize: file.size,
          hatracObj: new ConfigService.ERMrest.Upload(file, {
            column: usedReference.columns.find((column: any) => { return column.name === annotConfig.overlay_column_name }),
            reference: usedReference
          })
        };

      }
    });

  };

  /**
   * sends the delete request
   */
  const deleteAnnotation = (index: number) => {
    const annot = annotationModelsRef.current[index];
    if (!annot) return;

    setShowAnnotationFormSpinner(true);
    const logObj = {
      action: ViewerAnnotationService.getAnnotationLogAction(LogActions.DELETE, annot),
      stack: ViewerAnnotationService.getAnnotationLogStack(annot)
    };

    annot.tuple.reference.delete(null, logObj).then(() => {
      // remove svg object from openseadragon
      if (annot.svgID) {
        ViewerAnnotationService.removeSVG({ svgID: annot.svgID });
      }

      // remove from the list
      setAnnotationModels((prev) => prev.filter((_, i) => i !== index));

      // close the current panel if it's open
      closeAnnotationForm();

    }).catch((error: any) => {
      dispatchError({ error, isDismissible: true });
    }).finally(() => setShowAnnotationFormSpinner(false))
  }

  /**
   * can be used for logging client actions
   */
  const logViewerClientAction = (action: LogActions, isAnnotation: boolean, item?: ViewerAnnotationModal, extraInfo?: any) => {
    if (isAnnotation) {
      ViewerAnnotationService.logAnnotationClientAction(action, item, extraInfo);
    } else {
      const stack = isObjectAndNotNull(extraInfo) ? LogService.addExtraInfoToStack(logInfo.logStack, extraInfo) : logInfo.logStack;
      LogService.logClientAction({
        action: LogService.getActionString(action, null, ''),
        stack
      }, reference.defaultLogInfo);
    }
  };

  // ---------------------- UI callbacks ------------------- //
  const toggleAnnotationSidebar = () => {
    setHideAnnotationSidebar((prev: boolean) => {
      const action = prev ? LogActions.VIEWER_ANNOT_PANEL_SHOW : LogActions.VIEWER_ANNOT_PANEL_HIDE;
      logViewerClientAction(action, false);
      return !prev;
    })
  };

  /**
   * callback when user clicked on the edit button for an annotation
   * @param index the annotation index
   * @param event the client event
   */
  const startAnnotationEdit = (index: number, event: any) => {
    const annot = annotationModelsRef.current[index];
    // if the annotation is coming from file, we're going to technically create it
    const action = annot.tuple ? LogActions.EDIT_INTEND : LogActions.ADD_INTEND;
    // log the client action
    logViewerClientAction(action, true, annot);

    // open the form
    changeAnnotationFormState(annotationModelsRef.current[index], index, event);
  };

  /**
   * callback for when users click on the New button for an annotation
   * @param event the client action
   */
  const startAnnotationCreate = (event: any) => {
    // log the client action
    logViewerClientAction(LogActions.ADD_INTEND, true);

    const svgID = VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.SVG_ID;
    const groupID = VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.GROUP_ID;

    // all of these will be populated in the end
    const newAnnot: ViewerAnnotationModal = {
      isDisplayed: true,
      svgID,
      groupID,
      anatomy: '',
      url: '',
      isStoredInDB: false,
      canUpdate: false,
      canDelete: false,
      colors: [],
      logStackNode: undefined
    };

    // open the form
    changeAnnotationFormState(newAnnot, undefined, event);

    /**
     * NOTE the osd-viewer expect this one to be called after the call to switch the draw mode (done as part of changeAnnotationFormState).
     * if we call this before switching the draw mode, the default color won't be populated. this is because the
     * drawAnnotationMode only works if the `NEW_SVG` svg group is not there. otherwise it will just find a match
     * and won't change the color.
     */
    // Notify OSD to create a new svg and group for annotations
    ViewerAnnotationService.startAnnotationCreate({
      svgID,
      groupID,
      anatomy: '',
      description: ''
    });
  };

  /**
   * can be used to switch from create/edit mode to view mode
   */
  const closeAnnotationForm = () => {
    const formState = currentAnnotationFormState.current;
    if (!formState) return;

    // if in drawing mode, switch
    if (isInDrawingModeRef.current) {
      toggleDrawingMode();
    }

    /**
     * if the current annotation is still unsaved, remove the drawing from openseadragon
     */
    if (
      formState.model.svgID === VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.SVG_ID ||
      formState.model.groupID === VIEWER_CONSTANT.OSD_VIEWER.NEW_ANNOTATION.GROUP_ID
    ) {
      // Remove the new created svg and group if not saved
      ViewerAnnotationService.removeSVG({ svgID: formState.model.svgID });
    }
    else if (typeof formState.index === 'number') {
      const origAnnot = annotationModelsRef.current[formState.index];

      // if anatomy has been changed, change it back
      if (formState.model.groupID !== origAnnot.groupID) {
        // signal osd to change the groupID back
        ViewerAnnotationService.changeGroupInfo({
          svgID: formState.model.svgID,
          groupID: formState.model.groupID,
          newGroupID: origAnnot.groupID,
          newAnatomy: origAnnot.anatomy
        });
      }

      // send a message to osd viewer to discard the changes
      ViewerAnnotationService.discardAnnotationChange({
        svgID: formState.model.svgID,
        groupID: formState.model.groupID
      });


    }

    // close the form
    changeAnnotationFormState();
  };

  /**
   * will be called when users clicked on the submit button.
   * calls osd-viewer to get the svg annotation
   */
  const submitAnnotationForm = () => {
    const formState = currentAnnotationFormState.current;
    if (!formState) {
      // if this happens, it's a programmatic error
      // just added for sanity check
      throw new Error('submitAnnotationForm called when there are no form present.');
    }

    removeAllAlerts();
    setDisplayDrawingRequiredError(false);
    ViewerAnnotationService.saveAnnotationRecord({
      svgID: formState.model.svgID,
      groupID: formState.model.groupID
    })
  };

  /**
   * will be called when users click on delete button for an annotation.
   * if index=-1, then they clicked the delete on the anntoation form.
   */
  const startAnnotationDelete = (index: number, event: any) => {
    let annot: ViewerAnnotationModal;
    if (index >= 0) {
      annot = annotationModelsRef.current[index];
    } else {
      const formState = currentAnnotationFormState.current;
      if (!formState || typeof formState.index !== 'number') {
        // if this happens, it's a programmatic error
        // just added for sanity check and to remove the typescript errors
        throw new Error('startAnnotationDelete called without proper index when there are no form present.');
      }
      annot = formState.model;
      index = formState.index;
    }

    if (event) {
      event.stopPropagation();
    }

    validateSessionBeforeMutation(() => {
      if (ConfigService.chaiseConfig.confirmDelete === undefined || ConfigService.chaiseConfig.confirmDelete) {
        logViewerClientAction(LogActions.DELETE_INTEND, true, annot);

        setDeleteAnnotationConfirmProps({
          message: (
            <>
              Are you sure you want to delete <code>{annot.name + (annot.id ? ` (${annot.id})` : '')}</code> annotation?
            </>
          ),
          onConfirm: () => {
            setDeleteAnnotationConfirmProps(null);
            deleteAnnotation(index);
          },
          onCancel: () => {
            setDeleteAnnotationConfirmProps(null);
            logViewerClientAction(LogActions.DELETE_CANCEL, true, annot);
          }
        })
      } else {
        deleteAnnotation(index);
      }
    });
  };

  /**
   * toggle the drawing mode
   */
  const toggleDrawingMode = (event?: any, changeColor?: boolean) => {
    const res = !isInDrawingModeRef.current;

    // remove the error since they switched modes
    setDisplayDrawingRequiredError(false);

    ViewerAnnotationService.drawAnnotation({
      svgID: currentAnnotationFormState.current?.model?.svgID,
      groupID: currentAnnotationFormState.current?.model?.groupID,
      mode: res ? 'ON' : 'OFF',
      setStroke: (changeColor === true) // change the color that is used in toolbar
    });

    if (event) {
      // log the client action
      logViewerClientAction(
        res ? LogActions.VIEWER_ANNOT_DRAW_MODE_SHOW : LogActions.VIEWER_ANNOT_DRAW_MODE_HIDE,
        true,
        currentAnnotationFormState.current?.model
      );

      event.stopPropagation();
    }

    setIsInDrawingMode(prev => !prev);
  };

  /**
   * toggle display of annotation
   */
  const toggleAnnotationDisplay = (index: number, event?: any) => {
    setAnnotationModels((prev) => {
      return prev.map((annot, i) => {
        if (i !== index) return annot;
        const isDisplayed = !annot.isDisplayed;

        // notify openseadragon to update the display
        ViewerAnnotationService.changeAnnotationVisibility({
          svgID: annot.svgID,
          groupID: annot.groupID,
          isDisplay: isDisplayed
        });

        if (event) {
          // log the client action
          const action = isDisplayed ? LogActions.VIEWER_ANNOT_SHOW : LogActions.VIEWER_ANNOT_HIDE;
          logViewerClientAction(action, true, annot);

          event.stopPropagation();
        }

        return { ...annot, isDisplayed };
      });
    });
  };

  const changeAllAnnotationVisibility = (show: boolean) => {
    ViewerAnnotationService.changeAllAnnotationVisibility({
      isDisplay: show
    });

    const action = show ? LogActions.VIEWER_ANNOT_DISPLAY_ALL : LogActions.VIEWER_ANNOT_DISPLAY_NONE;
    logViewerClientAction(action, true);

    setAnnotationModels(prev => {
      return prev.map(annot => ({ ...annot, isDisplayed: show }));
    });
  };

  /**
   * change the highlighted annotation
   */
  const toggleHighlightAnnotation = (index: number, event?: any, fromOSD?: boolean, forceHighlight?: boolean) => {
    const isHighlighted = forceHighlight || highlightedAnnotationIndexRef.current !== index;
    const annot = annotationModelsRef.current[index];

    if (isHighlighted && !annot.isDisplayed) {
      toggleAnnotationDisplay(index);
    }

    // Notify openseadragon to highlight the annotations
    if (!fromOSD) {
      ViewerAnnotationService.highlightAnnotation({
        svgID: annot.svgID,
        groupID: annot.groupID,
      });
    }

    if (event) {
      // log the client action
      if (isHighlighted) {
        logViewerClientAction(LogActions.VIEWER_ANNOT_HIGHLIGHT, true, annot);
      }

      event.stopPropagation();
    }

    /**
     * the updated function will be called twice in dev mode, that's why
     * the log and calling osd-viewer is done outside of the updater
     */
    setHighlightedAnnotationIndex((prev) => (prev !== index || forceHighlight) ? index : -1);
  }

  const providerValue = useMemo(() => {
    return {
      imageID,
      initialized,
      pageTitle,
      hideAnnotationSidebar,
      toggleAnnotationSidebar,
      annotationModels,
      loadingAnnotations,
      canCreateAnnotation,
      annotationFormProps,
      submitAnnotationForm,
      showAnnotationFormSpinner,
      closeAnnotationForm,
      startAnnotationCreate,
      startAnnotationEdit,
      startAnnotationDelete,
      deleteAnnotationConfirmProps,
      displayDrawingRequiredError,
      toggleDrawingMode,
      isInDrawingMode,
      toggleAnnotationDisplay,
      changeAllAnnotationVisibility,
      highlightedAnnotationIndex,
      toggleHighlightAnnotation,
      logViewerClientAction
    }
  }, [
    imageID,
    initialized,
    pageTitle,
    hideAnnotationSidebar,
    annotationModels,
    loadingAnnotations,
    canCreateAnnotation,
    annotationFormProps,
    showAnnotationFormSpinner,
    deleteAnnotationConfirmProps,
    displayDrawingRequiredError,
    isInDrawingMode,
    highlightedAnnotationIndex,
  ]);

  return (
    <ViewerContext.Provider value={providerValue}>
      {children}
    </ViewerContext.Provider>
  )
}
