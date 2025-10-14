export type Displayname = {
  value: string | null,
  isHTML: boolean,
  unformatted?: string | null
};

/**
 * what the comment coming from ermrestjs might look like
 */
export type CommentType = {
  value: string,
  isHTML: boolean,
  unformatted?: string,
  displayMode: CommentDisplayModes
} | false | null;

export enum CommentDisplayModes {
  INLINE = 'inline',
  TOOLTIP = 'tooltip'
}
