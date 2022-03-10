import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faShare, faSyncAlt,
  faSearch,
  faFileExport, faBookmark
} from '@fortawesome/free-solid-svg-icons';

/**
 * Include all the fonts that are used by components
 */
export default class FontAwesome {
  static addNavbarFonts() {
    library.add(faShare, faSyncAlt);
  }

  static addRecordSetFonts() {
    library.add(faBookmark);
  }

  static addSearchInputFonts() {
    library.add(faSearch);
  }

  static addExportFonts() {
    library.add(faFileExport, faSyncAlt)
  }
}
