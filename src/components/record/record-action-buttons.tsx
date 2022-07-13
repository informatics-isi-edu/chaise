import '@isrd-isi-edu/chaise/src/assets/scss/_record.scss';
import Button from 'react-bootstrap/Button';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

/**
 * Record Action Types can be create, delete, copy, and edit
 */
export enum ACTION_TYPES {
  CREATE,
  DELETE,
  EDIT,
  COPY
}

export type RecordActionButtonsProps = {
  onAction: (type: ACTION_TYPES, event: any) => void
};

/**
 * Returns Related Section of the record page.
 */
const RecordActionButtons = ({
  onAction
}: RecordActionButtonsProps): JSX.Element => {
  return (
    <div className='title-buttons record-action-btns-container'>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to create a record.'
      >
        <Button className='chaise-btn chaise-btn-primary' onClick={(event: any) => onAction(ACTION_TYPES.CREATE, event)}>
          <span className='chaise-btn-icon fa fa-plus'></span>
          Create
        </Button>
      </ChaiseTooltip>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to create a copy of this record'
      >
        <Button className='chaise-btn chaise-btn-primary' onClick={(event: any) => onAction(ACTION_TYPES.COPY, event)}>
          <span className='chaise-btn-icon fa fa-clipboard'></span>
          Copy
        </Button>
      </ChaiseTooltip>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to edit this record'
      >
        <Button className='chaise-btn chaise-btn-primary' onClick={(event: any) => onAction(ACTION_TYPES.EDIT, event)}>
          <span className='chaise-btn-icon fa fa-pencil'></span>
          Edit
        </Button>
      </ChaiseTooltip>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip='Click here to delete this record'
      >
        <Button className='chaise-btn chaise-btn-primary' onClick={(event: any) => onAction(ACTION_TYPES.DELETE, event)}>
          <span className='chaise-btn-icon fa fa-trash-alt'></span>
          Delete
        </Button>
      </ChaiseTooltip>
    </div>
  );
};

export default RecordActionButtons;
