import axios from "axios";
import Q from "q";
import { windowRef } from "../utils/window-ref";

export default class ERMrestService {
  private static _ermrest : any;
  private static _server: any;
  static setupDone = false;

  static get() {
    if (ERMrestService.setupDone) {
      return ERMrestService._ermrest;
    }
    return null;
  }


  static server () {
    if (ERMrestService.setupDone) {
      return ERMrestService._server;
    }
    return null;
  }


  static async setup() {
    ERMrestService._ermrest = windowRef.ERMrest;

    ERMrestService._ermrest.configure(axios, Q);

    await ERMrestService._ermrest.onload();

    // TODO FunctionUtils.registerErmrestCallbacks

    // TODO


    // TODO create the server based on ermrest location

    ERMrestService.setupDone = true;
    return ERMrestService._ermrest;

  }
}
