import '@chaise/assets/scss/_modal.scss';

import { useEffect, useState } from 'react';

// components
import ChaiseModal from '@chaise/components/modal';

// models
import { Client } from '@chaise/models/user';

// utilities
import AuthnService from '@chaise/services/authn';


const ProfileModal = ({
  showProfile, setShowProfile,
}: any): JSX.Element | null => {
  const user = AuthnService.session;
  const userDisplay = user ? (user.client.full_name || user.client.display_name || user.client.email || user.client.id) : '';

  const [initialized, setInitialzed]          = useState<boolean>(false);
  const [identities, setIdentities]           = useState<string[]>([]);
  const [globusGroupList, setGlobusGroupList] = useState<Client[]>([]);
  const [otherGroups, setOtherGroups]         = useState<Client[]>([]);

  useEffect(() => {
    if (!user || initialized) return;

    const tempIdentities = [];
    for (let i = 0; i < user.client.identities.length; i++) {
      tempIdentities.push(user.client.identities[i]);
    }
    setIdentities(tempIdentities);

    const tempGlobusGroupList = [],
      tempOtherGroups = [];
    for (let i = 0; i < user.attributes.length; i++) {
      const tempUserAttr = JSON.parse(JSON.stringify(user.attributes[i]));
      if (tempUserAttr.display_name && tempUserAttr.display_name !== userDisplay && tempIdentities.indexOf(tempUserAttr.id) === -1) {
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
  });

  // the profile modal only makes sense when we have a user
  if (!user) {
    return null;
  }

  const handleClose = () => {
    setShowProfile(false);
  };

  // keys in client to display: ['id', 'display_name', 'full_name', 'email']
  const renderClientInfo = () => {
    return (<>
      <tr>
        <td className='text-left'>Id</td>
        <td className='text-left profileValue'>{user.client.id}</td>
      </tr>
      <tr>
        <td className='text-left'>Display Name</td>
        <td className='text-left profileValue'>{user.client.display_name}</td>
      </tr>
      <tr>
        <td className='text-left'>Full Name</td>
        <td className='text-left profileValue'>{user.client.full_name}</td>
      </tr>
      <tr>
        <td className='text-left'>Email</td>
        <td className='text-left profileValue'>{user.client.email}</td>
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

  const profileTitle = (<>
      {userDisplay}
    </>
  );

  const profileBody = (
    <table className='table'>
      <tbody>
        {renderClientInfo()}
        {renderIdentities()}
        {renderGroups()}
      </tbody>
    </table>
  );

  const profileFooter = (
    <div />
  );

  if (!showProfile) {
    return null;
  }

  return (
    <ChaiseModal
      body={profileBody}
      contentClassName='profile-popup'
      footer={profileFooter}
      onHide={handleClose}
      show={showProfile}
      title={profileTitle}
    />
  );
};

export default ProfileModal;
