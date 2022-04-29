import { useState } from 'react'
import { Modal } from 'react-bootstrap';
import Recordset, { RecordsetProps } from '@chaise/components/recordset';
import RecordsetProvider from '@chaise/providers/recordset';

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
        <RecordsetProvider
          initialReference={recordsetProps.initialReference}
          config={recordsetProps.config}
          logInfo={recordsetProps.logInfo}
          initialPageLimit={recordsetProps.initialPageLimit}
        >
        <Recordset
          initialReference={recordsetProps.initialReference}
          config={recordsetProps.config}
          logInfo={recordsetProps.logInfo}
          initialPageLimit={recordsetProps.initialPageLimit}
        />
        </RecordsetProvider>
      </Modal.Body>
    </Modal>
  )

};

export default RecordsetModal;
