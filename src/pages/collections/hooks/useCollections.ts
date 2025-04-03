
import { useCollectionQueries } from './useCollectionQueries';
import { useCollectionMutations } from './useCollectionMutations';
import { useCollectionSelection } from './useCollectionSelection';

/**
 * Main hook that combines all collection-related functionality
 */
export const useCollections = () => {
  const queries = useCollectionQueries();
  const mutations = useCollectionMutations();
  const selection = useCollectionSelection();

  return {
    // Query-related data and functions
    collections: queries.collections,
    overdueCollections: queries.overdueCollections,
    isLoading: queries.isLoading,
    isError: queries.isError,
    error: queries.error,
    refetch: queries.refetch,
    
    // Mutation-related functions
    updateCollection: mutations.updateCollection,
    markAsPaid: mutations.markAsPaid,
    importCollections: mutations.importCollections,
    
    // Selection-related state and functions
    selectedCollections: selection.selectedCollections,
    setSelectedCollections: selection.setSelectedCollections,
    clearSelection: selection.clearSelection,
    isSelected: selection.isSelected,
    toggleSelection: selection.toggleSelection
  };
};
