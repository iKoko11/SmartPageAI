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
      const selectedPrompt = state.customPrompts.find(p => p.id === state.selectedPromptId);
      if (!selectedPrompt || !selectedPrompt.text) {
        popupUI.showError('Please select or enter a prompt');
        return;
      }
      // Show loading state
      popupUI.updateLoadingState(true);
      // Capture screenshot
      const screenshotUrl = await captureVisibleTab();
      // Generate summary
      const apiService = new ApiService(state.apiKey);
      const summary = await apiService.summarizeContent(screenshotUrl, selectedPrompt.text, state.selectedModel);
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
});
