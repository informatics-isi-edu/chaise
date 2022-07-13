import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';
import Button from 'react-bootstrap/Button';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import Export from '@isrd-isi-edu/chaise/src/components/export';

/**
 * Page Action Types can be create, delete, copy, and edit
 */
export enum PAGE_ACTION_TYPES {
  SHOW_EMPTY,
  SHARE_CITE,
}

export type RecordPageActionButtonsProps = {
  onAction: (type: PAGE_ACTION_TYPES, event: any) => void;
};

/**
 * Returns Related Section of the record page.
 */
const RecordPageActionButtons = ({
  onAction,
}: RecordPageActionButtonsProps): JSX.Element => {
  return (
    <>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to show empty related sections too.'
      >
        <Button className='chaise-btn chaise-btn-primary' onClick={(event: any) => onAction(PAGE_ACTION_TYPES.SHOW_EMPTY, event)}>
          <span className='chaise-btn-icon fa fa-th-list'></span>
          Show empty sections
        </Button>
      </ChaiseTooltip>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to show an export format'
      >
        <Export
          reference={null}
          // disabled={isLoading || !page || page.length === 0}
          disabled={false}
        />
      </ChaiseTooltip>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to show the share dialog.'
      >
        <Button className='chaise-btn chaise-btn-primary' onClick={(event: any) => onAction(PAGE_ACTION_TYPES.SHARE_CITE, event)}>
          <span className='chaise-btn-icon fa fa-share-square'></span>
          Share and cite
        </Button>
      </ChaiseTooltip>
    </>
  );
};

export default RecordPageActionButtons;
