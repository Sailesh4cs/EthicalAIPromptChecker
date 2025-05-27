// Helper utilities

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified time period
 * @param {Function} func - The function to throttle
 * @param {number} wait - The time period in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle(func, wait) {
  let lastCall = 0;
  let lastResult;
  
  return function(...args) {
    const now = Date.now();
    if (now - lastCall < wait) {
      return lastResult;
    }
    lastCall = now;
    lastResult = func.apply(this, args);
    return lastResult;
  };
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait period has elapsed since the last time it was invoked
 * @param {Function} func - The function to debounce
 * @param {number} wait - The wait period in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function(...args) {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safely parses JSON with error handling
 * @param {string} str - The JSON string to parse
 * @param {any} fallback - The fallback value if parsing fails
 * @returns {any} The parsed object or fallback value
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
}

/**
 * Truncates a string to a specified length and adds ellipsis if truncated
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} The truncated string
 */
export function truncateString(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + '...';
}

/**
 * Formats a date string to a more readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}