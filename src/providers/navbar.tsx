import { createContext, useMemo, useState } from 'react';


export const NavbarContext = createContext<{
  navHeaderHeight: number,
  topContainerHeight: number,
  setTopContainerHeight: any,
  setNavHeaderHeight: any,
} |
  // NOTE: since it can be null, to make sure the context is used properly with
  //       a provider, the useRecordset hook will throw an error if it's null.
  null>(null);

type NavbarProviderProps = {
  children: React.ReactNode,
}


/**
 * The provider that ensures errors are captured.
 * The whole app should be wrapped in this provider. and if we need local display of
 * Navbar
 */
export default function NavbarProvider({ children }: NavbarProviderProps): JSX.Element {
  const [navHeaderHeight, setNavHeaderHeight] = useState<number>(0);
  const [topContainerHeight, setTopContainerHeight] = useState<number>(0);
  const providerValue = useMemo(() => {
    return {
      navHeaderHeight,
      setNavHeaderHeight,
      topContainerHeight,
      setTopContainerHeight,
    }
  }, [navHeaderHeight, topContainerHeight]);
  return (
    <NavbarContext.Provider value={providerValue}>
      {children}
    </NavbarContext.Provider>
  )
}
