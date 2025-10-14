import LocalStorage from '@isrd-isi-edu/chaise/src/utils/storage';

import type { Reference } from '@isrd-isi-edu/ermrestjs/src/models/reference';
import type { FacetGroup } from '@isrd-isi-edu/ermrestjs/src/models/reference-column';
import { isObjectAndNotNull } from '@isrd-isi-edu/ermrestjs/src/utils/type-utils';

export type FacetOrder = {
  /**
   * the index of the facet column in the reference.facetColumns array
   */
  index: number;
  /**
   * whether the facet should be open or not
   */
  isOpen: boolean;
};

export type FacetGroupOrder = {
  /**
   * the index of the facet group in the reference.facetColumnsStructure array
   */
  index: number;
  /**
   * whether the facet group should be open or not
   */
  isOpen: boolean;
  /**
   * the facets of this group (with their index in the facetColumns array and whether they are open or not)
   */
  children: FacetOrder[];
};

export type StoredFacetOrder = Array<
  | { name: string; open: boolean }
  | { markdown_name: string; open: boolean; children: StoredFacetOrder }
>;

export class FacetStorageService {
  // so we don't have to recompute the facet order every time
  private static facetOrderPerAnnotation: Array<FacetOrder | FacetGroupOrder> | null = null;
  private static facetOrderPerStorage: Array<FacetOrder | FacetGroupOrder> | null = null;
  private static openStatusPerStorage: { [structureKey: string]: boolean } | null = null;
  private static openStatusPerAnnotation: { [structureKey: string]: boolean } | null = null;

  /**
   * returns the key that should be used for local storage name.
   *
   * Notes:
   *  - we want to make sure the same list is used for all recordset instances of the same table (recordset app, facet popup, etc).
   * @param reference the reference object
   */
  static getFacetOrderStorageKey = (reference: Reference): string => {
    return `facet-order-${reference.table.schema.catalog.id}_${reference.table.schema.name}_${reference.table.name}`;
  };

  /**
   * checks if there is a stored facet order for the given reference
   * @param reference the reference object
   */
  static hasStoredFacetOrder = (reference: Reference): boolean => {
    const facetListKey = FacetStorageService.getFacetOrderStorageKey(reference);
    const facetOrder = LocalStorage.getStorage(facetListKey);
    return facetOrder && Array.isArray(facetOrder) && facetOrder.length > 0;
  };

  /**
   * The new order should be an array of objects with the following structure:
   * - for facets: { name: string, open: boolean }
   * - for groups: { markdown_name: string, open: boolean, children: [ { name: string, open: boolean }, ... ] }
   * @param reference
   * @param newOrder
   */
  static changeStoredFacetOrder = (reference: Reference, newOrder: StoredFacetOrder) => {
    LocalStorage.setStorage(FacetStorageService.getFacetOrderStorageKey(reference), newOrder);
    FacetStorageService.facetOrderPerStorage = null;
    FacetStorageService.facetOrderPerAnnotation = null;
  };

  /**
   * Returns the key for accordion items
   * @param group if it's part of a group, the index of that group in the facetColumnsStructure array
   * @param facetIndex if it's a facet, the index of that facet in the facetColumns array
   */
  static getFacetStructureKey = (groupIndex?: number, facetIndex?: number): string => {
    let key = '';
    if (groupIndex !== undefined) {
      key = `group-${groupIndex}`;
    }
    if (facetIndex !== undefined) {
      key += (key ? '-' : '') + `facet-${facetIndex}`;
    }
    return key;
  };

  static getFacetInfoFromStructureKey = (
    structureKey: string
  ): { groupIndex?: number; facetIndex?: number } => {
    const parts = structureKey.split('-');
    if (parts.length === 2 && parts[0] === 'group') {
      const groupIndex = parseInt(parts[1]);
      return { groupIndex };
    } else if (parts.length === 4 && parts[0] === 'group' && parts[2] === 'facet') {
      const groupIndex = parseInt(parts[1]);
      const facetIndex = parseInt(parts[3]);
      return { groupIndex, facetIndex };
    } else if (parts.length === 2 && parts[0] === 'facet') {
      const facetIndex = parseInt(parts[1]);
      return { facetIndex };
    }
    return {};
  };

  /**
   * Returns the open status of a given facet or facet group based on either the annotation or the stored value
   * @param reference the reference object
   * @param groupIndex if it's part of a group, the index of that group in the facetColumnsStructure array
   * @param facetIndex if it's a facet, the index of that facet in the facetColumns array
   * @param ignoreStorage whether to ignore the stored value and just use the annotation
   */
  static getFacetOpenStatus(
    reference: Reference,
    groupIndex?: number,
    facetIndex?: number,
    ignoreStorage?: boolean
  ): boolean {
    if (
      (ignoreStorage && FacetStorageService.openStatusPerAnnotation === null) ||
      (!ignoreStorage && FacetStorageService.openStatusPerStorage === null)
    ) {
      const order = FacetStorageService.getFacetOrder(reference, ignoreStorage);

      const booleanRes: { [structureIndex: string]: boolean } = {};
      order.forEach((item) => {
        if ('children' in item) {
          booleanRes[FacetStorageService.getFacetStructureKey(item.index)] = item.isOpen;

          item.children.forEach((child) => {
            const facetIndex = child.index;
            booleanRes[FacetStorageService.getFacetStructureKey(item.index, facetIndex)] =
              child.isOpen;
          });
        } else {
          booleanRes[FacetStorageService.getFacetStructureKey(undefined, item.index)] = item.isOpen;
        }
      });

      if (ignoreStorage) {
        FacetStorageService.openStatusPerAnnotation = booleanRes;
      } else {
        FacetStorageService.openStatusPerStorage = booleanRes;
      }
    }

    const structureKey = FacetStorageService.getFacetStructureKey(groupIndex, facetIndex);
    if (ignoreStorage) {
      return FacetStorageService.openStatusPerAnnotation![structureKey];
    } else {
      return FacetStorageService.openStatusPerStorage![structureKey];
    }
  }

  /**
   * Return the order of facets that should be used initially.
   *
   * This function consults both the annotation and the stored order.
   *
   * @param reference the reference that represents the main recordset page
   */
  static getFacetOrder = (
    reference: Reference,
    ignoreStorage?: boolean
  ): Array<FacetOrder | FacetGroupOrder> => {
    const res: Array<FacetOrder | FacetGroupOrder> = [];
    const facetColumns = reference.facetColumns;
    const facetColumnsStructure = reference.facetColumnsStructure;
    const facetListKey = FacetStorageService.getFacetOrderStorageKey(reference);
    let facetOrder: StoredFacetOrder | undefined;
    let atLeastOneIsOpen = false;

    // use the already computed value if available
    if (ignoreStorage && FacetStorageService.facetOrderPerAnnotation !== null) {
      return FacetStorageService.facetOrderPerAnnotation;
    } else if (!ignoreStorage && FacetStorageService.facetOrderPerStorage !== null) {
      return FacetStorageService.facetOrderPerStorage;
    }

    if (ignoreStorage) {
      facetOrder = [];
    } else {
      facetOrder = LocalStorage.getStorage(facetListKey);
    }

    // no valid stored value was found in storage, so return the annotaion value.
    if (!facetOrder || !Array.isArray(facetOrder) || facetOrder.length === 0) {
      facetColumnsStructure.forEach((structure) => {
        if (typeof structure === 'number') {
          const fc = facetColumns[structure];
          if (fc.isOpen) atLeastOneIsOpen = true;
          res.push({ index: structure, isOpen: fc.isOpen });
        } else {
          // group of facets
          const children: FacetOrder[] = [];
          structure.children.forEach((childIndex: number) => {
            const fc = facetColumns[childIndex];
            if (fc.isOpen) atLeastOneIsOpen = true;
            children.push({ index: childIndex, isOpen: fc.isOpen });
          });
          res.push({
            index: structure.structureIndex,
            isOpen: structure.isOpen,
            children: children,
          });
        }
      });

      // all the facets are closed, open the first one
      if (!atLeastOneIsOpen && res.length > 0) {
        const first = res[0];
        first.isOpen = true;
        if ('children' in first) {
          first.children[0].isOpen = true;
        }
      }

      if (ignoreStorage) {
        FacetStorageService.facetOrderPerAnnotation = res;
      } else {
        FacetStorageService.facetOrderPerStorage = res;
      }

      return res;
    }

    // store the mapping between name and facetIndex
    const annotOrder: {
      [facetName: string]: {
        facetIndex: number;
        isOpen: boolean;
        hasFilters: boolean;
        groupIndex?: number;
      };
    } = {};
    const annotGroupNames: { [groupName: string]: number } = {};
    const addedGroups: {
      [groupIndex: number]: {
        resultIndex: number;
        addedChildren: { [childIndex: number]: boolean };
      };
    } = {};
    facetColumnsStructure.forEach((structure) => {
      if (typeof structure === 'number') {
        const facetIndex = structure;
        const fc = facetColumns[facetIndex];
        annotOrder[fc.sourceObjectWrapper.name] = {
          facetIndex,
          isOpen: fc.isOpen,
          // if the facet has filters, we have to open it.
          hasFilters: fc.filters.length > 0,
        };
      } else {
        annotGroupNames[structure.displayname.unformatted!] = structure.structureIndex;
        // group of facets
        structure.children.forEach((facetIndex: number) => {
          const fc = facetColumns[facetIndex];
          annotOrder[fc.sourceObjectWrapper.name] = {
            facetIndex,
            isOpen: fc.isOpen,
            // if the facet has filters, we have to open it.
            hasFilters: fc.filters.length > 0,
            groupIndex: structure.structureIndex,
          };
        });
      }
    });

    // go through the stored order and add them to the result if they are still valid
    facetOrder.forEach((fo) => {
      if (!isObjectAndNotNull(fo)) return;

      // for facets
      if ('name' in fo) {
        const facetInfo = annotOrder[fo.name];
        if (!facetInfo) return;

        /**
         * if the saved order is for a facet, but in annotation it's part of a group,
         * we have to add it to the group while respecting the order of groups and facets in annotation
         */
        if (facetInfo.groupIndex !== undefined) {
          // if the group is already added, just add the facet to that group
          if (facetInfo.groupIndex in addedGroups) {
            const addedGroup = res[
              addedGroups[facetInfo.groupIndex].resultIndex
            ] as FacetGroupOrder;

            let isOpen = fo.open;
            // if it has filters, we have to open the group and the facet
            if (facetInfo.hasFilters) {
              addedGroup.isOpen = true;
              isOpen = true;
            }

            addedGroup.children.push({
              index: facetInfo.facetIndex,
              isOpen,
            });

            if (isOpen) atLeastOneIsOpen = true;
          }
          // if the group is not added yet, we need to create it
          else {
            // find the group for open status
            const group = facetColumnsStructure[facetInfo.groupIndex] as FacetGroup;
            let groupIsOpen = group.isOpen;
            let isOpen = fo.open;
            // if it has filters, we have to open the group and the facet
            if (facetInfo.hasFilters) {
              groupIsOpen = true;
              isOpen = true;
            }

            if (isOpen) atLeastOneIsOpen = true;
            res.push({
              index: facetInfo.groupIndex,
              isOpen: groupIsOpen,
              children: [
                {
                  index: facetInfo.facetIndex,
                  isOpen: isOpen,
                },
              ],
            });
            addedGroups[facetInfo.groupIndex] = {
              resultIndex: res.length - 1,
              addedChildren: { [facetInfo.facetIndex]: true },
            };
          }
        }
        // if it's not part of a group, just add it as a level-0 facet
        else {
          let isOpen = fo.open;
          // if it has filters, we have to open the facet
          if (facetInfo.hasFilters) {
            isOpen = true;
          }

          res.push({ index: facetInfo.facetIndex, isOpen });

          if (isOpen) atLeastOneIsOpen = true;
        }

        // remove it so we know which facets were not in the stored order (it will also make sure duplicates are ignored)
        delete annotOrder[fo.name];
      }
      // for groups
      else if ('markdown_name' in fo && Array.isArray(fo.children)) {
        const groupIndex = annotGroupNames[fo.markdown_name];
        if (groupIndex === undefined) return;

        // if the group is already added, add the remaining children to that group
        if (groupIndex in addedGroups) {
          const addedGroup = res[addedGroups[groupIndex].resultIndex] as FacetGroupOrder;
          const addedChildren = addedGroups[groupIndex].addedChildren;

          fo.children.forEach((child) => {
            if (!isObjectAndNotNull(child) || !('name' in child) || child.name in addedChildren)
              return;
            const facetInfo = annotOrder[child.name];
            if (!facetInfo) return;
            if (facetInfo.groupIndex === undefined || facetInfo.groupIndex !== groupIndex) return;

            let isOpen = child.open;
            // if it has filters, we have to open the group and the facet
            if (facetInfo.hasFilters) {
              addedGroup.isOpen = true;
              isOpen = true;
            }

            addedGroup.children.push({
              index: facetInfo.facetIndex,
              isOpen,
            });
            addedChildren[facetInfo.facetIndex] = true;

            if (isOpen) atLeastOneIsOpen = true;
          });
        }
        // if the group is not added yet, we need to create it
        else {
          const group = facetColumnsStructure[groupIndex] as FacetGroup;
          let groupIsOpen = fo.open;
          if (group.isOpen) {
            groupIsOpen = true;
          }

          const children: FacetOrder[] = [];
          const addedChildren: { [childIndex: number]: boolean } = {};
          fo.children.forEach((child) => {
            if (!isObjectAndNotNull(child) || !('name' in child)) return;
            const facetInfo = annotOrder[child.name];
            if (!facetInfo) return;
            if (facetInfo.groupIndex === undefined || facetInfo.groupIndex !== groupIndex) return;

            let isOpen = child.open;
            // if it has filters, we have to open the group and the facet
            if (facetInfo.hasFilters) {
              groupIsOpen = true;
              isOpen = true;
            }

            children.push({
              index: facetInfo.facetIndex,
              isOpen,
            });
            addedChildren[facetInfo.facetIndex] = true;

            if (isOpen) atLeastOneIsOpen = true;
          });

          res.push({
            index: groupIndex,
            isOpen: groupIsOpen,
            children,
          });
          addedGroups[groupIndex] = {
            resultIndex: res.length - 1,
            addedChildren,
          };

          if (groupIsOpen) atLeastOneIsOpen = true;
        }

        // remove it so we know which groups were not in the stored order
        delete annotGroupNames[fo.markdown_name];
      }
    });

    // add the rest of visible facets that were not part of the stored order
    facetColumnsStructure.forEach((structure) => {
      if (typeof structure === 'number') {
        const facetIndex = structure;
        const fc = facetColumns[facetIndex];
        // If this facet was not added from stored order
        if (!(fc.sourceObjectWrapper.name in annotOrder)) return;

        let isOpen = annotOrder[fc.sourceObjectWrapper.name].isOpen;
        // If it has filters, open it
        if (annotOrder[fc.sourceObjectWrapper.name].hasFilters) {
          isOpen = true;
        }
        res.push({ index: facetIndex, isOpen });
        if (isOpen) atLeastOneIsOpen = true;
      } else {
        const groupIndex = structure.structureIndex;
        // If this group was not added from stored order
        if (structure.displayname.unformatted! in annotGroupNames) return;

        const children: FacetOrder[] = [];
        let groupIsOpen = structure.isOpen;
        structure.children.forEach((facetIndex: number) => {
          const fc = facetColumns[facetIndex];
          if (fc.sourceObjectWrapper.name in annotOrder) {
            let isOpen = annotOrder[fc.sourceObjectWrapper.name].isOpen;
            if (annotOrder[fc.sourceObjectWrapper.name].hasFilters) {
              groupIsOpen = true;
              isOpen = true;
            }
            children.push({ index: facetIndex, isOpen });
            if (isOpen) atLeastOneIsOpen = true;
          }
        });

        res.push({
          index: groupIndex,
          isOpen: groupIsOpen,
          children,
        });
        if (groupIsOpen) atLeastOneIsOpen = true;
      }

      // If all facets are closed, open the first one
      if (!atLeastOneIsOpen && res.length > 0) {
        const first = res[0];
        first.isOpen = true;
        if ('children' in first && first.children.length > 0) {
          first.children[0].isOpen = true;
        }
      }
    });

    if (ignoreStorage) {
      FacetStorageService.facetOrderPerAnnotation = res;
    } else {
      FacetStorageService.facetOrderPerStorage = res;
    }

    return res;
  };
}
