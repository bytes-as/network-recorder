// Inject the interceptor script into the page context
function injectInterceptor() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);
}

// Listen for messages from injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window || event.data.type !== 'NETWORK_RESPONSE') {
    return;
  }
  
  // Send to background script to handle storage
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      return; // Extension context invalidated
    }
    
    chrome.runtime.sendMessage({
      action: 'addNetworkCall',
      data: event.data.data
    }, (response) => {
      // Check for errors in callback
      if (chrome.runtime.lastError) {
        // Silently ignore - extension was reloaded
      }
    });
  } catch (error) {
    // Silently catch any errors
  }
});

// Create a floating Dynamic Island pill on the webpage
function createRecorderButton() {
  const island = document.createElement('div');
  island.id = 'network-recorder-island';
  island.innerHTML = `
    <div class="island-brand">
      <div class="island-status-dot"></div>
      <div class="island-brand-text">NET.REC</div>
    </div>
    
    <div class="island-counter">0</div>
    
    <div class="island-controls">
      <button class="island-mic-button">
        <svg class="island-mic-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        <div class="island-waveform">
          <div class="island-wave-bar"></div>
          <div class="island-wave-bar"></div>
          <div class="island-wave-bar"></div>
          <div class="island-wave-bar"></div>
        </div>
      </button>
      
      <button class="island-config-button" title="Configure filters">
        <svg class="island-config-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </button>
      
      <button class="island-download-button" title="Export data">
        <svg class="island-download-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </button>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700&display=swap');
    
    #network-recorder-island {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      width: 320px;
      height: 64px;
      border-radius: 9999px;
      background: rgba(0, 0, 0, 0.95);
      backdrop-filter: blur(25px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0px 10px 30px -10px rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      transition: box-shadow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      font-family: 'Inter', 'SF Pro Display', 'SF Pro Text', -apple-system, sans-serif;
    }
    
    #network-recorder-island.recording {
      box-shadow: 0px 10px 30px -10px rgba(0, 0, 0, 0.8), 0px 0px 25px rgba(255, 59, 48, 0.15);
    }
    
    .island-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .island-status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #3A3A3C;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    #network-recorder-island.recording .island-status-dot {
      background: #FF3B30;
      box-shadow: 0 0 8px rgba(255, 59, 48, 0.6);
    }
    
    .island-brand-text {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: #6B6B6B;
      text-transform: uppercase;
    }
    
    .island-counter {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      font-size: 28px;
      font-weight: 500;
      color: #FFFFFF;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      user-select: none;
    }
    
    #network-recorder-island.recording .island-counter {
      text-shadow: 0 0 10px rgba(255, 59, 48, 0.6);
    }
    
    .island-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .island-mic-button {
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    .island-mic-icon {
      width: 20px;
      height: 20px;
      fill: #FFFFFF;
      opacity: 1;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    #network-recorder-island.recording .island-mic-icon {
      opacity: 0;
      transform: scale(0);
    }
    
    .island-waveform {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 2px;
      position: absolute;
      opacity: 0;
      transform: scale(0);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    #network-recorder-island.recording .island-waveform {
      display: flex;
      opacity: 1;
      transform: scale(1);
    }
    
    .island-wave-bar {
      width: 3px;
      border-radius: 2px;
      background: linear-gradient(180deg, #FF3B30 0%, #FF6B30 100%);
      animation: island-wave-pulse 1s ease-in-out infinite;
    }
    
    .island-wave-bar:nth-child(1) {
      height: 8px;
      animation-delay: 0s;
    }
    
    .island-wave-bar:nth-child(2) {
      height: 14px;
      animation-delay: 0.15s;
    }
    
    .island-wave-bar:nth-child(3) {
      height: 10px;
      animation-delay: 0.3s;
    }
    
    .island-wave-bar:nth-child(4) {
      height: 16px;
      animation-delay: 0.45s;
    }
    
    @keyframes island-wave-pulse {
      0%, 100% {
        transform: scaleY(0.5);
      }
      50% {
        transform: scaleY(1);
      }
    }
    
    .island-download-button {
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .island-download-icon {
      width: 20px;
      height: 20px;
      fill: #8E8E93;
      transition: all 0.2s ease;
    }
    
    .island-download-button:hover:not(:disabled) .island-download-icon {
      fill: #FFFFFF;
    }
    
    .island-download-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .island-config-button {
      width: 20px;
      height: 20px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .island-config-icon {
      width: 20px;
      height: 20px;
      fill: #8E8E93;
      transition: all 0.2s ease;
    }
    
    .island-config-button:hover .island-config-icon {
      fill: #FFFFFF;
      transform: rotate(30deg);
    }
    
    /* Settings Modal */
    #network-recorder-settings-modal {
      position: fixed;
      bottom: 100px;
      right: 24px;
      z-index: 999998;
      width: 420px;
      max-height: 600px;
      border-radius: 24px;
      background: rgba(28, 28, 30, 0.98);
      backdrop-filter: blur(40px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0px 20px 60px -15px rgba(0, 0, 0, 0.9);
      font-family: 'Inter', 'SF Pro Display', 'SF Pro Text', -apple-system, sans-serif;
      display: none;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    
    #network-recorder-settings-modal.show {
      display: flex;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    
    .settings-header {
      padding: 24px 24px 20px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .settings-title {
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 4px 0;
    }
    
    .settings-subtitle {
      font-size: 13px;
      color: #8E8E93;
      margin: 0;
    }
    
    .settings-content {
      padding: 20px 24px;
      overflow-y: auto;
      max-height: 440px;
    }
    
    .settings-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .settings-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 3px;
    }
    
    .settings-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }
    
    .settings-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    
    .settings-section {
      margin-bottom: 24px;
    }
    
    .settings-section-title {
      font-size: 14px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .filter-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .filter-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    
    .filter-item:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .filter-input {
      flex: 1;
      background: none;
      border: none;
      color: #FFFFFF;
      font-size: 14px;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      outline: none;
    }
    
    .filter-input::placeholder {
      color: #6B6B6B;
    }
    
    .filter-remove-btn {
      width: 24px;
      height: 24px;
      background: rgba(255, 59, 48, 0.15);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    
    .filter-remove-btn:hover {
      background: rgba(255, 59, 48, 0.3);
    }
    
    .filter-remove-btn svg {
      width: 12px;
      height: 12px;
      fill: #FF3B30;
    }
    
    .filter-add-btn {
      width: 100%;
      padding: 12px;
      background: rgba(10, 132, 255, 0.15);
      border: 1px solid rgba(10, 132, 255, 0.3);
      border-radius: 12px;
      color: #0A84FF;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .filter-add-btn:hover {
      background: rgba(10, 132, 255, 0.25);
      border-color: rgba(10, 132, 255, 0.5);
    }
    
    .filter-add-btn svg {
      width: 16px;
      height: 16px;
      fill: #0A84FF;
    }
    
    .settings-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 12px;
    }
    
    .settings-btn {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    
    .settings-btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
    }
    
    .settings-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    
    .settings-btn-primary {
      background: #0A84FF;
      color: #FFFFFF;
    }
    
    .settings-btn-primary:hover {
      background: #0077ED;
    }
    
    .filter-error {
      font-size: 12px;
      color: #FF3B30;
      margin-top: 4px;
      display: none;
    }
    
    .filter-item.error {
      border-color: rgba(255, 59, 48, 0.5);
    }
    
    .filter-item.error .filter-error {
      display: block;
    }
    
    .empty-state {
      text-align: center;
      padding: 32px 20px;
      color: #6B6B6B;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
  
  const micButton = island.querySelector('.island-mic-button');
  const configButton = island.querySelector('.island-config-button');
  const downloadButton = island.querySelector('.island-download-button');
  
  micButton.addEventListener('click', toggleRecording);
  configButton.addEventListener('click', toggleSettingsModal);
  downloadButton.addEventListener('click', downloadRecordedData);
  
  document.body.appendChild(island);
  createSettingsModal();
  updateButtonState();
}

function createSettingsModal() {
  const modal = document.createElement('div');
  modal.id = 'network-recorder-settings-modal';
  modal.innerHTML = `
    <div class="settings-header">
      <h2 class="settings-title">Filter Settings</h2>
      <p class="settings-subtitle">Configure regex patterns to filter network calls</p>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h3 class="settings-section-title">URL Filters</h3>
        <div class="filter-list" id="filter-list">
          <div class="empty-state">
            No filters added yet. Add regex patterns to filter URLs.
          </div>
        </div>
        <button class="filter-add-btn" id="add-filter-btn">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add Filter
        </button>
      </div>
      
      <div class="settings-section">
        <h3 class="settings-section-title">Examples</h3>
        <div style="font-size: 12px; color: #8E8E93; line-height: 1.6;">
          <div style="margin-bottom: 8px;">
            <code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: Monaco, monospace;">.*\\.json$</code>
            <span style="margin-left: 8px;">Match all JSON responses</span>
          </div>
          <div style="margin-bottom: 8px;">
            <code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: Monaco, monospace;">api\\.example\\.com</code>
            <span style="margin-left: 8px;">Match specific domain</span>
          </div>
          <div>
            <code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: Monaco, monospace;">/users/\\d+</code>
            <span style="margin-left: 8px;">Match user endpoints</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="settings-footer">
      <button class="settings-btn settings-btn-secondary" id="settings-cancel-btn">Cancel</button>
      <button class="settings-btn settings-btn-primary" id="settings-save-btn">Save Filters</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('add-filter-btn').addEventListener('click', addFilterInput);
  document.getElementById('settings-cancel-btn').addEventListener('click', closeSettingsModal);
  document.getElementById('settings-save-btn').addEventListener('click', saveFilters);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettingsModal();
    }
  });
  
  // Load existing filters
  loadFilters();
}

async function loadFilters() {
  try {
    const result = await chrome.storage.local.get(['urlFilters']);
    const filters = result.urlFilters || [];
    const filterList = document.getElementById('filter-list');
    
    if (filters.length === 0) {
      filterList.innerHTML = `
        <div class="empty-state">
          No filters added yet. Add regex patterns to filter URLs.
        </div>
      `;
    } else {
      filterList.innerHTML = '';
      filters.forEach((filter, index) => {
        addFilterInput(filter, index);
      });
    }
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      console.log('Extension reloaded. Please refresh the page.');
    } else {
      console.error('Error loading filters:', error);
    }
  }
}

function addFilterInput(pattern = '', index = null) {
  const filterList = document.getElementById('filter-list');
  const emptyState = filterList.querySelector('.empty-state');
  
  if (emptyState) {
    emptyState.remove();
  }
  
  const filterItem = document.createElement('div');
  filterItem.className = 'filter-item';
  filterItem.dataset.index = index !== null ? index : Date.now();
  filterItem.innerHTML = `
    <input 
      type="text" 
      class="filter-input" 
      placeholder="Enter regex pattern (e.g., .*\\.json$)" 
      value="${pattern}"
    />
    <button class="filter-remove-btn">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;
  
  const removeBtn = filterItem.querySelector('.filter-remove-btn');
  removeBtn.addEventListener('click', () => {
    filterItem.remove();
    
    const filterList = document.getElementById('filter-list');
    if (filterList.children.length === 0) {
      filterList.innerHTML = `
        <div class="empty-state">
          No filters added yet. Add regex patterns to filter URLs.
        </div>
      `;
    }
  });
  
  // Validate regex on input
  const input = filterItem.querySelector('.filter-input');
  input.addEventListener('input', () => {
    validateRegex(input, filterItem);
  });
  
  filterList.appendChild(filterItem);
}

function validateRegex(input, filterItem) {
  try {
    if (input.value.trim()) {
      new RegExp(input.value);
      filterItem.classList.remove('error');
    }
  } catch (e) {
    filterItem.classList.add('error');
  }
}

async function saveFilters() {
  const filterItems = document.querySelectorAll('.filter-item');
  const filters = [];
  let hasError = false;
  
  filterItems.forEach(item => {
    const input = item.querySelector('.filter-input');
    const pattern = input.value.trim();
    
    if (pattern) {
      try {
        new RegExp(pattern);
        filters.push(pattern);
      } catch (e) {
        hasError = true;
        item.classList.add('error');
      }
    }
  });
  
  if (hasError) {
    return;
  }
  
  try {
    await chrome.storage.local.set({ urlFilters: filters });
    closeSettingsModal();
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      alert('Extension was reloaded. Please refresh this page to continue.');
    } else {
      console.error('Error saving filters:', error);
      alert('Failed to save filters. Please try again.');
    }
  }
}

function toggleSettingsModal() {
  const modal = document.getElementById('network-recorder-settings-modal');
  if (modal.classList.contains('show')) {
    closeSettingsModal();
  } else {
    openSettingsModal();
  }
}

function openSettingsModal() {
  const modal = document.getElementById('network-recorder-settings-modal');
  loadFilters();
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

function closeSettingsModal() {
  const modal = document.getElementById('network-recorder-settings-modal');
  modal.classList.remove('show');
}

async function toggleRecording() {
  try {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      alert('Extension was reloaded. Please refresh this page to continue.');
      return;
    }
    
    const result = await chrome.storage.local.get(['isRecording']);
    const isRecording = result.isRecording || false;
    
    if (isRecording) {
      await chrome.storage.local.set({ isRecording: false });
      chrome.runtime.sendMessage({ action: 'stopRecording' }, () => {
        if (chrome.runtime.lastError) {
          // Silently ignore
        }
      });
    } else {
      await chrome.storage.local.set({ 
        isRecording: true,
        networkCalls: []
      });
      chrome.runtime.sendMessage({ action: 'startRecording' }, () => {
        if (chrome.runtime.lastError) {
          // Silently ignore
        }
      });
    }
    
    updateButtonState();
  } catch (error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      alert('Extension was reloaded. Please refresh this page to continue.');
      return;
    }
    console.error('Error toggling recording:', error);
  }
}

async function updateButtonState() {
  const island = document.getElementById('network-recorder-island');
  const counter = island?.querySelector('.island-counter');
  const downloadButton = island?.querySelector('.island-download-button');
  if (!island) return;
  
  try {
    const result = await chrome.storage.local.get(['isRecording', 'networkCalls']);
    const isRecording = result.isRecording || false;
    const callCount = result.networkCalls ? result.networkCalls.length : 0;
    
    // Update counter
    if (counter) {
      counter.textContent = callCount;
    }
    
    // Update download button state
    if (downloadButton) {
      downloadButton.disabled = callCount === 0 || isRecording;
    }
    
    if (isRecording) {
      island.classList.add('recording');
    } else {
      island.classList.remove('recording');
    }
  } catch (error) {
    // Extension context invalidated - silently ignore
    if (!error.message.includes('Extension context invalidated')) {
      console.error('Error updating button state:', error);
    }
  }
}

async function downloadRecordedData() {
  try {
    const result = await chrome.storage.local.get(['networkCalls']);
    const networkCalls = result.networkCalls || [];
    
    if (networkCalls.length === 0) {
      return;
    }
    
    const dataStr = JSON.stringify(networkCalls, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-calls-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error.message.includes('Extension context invalidated')) {
      alert('Extension was reloaded. Please refresh this page to continue.');
    } else {
      console.error('Error downloading data:', error);
      alert('Failed to download data. Please try again.');
    }
  }
}

// Initialize
function init() {
  injectInterceptor();
  if (document.body) {
    createRecorderButton();
  } else {
    document.addEventListener('DOMContentLoaded', createRecorderButton);
  }
}

init();

// Listen for storage changes to update button
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.isRecording) {
    updateButtonState();
  }
});