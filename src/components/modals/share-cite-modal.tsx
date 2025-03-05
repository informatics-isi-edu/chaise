// hooks
import { useState, type JSX } from 'react';

// components
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';
import ChaiseSpinner from '@isrd-isi-edu/chaise/src/components/spinner';

// models
import { CitationModel } from '@isrd-isi-edu/chaise/src/models/record';
import { LogActions } from '@isrd-isi-edu/chaise/src/models/log';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import { LogService } from '@isrd-isi-edu/chaise/src/services/log';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

// utils
import { hasTrailingPeriod } from '@isrd-isi-edu/chaise/src/utils/string-utils';
import { resolvePermalink } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { getVersionDate, humanizeTimestamp } from '@isrd-isi-edu/chaise/src/utils/date-time-utils';
import { copyToClipboard } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

export type ShareCiteModalProps = {
  /**
   * The function that will be called when user clicks on 'cancel' button
   * Note: the modal won't close by itself and if that's the expected behavior,
   * you should do it in this callback.
   */
  onClose: () => void,
  /**
   * The tuple that we're trying to share
   */
  tuple: any,
  /**
   * The reference object
   */
  reference: any,
  /**
   * the citation object
   * if you don't want to show citation use { isReady: true, value: null } for this prop
   */
  citation: CitationModel,
  /**
   * whether we should show the version warning or not
   */
  showVersionWarning: boolean,
  logStack?: any,
  logStackPath?: string,
  /**
   * The title of modal
   */
  title?: string,
  /**
   * hide all the section headers.
   */
  hideHeaders?: boolean,
  extraInfo?: {
    title: string,
    value: string,
    link?: string
  }[]
};

const ShareCiteModal = ({
  onClose,
  tuple,
  reference,
  citation,
  showVersionWarning,
  title,
  hideHeaders,
  extraInfo,
  logStack,
  logStackPath,
}: ShareCiteModalProps): JSX.Element => {

  const DEFAULT_COPY_TOOLTIP = 'Copy link URL to clipboard.';
  const [versionLinkCopyTooltip, setVersionLinkCopyTooltip] = useState(DEFAULT_COPY_TOOLTIP);
  const [liveLinkCopyTooltip, setLiveLinkCopyTooltip] = useState(DEFAULT_COPY_TOOLTIP);

  const logCitationDownload = () => {
    LogService.logClientAction({
      action: LogService.getActionString(LogActions.CITE_BIBTEXT_DOWNLOAD, logStackPath),
      stack: logStack ? logStack : LogService.getStackObject()
    }, reference.defaultLogInfo);
  };

  /**
   * set the tooltip of the copy button
   * @param isVersionLink whether this is for the version link or live link
   * @param str the tooltip
   */
  const setLinkCopyTooltip = (isVersionLink: boolean, str: string) => {
    if (isVersionLink) {
      setVersionLinkCopyTooltip(str)
    } else {
      setLiveLinkCopyTooltip(str);
    }
  }

  /**
   * the callback for clicking on the copy link button
   * @param isVersionLink whether this is for the version link or live link
   */
  const onCopyToClipboard = (isVersionLink: boolean) => {
    const action = isVersionLink ? LogActions.SHARE_VERSIONED_LINK_COPY : LogActions.SHARE_LIVE_LINK_COPY;
    const text = isVersionLink ? versionLink : liveLink;

    LogService.logClientAction({
      action: LogService.getActionString(action, logStackPath),
      stack: logStack ? logStack : LogService.getStackObject()
    }, reference.defaultLogInfo);

    copyToClipboard(text).then(() => {
      setLinkCopyTooltip(isVersionLink, 'Copied!');
      setTimeout(() => {
        setLinkCopyTooltip(isVersionLink, DEFAULT_COPY_TOOLTIP);
      }, 1000);
    }).catch((err) => {
      $log.warn('failed to copy with the following error:');
      $log.warn(err);
    })
  }

  const appendTrailingPeriod = (str: string) => {
    if (hasTrailingPeriod(str)) return str;

    return str + '.';
  }

  const citationReady = !!citation && citation.isReady;
  const refTable = reference.table;

  const liveLink = resolvePermalink(tuple, reference);

  let versionLink = '', versionDateRelative = '', versionDate = '';
  if (reference.table.supportHistory) {
    const versionString = '@' + (reference.location.version || refTable.schema.catalog.snaptime);
    versionLink = resolvePermalink(tuple, reference, versionString);
    versionDateRelative = humanizeTimestamp(ConfigService.ERMrest.versionDecodeBase32(refTable.schema.catalog.snaptime));
    versionDate = getVersionDate(ConfigService.ERMrest.versionDecodeBase32(refTable.schema.catalog.snaptime));
  }

  const downloadFilename = `${refTable.name}_${tuple.uniqueId}`;
  let bibtexObjectURL;
  if (citationReady && citation.value) {
    let bibtexContent = '@article{';
    bibtexContent += (citation.value.id ? `${citation.value.id},\n` : `${downloadFilename},\n`);
    if (citation.value.author) bibtexContent += `author = {${citation.value.author}},\n`;
    if (citation.value.title) bibtexContent += `title = {${citation.value.title}},\n`;
    bibtexContent += `journal = {${citation.value.journal}},\n`;
    bibtexContent += `year = {${citation.value.year}},\n`;
    bibtexContent += `URL = {${citation.value.url}}\n}`;

    const bibtexBlob = new Blob([bibtexContent], { type: 'text/plain' });
    // set downloadURL for ng-href attribute
    bibtexObjectURL = URL.createObjectURL(bibtexBlob);
  }

  let usedTitle = title;
  if (!title) {
    usedTitle = citationReady && citation.value ? 'Share and Cite' : 'Share';
  }

  return (
    <Modal
      className='chaise-share-citation-modal'
      show={true}
      onHide={onClose}
    >
      <Modal.Header className='center-aligned-title'>
        <Modal.Title>{usedTitle}</Modal.Title>
        <button
          className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
          // prevent the event from propagating to the button that opened it
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <strong className='chaise-btn-icon'>X</strong>
          <span>Close</span>
        </button>
      </Modal.Header>
      <Modal.Body>
        {showVersionWarning && versionLink &&
          <Alert variant='warning' dismissible>
            <strong className='alert-title'>Warning</strong>
            <span>
              The displayed content may be stale due to recent changes made by other users.
              You may wish to review the changes prior to sharing the <a href={liveLink}>live link</a> below.
              Or, you may share the older content using the <a href={versionLink}>versioned link</a>.
            </span>
          </Alert>
        }
        <ul>
          {extraInfo &&
            extraInfo.map((item, index: number) => (
              <li key={index} className='share-extra-item'>
                <h3 className='share-item-header'>{item.title}</h3>
                {item.link && <a className='share-item-value' href={item.link}>{item.value}</a>}
                {!item.link && <span className='share-item-value'>{item.value}</span>}
              </li>
            ))
          }
          <li className='share-modal-links'>
            {!hideHeaders && <h2>Share Link</h2>}
            {versionLink &&
              <>
                <h3 className='share-item-header'>
                  <span>Versioned Link </span>
                  <ChaiseTooltip placement='bottom' tooltip={`Data snapshotted at ${versionDate}`}>
                    <small>({versionDateRelative}) </small>
                  </ChaiseTooltip>
                  <ChaiseTooltip placement='bottom' tooltip={versionLinkCopyTooltip} dynamicTooltipString>
                    <span
                      className='fa-solid fa-clipboard chaise-copy-to-clipboard-btn'
                      // prevent the event from propagating to the button that opened it
                      onClick={(e) => { e.stopPropagation(); onCopyToClipboard(true); }}
                    />
                  </ChaiseTooltip>
                </h3>
                <a className='share-item-value share-modal-versioned-link' href={versionLink}>{versionLink}</a>
              </>
            }
            <h3 className='share-item-header'>
              <span>Live Link </span>
              <ChaiseTooltip placement='bottom' tooltip={liveLinkCopyTooltip} dynamicTooltipString>
                <span
                  className='fa-solid fa-clipboard chaise-copy-to-clipboard-btn'
                  // prevent the event from propagating to the button that opened it
                  onClick={(e) => { e.stopPropagation(); onCopyToClipboard(false); }}
                />
              </ChaiseTooltip>
            </h3>
            <a className='share-item-value share-modal-live-link' href={liveLink}>{liveLink}</a>
          </li>
          {!citationReady &&
            <li className='citation-loader'>
              <ChaiseSpinner spinnerSize='sm' />
            </li>
          }
          {citationReady && citation.value &&
            <li className='share-modal-citation'>
              {!hideHeaders && <h2>Data Citation</h2>}
              <div className='share-modal-citation-text'>
                {citation.value.author && <span>{appendTrailingPeriod(citation.value.author)} </span>}
                {citation.value.title && <span>{appendTrailingPeriod(citation.value.title)} </span>}
                <i>{citation.value.journal}</i> <a href={citation.value.url}>{citation.value.url}</a> ({citation.value.year}).
              </div>
            </li>
          }
          {citationReady && bibtexObjectURL &&
            <li className='share-modal-download-citation'>
              <h3>Download Data Citation:</h3>
              <a
                className='share-item-value chaise-btn chaise-download-btn bibtex-download-btn'
                download={`${downloadFilename}.bib`} href={bibtexObjectURL}
                // prevent the event from propagating to the button that opened it
                onClick={(e) => { e.stopPropagation(); logCitationDownload(); }}>
                BibTex
              </a>
            </li>
          }

        </ul>
      </Modal.Body>
    </Modal>
  )
};

export default ShareCiteModal;
