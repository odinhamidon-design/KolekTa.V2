/**
 * Fetch wrapper with silent exponential backoff retry.
 * Retries on network errors and 5xx responses.
 * Does NOT retry 4xx client errors.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {object} retryOpts
 * @param {number} retryOpts.maxRetries - Max retry attempts (default 3)
 * @param {number} retryOpts.baseDelay - Initial delay in ms (default 1000)
 * @param {boolean} retryOpts.retryOnMutation - Retry non-GET requests (default false)
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, options = {}, retryOpts = {}) {
  const maxRetries = retryOpts.maxRetries || 3;
  const baseDelay = retryOpts.baseDelay || 1000;
  const retryOnMutation = retryOpts.retryOnMutation || false;
  const method = (options.method || 'GET').toUpperCase();

  // Only retry GET requests and explicitly opted-in mutations
  const canRetry = method === 'GET' || retryOnMutation;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry server errors (5xx) if allowed
      if (response.status >= 500 && canRetry && attempt < maxRetries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      // Network error — retry if allowed
      if (canRetry && attempt < maxRetries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
