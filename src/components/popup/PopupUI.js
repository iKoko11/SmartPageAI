import { AppState } from '../../state.js';
import { showSnackbar } from '../../utils/helpers.js';
import { MODEL_LIST } from '../../constants/models.js';

// PopupUI component for managing the main popup interface
export class PopupUI {
  constructor() {
    this.elements = {
      settingsPanel: document.getElementById('settingsPanel'),
      mainPromptArea: document.getElementById('mainPromptArea'),
      apiKey: document.getElementById('apiKey'),
      promptSelect: document.getElementById('promptSelect'),
      modelSelect: document.getElementById('modelSelect'),
      mainCustomPrompt: document.getElementById('mainCustomPrompt'),
      summary: document.getElementById('summary'),
      screenshot: document.getElementById('screenshot'),
      toggleSettings: document.getElementById('toggleSettings'),
      assist: document.getElementById('assist')
    };
    this._setupListeners();
  }

  _setupListeners() {
    this.elements.toggleSettings.addEventListener('click', () => this.toggleSettings());
    this.elements.promptSelect.addEventListener('change', (e) => this.handlePromptChange(e));
    this.elements.mainCustomPrompt.addEventListener('input', () => this.autoResizeTextarea());
    this.elements.modelSelect.addEventListener('change', (e) => this.handleModelChange(e));
  }

  toggleSettings() {
    const isVisible = this.elements.settingsPanel.style.display !== 'none';
    this.elements.settingsPanel.style.display = isVisible ? 'none' : 'block';
    this.elements.mainPromptArea.style.display = isVisible ? 'block' : 'none';
  }

  handlePromptChange(event) {
    const selectedPromptId = event.target.value;
    AppState.setSelectedPromptId(selectedPromptId);
    // Do NOT update the textarea here; let render() handle it.
  }

  handleModelChange(event) {
    AppState.setSelectedModel(event.target.value);
  }

  autoResizeTextarea() {
    const textarea = this.elements.mainCustomPrompt;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight + 2, 60); // 120px max
    textarea.style.height = newHeight + 'px';
  }

  render(state) {
    // Render API key (read-only in main area)
    this.elements.apiKey.value = state.apiKey || '';
    // Render prompts dropdown
    this.renderPrompts(state);
    // Render models dropdown
    this.renderModels(state);
    // Always set textarea to the selected prompt's value ONLY if the user hasn't edited it
    if (state.customPrompts && state.customPrompts.length > 0) {
      const selected = state.customPrompts.find(p => p.id === state.selectedPromptId) || state.customPrompts[0];
      // Only update textarea if it doesn't match the selected prompt (prevents overwriting user edits)
      if (this.elements.mainCustomPrompt.value !== selected.text) {
        this.elements.mainCustomPrompt.value = selected.text;
        requestAnimationFrame(() => this.autoResizeTextarea());
      }
      this.elements.assist.disabled = !state.apiKey || !this.elements.mainCustomPrompt.value.trim();
    } else {
      this.elements.mainCustomPrompt.value = '';
      this.elements.assist.disabled = true;
    }
  }

  renderPrompts(state) {
    const promptSelect = this.elements.promptSelect;
    promptSelect.innerHTML = '';
    if (!state.customPrompts || state.customPrompts.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No prompts available';
      promptSelect.appendChild(option);
      return;
    }
    state.customPrompts.forEach(prompt => {
      const option = document.createElement('option');
      option.value = prompt.id;
      option.textContent = prompt.name;
      option.setAttribute('aria-label', prompt.name);
      promptSelect.appendChild(option);
    });
    // Set the select value to a valid prompt ID
    const validId = state.selectedPromptId && state.customPrompts.find(p => p.id === state.selectedPromptId) ? state.selectedPromptId : state.customPrompts[0].id;
    promptSelect.value = validId;
  }

  renderModels(state) {
    const modelSelect = this.elements.modelSelect;
    modelSelect.innerHTML = '';
    MODEL_LIST.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      if (state.selectedModel === model.id) option.selected = true;
      modelSelect.appendChild(option);
    });
  }

  updateSummary(summary) {
    if (!summary) {
      this.elements.summary.innerHTML = '<div class="error">No summary generated</div>';
      return;
    }
    this.elements.summary.style.display = 'block';
    this.elements.summary.innerHTML = marked.parse(summary);
  }

  updateScreenshot(screenshotUrl) {
    if (!screenshotUrl) {
      this.elements.screenshot.style.display = 'none';
      return;
    }
    this.elements.screenshot.style.display = 'block';
    this.elements.screenshot.src = screenshotUrl;
  }

  updateLoadingState(isLoading) {
    if (isLoading) {
      this.elements.assist.disabled = true;
      this.elements.assist.innerHTML = 'Assist <span class="button-spinner"></span>';
      this.elements.summary.innerHTML = '';
      this.elements.summary.style.display = 'none';
      this.clearScreenshot();
    } else {
      this.elements.assist.disabled = false;
      this.elements.assist.innerHTML = 'Assist';
    }
  }

  clearScreenshot() {
    this.elements.screenshot.style.display = 'none';
    this.elements.screenshot.src = '';
  }

  showError(message) {
    showSnackbar(message, 'error');
  }

  showSuccess(message) {
    showSnackbar(message, 'success');
  }
} 