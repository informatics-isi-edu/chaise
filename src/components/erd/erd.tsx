import '@isrd-isi-edu/chaise/src/assets/scss/_erd.scss';

// components
import Footer from '@isrd-isi-edu/chaise/src/components/footer';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// hooks
import { useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react';

const ERD = (): JSX.Element => {

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
            <div className='container'>
              MAIN CONTENT
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default ERD;
