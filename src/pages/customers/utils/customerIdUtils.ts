
/**
 * Utility functions for handling customer IDs
 */
import { v4 as uuidv4 } from 'uuid';

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
 * Check if a string is a UUID
 * @param id The string to check
 * @returns True if the string is a UUID, false otherwise
 */
export const isUuid = (id: string): boolean => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(id);
};

/**
 * Convert a UUID to our custom customer ID format
 * @param uuid The UUID to convert
 * @param baseNumber The starting number for the ID
 * @returns A customer ID in the format C1010001
 */
export const convertUuidToCustomerId = (uuid: string, baseNumber: number): string => {
  return `C${1010000 + baseNumber}`;
};

/**
 * Generate a UUID for database storage while keeping track of our custom ID
 * @returns A UUID for database storage
 */
export const generateUuid = (): string => {
  return uuidv4();
};

