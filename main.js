const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron'); // Added dialog & shell
const path = require('path');
const fs = require('fs'); // Added fs for file writing
const https = require('https'); // Use Node's built-in https module

// electron-store is ESM-only, so we need to use dynamic import()
let store;

async function initializeStore() {
  const { default: Store } = await import('electron-store');
  store = new Store();
}

async function createWindow() {
  // Ensure store is initialized before creating the window or setting up IPC handlers
  if (!store) {
    await initializeStore();
  }

  // Define the icon path
  const iconPath = path.join(__dirname, 'assets/icon.png');
  console.log(`Attempting to load icon from: ${iconPath}`); // Log path for debugging

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: iconPath, // Set the window icon
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Important for security
      nodeIntegration: false, // Keep false for security
    },
  });

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools (optional, useful for debugging)
  // mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => { // Make the callback async
  // Initialize store first
  await initializeStore();

  // Now setup IPC handlers that depend on the store
  setupIpcHandlers();

  // Then create the window
  createWindow(); // Note: createWindow itself is now async but we don't necessarily need to await it here

  app.on('activate', async function () { // Make the callback async
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// --- IPC Handlers ---
// We'll define them in a function to ensure 'store' is initialized first

function setupIpcHandlers() {
  // Handle saving API key
  ipcMain.handle('save-api-key', async (event, apiKey) => {
  try {
    store.set('apiKey', apiKey);
    console.log('API Key saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to save API Key:', error);
    return { success: false, error: error.message };
  }
});

// Handle loading API key
ipcMain.handle('load-api-key', async (event) => {
  try {
    const apiKey = store.get('apiKey', ''); // Get key, default to empty string
    return { success: true, apiKey: apiKey };
  } catch (error) {
    console.error('Failed to load API Key:', error);
    return { success: false, error: error.message };
  }
});

// Handle making scrape request
  ipcMain.handle('make-scrape-request', async (event, { url, options }) => {
    const apiKey = store.get('apiKey', '');
    if (!apiKey) {
      return { success: false, error: 'API Key not set. Please set it in Settings.' };
    }

    // Construct the API URL with proper parameter encoding
    const apiBase = 'https://api.scrapestack.com/scrape';
    const params = new URLSearchParams();
    params.append('access_key', apiKey);
    params.append('url', url);
    
    // Only add optional parameters if they have values
    if (options.render_js !== undefined) params.append('render_js', options.render_js);
    if (options.premium_proxy !== undefined) params.append('premium_proxy', options.premium_proxy);
    if (options.proxy_location) params.append('proxy_location', options.proxy_location);
    if (options.keep_headers !== undefined) params.append('keep_headers', options.keep_headers);

    const apiUrl = `${apiBase}?${params.toString()}`;
    console.log(`Making request to Scrapestack API`); // Don't log full URL with key

    return new Promise((resolve) => {
      const req = https.get(apiUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log(`Status Code: ${res.statusCode}`);
          
          // Handle 502 Bad Gateway specifically
          if (res.statusCode === 502) {
            return resolve({ 
              success: false, 
              error: 'Scrapestack API is temporarily unavailable (502 Bad Gateway). Please try again later.' 
            });
          }

          try {
            const jsonData = JSON.parse(data);
            if (jsonData.success === false && jsonData.error) {
              const errorMsg = `Scrapestack Error ${jsonData.error.code}: ${jsonData.error.type}`;
              console.error(errorMsg);
              return resolve({ success: false, error: errorMsg });
            }
            // If we get here, it's a successful JSON response
            return resolve({ success: true, data: JSON.stringify(jsonData, null, 2) });
          } catch (e) {
            // Not JSON - assume HTML content if status is 200
            if (res.statusCode === 200) {
              return resolve({ success: true, data: data });
            }
            // Other non-200 status
            return resolve({ 
              success: false, 
              error: `HTTP Error ${res.statusCode}: ${data || 'No details available'}` 
            });
          }
        });
      });

      req.on('error', (err) => {
        console.error('HTTPS request error:', err);
        let errorMsg = err.message;
        if (err.code === 'ECONNRESET') {
          errorMsg = 'Connection to Scrapestack API was reset. Please check your network and try again.';
        } else if (err.code === 'ETIMEDOUT') {
          errorMsg = 'Connection to Scrapestack API timed out. Please try again later.';
        }
        resolve({ success: false, error: errorMsg });
      });

      // Set timeout to prevent hanging
      req.setTimeout(30000, () => {
        req.destroy();
        resolve({ success: false, error: 'Request timed out after 30 seconds' });
      });
    });
});

  // Handle CSV export
  ipcMain.handle('export-to-csv', async (event, { url, htmlContent }) => {
    // Get the window associated with the renderer process that sent the request
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
        return { success: false, error: 'Could not find the application window.' };
    }

    // Suggest a filename based on the URL
    let suggestedFilename = 'scraped_data.csv';
    try {
        const parsedUrl = new URL(url);
        suggestedFilename = `${parsedUrl.hostname.replace(/^www\./, '')}_${new Date().toISOString().split('T')[0]}.csv`;
    } catch (e) {
        console.warn("Could not parse URL for suggested filename:", e);
    }


    try {
      // Show save dialog
      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        title: 'Save Scraped Data as CSV',
        defaultPath: suggestedFilename,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (canceled || !filePath) {
        console.log('CSV export cancelled by user.');
        return { success: false, cancelled: true };
      }

      // Prepare CSV content (simple example: URL, Timestamp, Content)
      // For proper CSV handling, especially with content containing commas or quotes,
      // a dedicated CSV library would be better, but for basic HTML this might suffice.
      const timestamp = new Date().toISOString();
      // Basic CSV escaping: double quotes around fields, double up existing double quotes
      const escapeCsvField = (field) => `"${String(field).replace(/"/g, '""')}"`;

      const csvHeader = 'URL,Timestamp,HTMLContent\n';
      const csvRow = `${escapeCsvField(url)},${escapeCsvField(timestamp)},${escapeCsvField(htmlContent)}\n`;
      const csvContent = csvHeader + csvRow;

      // Write file
      fs.writeFileSync(filePath, csvContent, 'utf8');
      console.log(`CSV data saved to: ${filePath}`);
      return { success: true, filePath: filePath };

    } catch (error) {
      console.error('Failed to export CSV:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle opening external links
  ipcMain.handle('open-external-link', async (event, url) => {
    try {
      // Basic check to ensure it's likely a web URL
      if (url && (url.startsWith('http:') || url.startsWith('https:'))) {
        await shell.openExternal(url);
        return { success: true };
      } else {
        console.error('Attempted to open invalid external link:', url);
        return { success: false, error: 'Invalid URL format.' };
      }
    } catch (error) {
      console.error('Failed to open external link:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle request to close the application
  ipcMain.handle('close-app', () => {
      app.quit();
  });

  // --- OpenAI Key Handlers ---
  ipcMain.handle('save-openai-api-key', async (event, apiKey) => {
    try {
      store.set('openaiApiKey', apiKey); // Use a distinct key name
      console.log('OpenAI API Key saved successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to save OpenAI API Key:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-openai-api-key', async (event) => {
    try {
      const apiKey = store.get('openaiApiKey', ''); // Use the distinct key name
      return { success: true, apiKey: apiKey };
    } catch (error) {
      console.error('Failed to load OpenAI API Key:', error);
      return { success: false, error: error.message };
    }
  });

   ipcMain.handle('test-openai-api-key', async (event, apiKey) => {
    if (!apiKey) {
      return { success: false, error: 'API Key is empty.' };
    }
    const url = 'https://api.openai.com/v1/models';
    console.log(`Testing OpenAI Key by requesting: ${url}`);

    return new Promise((resolve) => {
        const request = https.request(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        }, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                console.log(`OpenAI Test Status Code: ${res.statusCode}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    // Optionally check if responseBody is valid JSON
                     try {
                         JSON.parse(responseBody);
                         resolve({ success: true });
                     } catch (e) {
                         console.warn('OpenAI test response was not valid JSON, but status code was OK.');
                         resolve({ success: true, warning: 'Response format unexpected.' });
                     }
                } else {
                    resolve({ success: false, error: `Invalid Key or API Error (Status: ${res.statusCode})` });
                }
            });
        });

        request.on('error', (err) => {
            console.error('Error testing OpenAI key (network request):', err);
            resolve({ success: false, error: `Network error: ${err.message}` });
        });

        request.end();
    });
  });

  ipcMain.handle('call-openai-chat', async (event, prompt) => {
    const apiKey = store.get('openaiApiKey', '');
    if (!apiKey) {
      return { success: false, error: 'OpenAI API Key not set. Please set it in Settings.' };
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    console.log(`Calling OpenAI Chat API with prompt: ${prompt.substring(0, 50)}...`);

    return new Promise((resolve) => {
        const request = https.request(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                console.log(`OpenAI Chat Status Code: ${res.statusCode}`);
                
                // Handle rate limiting (429) specifically
                if (res.statusCode === 429) {
                    const retryAfter = res.headers['retry-after'] || 20;
                    const errorMsg = `API rate limit exceeded. Please wait ${retryAfter} seconds and try again.`;
                    return resolve({ 
                        success: false, 
                        error: errorMsg,
                        retryAfter: parseInt(retryAfter)
                    });
                }

                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const data = JSON.parse(responseBody);
                        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                            resolve({ 
                                success: true, 
                                content: data.choices[0].message.content.trim(),
                                usage: data.usage // Include usage stats
                            });
                        } else {
                            throw new Error("Invalid response structure from OpenAI.");
                        }
                    } catch (e) {
                        resolve({ success: false, error: `Response parsing error: ${e.message}` });
                    }
                } else {
                    // Handle other API errors
                    let errorMsg = `API Error (Status: ${res.statusCode})`;
                    try {
                        const errorData = JSON.parse(responseBody);
                        if (errorData.error && errorData.error.message) {
                            errorMsg = errorData.error.message;
                        }
                    } catch (e) {}
                    resolve({ success: false, error: errorMsg });
                }
            });
        });

        request.on('error', (err) => {
            console.error('Error calling OpenAI Chat API (network request):', err);
            resolve({ success: false, error: `Network error: ${err.message}` });
        });

        // Use gpt-3.5-turbo by default to reduce costs/rate limits
        request.write(JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 500
        }));

        request.end();
    });
  });

  // --- Clipboard and File Operations ---
  ipcMain.handle('write-clipboard-text', async (event, text) => {
    try {
      const { clipboard } = require('electron');
      clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      console.error('Failed to write to clipboard:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-file', async (event, { content, filename, fileType, defaultPath }) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        return { success: false, error: 'Could not find the application window.' };
      }

      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        title: 'Save File',
        defaultPath: defaultPath || filename,
        filters: [{ name: fileType.toUpperCase() + ' Files', extensions: [fileType] }],
      });

      if (canceled || !filePath) {
        return { success: false, cancelled: true };
      }

      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true, filePath };
    } catch (error) {
      console.error('Failed to save file:', error);
      return { success: false, error: error.message };
    }
  });
} // End of setupIpcHandlers function
