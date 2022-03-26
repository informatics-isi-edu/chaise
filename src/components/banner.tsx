import { useState } from 'react';

const ChaiseBanner = ({
  banner,
}: any): JSX.Element => {
  let [hide, setHide] = useState<boolean>(banner.hide)

  if (hide) return (<></>);

  let classString: string = `chaise-navbar-banner-container ${banner.key ? 'chaise-navbar-banner-container-' + banner.key : ''}`;
  return (<div className={classString}>
    {banner.dismissible ? <button className='close' onClick={() => setHide(true)}>
      <span aria-hidden='true'>×</span>
    </button> : <></>}
    <div className='markdown-container' dangerouslySetInnerHTML={{ __html: banner.html }} />
  </div>)
};

export default ChaiseBanner;
