import { AppState } from './src/state.js';
import { PopupUI} from './src/components/popup/PopupUI.js';
import { SettingsUI } from './src/components/settings/SettingsUI.js';
import { ApiService } from './src/services/api.js';
import { captureVisibleTab } from './src/utils/helpers.js';

let popupUI, settingsUI;

document.addEventListener('DOMContentLoaded', async () => {
  await AppState.initialize();

  popupUI = new PopupUI();
  settingsUI = new SettingsUI();

  // Subscribe UI components to state changes
  AppState.subscribe((state) => {
    popupUI.render(state);
    settingsUI.render(state);
  });

  // Initial render
  popupUI.render(AppState.state);
  settingsUI.render(AppState.state);

  // Handle assist button click
  document.getElementById('assist').addEventListener('click', async () => {
    const state = AppState.state;
    try {
      if (!state.apiKey) {
        popupUI.showError('Please set your API key in settings');
        return;
      }
      // Use the current textarea value as the prompt
      const promptText = document.getElementById('mainCustomPrompt').value.trim();
      if (!promptText) {
        popupUI.showError('Please enter a prompt');
        return;
      }
      // Add Markdown formatting instruction suffix
      const markdownSuffix = "\n\nPlease format your response in Markdown. Use bullet points, numbered lists, and headings where appropriate. Be precise, concise, and correct in your answer.";
      const finalPrompt = promptText + markdownSuffix;
      // Show loading state
      popupUI.updateLoadingState(true);
      // Screenshot mode logic
      const screenshotMode = document.getElementById('fullScreenshotRadio').checked ? 'full' : 'visible';
      let screenshotUrl = null;
      if (screenshotMode === 'visible') {
        screenshotUrl = await captureVisibleTab();
      } else {
        // Full page screenshot: trigger capture and wait for result
        screenshotUrl = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'START_FULL_PAGE_CAPTURE', showModal: false }, (response) => {
            if (response && response.error) {
              popupUI.showError(response.error);
              reject(new Error(response.error));
            }
          });
          // Listen for the result once
          const handler = (message, sender, sendResponse) => {
            if (message.type === 'FULL_PAGE_CAPTURE_DONE') {
              resolve(message.dataUrl);
              chrome.runtime.onMessage.removeListener(handler);
            }
          };
          chrome.runtime.onMessage.addListener(handler);
        });
      }
      // Generate summary
      const apiService = new ApiService(state.apiKey);
      const summary = await apiService.summarizeContent(screenshotUrl, finalPrompt, state.selectedModel);
      // Update UI with results
      popupUI.updateSummary(summary);
      popupUI.updateScreenshot(screenshotUrl);
      popupUI.showSuccess('Summary generated successfully!');
    } catch (error) {
      popupUI.showError(error.message || 'Failed to generate summary');
    } finally {
      // Hide loading state
      popupUI.updateLoadingState(false);
    }
  });

  document.getElementById('fullPageScreenshotBtn').addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'START_FULL_PAGE_CAPTURE', showModal: true }, (response) => {
      if (response && response.error) {
        alert(response.error);
      }
    });
  });

  document.getElementById('closeScreenshotModal').addEventListener('click', () => {
    document.getElementById('screenshotModal').classList.remove('show');
    document.getElementById('fullPageScreenshotPreview').src = '';
  });
});
