export type Displayname = {
  value: string | null,
  isHTML: boolean,
  unformatted?: string
};

export type CommentType = {
  value: string,
  isHTML: boolean,
  unformatted?: string,
  displayMode: CommentDisplayModes
} | null;

export enum CommentDisplayModes {
  INLINE = 'inline',
  TOOLTIP = 'tooltip'
}
