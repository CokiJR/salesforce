import { useState, useEffect } from 'react';
import { Collection } from '@/types/collection';
import { Customer } from '@/types';
import { CollectionService } from '../services/CollectionService';

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const collectionsData = await CollectionService.getCollections();
      setCollections(collectionsData);
      
      // Get customers with due payments
      const customersData = await CollectionService.getCustomersWithDuePayments();
      setCustomers(customersData);
    } catch (err: any) {
      console.error('Error in useCollections:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createCollection = async (collection: Omit<Collection, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCollection = await CollectionService.createCollection(collection);
      setCollections(prev => [...prev, newCollection]);
      return newCollection;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      const updatedCollection = await CollectionService.updateCollection(id, updates);
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? updatedCollection : collection
        )
      );
      return updatedCollection;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await CollectionService.deleteCollection(id);
      setCollections(prev => prev.filter(collection => collection.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const markAsPaid = async (id: string, transactionId?: string) => {
    try {
      const updatedCollection = await CollectionService.markAsPaid(id, transactionId);
      setCollections(prev => 
        prev.map(collection => 
          collection.id === id ? updatedCollection : collection
        )
      );
      return updatedCollection;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const importFromExcel = async (file: File) => {
    try {
      const importedCollections = await CollectionService.importFromExcel(file);
      setCollections(prev => [...prev, ...importedCollections]);
      return importedCollections;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const exportToExcel = () => {
    try {
      const blob = CollectionService.exportToExcel(collections);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    collections,
    customers,
    isLoading,
    error,
    refresh: fetchCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    markAsPaid,
    importFromExcel,
    exportToExcel
  };
}