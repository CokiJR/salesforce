
import { Collection, CollectionFilters } from "@/types/collection";
import { CollectionCoreService } from "./CollectionCoreService";
import { CollectionQueryService } from "./CollectionQueryService";
import { CollectionExcelService } from "./CollectionExcelService";

/**
 * Main Collection Service that aggregates all collection-related functionality
 */
export const CollectionService = {
  // Query functions
  fetchCollections: CollectionQueryService.fetchCollections,
  fetchOverdueCollections: CollectionQueryService.fetchOverdueCollections,
  fetchFilteredCollections: CollectionQueryService.fetchFilteredCollections,
  fetchCollectionById: CollectionCoreService.fetchCollectionById,
  fetchCustomerCollections: CollectionQueryService.fetchCustomerCollections,
  
  // Core operations
  createCollection: CollectionCoreService.createCollection,
  updateCollection: CollectionCoreService.updateCollection,
  deleteCollection: CollectionCoreService.deleteCollection,
  bulkUpdateStatus: CollectionCoreService.bulkUpdateStatus,
  importCollections: CollectionCoreService.importCollections,
  
  // Excel operations
  exportToExcel: CollectionExcelService.exportToExcel,
  importFromExcel: CollectionExcelService.importFromExcel,
};
