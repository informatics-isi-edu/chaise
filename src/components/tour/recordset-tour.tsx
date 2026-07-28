// hooks
import { useCallback, useState, type JSX } from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Tour, { useTourSeen } from '@isrd-isi-edu/chaise/src/components/tour/tour';

// utils
import { RECORDSET_DEMO_TOUR } from '@isrd-isi-edu/chaise/src/components/tour/demo-steps';

/** identifies this tour in storage; would come from the annotation once it is not hardcoded */
const RECORDSET_TOUR_ID = 'recordset-demo';

/**
 * The tour launcher for the recordset app, plus the tour itself.
 *
 * The button is always available so anyone can replay the tour, and it pulses only until the
 * user has been through it once. That is the deliberate alternative to auto-launching: nothing
 * happens on load unless the user opts in.
 *
 * NOTE: proof of concept. The steps are hardcoded in demo-steps.ts, not read from an annotation.
 */
const RecordsetTour = (): JSX.Element => {
  const [run, setRun] = useState(false);
  const { seen, markSeen } = useTourSeen(RECORDSET_TOUR_ID);

  const startTour = useCallback(() => {
    setRun(true);
    // stop pulsing as soon as they engage, rather than waiting for them to reach the end
    markSeen();
  }, [markSeen]);

  const finishTour = useCallback(() => {
    setRun(false);
    markSeen();
  }, [markSeen]);

  return (
    <>
      <ChaiseTooltip placement='bottom' tooltip='Take a quick tour of this page'>
        <button
          className={`chaise-btn chaise-btn-primary tour-launcher-btn${seen ? '' : ' tour-launcher-btn-pulse'}`}
          onClick={startTour}
          type='button'
        >
          <span className='chaise-btn-icon fa-solid fa-circle-question' />
          <span>Take a tour</span>
        </button>
      </ChaiseTooltip>
      <Tour steps={RECORDSET_DEMO_TOUR} run={run} onFinish={finishTour} />
    </>
  );
};

export default RecordsetTour;
