// Background script for handling messages and side panel state

// Inlined StorageService logic (no ES module imports)
const DEFAULT_PROMPTS = [
  "Please summarize the content of this webpage.",
  "What are the key points from this page?",
  "Extract the main ideas from this content.",
  "Give me a brief overview of this page."
];

async function getApiKey() {
  const result = await chrome.storage.sync.get('apiKey');
  return result.apiKey;
}

async function saveApiKey(apiKey) {
  await chrome.storage.sync.set({ apiKey });
}

async function getCustomPrompts() {
  const result = await chrome.storage.sync.get('customPrompts');
  if (!result.customPrompts || result.customPrompts.length === 0) {
    await initializeDefaultPrompts();
    return DEFAULT_PROMPTS;
  }
  return result.customPrompts;
}

async function initializeDefaultPrompts() {
  await chrome.storage.sync.set({ customPrompts: DEFAULT_PROMPTS });
}

async function saveCustomPrompt(prompt) {
  const prompts = await getCustomPrompts();
  if (!prompts.includes(prompt)) {
    prompts.push(prompt);
    await chrome.storage.sync.set({ customPrompts: prompts });
  }
}

async function deleteCustomPrompt(promptId) {
  const prompts = await getCustomPrompts();
  const updatedPrompts = prompts.filter(p => p.id !== promptId);
  await chrome.storage.sync.set({ customPrompts: updatedPrompts });
}

let panelState = {}; // Keeps track of side panel state per tab

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'saveApiKey':
      saveApiKey(request.apiKey)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'savePrompt':
      saveCustomPrompt(request.prompt)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'deletePrompt':
      deleteCustomPrompt(request.promptId)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'getCustomPrompts':
      getCustomPrompts()
        .then(prompts => sendResponse({ prompts }))
        .catch(error => sendResponse({ error: error.message }));
      break;

    case 'captureAndSummarize':
      handleCaptureAndSummarize(request, sendResponse);
      break;
  }
  return true; // Keep the message channel open for async responses
});

async function handleCaptureAndSummarize(request, sendResponse) {
  try {
    const screenshotUrl = await captureVisibleTab();
    const prompt = request.customPrompt || "Please summarize the content of this webpage.";
    const base64Image = screenshotUrl.split(",")[1];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${request.apiKey}`,
      },
      body: JSON.stringify({
        model: "o4-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
      }),
    });

    const result = await openaiRes.json();
    if (result.error) {
      sendResponse({ error: result.error.message });
    } else {
      sendResponse({
        summary: result.choices[0].message.content,
        screenshot: screenshotUrl,
      });
    }
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (screenshotUrl) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(screenshotUrl);
      }
    });
  });
}

chrome.action.onClicked.addListener((tab) => {
  const tabId = tab.id;

  if (panelState[tabId]) {
    // Panel is open → close it
    chrome.sidePanel.setOptions({
      tabId: tabId,
      enabled: false,
    });
    panelState[tabId] = false;
    console.log("🔒 Side panel closed");
  } else {
    // Panel is closed → open it
    chrome.sidePanel.setOptions({
      tabId: tabId,
      path: "popup.html",
      enabled: true,
    });

    chrome.sidePanel.open({ tabId: tabId });
    panelState[tabId] = true;
    console.log("🔓 Side panel opened");
  }
});
