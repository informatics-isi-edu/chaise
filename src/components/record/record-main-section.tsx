import '@isrd-isi-edu/chaise/src/assets/scss/_record-main-section.scss';

// components
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';
import RecordMainSectionRow from '@isrd-isi-edu/chaise/src/components/record/record-main-section-row';

// hooks
import useRecord from '@isrd-isi-edu/chaise/src/hooks/record';
import useError from '@isrd-isi-edu/chaise/src/hooks/error';

// models
import { RecordColumnModel } from '@isrd-isi-edu/chaise/src/models/record';

import type { JSX } from 'react';

/**
 * Returns Main Section of the record page.
 */
const RecordMainSection = (): JSX.Element => {
  const { errors } = useError();
  const { columnModels, showMainSectionSpinner } = useRecord();

  const hasSpinner = errors.length === 0 && showMainSectionSpinner;
  return (
    <div className={`record-main-section ${hasSpinner ? ' with-spinner' : ''}`}>
      {hasSpinner && (
        <div className='sticky-spinner-outer-container'>
          <ChaiseSpinner className='record-main-spinner manual-position-spinner' />
        </div>
      )}
      <table className='table table-fixed-layout record-main-section-table'>
        <tbody>
          {columnModels.map((cm: RecordColumnModel, index: number) => (
            <RecordMainSectionRow key={`col-${index}`} columnModel={cm} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordMainSection;
