
/**
 * Security Utility for ERP Data Persistence
 * NOTE: secureStorage is being removed as data persistence moves to a backend API.
 */

export const generateSessionId = () => {
  return 'SID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};