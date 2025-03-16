
import { format, isValid } from "date-fns";

/**
 * Formats a number as currency
 */
export const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined) return "-";
  
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return "-";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numericAmount);
};

/**
 * Formats a date string to a human-readable format
 */
export const formatDate = (
  date: Date | string | null | undefined,
  formatString = "MMM d, yyyy"
) => {
  if (!date) return "-";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  if (!isValid(dateObj)) return "-";
  
  return format(dateObj, formatString);
};

/**
 * Formats a phone number to (XXX) XXX-XXXX format
 */
export const formatPhoneNumber = (phoneNumber: string | null | undefined) => {
  if (!phoneNumber) return "-";
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");
  
  // Check if the input is of correct length
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phoneNumber;
};

/**
 * Truncates text to a specified length and adds ellipsis
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength = 50
) => {
  if (!text) return "";
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Formats a file size in bytes to human-readable format
 */
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
