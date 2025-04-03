
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollectionService } from '../services/CollectionService';
import { Collection } from '@/types/collection';
import { useToast } from '@/hooks/use-toast';

export const useCollections = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([]);

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: CollectionService.fetchCollections
  });

  const overdueCollectionsQuery = useQuery({
    queryKey: ['overdueCollections'],
    queryFn: CollectionService.fetchOverdueCollections
  });

  const updateCollectionMutation = useMutation({
    mutationFn: (data: { id: string; collection: Partial<Collection> }) => 
      CollectionService.updateCollection(data.id, data.collection),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['overdueCollections'] });
      toast({
        title: 'Collection Updated',
        description: 'The collection has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Error: ${error.message}`,
      });
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (collectionIds: string[]) => 
      CollectionService.bulkUpdateStatus(collectionIds, 'paid'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['overdueCollections'] });
      setSelectedCollections([]);
      toast({
        title: 'Collections Updated',
        description: 'Collections have been marked as paid.',
      });
    }
  });

  const importCollectionsMutation = useMutation({
    mutationFn: (collections: Omit<Collection, 'id' | 'created_at' | 'updated_at'>[]) => 
      CollectionService.importCollections(collections),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['overdueCollections'] });
      toast({
        title: 'Import Successful',
        description: 'Collections have been imported successfully.',
      });
    }
  });

  return {
    collections: collectionsQuery.data || [],
    overdueCollections: overdueCollectionsQuery.data || [],
    isLoading: collectionsQuery.isLoading || overdueCollectionsQuery.isLoading,
    isError: collectionsQuery.isError || overdueCollectionsQuery.isError,
    error: collectionsQuery.error || overdueCollectionsQuery.error,
    updateCollection: updateCollectionMutation.mutate,
    selectedCollections,
    setSelectedCollections,
    markAsPaid: (ids: string[]) => markAsPaidMutation.mutate(ids),
    importCollections: importCollectionsMutation.mutate,
    refetch: () => {
      collectionsQuery.refetch();
      overdueCollectionsQuery.refetch();
    }
  };
};
