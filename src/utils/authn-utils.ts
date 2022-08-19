import { Session } from '@isrd-isi-edu/chaise/src/models/user';

// groupArray should be the array of globus group
export function isGroupIncluded(groupArray: string[] | null, session: Session | null) {
  // if no array, assume it wasn't defined and default hasn't been set yet
  if (!groupArray || groupArray.indexOf('*') > -1) return true; // if "*" acl, show the option
  if (!session) return false; // no "*" exists and no session, hide the option

  for (let i = 0; i < groupArray.length; i++) {
    const attribute = groupArray[i];

    const match = session.attributes.some((attr: any) => attr.id === attribute);

    if (match) return true;
  }

  return false;
}