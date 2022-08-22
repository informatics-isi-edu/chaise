import React from 'react';

import { useEffect, useState } from 'react';
import { isStringAndNotEmpty } from '@isrd-isi-edu/chaise/src/utils/type-utils';
import $log from '@isrd-isi-edu/chaise/src/services/logger';

type ExampleComponentProps = {
  /**
   * The app name
   */
  app: string;
  /**
   * description of the app.
   * Note:
   *   - Add any important things that you need to remind developers about this prop
   */
  description?: string;
}

/**
 * The example component that shows the code style of components
 * and how we should structure the code and document it.
 */
const ExampleComponent = ({
  // - Destructure values from `props` object
  app,
  description,
} : ExampleComponentProps) : JSX.Element => {
  // - Declare state values
  const [showDescription, setShowDescription] = useState(false);

  // - useEffect or other hooks

  // explain why the hook is used
  useEffect(() => {
    // document.title = app;
  });

  // - any callbacks

  /**
   * when the button is clicked, show the description.
   */
  const onClick = () => {
    setShowDescription(true);
  };

  /**
   * explain the function here
   * @param change {string} explain the input here
   */
  const onSomeChange = (change: string) => {
    $log.debug(`new change: ${change}`);
    return;
  }

  // - Render any dependent items into temporary variables,
  //    such as conditional components or lists
  const conditionalDescription = (isStringAndNotEmpty(description))
    ? (<button className='chaise-btn chaise-btn-primary' onClick={onClick}>Show Description</button>) : null;

  // - Use a single JSX structure filled with content
  return (
    <div>
      A sample component for
      {' '}
      {app}
      {' '}
      app.
      {conditionalDescription}
    </div>
  );
};

export default ExampleComponent;
