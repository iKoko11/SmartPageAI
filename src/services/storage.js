// Storage service for handling Chrome storage operations
export class StorageService {
  static DEFAULT_PROMPTS = [
    { id: 'default-1', name: "Summarize", text: "Please summarize the content of this webpage." },
    { id: 'default-2', name: "Key Points", text: "What are the key points from this page?" },
    { id: 'default-3', name: "Main Ideas", text: "Extract the main ideas from this content." },
    { id: 'default-4', name: "Overview", text: "Give me a brief overview of this page." }
  ];

  static generatePromptId() {
    return 'prompt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  static async getApiKey() {
    const result = await chrome.storage.sync.get('apiKey');
    return result.apiKey;
  }

  static async saveApiKey(apiKey) {
    await chrome.storage.sync.set({ apiKey });
  }

  static async getCustomPrompts() {
    const result = await chrome.storage.sync.get('customPrompts');
    if (!result.customPrompts || result.customPrompts.length === 0) {
      await this.initializeDefaultPrompts();
      return this.DEFAULT_PROMPTS;
    }
    // Migrate old string prompts to object format if needed
    if (typeof result.customPrompts[0] === 'string') {
      const migrated = result.customPrompts.map((text, i) => ({
        id: this.generatePromptId(),
        name: `Prompt ${i + 1}`,
        text
      }));
      await chrome.storage.sync.set({ customPrompts: migrated });
      return migrated;
    }
    // Ensure all prompts have IDs
    const prompts = result.customPrompts.map(prompt => {
      if (!prompt.id) {
        return { ...prompt, id: this.generatePromptId() };
      }
      return prompt;
    });
    await chrome.storage.sync.set({ customPrompts: prompts });
    return prompts;
  }

  static async initializeDefaultPrompts() {
    await chrome.storage.sync.set({ customPrompts: this.DEFAULT_PROMPTS });
  }

  static async saveCustomPrompt(promptObj) {
    const prompts = await this.getCustomPrompts();
    if (!prompts.some(p => p.id === promptObj.id)) {
      const newPrompt = {
        ...promptObj,
        id: promptObj.id || this.generatePromptId()
      };
      prompts.push(newPrompt);
      await chrome.storage.sync.set({ customPrompts: prompts });
    }
  }

  static async deleteCustomPrompt(promptId) {
    const prompts = await this.getCustomPrompts();
    const updatedPrompts = prompts.filter(p => p.id !== promptId);
    await chrome.storage.sync.set({ customPrompts: updatedPrompts });
  }

  static async getState() {
    const [apiKey, customPrompts] = await Promise.all([
      this.getApiKey(),
      this.getCustomPrompts()
    ]);
    return { apiKey, customPrompts };
  }
}
