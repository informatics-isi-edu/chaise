// models
import { ViewerConfigProps } from '@isrd-isi-edu/chaise/src/models/viewer';

// utils
import { getConfigObject } from '@isrd-isi-edu/chaise/src/utils/config';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

export class ViewerConfigService {

  private static _config: ViewerConfigProps;

  /**
   * populate the viewer config
   */
  static configure() {

    // TODO validation and adding the default values
    // https://github.com/informatics-isi-edu/chaise/issues/2083
    ViewerConfigService._config = getConfigObject(windowRef.viewerConfigs);

  }

  static get imageConfig() {
    return ViewerConfigService._config.image;
  }

  static get processsedImageConfig() {
    return ViewerConfigService._config.processed_image;
  }

  static get channelConfig() {
    return ViewerConfigService._config.image_channel;
  }

  static get annotationConfig() {
    return ViewerConfigService._config.image_annotation;
  }
}
