// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// hooks
import { useState } from 'react';

// utils
import { NavbarBanner } from '@isrd-isi-edu/chaise/src/utils/menu-utils';

interface BannerProps {
  banner: NavbarBanner
}

const ChaiseBanner = ({
  banner,
}: BannerProps): JSX.Element => {
  const [hide, setHide] = useState<boolean>(banner.hide)

  if (hide) return (<></>);

  const classString = `chaise-navbar-banner-container ${banner.key ? 'chaise-navbar-banner-container-' + banner.key : ''}`;
  return (<div className={classString}>
    {banner.dismissible && <button className='close' onClick={() => setHide(true)}><span aria-hidden='true'>×</span></button>}
    <DisplayValue value={{isHTML: true, value: banner.html}} addClass />
  </div>)
};

export default ChaiseBanner;
