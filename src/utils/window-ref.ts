interface ICustomWindow extends Window {
  // WID
  name: string;
  // ERMrset object that is attached to window in ermrestjs:
  ERMrest: any;
  chaiseBuildVariables: any;
  // chaiseConfig is attached to the window with the chaise-config.js file
  chaiseConfig: any;
  dcctx: {
    // the object that will be logged with every request:
    contextHeaderParams: {
      cid: string,
      pid: string,
      wid: string
    },
    // the settings that all chaise apps (including deriva webapps) honor
    settings: {
      hideNavbar: boolean,
      appTitle: string,
      overrideHeadTitle: boolean,
      overrideDownloadClickBehavior: boolean,
      overrideExternalLinkBehavior: boolean,
      openLinksInTab: boolean
    }
  }
}

declare var window: ICustomWindow;

export const windowRef = window;
