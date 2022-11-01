import { PureComponent } from 'react';

// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// services
import { ConfigService } from '@isrd-isi-edu/chaise/src/services/config';

class Footer extends PureComponent {

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
        >
          <DisplayValue value={{ isHTML: true, value: footerContent }} addClass />
        </div>
      </div>
    )
  }
}

export default Footer;
