import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';
import React from 'react';
import { attachFooterResizeSensor } from '@isrd-isi-edu/chaise/src/utils/ui-utils';

class Footer extends React.PureComponent {

  componentDidMount() {
    attachFooterResizeSensor(0);
  }

  render() {
    const footerContent = ConfigService.ERMrest.renderMarkdown(
      ConfigService.chaiseConfig.footerMarkdown,
      false
    );

    if (!footerContent) {
      return <></>
    }

    return (
      <div className='footer-container'>
        <div
          id='footer'
          className='footer-content'
          dangerouslySetInnerHTML={{ __html: footerContent }}
        >
        </div>
      </div>
    )
  }
}

export default Footer;
