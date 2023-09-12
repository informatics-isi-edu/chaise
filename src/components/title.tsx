// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import ChaiseTooltip from '@isrd-isi-edu/chaise/src/components/tooltip';

// models
import { Displayname as DisplaynameType } from '@isrd-isi-edu/chaise/src/models/displayname';



type TitleProps = {
  /**
   * The reference object.
   */
  reference?: any,
  /**
   * the displayname that should be used
   * - can be used to override the reference.displayname
   */
  displayname?: DisplaynameType,
  /**
   * if defined, we will use this instead of getting it from the reference
   * - use `false` to suppress adding the comment
   */
  comment?: string | false,
  /**
   * whether we should add a link or not.
   * - if `link` is passed, we will add the link regardless of this property.
   */
  addLink?: boolean,
  /**
   * if defined, we will use this instead of getting it from the reference
   */
  link?: string,
  /**
   * the class added to the title element.
   */
  className?: string
}

const Title = ({
  reference,
  displayname,
  comment,
  addLink,
  link,
  className
}: TitleProps): JSX.Element => {

  let showTooltip = comment ? true : false;

  if (typeof link === 'string') {
    addLink = true;
  }
  else if (reference){
    link = reference.unfilteredReference.contextualize.compact.appLink;
  }

  if (reference) {
    if (typeof displayname !== 'object') {
      displayname = reference.displayname;
    }

    if (comment !== false && !comment && reference.comment) {
      comment = reference.comment;
    }

    showTooltip = reference.commentDisplay === 'tooltip' && (comment || reference.comment);
  }


  const renderDisplayname = <DisplayValue value={displayname} />;

  const usedClassNames: string[] = [];
  if (className) usedClassNames.push(className);
  if (showTooltip && comment) usedClassNames.push('chaise-icon-for-tooltip');

  const renderLinkOrContainer = () => {
    if (addLink) {
      return <a className={usedClassNames.join(' ')} href={link}>{renderDisplayname}</a>;
    }
    return <span className={usedClassNames.join(' ')}>{renderDisplayname}</span>
  }


  if (showTooltip && comment) {
    return (
      <ChaiseTooltip
        placement='bottom-start'
        tooltip={comment}
      >
        {renderLinkOrContainer()}
      </ChaiseTooltip>
    )
  }

  return renderLinkOrContainer();


}

export default Title;
