import React, { useState, useEffect } from 'react';
import { DroppableProps, Droppable } from '@hello-pangea/dnd';

/** Since we're using strict mode, @hello-pangea/dnd misbehaves due to multiple renders caused by strict mode.
 *  This is to guard against it
 */
const ChaiseDroppable = React.memo(function StrictModeDroppable({ children, ...props }: DroppableProps) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
});


export default ChaiseDroppable;
