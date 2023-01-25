import { createRoot } from 'react-dom/client';

// components
import AppWrapper from '@isrd-isi-edu/chaise/src/components/app-wrapper';
import MarkdownHelp from '@isrd-isi-edu/chaise/src/components/help/markdown-help';
import SwitchUserAccountsHelp from '@isrd-isi-edu/chaise/src/components/help/switch-user-accounts';
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// hooks
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { InvalidHelpPage } from '@isrd-isi-edu/chaise/src/models/errors';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { APP_NAMES, ID_NAMES, HELP_PAGES, HELP_PAGES_FOLDER_LOCATION } from '@isrd-isi-edu/chaise/src/utils/constants';
import { chaiseDeploymentPath, getQueryParam } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { updateHeadTitle } from '@isrd-isi-edu/chaise/src/utils/head-injector';
import { windowRef } from '@isrd-isi-edu/chaise/src/utils/window-ref';
import { attachContainerHeightSensors } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

const helpSettings = {
  appName: APP_NAMES.HELP,
  appTitle: 'Help Page',
  overrideHeadTitle: true,
  overrideDownloadClickBehavior: true,    // links in navbar might need this
  overrideExternalLinkBehavior: true      // links in navbar might need this
};

const HelpApp = (): JSX.Element => {
  const { dispatchError, errors } = useError();

  const [helpContent, setHelpContent] = useState<any>(null);
  const [isComponentPage, setIsComponentPage] = useState<boolean>(false);
  // the name of the page pulled from the query parameter
  const [pageName, setPageName] = useState<string>('');

  const [pageReady, setPageReady] = useState(false);

  const [showScrollToTopBtn, setShowScrollToTopBtn] = useState(false);

  const mainContainer = useRef<HTMLDivElement>(null);

  // since we're using strict mode, the useEffect is getting called twice in dev mode
  // this is to guard against it
  const setupStarted = useRef<boolean>(false);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;

    let queryParamName = getQueryParam(windowRef.location.href, 'page');

    // remove the hash (the qetQueryParam doesn't do that properly)
    if (typeof queryParamName === 'string') {
      const parts = queryParamName.split('#');
      if (parts.length > 0) {
        queryParamName = parts[0];
      }
      if (!!queryParamName) setPageName(queryParamName);
    }

    // find the help page that matches the query parameter
    const tempPage = Object.values(HELP_PAGES).find((p) => p.location === queryParamName);

    updateHeadTitle(!!tempPage ? tempPage.title : 'Help Page');

    // footer as well as markdown pages rely on ermrest, so make sure it's loaded
    if (!!tempPage && tempPage.isComponent) {
      setIsComponentPage(true);
      setPageReady(true);
    } else {
      const loc = `${chaiseDeploymentPath()}${HELP_PAGES_FOLDER_LOCATION}/${queryParamName}.md`;
      ConfigService.http.get(loc).then((res: any) => {
        setHelpContent(ConfigService.ERMrest.renderMarkdown(res.data));
        setPageReady(true);
      }).catch(() => {
        let errMessage = 'No "page=" query parameter present in the url.'
        if (queryParamName) errMessage = `The following help page doesn't exist: \n"${loc}"`
        dispatchError({ error: new InvalidHelpPage('', errMessage) });
      });
    }
  }, []);

  /**
   * add height to container to make sure scroll behavior is correct
   */
  useLayoutEffect(() => {
    if (!pageReady) return;
    const resizeSensors = attachContainerHeightSensors();

    const toggleScrollToTopBtn = () => {
      if (!mainContainer.current) return;
      setShowScrollToTopBtn(mainContainer.current.scrollTop > 300);
    }
    mainContainer.current?.addEventListener('scroll', toggleScrollToTopBtn);

    return () => {
      resizeSensors?.forEach((rs) => !!rs && rs.detach());

      mainContainer.current?.removeEventListener('scroll', toggleScrollToTopBtn);
    }
  }, [pageReady]);

  const scrollMainContainerToTop = () => {
    if (!mainContainer.current) return;

    mainContainer.current.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const renderHelpPage = () => {
    if (!isComponentPage) {
      return <DisplayValue value={{ isHTML: true, value: helpContent }} internal addClass />;
    }
    switch (pageName) {
      case HELP_PAGES.MARKDOWN_HELP.location:
        return (<MarkdownHelp />);
      case HELP_PAGES.SWITCH_USER_ACCOUNTS.location:
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
        <div className='main-container' ref={mainContainer}>
          <div className='main-body'>
            {/* container is a bootstrap class to make sure content is displaye in the middle */}
            <div className='container'>
              {renderHelpPage()}
              {showScrollToTopBtn &&
                <ChaiseTooltip placement='left' tooltip='Scroll to top of the page.'>
                  <div className='chaise-btn chaise-btn-primary back-to-top-btn' onClick={scrollMainContainerToTop}>
                    <i className='fa-solid fa-caret-up'></i>
                  </div>
                </ChaiseTooltip>
              }
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById(ID_NAMES.APP_ROOT) as HTMLElement);
root.render(
  <AppWrapper appSettings={helpSettings} includeNavbar displaySpinner ignoreHashChange>
    <HelpApp />
  </AppWrapper>
);
