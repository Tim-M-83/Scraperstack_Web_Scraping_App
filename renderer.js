const dashboardView = document.getElementById('dashboard-view');
const settingsView = document.getElementById('settings-view');
const navDashboardButton = document.getElementById('nav-dashboard');
const navSettingsButton = document.getElementById('nav-settings');

const urlInput = document.getElementById('url-input');
const renderJsCheckbox = document.getElementById('render-js-checkbox');
const premiumProxyCheckbox = document.getElementById('premium-proxy-checkbox');
const proxyLocationInput = document.getElementById('proxy-location-input');
const keepHeadersCheckbox = document.getElementById('keep-headers-checkbox');
const scrapeButton = document.getElementById('scrape-button');
const resultOutput = document.getElementById('result-output');
const statusMessage = document.getElementById('status-message');
const exportCsvButton = document.getElementById('export-csv-button'); // Added

const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyButton = document.getElementById('save-api-key-button');
const settingsStatusMessage = document.getElementById('settings-status-message');
const toggleApiKeyVisibilityButton = document.getElementById('toggle-api-key-visibility');
const closeAppButton = document.getElementById('close-app-button'); // Added

// OpenAI Settings Elements
const openaiApiKeyInput = document.getElementById('openai-api-key-input');
const toggleOpenaiApiKeyVisibilityButton = document.getElementById('toggle-openai-api-key-visibility');
const saveOpenaiApiKeyButton = document.getElementById('save-openai-api-key-button');
const testOpenaiKeyButton = document.getElementById('test-openai-key-button');
const openaiKeyStatusMessage = document.getElementById('openai-key-status-message');

// Post-Scrape AI Elements
const postScrapeOptionsDiv = document.getElementById('post-scrape-options');
const analyzeGpt4Button = document.getElementById('analyze-gpt4-button');
const analyzeGpt4ResultDiv = document.getElementById('analyze-gpt4-result');
const generateCaptionButton = document.getElementById('generate-caption-button');
const generateCaptionResultDiv = document.getElementById('generate-caption-result');
const generateMetadataButton = document.getElementById('generate-metadata-button');

// New Feature Elements
const copyResponseButton = document.getElementById('copy-response-button');
const saveResponseButton = document.getElementById('save-response-button');
const generateFaqButton = document.getElementById('generate-faq-button');
const faqResultDiv = document.getElementById('faq-result');
const copyFaqButton = document.getElementById('copy-faq-button');
const saveFaqButton = document.getElementById('save-faq-button');
const generateTitleMetaButton = document.getElementById('generate-title-meta-button');
const titleMetaResultDiv = document.getElementById('title-meta-result');
const estimateSeoScoreButton = document.getElementById('estimate-seo-score-button');
const seoScoreResultDiv = document.getElementById('seo-score-result');
const languageSelect = document.getElementById('language-select');
const generateMetadataResultDiv = document.getElementById('generate-metadata-result');


// --- Navigation ---
navDashboardButton.addEventListener('click', () => {
    settingsView.classList.remove('active-view');
    dashboardView.classList.add('active-view');
});

navSettingsButton.addEventListener('click', () => {
    dashboardView.classList.remove('active-view');
    settingsView.classList.add('active-view');
});

// --- Settings ---
saveApiKeyButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        settingsStatusMessage.textContent = 'Please enter an API Key.';
        settingsStatusMessage.className = 'error';
        return;
    }
    settingsStatusMessage.textContent = 'Saving...';
    settingsStatusMessage.className = '';

    try {
        const result = await window.electronAPI.saveApiKey(apiKey);
        if (result.success) {
            settingsStatusMessage.textContent = 'API Key saved successfully!';
            settingsStatusMessage.className = 'success';
        } else {
            settingsStatusMessage.textContent = `Error saving API Key: ${result.error || 'Unknown error'}`;
            settingsStatusMessage.className = 'error';
        }
    } catch (error) {
        settingsStatusMessage.textContent = `Error saving API Key: ${error.message}`;
        settingsStatusMessage.className = 'error';
    }
});

toggleApiKeyVisibilityButton.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleApiKeyVisibilityButton.textContent = 'Hide';
    } else {
        apiKeyInput.type = 'password';
        toggleApiKeyVisibilityButton.textContent = 'Show';
    }
});

// --- OpenAI Settings Logic ---

// Toggle OpenAI Key Visibility
if (toggleOpenaiApiKeyVisibilityButton) {
    toggleOpenaiApiKeyVisibilityButton.addEventListener('click', () => {
        if (openaiApiKeyInput.type === 'password') {
            openaiApiKeyInput.type = 'text';
            toggleOpenaiApiKeyVisibilityButton.textContent = 'Hide';
        } else {
            openaiApiKeyInput.type = 'password';
            toggleOpenaiApiKeyVisibilityButton.textContent = 'Show';
        }
    });
}

// Save OpenAI Key
if (saveOpenaiApiKeyButton) {
    saveOpenaiApiKeyButton.addEventListener('click', async () => {
        const apiKey = openaiApiKeyInput.value.trim();
        if (!apiKey) {
            openaiKeyStatusMessage.textContent = 'Please enter an OpenAI API Key.';
            openaiKeyStatusMessage.className = 'error';
            return;
        }
        openaiKeyStatusMessage.textContent = 'Saving...';
        openaiKeyStatusMessage.className = '';

        try {
            const result = await window.electronAPI.saveOpenaiApiKey(apiKey);
            if (result.success) {
                openaiKeyStatusMessage.textContent = 'OpenAI API Key saved successfully!';
                openaiKeyStatusMessage.className = 'success';
            } else {
                openaiKeyStatusMessage.textContent = `Error saving OpenAI API Key: ${result.error || 'Unknown error'}`;
                openaiKeyStatusMessage.className = 'error';
            }
        } catch (error) {
            openaiKeyStatusMessage.textContent = `Error saving OpenAI API Key: ${error.message}`;
            openaiKeyStatusMessage.className = 'error';
        }
    });
}

// Test OpenAI Key
if (testOpenaiKeyButton) {
    testOpenaiKeyButton.addEventListener('click', async () => {
        const key = openaiApiKeyInput.value.trim();
        if (!key) {
            openaiKeyStatusMessage.textContent = 'Please enter an OpenAI API Key to test.';
            openaiKeyStatusMessage.className = 'error';
            return;
        }

        openaiKeyStatusMessage.textContent = 'Testing OpenAI API Key...';
        openaiKeyStatusMessage.className = '';
        testOpenaiKeyButton.disabled = true;

        try {
            // Use the IPC channel to test the key in the main process
            const result = await window.electronAPI.testOpenaiApiKey(key);

            if (result.success) {
                 openaiKeyStatusMessage.textContent = '✅ Valid OpenAI API Key!';
                 openaiKeyStatusMessage.className = 'success';
                 if(result.warning) {
                     openaiKeyStatusMessage.textContent += ` (${result.warning})`;
                     openaiKeyStatusMessage.className = 'warning';
                 }
            } else {
                 openaiKeyStatusMessage.textContent = `❌ ${result.error || 'Test failed.'}`;
                 openaiKeyStatusMessage.className = 'error';
            }
        } catch (err) {
            console.error("Error testing OpenAI key via IPC:", err);
            openaiKeyStatusMessage.textContent = '❌ Error communicating with main process for test.';
            openaiKeyStatusMessage.className = 'error';
        } finally {
            testOpenaiKeyButton.disabled = false;
        }
    });
}

// Add listener for the OpenAI API Keys link
const openaiApiKeysLink = document.getElementById('openai-api-keys-link');
if (openaiApiKeysLink) {
    openaiApiKeysLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.electronAPI.openExternalLink(event.target.href);
    });
}


// Add listener for the external link
const scrapestackLink = document.getElementById('scrapestack-link');
if (scrapestackLink) {
    scrapestackLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default link navigation within Electron window
        const url = event.target.href;
        // We need to define 'openExternalLink' in preload.js and handle it in main.js
        window.electronAPI.openExternalLink(url);
    });
}

// Add listener for the dashboard Scrapestack link
const scrapestackLinkDashboard = document.getElementById('scrapestack-link-dashboard');
if (scrapestackLinkDashboard) {
    scrapestackLinkDashboard.addEventListener('click', (event) => {
        event.preventDefault();
        window.electronAPI.openExternalLink(event.target.href);
    });
}

// Add listener for the GitHub link in the footer
const githubLink = document.getElementById('github-link');
if (githubLink) {
    githubLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.electronAPI.openExternalLink(event.target.href);
    });
}

// Add listener for the YouTube link in the footer
const youtubeLink = document.getElementById('youtube-link');
if (youtubeLink) {
    youtubeLink.addEventListener('click', (event) => {
        event.preventDefault();
        window.electronAPI.openExternalLink(event.target.href);
    });
}


// Add listener for the inline button link to Settings page
const linkToSettingsButton = document.getElementById('link-to-settings');
if (linkToSettingsButton) {
    linkToSettingsButton.addEventListener('click', () => {
        // Reuse the existing navigation logic/elements
        navSettingsButton.click();
    });
}


// Load API key on startup (optional - maybe just check if it exists)
window.addEventListener('DOMContentLoaded', async () => {
    // Load Scrapestack key
    try {
        const result = await window.electronAPI.loadApiKey();
        if (result.success && result.apiKey) {
            console.log('Scrapestack API Key is set.');
        } else if (!result.success) {
             console.error('Failed to load Scrapestack API key on startup:', result.error);
        }
    } catch (error) {
        console.error('Error loading Scrapestack API key on startup:', error);
    }

    // Load OpenAI key
    try {
        const resultOpenAI = await window.electronAPI.loadOpenaiApiKey();
         if (resultOpenAI.success && openaiApiKeyInput) {
            openaiApiKeyInput.value = resultOpenAI.apiKey || '';
            if (resultOpenAI.apiKey) {
                 console.log('OpenAI API Key is set.');
            }
         } else if (!resultOpenAI.success) {
             console.error('Failed to load OpenAI API key on startup:', resultOpenAI.error);
         }
    } catch (error) {
         console.error('Error loading OpenAI API key on startup:', error);
    }
});


// --- Dashboard (Scraping) ---
scrapeButton.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) {
        statusMessage.textContent = 'Please enter a URL to scrape.';
        statusMessage.className = 'error';
        return;
    }

    // Basic URL validation (can be improved)
    try {
        new URL(url);
    } catch (_) {
        statusMessage.textContent = 'Invalid URL format.';
        statusMessage.className = 'error';
        return;
    }


    const options = {
        render_js: renderJsCheckbox.checked ? 1 : 0,
        premium_proxy: premiumProxyCheckbox.checked ? 1 : 0,
        proxy_location: proxyLocationInput.value.trim() || undefined, // Send only if not empty
        keep_headers: keepHeadersCheckbox.checked ? 1 : 0,
    };

    // Remove undefined options
    Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);

    statusMessage.textContent = 'Scraping in progress...';
    statusMessage.className = '';
    resultOutput.value = ''; // Clear previous results
    scrapeButton.disabled = true;
    exportCsvButton.disabled = true; // Disable export button during scrape
    postScrapeOptionsDiv.style.display = 'none'; // Hide AI options on new scrape
    // Clear previous AI results
    if(analyzeGpt4ResultDiv) analyzeGpt4ResultDiv.textContent = '';
    if(generateCaptionResultDiv) generateCaptionResultDiv.textContent = '';
    if(generateMetadataResultDiv) generateMetadataResultDiv.textContent = '';


    try {
        const result = await window.electronAPI.makeScrapeRequest(url, options);
        if (result.success) {
            resultOutput.value = result.data;
            statusMessage.textContent = 'Scraping successful!';
            statusMessage.className = 'success';
            // Enable export and show AI options only if we got some data
            if (result.data && typeof result.data === 'string' && result.data.length > 0) {
                exportCsvButton.disabled = false;
                // Show all AI options container and individual options
                postScrapeOptionsDiv.style.display = 'block';
                document.querySelectorAll('.ai-option').forEach(option => {
                    option.style.display = 'block';
                });
                
                // Enable all AI feature buttons
                if(analyzeGpt4Button) analyzeGpt4Button.disabled = false;
                if(generateCaptionButton) generateCaptionButton.disabled = false;
                if(generateMetadataButton) generateMetadataButton.disabled = false;
            }
        } else {
            // Improved error display
            const errorMessage = result.error || 'Unknown error occurred';
            resultOutput.value = `Error Details:\n${errorMessage}\n\nSuggested Solutions:\n1. Check your internet connection\n2. Verify your Scrapestack API key is valid\n3. Try again in a few minutes\n4. Contact support if issue persists`;
            
            // Format error message with more details
            statusMessage.innerHTML = `❌ Scraping failed: ${errorMessage}<br>
            <small>URL: ${url}</small><br>
            <small>Options: ${JSON.stringify(options)}</small>`;
            
            statusMessage.className = 'error';
            
            // If it's a 502 error, suggest trying without premium proxies
            if (errorMessage.includes('502') && options.premium_proxy) {
                statusMessage.innerHTML += `<br><small>Tip: Try disabling premium proxies as they may be temporarily unavailable</small>`;
            }
        }
    } catch (error) {
        resultOutput.value = `Unexpected Error:\n${error.message}\n\nPlease check your settings and try again.`;
        statusMessage.textContent = `Critical error: ${error.message}`;
        statusMessage.className = 'error';
    } finally {
        scrapeButton.disabled = false;
        
        // If there was an error, ensure AI options are hidden
        if (statusMessage.className === 'error') {
            postScrapeOptionsDiv.style.display = 'none';
            exportCsvButton.disabled = true;
        }
    }
});

// --- Export CSV ---
exportCsvButton.addEventListener('click', async () => {
    const htmlContent = resultOutput.value;
    const originalUrl = urlInput.value.trim(); // Get the URL that was scraped

    if (!htmlContent || !originalUrl) {
        statusMessage.textContent = 'No data or URL to export.';
        statusMessage.className = 'error';
        return;
    }

    statusMessage.textContent = 'Exporting CSV...';
    statusMessage.className = '';
    exportCsvButton.disabled = true; // Disable during export

    try {
        // We need to define 'exportToCsv' in preload.js and handle it in main.js
        const result = await window.electronAPI.exportToCsv(originalUrl, htmlContent);
        if (result.success) {
            statusMessage.textContent = `CSV exported successfully to ${result.filePath || 'selected location'}.`;
            statusMessage.className = 'success';
        } else if (result.cancelled) {
             statusMessage.textContent = 'CSV export cancelled.';
             statusMessage.className = ''; // Not an error
        }
        else {
            statusMessage.textContent = `Error exporting CSV: ${result.error || 'Unknown error'}`;
            statusMessage.className = 'error';
        }
    } catch (error) {
        statusMessage.textContent = `Error exporting CSV: ${error.message}`;
        statusMessage.className = 'error';
    } finally {
        // Re-enable button only if there's still content
        if (resultOutput.value && resultOutput.value.length > 0) {
             exportCsvButton.disabled = false;
         }
    }
});

// --- Close App Button ---
if (closeAppButton) {
    closeAppButton.addEventListener('click', () => {
        // Define 'closeApp' in preload.js and handle in main.js
        window.electronAPI.closeApp();
    });
}

// --- AI Helper Function ---
async function callOpenAI(promptText, resultDiv, buttonElement) {
    resultDiv.textContent = '🧠 Thinking...';
    resultDiv.className = 'ai-result'; // Reset class
    buttonElement.disabled = true;

    // Basic check for HTML content
    const htmlContent = resultOutput.value;
    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
        resultDiv.textContent = '❌ No scraped HTML content available to analyze.';
        resultDiv.className = 'ai-result error';
        buttonElement.disabled = false;
        return;
    }

    // Construct the full prompt including the HTML content
    // Truncate HTML if it's too long to avoid excessive token usage/cost
    const maxHtmlLength = 10000; // Adjust as needed (approx 2.5k tokens)
    const truncatedHtml = htmlContent.length > maxHtmlLength
        ? htmlContent.substring(0, maxHtmlLength) + "\n... [HTML truncated] ..."
        : htmlContent;

    const fullPrompt = `${promptText}\n\nHere is the scraped HTML content:\n\`\`\`html\n${truncatedHtml}\n\`\`\``;

    try {
        const result = await window.electronAPI.callOpenaiChat(fullPrompt);
        if (result.success) {
            resultDiv.textContent = result.content;
            resultDiv.className = 'ai-result success'; // Optional success styling
        } else {
            throw new Error(result.error || "Unknown error from OpenAI.");
        }
    } catch (error) {
        console.error("Error calling OpenAI via IPC:", error);
        resultDiv.textContent = `❌ Error: ${error.message}`;
        resultDiv.className = 'ai-result error';
    } finally {
        buttonElement.disabled = false;
    }
}

let selectedLanguage = 'EN'; // Default language

// --- Language Selection ---
if (languageSelect) {
    languageSelect.addEventListener('change', (event) => {
        selectedLanguage = event.target.value;
    });
}

// --- AI Button Listeners ---

// Copy to Clipboard
if (copyResponseButton) {
    copyResponseButton.addEventListener('click', () => {
        const textToCopy = resultOutput.value;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}

// Save to File
if (saveResponseButton) {
    saveResponseButton.addEventListener('click', () => {
        const textToSave = resultOutput.value;
        const blob = new Blob([textToSave], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'output.txt';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Generate FAQ Schema
if (generateFaqButton) {
    generateFaqButton.addEventListener('click', () => {
        const prompt = `Based on this website's content, generate three frequently asked questions (FAQs) and answers relevant to the topic. Format the result as a valid JSON-LD schema for SEO integration.`;
        callOpenAI(prompt, faqResultDiv, generateFaqButton);
    });
}

// Copy FAQ Schema
if (copyFaqButton) {
    copyFaqButton.addEventListener('click', () => {
        const textToCopy = faqResultDiv.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });
}

// Save FAQ as .json
if (saveFaqButton) {
    saveFaqButton.addEventListener('click', () => {
        const textToSave = faqResultDiv.textContent;
        const blob = new Blob([textToSave], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'faq-schema.json';
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Generate Title + Meta Description Suggestions
if (generateTitleMetaButton) {
    generateTitleMetaButton.addEventListener('click', () => {
        const prompt = `Using the website’s content and structure, suggest 3 SEO-optimized title and meta description pairs. Each should be tailored for click-through rate and search ranking. Include suggested keywords.`;
        callOpenAI(prompt, titleMetaResultDiv, generateTitleMetaButton);
    });
}

// Estimate SEO Score
if (estimateSeoScoreButton) {
    estimateSeoScoreButton.addEventListener('click', () => {
        const prompt = `Based on the provided HTML and metadata, estimate a basic SEO score (0-100) for the page. Explain what is working well and list 3-5 areas for improvement related to technical SEO, metadata, and structure. At the end of the SEO score evaluation, give the following rating: "Optimize your website even more easily with our professional SEO Toolkit.". Use the following link to draw the user's attention to our SEO toolkit (make the link clickable, if possible): "https://appsumo.8odi.net/VxAbrJ".`;
        callOpenAI(prompt, seoScoreResultDiv, estimateSeoScoreButton);
    });
}


if (analyzeGpt4Button) {
    analyzeGpt4Button.addEventListener('click', () => {
        const prompt = `You are an AI assistant analyzing scraped HTML content. Provide a brief analysis of the structure, potential purpose, a quick breakdown of the content, and any notable elements found in the HTML provided below. Describe the content of the website in two to three sentences. Keep it concise.`;
        callOpenAI(prompt, analyzeGpt4ResultDiv, analyzeGpt4Button);
    });
}

if (generateCaptionButton) {
    generateCaptionButton.addEventListener('click', () => {
        const prompt = `Based on the HTML content provided below, generate three different short, engaging social media caption (e.g., for Instagram or Twitter) that summarizes the page's likely topic or product.`;
        callOpenAI(prompt, generateCaptionResultDiv, generateCaptionButton);
    });
}

if (generateMetadataButton) {
    generateMetadataButton.addEventListener('click', () => {
        const prompt = `Based on the HTML content provided below, generate the following metadata:\n1. A concise SEO-friendly page title (max 60 chars).\n2. A compelling meta description (max 160 chars).\n3. 5 relevant keywords (comma-separated).\n\nFormat the output clearly labeled.`;
        callOpenAI(prompt, generateMetadataResultDiv, generateMetadataButton);
    });
}

// Setup copy/save buttons for all AI result sections
function setupAiActionButtons() {
    // Map of button IDs to their corresponding result div IDs
    const buttonMap = {
        'copy-analyze-button': 'analyze-gpt4-result',
        'save-analyze-button': 'analyze-gpt4-result',
        'copy-caption-button': 'generate-caption-result',
        'save-caption-button': 'generate-caption-result',
        'copy-metadata-button': 'generate-metadata-result',
        'save-metadata-button': 'generate-metadata-result',
        'copy-faq-button': 'faq-result',
        'save-faq-button': 'faq-result',
        'copy-title-meta-button': 'title-meta-result',
        'save-title-meta-button': 'title-meta-result',
        'copy-seo-score-button': 'seo-score-result',
        'save-seo-score-button': 'seo-score-result',
        'copy-custom-seo-strategy-button': 'custom-seo-strategy-result',
        'save-custom-seo-strategy-button': 'custom-seo-strategy-result'
    };

    // Initialize the Custom SEO Strategy buttons if they exist
    const customSeoStrategyCopyBtn = document.getElementById('copy-custom-seo-strategy-button');
    const customSeoStrategySaveBtn = document.getElementById('save-custom-seo-strategy-button');
    const customSeoStrategyResultDiv = document.getElementById('custom-seo-strategy-result');

    if (customSeoStrategyCopyBtn && customSeoStrategyResultDiv) {
        customSeoStrategyCopyBtn.addEventListener('click', async () => {
            try {
                const textToCopy = customSeoStrategyResultDiv.textContent || customSeoStrategyResultDiv.innerText;
                await window.electronAPI.writeClipboardText(textToCopy);
                const originalText = customSeoStrategyCopyBtn.textContent;
                customSeoStrategyCopyBtn.textContent = '✓ Copied!';
                setTimeout(() => customSeoStrategyCopyBtn.textContent = originalText, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard. Please try again.');
            }
        });
    }

    if (customSeoStrategySaveBtn && customSeoStrategyResultDiv) {
        customSeoStrategySaveBtn.addEventListener('click', async () => {
            const content = customSeoStrategyResultDiv.textContent || customSeoStrategyResultDiv.innerText;
            const filename = `custom-seo-strategy-${new Date().toISOString().slice(0,10)}.txt`;
            
            try {
                const result = await window.electronAPI.saveFile({
                    content,
                    filename,
                    fileType: 'txt',
                    defaultPath: filename
                });
                
                if (!result.success) {
                    alert(`Failed to save file: ${result.error || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('Save failed:', err);
                alert('Failed to save file. Please try again.');
            }
        });
    }

    // Setup copy buttons
    Object.entries(buttonMap).forEach(([buttonId, resultDivId]) => {
        if (buttonId.startsWith('copy-')) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', async () => {
                    const resultDiv = document.getElementById(resultDivId);
                    if (resultDiv) {
                        try {
                            const textToCopy = resultDiv.textContent || resultDiv.innerText;
                            await window.electronAPI.writeClipboardText(textToCopy);
                            const originalText = button.textContent;
                            button.textContent = '✓ Copied!';
                            setTimeout(() => button.textContent = originalText, 2000);
                        } catch (err) {
                            console.error('Failed to copy:', err);
                            alert('Failed to copy to clipboard. Please try again.');
                        }
                    }
                });
            }
        }
    });

    // Setup save buttons
    Object.entries(buttonMap).forEach(([buttonId, resultDivId]) => {
        if (buttonId.startsWith('save-')) {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', async () => {
                    const resultDiv = document.getElementById(resultDivId);
                    if (resultDiv) {
                        const content = resultDiv.textContent || resultDiv.innerText;
                        const fileType = buttonId.includes('faq') ? 'json' : 'txt';
                        const filename = `${resultDivId.replace('-result', '')}-${new Date().toISOString().slice(0,10)}.${fileType}`;
                        
                        try {
                            const result = await window.electronAPI.saveFile({
                                content,
                                filename,
                                fileType,
                                defaultPath: filename
                            });
                            
                            if (!result.success) {
                                alert(`Failed to save file: ${result.error || 'Unknown error'}`);
                            }
                        } catch (err) {
                            console.error('Save failed:', err);
                            alert('Failed to save file. Please try again.');
                        }
                    }
                });
            }
        }
    });
}

// Initialize the buttons when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    setupAiActionButtons();
});

// FAQ Generation
if (generateFaqButton) {
    generateFaqButton.addEventListener('click', () => {
        const prompt = `Based on this website's content, generate three frequently asked questions (FAQs) and answers relevant to the topic. Format the result as a valid JSON-LD schema for SEO integration.`;
        callOpenAI(prompt, faqResultDiv, generateFaqButton);
    });
}

// Title + Meta Suggestions
if (generateTitleMetaButton) {
    generateTitleMetaButton.addEventListener('click', () => {
        const prompt = `Using the website's content and structure, suggest 3 SEO-optimized title and meta description pairs. Each should be tailored for click-through rate and search ranking. Include suggested keywords.`;
        callOpenAI(prompt, titleMetaResultDiv, generateTitleMetaButton);
    });
}

// SEO Score Estimation
if (estimateSeoScoreButton) {
    estimateSeoScoreButton.addEventListener('click', () => {
        const prompt = `Based on the provided HTML and metadata, estimate a basic SEO score (0-100) for the page. Explain what is working well and list 3-5 areas for improvement related to technical SEO, metadata, and structure. At the end of the SEO score evaluation, give the following rating: "Optimize your website even more easily with our professional SEO Toolkit.". Use the following link to draw the user's attention to our SEO toolkit (make the link clickable, if possible): "https://appsumo.8odi.net/VxAbrJ".`;
        callOpenAI(prompt, seoScoreResultDiv, estimateSeoScoreButton);
    });
}

// Custom SEO Strategy
const customSeoStrategyButton = document.getElementById('custom-seo-strategy-button');
const customSeoStrategyResultDiv = document.getElementById('custom-seo-strategy-result');
if (customSeoStrategyButton) {
    customSeoStrategyButton.addEventListener('click', () => {
        const prompt = `Create a comprehensive SEO strategy for this website by analyzing the following aspects:
        
1. Content Sufficiency: Does the website have enough content explaining its purpose, services or products? If not, provide structured recommendations to improve.

2. Originality & Depth: Evaluate the content's originality and depth. Provide specific recommendations if improvements are needed.

3. Technical SEO Factors:
   - User Experience (UX) evaluation
   - E-E-A-T (Expertise, Authoritativeness, Trustworthiness) assessment
   - Keyword optimization analysis
   - Heading tag structure review
   - Image optimization suggestions
   - Schema markup implementation advice
   - Internal linking strategy

For each area, provide:
- Current status assessment
- Specific improvement recommendations
- Priority level (High/Medium/Low)
- Estimated implementation difficulty

Format the output with clear headings for each section. Include clickable links to relevant SEO resources where appropriate.

At the end, include this message with clickable links:
"Need professional help with SEO or digital marketing? Hire me (Tim) for expert services: 
<a href="https://go.fiverr.com/visit/?bta=1112748&brand=fiverrmarketplace&landingPage=https%253A%252F%252Fwww.fiverr.com%252Fs%252FWEzXrNE" target="_blank">SEO Services</a> or 
<a href="https://go.fiverr.com/visit/?bta=1112748&brand=fiverrmarketplace&landingPage=https%253A%252F%252Fwww.fiverr.com%252Fs%252FQ7yE3Ge" target="_blank">Digital Marketing Services</a>"`;
        
        callOpenAI(prompt, customSeoStrategyResultDiv, customSeoStrategyButton);
    });
}

// Language selection handling
if (languageSelect) {
    languageSelect.addEventListener('change', (event) => {
        // This will be used in the callOpenAI function to modify prompts
        window.selectedLanguage = event.target.value;
    });
}

// Update callOpenAI to handle language selection
async function callOpenAI(promptText, resultDiv, buttonElement) {
    resultDiv.textContent = '🧠 Thinking...';
    resultDiv.className = 'ai-result'; // Reset class
    buttonElement.disabled = true;

    // Basic check for HTML content
    const htmlContent = resultOutput.value;
    if (!htmlContent || typeof htmlContent !== 'string' || htmlContent.trim().length === 0) {
        resultDiv.textContent = '❌ No scraped HTML content available to analyze.';
        resultDiv.className = 'ai-result error';
        buttonElement.disabled = false;
        return;
    }

    // Add language instruction if not English
    if (window.selectedLanguage && window.selectedLanguage !== 'EN') {
        promptText += `\n\nPlease provide the output in ${window.selectedLanguage} language.`;
    }

    // Construct the full prompt including the HTML content
    // Increased max length for SEO strategy to allow more complete analysis
    const maxHtmlLength = promptText.includes('SEO strategy') ? 20000 : 10000;
    const truncatedHtml = htmlContent.length > maxHtmlLength
        ? htmlContent.substring(0, maxHtmlLength) + "\n... [HTML truncated] ..."
        : htmlContent;

    const fullPrompt = `${promptText}\n\nHere is the scraped HTML content:\n\`\`\`html\n${truncatedHtml}\n\`\`\``;

    try {
        const result = await window.electronAPI.callOpenaiChat(fullPrompt);
        if (result.success) {
            resultDiv.textContent = result.content;
            resultDiv.className = 'ai-result success';
        } else {
            throw new Error(result.error || "Unknown error from OpenAI.");
        }
    } catch (error) {
        console.error("Error calling OpenAI via IPC:", error);
        resultDiv.textContent = `❌ Error: ${error.message}`;
        resultDiv.className = 'ai-result error';
    } finally {
        buttonElement.disabled = false;
    }
}
