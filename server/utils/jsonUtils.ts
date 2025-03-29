/**
 * Safe JSON stringification that handles circular references
 * Use this when sending responses from API endpoints to prevent
 * circular reference errors
 * 
 * @param obj Object to stringify
 * @returns Safe JSON string
 */
export function safeJsonStringify(obj: any): string {
  // Objects seen during stringification
  const seen = new Set();
  
  return JSON.stringify(obj, (key, value) => {
    // Handle non-object values normally
    if (typeof value !== 'object' || value === null) {
      return value;
    }
    
    // Handle circular references
    if (seen.has(value)) {
      return '[Circular]';
    }
    
    seen.add(value);
    return value;
  });
}

/**
 * Creates a deep copy of an object that is safe to stringify as JSON
 * by removing circular references and non-serializable values
 * 
 * @param obj Object to sanitize
 * @returns Safe object copy
 */
export function sanitizeForJson(obj: any): any {
  if (!obj) return obj;
  
  try {
    // Use JSON.parse/stringify to create a clean copy
    return JSON.parse(safeJsonStringify(obj));
  } catch (err) {
    console.error('Error sanitizing object for API response:', err);
    return { error: 'Unable to process response data' };
  }
}