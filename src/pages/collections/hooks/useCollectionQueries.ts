
import { useQuery } from '@tanstack/react-query';
import { CollectionService } from '../services/CollectionService';
import { Collection } from '@/types/collection';

/**
 * Hook that provides collection query functionality
 */
export const useCollectionQueries = () => {
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: CollectionService.fetchCollections
  });

  const overdueCollectionsQuery = useQuery({
    queryKey: ['overdueCollections'],
    queryFn: CollectionService.fetchOverdueCollections
  });

  return {
    collections: collectionsQuery.data || [],
    overdueCollections: overdueCollectionsQuery.data || [],
    isLoading: collectionsQuery.isLoading || overdueCollectionsQuery.isLoading,
    isError: collectionsQuery.isError || overdueCollectionsQuery.isError,
    error: collectionsQuery.error || overdueCollectionsQuery.error,
    refetch: () => {
      collectionsQuery.refetch();
      overdueCollectionsQuery.refetch();
    }
  };
};
