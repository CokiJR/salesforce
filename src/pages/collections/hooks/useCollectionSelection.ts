
import { useState } from 'react';
import { Collection } from '@/types/collection';

/**
 * Hook that manages collection selection state
 */
export const useCollectionSelection = () => {
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([]);

  return {
    selectedCollections,
    setSelectedCollections,
    clearSelection: () => setSelectedCollections([]),
    isSelected: (id: string) => selectedCollections.some(c => c.id === id),
    toggleSelection: (collection: Collection) => {
      setSelectedCollections(prev => 
        prev.some(c => c.id === collection.id)
          ? prev.filter(c => c.id !== collection.id)
          : [...prev, collection]
      );
    }
  };
};
