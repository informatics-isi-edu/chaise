/**
 * - include the css dependencies
 * - get the session
 * - get the config
 * - resolve the reference
 *   - intiaize ermrestJS?
 */


import React from 'react'
import Spinner from '@chaise/components/spinner';
import ERMrestService from '@chaise/services/ermrest';

const ChaiseApp: React.FC<{}> = (): JSX.Element => {

  ERMrestService.setup().then(() => {

  });


  return (<Spinner/>)

  return (
    <div></div>
  )
}


export default ChaiseApp;
