
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CollectionService } from '../services/CollectionService';
import { Collection } from '@/types/collection';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook that provides collection mutation functionality
 */
export const useCollectionMutations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
    updateCollection: updateCollectionMutation.mutate,
    markAsPaid: (ids: string[]) => markAsPaidMutation.mutate(ids),
    importCollections: importCollectionsMutation.mutate,
  };
};
