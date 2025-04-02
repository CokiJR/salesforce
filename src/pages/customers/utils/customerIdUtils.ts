
/**
 * Utility functions for handling customer IDs
 */

/**
 * Generate a new customer ID in the format C1010001, C1010002, etc.
 * @param lastId The last customer ID in the system
 * @returns A new customer ID
 */
export const generateNextCustomerId = (lastId: string | null): string => {
  if (!lastId || !lastId.startsWith('C')) {
    // If no previous ID or not in our format, start with C1010001
    return 'C1010001';
  }
  
  try {
    // Extract the numeric part of the ID
    const numericPart = lastId.substring(1);
    const nextNumber = parseInt(numericPart, 10) + 1;
    
    // Format back to C+ number format
    return `C${nextNumber}`;
  } catch (error) {
    console.error("Error generating next customer ID:", error);
    return 'C1010001'; // Fallback
  }
};

/**
 * Check if a string looks like our custom customer ID format (C followed by numbers)
 * @param id The string to check
 * @returns True if the string matches our customer ID format
 */
export const isCustomerId = (id: string): boolean => {
  const customerIdPattern = /^C\d+$/;
  return customerIdPattern.test(id);
};

/**
 * Check if a string is a UUID
 * @param id The string to check
 * @returns True if the string is a UUID, false otherwise
 */
export const isUuid = (id: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
};
