import React from 'react';

import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import TypeUtils from '@chaise/utils/type-utils';

type ExampleComponentProps = {
  app: string;
  description?: string;
}

const ExampleComponent = ({
  // - Destructure values from `props` object
  app,
  description,
} : ExampleComponentProps) : JSX.Element => {
  // - Declare state values
  const [showDescription, setShowDescription] = useState(false);

  // - useEffect or other hooks
  useEffect(() => {
    // document.title = app;
  });

  // - any callbacks
  const onClick = () => {
    setShowDescription(true);
  };

  // - Render any dependent items into temporary variables,
  //    such as conditional components or lists
  const conditionalDescription = (TypeUtils.isStringAndNotEmpty(description))
    ? (<Button onClick={onClick}>Show Description</Button>) : null;

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
