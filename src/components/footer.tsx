import { ConfigService } from '@chaise/services/config';
import React from 'react';
import { attachFooterResizeSensor } from '@chaise/utils/ui-utils';
import $log from '@chaise/services/logger';

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
