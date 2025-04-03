
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Collection } from '@/types/collection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook untuk menangani pembayaran koleksi
 */
export const useCollectionPayment = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processPaymentMutation = useMutation({
    mutationFn: async (collection: Collection) => {
      // Update collection status menjadi paid dan tambahkan payment_date
      const { error } = await supabase
        .from('collections')
        .update({ 
          status: 'paid',
          payment_date: new Date().toISOString() 
        })
        .eq('id', collection.id);
      
      if (error) throw error;
      
      return collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['overdueCollections'] });
      toast({
        title: "Pembayaran Berhasil",
        description: "Pembayaran telah dicatat dengan sukses.",
      });
    },
    onError: (error: any) => {
      console.error("Payment processing error:", error);
      toast({
        variant: "destructive",
        title: "Pembayaran Gagal",
        description: error.message || "Gagal memproses pembayaran",
      });
    }
  });

  return {
    processPayment: processPaymentMutation.mutate,
    isProcessing: processPaymentMutation.isPending
  };
};
