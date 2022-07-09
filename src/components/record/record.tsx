import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';

import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';
import Alerts from '@isrd-isi-edu/chaise/src/components/alerts';
import RecordProvider from '@isrd-isi-edu/chaise/src/providers/record';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import { useEffect } from 'react';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';


export type RecordProps = {
  reference: any
}

const Record = ({
  reference
}: RecordProps): JSX.Element => {
  return (
    <AlertsProvider>
      <RecordProvider
        reference={reference}
      >
        <RecordInner />
      </RecordProvider>
    </AlertsProvider>
  )
};

const RecordInner = () : JSX.Element => {
  const { page, readMainEntity } = useRecord();

  useEffect(() => {
    // get the data
    readMainEntity();
  }, []);

  // TODO does this make sense?
  if (!page) {
    return <ChaiseSpinner/>
  }

  return (
    <div className='record-container app-content-container'>
      {/* TODO spinner was here with this: (!displayReady || showSpinner) && !error */}
      <div className='top-panel-container'>
        <Alerts/>
        {/* TODO */}
      </div>
      {/* TODO eventually split-view should be used here as well */}
      <div className='bottom-panel-container'>
        {/* TODO table of contents */}
        <div className='main-container dynamic-padding'>
          <div className='main-body'>
            {/* TODO RECORD CONTENT GOES HERE */}
            {/* the following should be removed: */}
            <span>
              Rowname: <DisplayValue value={page.tuples[0].displayname} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Record;


