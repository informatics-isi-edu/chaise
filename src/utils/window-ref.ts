interface ICustomWindow extends Window {
  ERMrest: any;
  dcctx: {
    contextHeaderParams: {
      cid: string,
      pid: string,
      wid: string
    },
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
