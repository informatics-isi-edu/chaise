import { useState } from 'react';

// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ShareCiteModal, { ShareCiteModalProps } from '@isrd-isi-edu/chaise/src/components/modals/share-cite-modal';
import Spinner from 'react-bootstrap/Spinner';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { CitationModel } from '@isrd-isi-edu/chaise/src/models/record';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';

type ShareCiteButtonProps = {
  reference: any,
  tuple: any,
  logStack?: any,
  logStackPath?: string,
  citation: CitationModel,
  title?: string,
  hideHeaders?: boolean,
  extraInfo?: {
    title: string,
    value: string,
    link?: string
  }[]
};

const ShareCiteButton = ({
  reference,
  tuple,
  logStack,
  logStackPath,
  citation,
  title,
  hideHeaders,
  extraInfo
}: ShareCiteButtonProps): JSX.Element => {
  // TODO viewer app: should be changed so it's also useful in viewer app
  const [waitingForModal, setWaitingForModal] = useState(false);
  const [shareModalProps, setShareModalProps] = useState<ShareCiteModalProps | null>(null);

  const showShareModal = (showVersionWarning: boolean) => {
    setShareModalProps({
      onClose: () => setShareModalProps(null),
      tuple,
      reference,
      citation,
      showVersionWarning,
      title,
      hideHeaders,
      extraInfo
    });
  }

  const onButtonClick = () => {
    if (!reference.table.supportHistory) {
      showShareModal(false);
      return;
    }

    // see if we need to show the version warning or not
    const stack = logStack ? logStack : LogService.getStackObject();
    const snaptimeHeader = {
      action: LogService.getActionString(LogActions.SHARE_OPEN, logStackPath),
      stack: stack,
      catalog: reference.defaultLogInfo.catalog,
      schema_table: reference.defaultLogInfo.schema_table
    }

    setWaitingForModal(true);
    reference.table.schema.catalog.currentSnaptime(snaptimeHeader).then((snaptime: any) => {
      // if current fetched snpatime doesn't match old snaptime, show a warning
      showShareModal(snaptime !== reference.table.schema.catalog.snaptime);
      setWaitingForModal(false);
    }).catch(function () {
      showShareModal(false);
      setWaitingForModal(false);
    });
  };


  return (
    <>
      <ChaiseTooltip
        placement='bottom-start'
        tooltip={waitingForModal ? 'Opening the share dialog...' : 'Click here to show the share dialog.'}
      >
        <button className='share-cite-btn chaise-btn chaise-btn-primary' onClick={onButtonClick} disabled={waitingForModal}>
          {!waitingForModal && <span className='chaise-btn-icon fa fa-share-square'></span>}
          {waitingForModal && <span className='chaise-btn-icon'><Spinner animation='border' size='sm' /></span>}
          <span>Share and cite</span>
        </button>
      </ChaiseTooltip>
      {shareModalProps &&
        <ShareCiteModal {...shareModalProps} />
      }
    </>
  );
}

export default ShareCiteButton;
