/**
 * Utility function to extract consistent error messages from various error types
 * Handles axios errors, standard errors, and custom error objects
 */
export function extractErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';

  // Handle axios error responses
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data) {
    return typeof error.response.data === 'string'
      ? error.response.data
      : JSON.stringify(error.response.data);
  }

  // Handle standard error messages
  if (error.message) {
    return error.message;
  }

  // Fallback for custom objects
  return typeof error === 'string' ? error : JSON.stringify(error);
}
