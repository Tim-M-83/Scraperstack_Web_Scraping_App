const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Function to send scrape request details to the main process
  makeScrapeRequest: (url, options) => ipcRenderer.invoke('make-scrape-request', { url, options }),

  // Function to send the API key to the main process for saving
  saveApiKey: (apiKey) => ipcRenderer.invoke('save-api-key', apiKey),

  // Function to request the saved API key from the main process
  loadApiKey: () => ipcRenderer.invoke('load-api-key'),

  // Function to trigger CSV export in the main process
  exportToCsv: (url, htmlContent) => ipcRenderer.invoke('export-to-csv', { url, htmlContent }),

  // Function to request opening a link in the default browser
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),

  // Function to request closing the application
  closeApp: () => ipcRenderer.invoke('close-app'),

  // --- OpenAI Key Management ---
  saveOpenaiApiKey: (apiKey) => ipcRenderer.invoke('save-openai-api-key', apiKey),
  loadOpenaiApiKey: () => ipcRenderer.invoke('load-openai-api-key'),
  testOpenaiApiKey: (apiKey) => ipcRenderer.invoke('test-openai-api-key', apiKey), // Added for testing

  // --- OpenAI Chat Completion ---
  callOpenaiChat: (prompt) => ipcRenderer.invoke('call-openai-chat', prompt), // Added for AI actions

  // --- Clipboard and File Operations ---
  writeClipboardText: (text) => ipcRenderer.invoke('write-clipboard-text', text),
  saveFile: (options) => ipcRenderer.invoke('save-file', options)
});
