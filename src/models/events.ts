export enum RecordeditNotifyActions {
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
}

export type RecordeditNotifyEventType = {
  /**
   * the page id ("invalidate" query param value)
   */
  id?: string,
  type: RecordeditNotifyActions,
  details?: {
    partial?: boolean
  }
}
