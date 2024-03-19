// components
import DisplayValue from '@isrd-isi-edu/chaise/src/components/display-value';

// models
import { CommentType } from '@isrd-isi-edu/chaise/src/models/displayname';

// utils
import { CLASS_NAMES } from '@isrd-isi-edu/chaise/src/utils/constants';

type DisplayCommentValueProps = {
  comment: CommentType
};

/**
 * should be used for showing the .comment API coming rom the Reference API of ERMrest
 */
const DisplayCommentValue = ({ comment }: DisplayCommentValueProps): JSX.Element => {
  if (!comment) {
    return <></>;
  }

  const className = [CLASS_NAMES.COMMENT];
  if (comment && comment.isHTML) className.push(CLASS_NAMES.COMMENT_IS_HTML);

  return <DisplayValue value={comment} addClass={comment.isHTML} className={className.join(' ')} />
};

export default DisplayCommentValue;
