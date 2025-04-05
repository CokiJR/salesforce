
import { useState, useEffect } from 'react';
import { Payment } from '@/types/collection';
import { PaymentService } from '../services/PaymentService';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidCollections, setUnpaidCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchUnpaidCollections();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const paymentsData = await PaymentService.getPayments();
      setPayments(paymentsData);
    } catch (err: any) {
      console.error('Error in usePayments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnpaidCollections = async () => {
    try {
      const collectionsData = await PaymentService.getUnpaidCollections();
      setUnpaidCollections(collectionsData);
    } catch (err: any) {
      console.error('Error fetching unpaid collections:', err);
      setError(err.message);
    }
  };

  const createPayment = async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newPayment = await PaymentService.createPayment(payment);
      setPayments(prev => [newPayment, ...prev]);
      await fetchUnpaidCollections(); // Refresh collections in case one was paid off
      return newPayment;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updatePaymentStatus = async (id: string, status: 'Pending' | 'Completed' | 'Failed') => {
    try {
      const updatedPayment = await PaymentService.updatePaymentStatus(id, status);
      setPayments(prev => 
        prev.map(payment => 
          payment.id === id ? updatedPayment : payment
        )
      );
      await fetchUnpaidCollections(); // Refresh collections in case one was paid off
      return updatedPayment;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      await PaymentService.deletePayment(id);
      setPayments(prev => prev.filter(payment => payment.id !== id));
      await fetchUnpaidCollections(); // Refresh collections in case a payment was deleted
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    payments,
    unpaidCollections,
    isLoading,
    error,
    refresh: fetchPayments,
    createPayment,
    updatePaymentStatus,
    deletePayment
  };
}
