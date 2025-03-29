/**
 * Safely serializes an object to JSON, removing circular references
 * and non-serializable values (like functions, DOM nodes, etc.)
 * 
 * @param obj The object to serialize
 * @returns A new object safe for JSON serialization
 */
export function safeJsonStringify(obj: any): string {
  // Create a set to track objects that have been seen before
  const seen = new Set();
  
  // Use JSON.stringify with a custom replacer function
  return JSON.stringify(obj, (key, value) => {
    // For DOM objects or window, return a string representation
    if (typeof window !== 'undefined' && value === window) {
      return '[Window]';
    }
    
    // For DOM elements, just return the tag name
    if (value instanceof Element) {
      return `[${value.tagName}]`;
    }
    
    // For functions, return a placeholder
    if (typeof value === 'function') {
      return '[Function]';
    }
    
    // Skip undefined values
    if (value === undefined) {
      return undefined;
    }
    
    // Handle objects (including arrays)
    if (typeof value === 'object' && value !== null) {
      // If we've seen this object before, return a placeholder to avoid circular refs
      if (seen.has(value)) {
        return '[Circular]';
      }
      
      // Add this object to the set of seen objects
      seen.add(value);
    }
    
    // Return the value unchanged
    return value;
  });
}

/**
 * Safely sanitizes an object for API requests by removing circular references
 * and non-serializable values (like functions, DOM nodes, etc.)
 * 
 * @param obj The object to sanitize
 * @returns A new object that is safe for JSON serialization
 */
export function sanitizeForApi(obj: any): any {
  // Parse and stringify to create a deep clone
  // without circular references or non-serializable values
  try {
    return JSON.parse(safeJsonStringify(obj));
  } catch (err) {
    console.error('Error sanitizing object for API:', err);
    // Fall back to a simpler approach if the sophisticated approach fails
    return simpleObjectSanitize(obj);
  }
}

/**
 * A simpler fallback sanitizer that manually creates a new object
 * by copying only the primitive values and arrays
 * 
 * @param obj The object to sanitize
 * @returns A new, sanitized object
 */
function simpleObjectSanitize(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle primitive types directly
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays recursively
  if (Array.isArray(obj)) {
    return obj.map(item => simpleObjectSanitize(item));
  }
  
  // Handle objects by creating a new object with sanitized properties
  const result: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Skip functions, DOM nodes, etc.
      if (typeof value === 'function' || 
          (typeof value === 'object' && value !== null && 
           (value === window || value instanceof Element))) {
        continue;
      }
      
      result[key] = simpleObjectSanitize(value);
    }
  }
  
  return result;
}