interface ICustomWindow extends Window {
  // WID
  name: string;
  // ERMrset object that is attached to window in ermrestjs:
  ERMrest: any;
  // momentJS library object attached for easy access
  moment: any;
  // the build variables (ermrestjs expects this property)
  chaiseBuildVariables: any;
  // chaiseConfig is attached to the window with the chaise-config.js file
  chaiseConfig: any;
  // googleDatasetConfig is attached to the window with the google-dataset-config.js file
  googleDatasetConfig: any;
  dcctx: {
    // the object that will be logged with every request:
    contextHeaderParams: {
      cid: string,
      pid: string,
      wid: string
    },
    // TODO are these needed at all (we're not attaching them):
    // the settings that all chaise apps (including deriva webapps) honor
    settings?: {
      hideNavbar: boolean,
      appTitle: string,
      overrideHeadTitle: boolean,
      overrideDownloadClickBehavior: boolean,
      overrideExternalLinkBehavior: boolean,
      openLinksInTab: boolean
    }
  },
  // this is the callback that is used in recordedit to communicate with
  // the parent that the update request is done and therefore the caller
  // needs to be updated/refreshed
  updated: any
}

declare let window: ICustomWindow;

export const windowRef = window;
