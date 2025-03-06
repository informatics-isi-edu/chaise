import { PropsWithChildren, ReactElement, type JSX } from 'react';

type ConditionalWrapperProps = {
  /**
   * The condition that dictates whether we should show the wrapper or not
   */
  condition: boolean;
  /**
   * A function that returns the wrapper. Make sure the children is properly
   * used in here.
   */
  wrapper: (children: ReactElement<any>) => JSX.Element;
  /**
   * The inner element
   */
  children: JSX.Element;
}

/**
 * conditionally wrap an element
 * Example:
 *  <ConditionalWrapper
 *       condition={showPlaceholderTooltip}
 *       wrapper={children => (
 *         {/* The wrapper goes here and make sure to use the children inside it /*}
 *       )}
 *     >
 *     {/* The inner component goes here /*}
 *  </ConditionalWrapper>
 */
export const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: PropsWithChildren<ConditionalWrapperProps>) => {
  return (condition ? wrapper(children) : children);
};
