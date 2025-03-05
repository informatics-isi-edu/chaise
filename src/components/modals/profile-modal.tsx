// components
import Modal from 'react-bootstrap/Modal';

// hooks
import useAuthn from '@isrd-isi-edu/chaise/src/hooks/authn';
import { useEffect, useState, type JSX } from 'react';

// models
import { Client } from '@isrd-isi-edu/chaise/src/models/user';

type ProfileModalProps = {
  showProfile: boolean,
  setShowProfile: Function
};

const ProfileModal = ({
  showProfile,
  setShowProfile,
}: ProfileModalProps): JSX.Element => {
  const { session } = useAuthn();

  const [initialized, setInitialzed]          = useState<boolean>(false);
  const [identities, setIdentities]           = useState<string[]>([]);
  const [globusGroupList, setGlobusGroupList] = useState<Client[]>([]);
  const [otherGroups, setOtherGroups]         = useState<Client[]>([]);
  const [userDisplay, setUserDisplay]         = useState<string>('')

  useEffect(() => {
    if (!session || initialized) return;
    const user = session;
    const userDisplayVar = (user.client.full_name || user.client.display_name || user.client.email || user.client.id)
    setUserDisplay(userDisplayVar);

    const tempIdentities = [];
    for (let i = 0; i < user.client.identities.length; i++) {
      tempIdentities.push(user.client.identities[i]);
    }
    setIdentities(tempIdentities);

    const tempGlobusGroupList = [],
      tempOtherGroups = [];
    for (let i = 0; i < user.attributes.length; i++) {
      const tempUserAttr = JSON.parse(JSON.stringify(user.attributes[i]));
      if (tempUserAttr.display_name && tempUserAttr.display_name !== userDisplayVar && tempIdentities.indexOf(tempUserAttr.id) === -1) {
        if (tempUserAttr.id.indexOf('https://auth.globus.org/') === 0) {
          tempUserAttr.truncated_id = tempUserAttr.id.substring(24);
          tempGlobusGroupList.push(tempUserAttr);
        } else {
          tempOtherGroups.push(tempUserAttr);
        }
      }
    }

    setGlobusGroupList(tempGlobusGroupList);
    setOtherGroups(tempOtherGroups);
    setInitialzed(true);
  }, [session]);

  // the profile modal only makes sense when we have a user
  if (!session) {
    return <></>;
  }

  const handleClose = () => {
    setShowProfile(false);
  };

  // keys in client to display: ['id', 'display_name', 'full_name', 'email']
  const renderClientInfo = () => {
    return (<>
      <tr>
        <td className='text-left'>Id</td>
        <td className='text-left profileValue'>{session.client.id}</td>
      </tr>
      <tr>
        <td className='text-left'>Display Name</td>
        <td className='text-left profileValue'>{session.client.display_name}</td>
      </tr>
      <tr>
        <td className='text-left'>Full Name</td>
        <td className='text-left profileValue'>{session.client.full_name}</td>
      </tr>
      <tr>
        <td className='text-left'>Email</td>
        <td className='text-left profileValue'>{session.client.email}</td>
      </tr>
    </>)
  };

  const renderIdentities = () => {
    if (identities.length === 0) return;

    return(
      <tr>
        <td className='text-left'>Identities</td>
        <td>
          <ul>
            {identities.map((identity, index) => (<li key={index}>{identity}</li>) )}
          </ul>
        </td>
      </tr>
    )
  }

  const renderGroups = () => {
    if (globusGroupList.length === 0 && otherGroups.length === 0) return;

    return(
      <tr>
        <td className='text-left'>Groups</td>
        <td>
          <ul>
            {globusGroupList.map((gGroup, index) => (
              <li key={index}>
                <a href={'https://app.globus.org/groups/' + gGroup.truncated_id + '/about'} target='_blank' rel='noreferrer'>{gGroup.display_name}</a>
              </li>)
            )}
            {otherGroups.map((oGroup, index) => (
              <li key={index}>
                <span>{oGroup.display_name}</span>
              </li>)
            )}
          </ul>
        </td>
      </tr>
    )
  }

  if (!showProfile) {
    return <></>;
  }

  return (
    <Modal
      className='profile-popup'
      show={showProfile}
      onHide={handleClose}
    >
      <Modal.Header className='center-aligned-title'>
        <Modal.Title>{userDisplay}</Modal.Title>
        <button
          className='chaise-btn chaise-btn-secondary modal-close modal-close-absolute'
          onClick={() => handleClose()}
        >
            <strong className='chaise-btn-icon'>X</strong>
            <span>Close</span>
        </button>
      </Modal.Header>
      <Modal.Body>
        <table className='table'>
          <tbody>
            {renderClientInfo()}
            {renderIdentities()}
            {renderGroups()}
          </tbody>
        </table>
      </Modal.Body>
    </Modal>
  );
};

export default ProfileModal;
