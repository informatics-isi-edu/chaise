import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import MarkdownHelp from '@isrd-isi-edu/chaise/src/components/help/markdown-help';
import SwitchUserAccountsHelp from '@isrd-isi-edu/chaise/src/components/help/switch-user-accounts';

// hooks
import { useEffect, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { APP_ROOT_ID_NAME } from '@isrd-isi-edu/chaise/src/utils/constants';
import { chaiseDeploymentPath, getQueryParam } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';

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
  const { dispatchError } = useError();
  const [helpContent, setHelpContent] = useState<any>(null);
  const [isComponentPage, setIsComponentPage] = useState<boolean>(false);
  // the name of the page pulled from thw uery parameter
  const [pageName, setPageName] = useState<string>('');
  const [page, setPage] = useState<any>(null);


  useEffect(() => {
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

    // content is in a .md file
    if (tempIsComponentPage) {
      // load a help page component
      tempPage = componentHelpPages[tempPageName];

      updateHeadTitle(tempPage.title);
      setPage(tempPage);
    } else {
      updateHeadTitle('Wiki Pages');

      let tempHelpContent: string;
      ConfigService.http.get(chaiseDeploymentPath() + 'help-pages/' + tempPageName + '.md').then((res: any) => {
        console.log(res)
        tempHelpContent = res.data;

        return ConfigService.ERMrest.onload();
      }).then(() => {
        setHelpContent(ConfigService.ERMrest.renderMarkdown(tempHelpContent));
      }).catch((err: any) => {

        let errMessage = 'No "page=" query parameter present in the url.'
        if (tempPageName) errMessage = `No File was found with name: "help-pages/${tempPageName}.md"`
        
        dispatchError({ error: new Error(errMessage) });
      });
    }
  }, []);

  const renderHelpPage = () => {
    if (!isComponentPage) return (<div dangerouslySetInnerHTML={{ __html: helpContent }} className='markdown-container help-content'></div>)
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

  const mainContainerClass = () => {
    return `main-container${pageName == 'markdown-help' ? ' markdown-help-page' : ''}`
  }

  return (
    <div className='app-container help-container'>
      <div className='app-content-container'>
        <div className='bottom-panel-container'>
          <div className={mainContainerClass()}>
            <div className='main-body container'>
              {renderHelpPage()}
            </div>
            <footer></footer>
          </div>
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
