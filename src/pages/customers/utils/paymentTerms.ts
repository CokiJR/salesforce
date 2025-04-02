
/**
 * Define payment term options for the customer form
 */

export interface PaymentTerm {
  code: string;
  description: string;
}

export const paymentTerms: PaymentTerm[] = [
  { code: 'Z000', description: 'Payment Due Immediately (Cash)' },
  { code: 'Z007', description: 'Due in 7 Days' },
  { code: 'Z015', description: 'Due in 15 days' },
  { code: 'Z030', description: 'Due in 30 days' },
  { code: 'Z045', description: 'Due in 45 days' },
  { code: 'Z060', description: 'Due in 60 days' },
  { code: 'Z090', description: 'Due in 90 days' },
  { code: 'Z120', description: 'Due in 120 days' }
];

/**
 * Get payment term description by code
 * @param code The payment term code
 * @returns The payment term description
 */
export const getPaymentTermDescription = (code: string | undefined): string => {
  if (!code) return '';
  const term = paymentTerms.find(term => term.code === code);
  return term ? term.description : '';
};
