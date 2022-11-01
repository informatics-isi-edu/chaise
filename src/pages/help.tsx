import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import MarkdownHelp from '@isrd-isi-edu/chaise/src/components/help/markdown-help';
import SwitchUserAccountsHelp from '@isrd-isi-edu/chaise/src/components/help/switch-user-accounts';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useEffect, useRef, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { InvalidHelpPage } from '@isrd-isi-edu/chaise/src/models/errors';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import { chaiseDeploymentPath, getQueryParam } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const helpSettings = {
  appName: 'help',
  appTitle: 'Wiki Pages',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,    // links in navbar might need this
  overrideExternalLinkBehavior: true      // links in navbar might need this
};

const componentHelpPages: any = {
  'markdown-help': {
    title: 'Markdown Help'
  },
  'switch-user-accounts': {
    title: 'Switch User Accounts'
  }
}

const HelpApp = (): JSX.Element => {
  const { dispatchError, errors } = useError();

  const [helpContent, setHelpContent] = useState<any>(null);
  const [isComponentPage, setIsComponentPage] = useState<boolean>(false);
  // the name of the page pulled from the query parameter
  const [pageName, setPageName] = useState<string>('');

  const [pageReady, setPageReady] = useState(false);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    let tempPageName = getQueryParam(windowRef.location.href, 'page'), tempIsComponentPage = isComponentPage;

    // remove the hash (the qetQueryParam doesn't do that properly)
    if (typeof tempPageName === 'string') {
      const parts = tempPageName.split('#');
      if (parts.length > 0) {
        tempPageName = parts[0];
      }

      if (tempPageName) setPageName(tempPageName);
    }

    let tempPage = componentHelpPages[tempPageName];
    tempIsComponentPage = tempPage ? true : false;
    setIsComponentPage(tempIsComponentPage);
    setPageReady(true);

    // content is in a .md file
    if (tempIsComponentPage) {
      // load a help page component
      tempPage = componentHelpPages[tempPageName];

      updateHeadTitle(tempPage.title);
    } else {
      let tempHelpContent: string;
      ConfigService.http.get(chaiseDeploymentPath() + 'help-pages/' + tempPageName + '.md').then((res: any) => {
        tempHelpContent = res.data;

        return ConfigService.ERMrest.onload();
      }).then(() => {
        setHelpContent(ConfigService.ERMrest.renderMarkdown(tempHelpContent));
        setPageReady(true);
      }).catch((err: any) => {

        let errMessage = 'No "page=" query parameter present in the url.'
        if (tempPageName) errMessage = `No File was found with name: "help-pages/${tempPageName}.md"`

        dispatchError({ error: new InvalidHelpPage('', errMessage) });
      });
    }
  }, []);

  /**
   * add height to container to make sure scroll behavior is correct
   */
  useEffect(() => {
    if (!pageReady) return;
    const resizeSensors = attachContainerHeightSensors();
    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());
    }
  }, [pageReady]);

  const renderHelpPage = () => {
    if (!isComponentPage) {
      return <DisplayValue value={{ isHTML: true, value: helpContent }} internal addClass />;
    }
    switch (pageName) {
      case 'markdown-help':
        return (<MarkdownHelp />);
      case 'switch-user-accounts':
        return (<SwitchUserAccountsHelp />);
      default:
        // NOTE: should never be reached
        return (<div></div>);
    }
  }

  if (!pageReady && errors.length > 0) {
    return <></>;
  }

  if (!pageReady) {
    return <ChaiseSpinner />;
  }

  return (
    <div className='app-content-container help-container'>
      {/* this is just for consistency with all apps (height logic needs it): */}
      <div className='top-panel-container'></div>
      <div className='bottom-panel-container'>
        {/* this is just for consistency with all apps (css rules need it): */}
        <div className='side-panel-resizable close-panel'></div>
        <div className='main-container'>
          <div className='main-body'>
            {/* container is a bootstrap class to make sure content is displaye in the middle */}
            {/* in other apps alerts-container is adding the padding-top */}
            <div className='container' style={{ paddingTop: '20px' }}>
              {renderHelpPage()}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById(APP_ROOT_ID_NAME) as HTMLElement);
root.render(
  <AppWrapper
    appSettings={helpSettings}
    includeAlerts={false}
    includeNavbar={true}
  >
    <HelpApp />
  </AppWrapper>
);
