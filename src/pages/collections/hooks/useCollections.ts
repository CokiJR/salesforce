
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CollectionService } from '../services/CollectionService';
import { Collection } from '@/types/collection';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

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

  // Function to handle importing collections from Excel
  const importFromExcel = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Map Excel data to collection format
        const collections = jsonData.map((row: any) => ({
          customer_id: row.customer_id,
          amount: Number(row.amount),
          due_date: row.due_date,
          status: row.status || 'pending',
          payment_date: row.payment_date || undefined,
          notes: row.notes || undefined,
          bank_account: row.bank_account || undefined,
          transaction_id: row.transaction_id || undefined,
          order_id: row.order_id || undefined,
          sync_status: row.sync_status || 'pending'
        }));
        
        await importCollectionsMutation.mutateAsync(collections);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: `Error: ${error.message}`,
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Function to export collections to Excel
  const exportToExcel = (collections: Collection[]) => {
    const worksheet = XLSX.utils.json_to_sheet(collections.map(c => ({
      id: c.id,
      customer_name: c.customer?.name || 'Unknown',
      customer_id: c.customer_id,
      amount: c.amount,
      due_date: c.due_date,
      payment_date: c.payment_date || '',
      status: c.status,
      notes: c.notes || '',
      bank_account: c.bank_account || '',
      transaction_id: c.transaction_id || '',
      order_id: c.order_id || '',
      created_at: c.created_at,
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Collections');
    
    // Generate Excel file
    XLSX.writeFile(workbook, 'Collections_Export.xlsx');
  };

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
    importFromExcel,
    exportToExcel,
    refetch: () => {
      collectionsQuery.refetch();
      overdueCollectionsQuery.refetch();
    }
  };
};
