
// components
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ShareCiteModal, { ShareCiteModalProps } from '@isrd-isi-edu/chaise/src/components/modals/share-cite-modal';
import Spinner from 'react-bootstrap/Spinner';

// hooks
import { useState } from 'react';
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';

// models
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';
import { CitationModel } from '@isrd-isi-edu/chaise/src/models/record';

// services
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

// utilities
import { isGroupIncluded } from '@isrd-isi-edu/chaise/src/utils/authn-utils';

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
  }[],
  onBtnClick?: (e: any) => void,
  btnClass?: string,
  btnTooltip?: {
    pending: string,
    ready: string
  }
};

const ShareCiteButton = ({
  reference,
  tuple,
  logStack,
  logStackPath,
  citation,
  title,
  hideHeaders,
  extraInfo,
  onBtnClick,
  btnClass,
  btnTooltip
}: ShareCiteButtonProps): JSX.Element => {

  const { session } = useAuthn();

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
      extraInfo,
      logStack,
      logStackPath,
    });
  }

  const onButtonClick = (e: any) => {
    if (onBtnClick) onBtnClick(e);

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

  const canShowShareCiteBtn = isGroupIncluded(ConfigService.chaiseConfig.shareCiteAcls.show, session);
  const canEnableShareCiteBtn = isGroupIncluded(ConfigService.chaiseConfig.shareCiteAcls.enable, session);

  if (!btnTooltip) {
    btnTooltip = { pending: 'Opening the share and cite links...', ready: 'Show the share and cite links.' };
  }

  return (
    <>
      {canShowShareCiteBtn &&
        <ChaiseTooltip
          placement='bottom-start'
          tooltip={waitingForModal ? btnTooltip?.pending : btnTooltip?.ready}
          dynamicTooltipString
        >
          <button
            className={btnClass ? btnClass : 'share-cite-btn chaise-btn chaise-btn-primary'}
            onClick={onButtonClick}
            disabled={!canEnableShareCiteBtn || waitingForModal}
          >
            {!waitingForModal && <span className='chaise-btn-icon fa fa-share-square'></span>}
            {waitingForModal && <span className='chaise-btn-icon'><Spinner animation='border' size='sm' /></span>}
            <span>Share and cite</span>
          </button>
        </ChaiseTooltip>
      }
      {shareModalProps &&
        <ShareCiteModal {...shareModalProps} />
      }
    </>
  );
}

export default ShareCiteButton;
