// hooks
import { useState } from 'react';

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

// utils
import { resolvePermalink } from '@isrd-isi-edu/chaise/src/utils/uri-utils';
import { getVersionDate, humanizeTimestamp } from '@isrd-isi-edu/chaise/src/utils/date-time-utils';


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
   * NOTE hideCitation is not needed, we just need to send null for this
   * and true for citationReady.
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

  const logCitationDownload = () => {
    LogService.logClientAction({
      action: LogService.getActionString(LogActions.CITE_BIBTEXT_DOWNLOAD, logStackPath),
      stack: logStack ? logStack : LogService.getStackObject()
    }, reference.defaultLogInfo);
  };

  const copyToClipboard = (text: string, action: string) => {
    LogService.logClientAction({
      action: LogService.getActionString(action, logStackPath),
      stack: logStack ? logStack : LogService.getStackObject()
    }, reference.defaultLogInfo);

    // Create a dummy input to put the text string into it, select it, then copy it
    // this has to be done because of HTML security and not letting scripts just copy stuff to the clipboard
    // it has to be a user initiated action that is done through the DOM object
    const dummy = document.createElement('input');
    dummy.setAttribute('visibility', 'hidden');
    dummy.setAttribute('display', 'none');
    document.body.appendChild(dummy);
    // dummy.setAttribute('id', 'copy_id');
    // document.getElementById('copy_id')!.value = text;
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
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
  if (citationReady) {
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

  return (
    <Modal
      className='chaise-share-citation'
      show={true}
      onHide={onClose}
    >
      <Modal.Header className='center-aligned-title'>
        <Modal.Title>{title ? title : 'Share'}</Modal.Title>
        <button
          className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
          onClick={() => onClose()}
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
          <li id='share-link'>
            {!hideHeaders && <h2>Share Link</h2>}
            {versionLink &&
              <>
                <h3 className='share-item-header'>
                  <span>Versioned Link </span>
                  <ChaiseTooltip placement='bottom' tooltip={`Data snapshotted at ${versionDate}`}>
                    <small>({versionDateRelative}) </small>
                  </ChaiseTooltip>
                  <ChaiseTooltip placement='bottom' tooltip='Copy link URL to clipboard.'>
                    <span
                      className='fa-solid fa-clipboard chaise-copy-to-clipboard-btn'
                      onClick={() => copyToClipboard(versionLink, LogActions.SHARE_VERSIONED_LINK_COPY)}
                    />
                  </ChaiseTooltip>
                </h3>
                <a className='share-item-value' id='version' href={versionLink}>{versionLink}</a>
              </>
            }
            <h3 className='share-item-header'>
              <span>Live Link </span>
              <ChaiseTooltip placement='bottom' tooltip='Copy link URL to clipboard.'>
                <span
                  className='fa-solid fa-clipboard chaise-copy-to-clipboard-btn'
                  onClick={() => copyToClipboard(liveLink, LogActions.SHARE_LIVE_LINK_COPY)}
                />
              </ChaiseTooltip>
            </h3>
            <a className='share-item-value' id='liveLink' ng-href={liveLink}>{liveLink}</a>
          </li>
          {!citationReady &&
            <li className='citation-loader'>
              <ChaiseSpinner spinnerSize='sm' />
            </li>
          }
          {citationReady && citation &&
            <li id='citation'>
              {!hideHeaders && <h2>Data Citation</h2>}
              <div id='citation-text'>
                {citation.value.author && <span>{citation.value.author} </span>}
                {citation.value.title && <span>{citation.value.title} </span>}
                <i>{citation.value.journal}</i> <a href={citation.value.url}>{citation.value.url}</a> ({citation.value.year}).
              </div>
            </li>
          }
          {citationReady && bibtexObjectURL &&
            <li id='download-citation'>
              <h3>Download Data Citation:</h3>
              <a
                className='share-item-value chaise-btn chaise-download-btn' id='bibtex-download'
                download={`${downloadFilename}.bib`} href={bibtexObjectURL}
                onClick={() => logCitationDownload()}>
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
