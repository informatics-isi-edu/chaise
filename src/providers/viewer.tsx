// hooks
import { createContext, useEffect, useMemo, useRef, useState } from 'react';

// hooks
import useAlert from '@isrd-isi-edu/chaise/src/hooks/alerts';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';
import useStateRef from '@isrd-isi-edu/chaise/src/hooks/state-ref';


// models
import { MultipleRecordError } from '@isrd-isi-edu/chaise/src/models/errors';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { ViewerConfigService } from '@isrd-isi-edu/chaise/src/services/viewer-config';

// utils
import { isObjectAndNotNull, isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import { hasURLQueryParam, initializeOSDParams, loadImageMetadata, readAllAnnotations } from '@isrd-isi-edu/chaise/src/utils/viewer-utils';
import { VIEWER_CONSTANT } from '@isrd-isi-edu/chaise/src/utils/constants';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { getDisplaynameInnerText } from '@isrd-isi-edu/chaise/src/utils/data-utils';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';


export const ViewerContext = createContext<{
  /**
   * the reference object of the Image table.
   */
  reference: any,
  /**
   * whether the page is initialized and we can start showing the elements
   */
  initialized: boolean
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
  const { dispatchError, errors } = useError();

  /**
   * whether we've initialized the page or not
   */
  const [initialized, setInitialized] = useState(true);

  const [pageTitle, setPageTitle] = useState('Image');

  /**
   * whether we're waiting for annotations or not
   */
  const [loadingAnnotations, setLoadingAnnotations] = useState(true);
  const [hideAnnotationSidebar, setHideAnnotationSidebar] = useState(true);

  const annotationTuples = useRef([]);

  const imageID = useRef();
  /**
   * if default z-index is missing, we're using 0
   */
  const defaultZIndex = useRef(0);

  const osdViewerParameters = useRef<any>();

  useEffect(() => {
    if (!initialized) return;
    const imageConfig = ViewerConfigService.imageConfig;
    const osdConstant = VIEWER_CONSTANT.OSD_VIEWER;

    let imageTuple: any, imageURI: string;
    let computedPageTitle : string, headTitleDisplayname : any;

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
            console.log(`The ${imageConfig.legacy_osd_url_column_name} value is empty in Image table.`);
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
            setPageTitle('<a href="' + imageTuple.reference.contextualize.detailed.appLink + '">' + pageTitleCaption.value + '</a>');
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

      return loadImageMetadata(osdViewerParameters);

    }).then(function () {
      // dont fetch annotation from db if:
      // - we have annotation query params
      // - or main image request didn't return any rows
      if (hasAnnotationQueryParam || noImageData) {
        return false;
      }

      // read the annotation reference
      return readAllAnnotations(true);
    }).then(function () {

      // view <table displayname>: tuple displayname
      let headTitle = `View ${getDisplaynameInnerText(reference.displayname)}`;
      if (headTitleDisplayname) {
        headTitle += `:  ${getDisplaynameInnerText(headTitleDisplayname)}`;
      }
      updateHeadTitle(headTitle);

      // TODO

    }).catch((error: any) => {
      dispatchError({ error })
    });

  }, [initialized]);



  const providerValue = useMemo(() => {
    return {
      reference,
      initialized
    }
  }, []);

  return (
    <ViewerContext.Provider value={providerValue}>
      {children}
    </ViewerContext.Provider>
  )
}
