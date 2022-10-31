import React from 'react';
import { Displayname as DisplaynameType } from '@isrd-isi-edu/chaise/src/models/displayname';
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

type TitleProps = {
  reference?: any,
  displayname?: DisplaynameType,
  comment?: string,
  addLink?: boolean,
  link?: string,
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

    if (typeof displayname !== 'object') {
      displayname = reference.displayname;
    }

    if (!comment && reference.comment) {
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
      <OverlayTrigger
        placement='bottom-start'
        trigger='hover'
        overlay={<Tooltip>{comment}</Tooltip>}
      >
        {renderLinkOrContainer()}
      </OverlayTrigger>
    )
  }

  return renderLinkOrContainer();


}

export default Title;
