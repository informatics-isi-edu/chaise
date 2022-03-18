import { ConfigService } from '@chaise/services/config';
import TypeUtils from '@chaise/utils/type-utils';

/**
* Returns true if the object passed is valid for the terms and conditions feature
* @params {Object} obj - the termaAndConditions object from chaise-config
* @return {boolean} boolean - value to use the terms and conditions config requiring a specific globus group for access
*
* termsAndConditionsConfig: {
*     "groupId": "https://auth.globus.org/123a4bcd-ef5a-67bc-8912-d34e5fa67b89",
*     "joinUrl": "https://app.globus.org/groups/123a4bcd-ef5a-67bc-8912-d34e5fa67b89/join",
*     "groupName": "Globus group name"
* },
*/
export function validateTermsAndConditionsConfig(obj: any) {
  if (!obj || typeof obj !== 'object') return false;
  const tacConfig = ConfigService.chaiseConfig.termsAndConditionsConfig;

  // all 3 properties must be defined for this to function, if not the old login app will be used
  return (TypeUtils.isStringAndNotEmpty(tacConfig.groupId) && TypeUtils.isStringAndNotEmpty(tacConfig.joinUrl) && TypeUtils.isStringAndNotEmpty(tacConfig.groupName));
}