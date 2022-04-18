import { PropsWithChildren, ReactElement } from 'react';

type ConditionalWrapperProps = {
  condition: boolean;
  wrapper: (children: ReactElement) => JSX.Element;
  children: JSX.Element;
}

/**
 * conditionally wrap an element
 * @returns
 */
export const ConditionalWrapper = ({
  condition,
  wrapper,
  children,
}: PropsWithChildren<ConditionalWrapperProps>) => {
  return (condition ? wrapper(children) : children);
};
