// Utility functions for the extension

export const captureVisibleTab = () => {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (screenshotUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error('Failed to capture screenshot: ' + chrome.runtime.lastError.message));
      } else {
        resolve(screenshotUrl);
      }
    });
  });
};

export function showSnackbar(message, type = 'success') {
  const snackbar = document.getElementById('snackbar');
  if (!snackbar) return;
  const icon = type === 'error'
    ? '<span class="material-icons" style="vertical-align:middle;color:#c62828;">error</span> '
    : '<span class="material-icons" style="vertical-align:middle;color:#388e3c;">check_circle</span> ';
  snackbar.innerHTML = icon + message;
  snackbar.className = 'show';
  snackbar.style.background = type === 'error' ? '#c62828' : '#323232';
  snackbar.style.color = '#fff';
  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const validateApiKey = (apiKey) => {
  if (!apiKey) return false;
  if (typeof apiKey !== 'string') return false;
  if (apiKey.trim().length === 0) return false;
  // Add more specific validation if needed
  return true;
};

export const formatPrompt = (prompt) => {
  if (!prompt) return '';
  return prompt.trim();
};

export const createLoadingIndicator = (parentElement) => {
  const loader = document.createElement('div');
  loader.className = 'loading-indicator';
  loader.innerHTML = `
    <div class="spinner"></div>
    <span>Processing...</span>
  `;
  parentElement.appendChild(loader);
  return loader;
};

export const removeLoadingIndicator = (loader) => {
  if (loader && loader.parentElement) {
    loader.parentElement.removeChild(loader);
  }
};

export const sanitizeHTML = (str) => {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
};
