import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faCheckSquare, faCoffee } from '@fortawesome/free-solid-svg-icons'

/**
 * Include all the fonts that are used by components
 */
export default class FontAwesome {

  static addRecordsetFonts() {
    library.add(fab, faCheckSquare, faCoffee)
  }
}
