import { test } from '@playwright/test';


type RelatedTableTestParam = {
  testTitle: string,
  name: string,
  schemaName: string,
  displayname: string,
  count: number,
  canEdit: boolean,
  canCreate: boolean,
  canDelete: boolean,

  isAssociation?: boolean,
  isMarkdown?: boolean
  isInline?: boolean,
  isTableMode?: boolean
  viewMore?: {
    name: string,
    displayname: string,
    filter?: string,
  },
  rowValues?: string[],
  rowViewPaths?: string[],
  markdownValue?: string,
  /**
   * default 25
   */
  page_size?: number,
  testAdd?: boolean,
  testEdit?: boolean,
  testDelete?: boolean,
};

export const testRelatedTable = (params: RelatedTableTestParam) => {
  test(params.testTitle, async ({page}) => {
    //
  })
}
