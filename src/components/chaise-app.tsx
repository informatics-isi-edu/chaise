/**
 * - include the css dependencies
 * - get the session
 * - get the config
 * - resolve the reference
 */


import React from 'react'
import Spinner from 'Components/spinner';
import ERMrestService from 'Services/ermrest';

const ChaiseApp: React.FC<{}> = (): JSX.Element => {

  ERMrestService.setup().then(() => {

  });


  return (<Spinner/>)

  return (
    <div></div>
  )
}


export default ChaiseApp;
