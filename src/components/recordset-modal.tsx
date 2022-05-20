import { useState } from 'react'
import { Modal } from 'react-bootstrap';
import Recordset, { RecordsetProps } from '@isrd-isi-edu/chaise/src/components/recordset';
import RecordsetProvider from '@isrd-isi-edu/chaise/src/providers/recordset';
import AlertsProvider from '@isrd-isi-edu/chaise/src/providers/alerts';

type RecordestModalProps = {
  recordsetProps: RecordsetProps,
  contentClassName?: string,
  onHide?: () => void,
}

const RecordsetModal = ({
  recordsetProps,
  contentClassName,
  onHide,
}: RecordestModalProps) => {
  const [show, setShow] = useState(true);

  return (
    <Modal
      contentClassName={`search-popup ${contentClassName}`}
      size={'lg'}
      show={show}
      onHide={onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>Recordet modal test</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Recordset
          initialReference={recordsetProps.initialReference}
          config={recordsetProps.config}
          logInfo={recordsetProps.logInfo}
          initialPageLimit={recordsetProps.initialPageLimit}
        />
      </Modal.Body>
    </Modal>
  )

};

export default RecordsetModal;
