import { useState } from 'react';
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
    <div className='markdown-container' dangerouslySetInnerHTML={{ __html: banner.html }} />
  </div>)
};

export default ChaiseBanner;
