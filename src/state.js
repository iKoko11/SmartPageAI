// Centralized state management for the extension

class State {
  constructor() {
    this.listeners = [];
    this.state = {
      apiKey: '',
      customPrompts: [],
      selectedPromptId: null,
      selectedModel: 'gpt-4o',
    };
  }

  async initialize() {
    const apiKey = await this.getApiKey();
    const customPrompts = await this.getCustomPrompts();
    this.state.apiKey = apiKey || '';
    this.state.customPrompts = customPrompts || [];
    // Always set selectedPromptId to a valid prompt ID
    if (!this.state.selectedPromptId || !customPrompts.find(p => p.id === this.state.selectedPromptId)) {
      this.state.selectedPromptId = customPrompts[0]?.id || null;
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    console.log('[AppState] notify called. State:', this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  async getApiKey() {
    const result = await chrome.storage.sync.get('apiKey');
    return result.apiKey;
  }

  async setApiKey(apiKey) {
    await chrome.storage.sync.set({ apiKey });
    this.state.apiKey = apiKey;
    this.notify();
  }

  async getCustomPrompts() {
    const result = await chrome.storage.sync.get('customPrompts');
    if (!result.customPrompts || result.customPrompts.length === 0) {
    const defaultPrompts = [
        { id: 'default-1', name: "Summarize", text: "Please summarize the content of this webpage." },
        { id: 'default-2', name: "Key Points", text: "What are the key points from this page?" },
        { id: 'default-3', name: "Main Ideas", text: "Extract the main ideas from this content." },
        { id: 'default-4', name: "Overview", text: "Give me a brief overview of this page." }
      ];
    
      await chrome.storage.sync.set({ customPrompts: defaultPrompts });
      return defaultPrompts;
    }
    // Migrate old string prompts to object format if needed
    if (typeof result.customPrompts[0] === 'string') {
      const migrated = result.customPrompts.map((text, i) => ({ name: `Prompt ${i + 1}`, text }));
      await chrome.storage.sync.set({ customPrompts: migrated });
      return migrated;
    }
    return result.customPrompts;
  }

  async addCustomPrompt(promptObj) {
    const prompts = await this.getCustomPrompts();
    const newPrompt = {
      ...promptObj,
      id: promptObj.id || 'prompt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    };
    prompts.push(newPrompt);
    await chrome.storage.sync.set({ customPrompts: prompts });
    this.state.customPrompts = prompts;
    this.notify();
  }

  async deleteCustomPrompt(promptId) {
    const prompts = await this.getCustomPrompts();
    const updatedPrompts = prompts.filter(p => p.id !== promptId);
    await chrome.storage.sync.set({ customPrompts: updatedPrompts });
    this.state.customPrompts = updatedPrompts;
    // If we deleted the selected prompt, select the first available one
    if (this.state.selectedPromptId === promptId || !updatedPrompts.find(p => p.id === this.state.selectedPromptId)) {
      this.state.selectedPromptId = updatedPrompts[0]?.id || null;
    }
    this.notify();
  }

  setSelectedPromptId(promptId) {
    if (!promptId || promptId === 'undefined') return;
    if (!this.state.customPrompts.find(p => p.id === promptId)) return;
    console.log('[AppState] setSelectedPromptId called with', promptId);
    this.state.selectedPromptId = promptId;
    this.notify();
  }

  async resetPromptsToDefault() {
    const defaultPrompts = [
      { id: 'default-1', name: "Summarize", text: "Please summarize the content of this webpage." },
      { id: 'default-2', name: "Key Points", text: "What are the key points from this page?" },
      { id: 'default-3', name: "Main Ideas", text: "Extract the main ideas from this content." },
      { id: 'default-4', name: "Overview", text: "Give me a brief overview of this page." }
    ];
    await chrome.storage.sync.set({ customPrompts: defaultPrompts });
    this.state.customPrompts = defaultPrompts;
    this.state.selectedPromptId = defaultPrompts[0].id;
    this.notify();
  }

  setSelectedModel(model) {
    this.state.selectedModel = model;
    this.notify();
  }
}

export const AppState = new State(); 