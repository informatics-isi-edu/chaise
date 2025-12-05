import { Session } from '@isrd-isi-edu/chaise/src/models/user';

/**
 * return the name that should be used for displaying the user
 * @param session 
 * @returns 
 */
export function getUserDisplayName(session: Session): string {
  return (
    session?.client.full_name ||
    session?.client.display_name ||
    session?.client.email ||
    session?.client.id
  );
}
