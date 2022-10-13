import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';

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
import MarkdownHelp from '@isrd-isi-edu/chaise/src/components/help/md-help';


const helpSettings = {
  appName: 'help',
  appTitle: 'Wiki Pages',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,    // links in navbar might need this
  overrideExternalLinkBehavior: true      // links in navbar might need this
};

const markdownHelpPages: any = {
  home: {
    file: 'home.md',
    title: 'Chaise help pages'
  },
  'viewer-annotation': {
    file: 'viewer-annotation.md',
    title: 'Viewer annotation drawing tools'
  }
}

const componentHelpPages: any = {
  'markdown-help': {
    title: 'Markdown Help'
  }
}

const HelpApp = (): JSX.Element => {
  const { dispatchError } = useError();
  const [helpContent, setHelpContent] = useState<any>(null);
  const [pageName, setPageName] = useState<string>('home');
  const [page, setPage] = useState<any>(markdownHelpPages['home']);
  const [isComponent, setIsComponent] = useState<boolean>(false);

  useEffect(() => {
    let tempPageName = getQueryParam(windowRef.location.href, 'page');

    // remove the hash (the qetQueryParam doesn't do that properly)
    if (typeof tempPageName === 'string') {
      const parts = tempPageName.split('#');
      if (parts.length > 0) {
        tempPageName = parts[0];
      }

      if (tempPageName) setPageName(tempPageName);
    }

    const tempPage = markdownHelpPages[tempPageName || pageName];
    if (tempPage) {
      setPage(tempPage);
      // content is in a .md file
      updateHeadTitle(tempPage.title);

      let tempHelpContent: string;
      ConfigService.http.get(chaiseDeploymentPath() + 'help/' + tempPage.file).then((res: any) => {
        console.log(res)
        tempHelpContent = res.data;

        return ConfigService.ERMrest.onload();
      }).then(() => {
        setHelpContent(ConfigService.ERMrest.renderMarkdown(tempHelpContent));
      }).catch((err: any) => {
        dispatchError({ error: err });
      });
    } else {
      // load a help page component
      setIsComponent(true)
    }
  }, []);

  return (
    <div className='app-container help-container'>
      <div className='app-content-container'>
        <div className='bottom-panel-container'>
          <div className='main-container'>
            <div className='main-body container'>
              {page && <div dangerouslySetInnerHTML={{ __html: helpContent }} className='markdown-container help-content'></div>}
              {isComponent && <MarkdownHelp />}
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
