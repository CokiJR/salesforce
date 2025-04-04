import { useState } from 'react';
import { useCollections } from './collections/hooks/useCollections';
import { CollectionsList } from './collections/components/CollectionsList';
import { CollectionImportExport } from './collections/components/CollectionImportExport';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Collections() {
  const { customers, isLoading } = useCollections();
  const navigate = useNavigate();
  
  const handleAddCollection = () => {
    navigate('/dashboard/collections/add');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
          <p className="text-muted-foreground">
            Manage customer payment collections and track due dates
          </p>
        </div>
        <Button onClick={handleAddCollection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Collection
        </Button>
      </div>
      
      <CollectionsList customers={customers} isLoading={isLoading} />
      <CollectionImportExport />
    </div>
  );
}