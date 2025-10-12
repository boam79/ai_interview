/**
 * Phone Number Validation Utilities
 * Supports Korean phone number format (010-XXXX-XXXX)
 */

/**
 * Format phone number with hyphens
 * @param phone - Raw phone number string (digits only)
 * @returns Formatted phone number (e.g., "010-1234-5678")
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Apply formatting based on length
  if (digits.length === 0) {
    return '';
  } else if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else if (digits.length <= 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else {
    // Limit to 11 digits
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
}

/**
 * Validate if phone number is complete and valid
 * @param phone - Phone number string (can be formatted or raw)
 * @returns true if valid Korean phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's exactly 11 digits and starts with 010
  if (digits.length !== 11) {
    return false;
  }
  
  // Check if it starts with 010
  if (!digits.startsWith('010')) {
    return false;
  }
  
  return true;
}

/**
 * Extract raw digits from formatted phone number
 * @param phone - Formatted phone number
 * @returns Raw digits only
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Get the maximum allowed digits
 */
export const MAX_PHONE_DIGITS = 11;

/**
 * Check if phone number is complete (11 digits)
 * @param phone - Phone number string
 * @returns true if 11 digits entered
 */
export function isPhoneComplete(phone: string): boolean {
  const digits = extractDigits(phone);
  return digits.length === MAX_PHONE_DIGITS;
}

/**
 * Add digit to phone number
 * @param currentPhone - Current phone number
 * @param digit - Digit to add (0-9)
 * @returns Updated phone number (formatted)
 */
export function addDigit(currentPhone: string, digit: string): string {
  const digits = extractDigits(currentPhone);
  
  // Don't add if already at max length
  if (digits.length >= MAX_PHONE_DIGITS) {
    return formatPhoneNumber(digits);
  }
  
  // Add the new digit
  const newDigits = digits + digit;
  return formatPhoneNumber(newDigits);
}

/**
 * Remove last digit from phone number
 * @param currentPhone - Current phone number
 * @returns Updated phone number (formatted)
 */
export function removeLastDigit(currentPhone: string): string {
  const digits = extractDigits(currentPhone);
  
  if (digits.length === 0) {
    return '';
  }
  
  // Remove last digit
  const newDigits = digits.slice(0, -1);
  return formatPhoneNumber(newDigits);
}

