import React from 'react';
import { Displayname as DisplaynameType } from '@chaise/models/displayname';
import DisplayValue from '@chaise/components/display-value';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

type TitleProps = {
  reference?: any,
  displayname?: DisplaynameType,
  comment?: string,
  addLink?: boolean,
  link?: string
}

const Title = ({
  reference,
  displayname,
  comment,
  addLink,
  link
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

  const className = showTooltip && comment ? 'chaise-icon-for-tooltip': '';

  const renderLinkOrContainer = () => {
    if (addLink) {
      return <a className={className} href={link}>{renderDisplayname}</a>;
    }
    return <span className={className}>{renderDisplayname}</span>
  }


  if (showTooltip && comment) {
    return (
      <OverlayTrigger
        placement='bottom-start'
        overlay={<Tooltip>{comment}</Tooltip>}
      >
        {renderLinkOrContainer()}
      </OverlayTrigger>
    )
  }

  return renderLinkOrContainer();


}

export default Title;
