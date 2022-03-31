export interface Session {
  attributes: Client[];
  client: Client;
  expires: string;
  seconds_remaining: number;
  since: string;
  tracking: string;
  vary_headers: string[];
}

export interface Client {
  /**
   * user's display name
   */
  display_name: string;
  /**
   * user's email address
   */
  email: string;
  /**
   * user's full name
   */
  full_name: string;
  /**
   * user's id (usually the globus id)
   */
  id: string;
  /**
   * list of alternative identities for the user (Client.id values)
   */
  identities: string[];

  truncated_id?: string;
}

// TODO is the following needed?
interface ChaiseUserParameters {
  attributes: Client[];
  client: Client;
  expires: string;
  seconds_remaining: number;
  since: string;
  tracking?: string;
  vary_headers?: string[];
}

class ChaiseUser {
  /**
   * list of groups and identities the user has
   */
  attributes: Client[];

  /**
   * information about the user
   */
  client: Client;

  /**
   * when the user's session will expire
   */
  expires: string;

  /**
   * how many seconds until user's session expires
   */
  seconds_remaining: number;

  /**
   * when the user's session started
   */
  since: string;

  tracking?: string;

  vary_headers?: string[];

  constructor(params: ChaiseUserParameters) {
    this.attributes = params.attributes;
    this.client = params.client;
    this.expires = params.expires;
    this.seconds_remaining = params.seconds_remaining;
    this.since = params.since;
    this.tracking = params.tracking;
    this.vary_headers = params.vary_headers;
  }
}
