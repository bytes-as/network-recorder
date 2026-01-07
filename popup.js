let allCalls = [];
let filteredCalls = [];
let isRecording = false;
let maxDuration = 0;

// DOM elements
const recordBtn = document.getElementById('recordBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const searchInput = document.getElementById('searchInput');
const searchStats = document.getElementById('searchStats');
const content = document.getElementById('content');

// Initialize
async function init() {
  await updateUI();
  
  // Event listeners
  recordBtn.addEventListener('click', toggleRecording);
  clearBtn.addEventListener('click', clearCalls);
  downloadBtn.addEventListener('click', downloadData);
  searchInput.addEventListener('input', handleSearch);
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      updateUI();
    }
  });
}

// Toggle recording state
async function toggleRecording() {
  try {
    if (!chrome.runtime?.id) {
      return;
    }
    
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
    
    await updateUI();
  } catch (error) {
    console.error('Error toggling recording:', error);
  }
}

// Clear all recorded calls
async function clearCalls() {
  if (confirm('Clear all recorded calls?')) {
    await chrome.storage.local.set({ networkCalls: [] });
    await updateUI();
  }
}

// Download recorded data
async function downloadData() {
  try {
    const result = await chrome.storage.local.get(['networkCalls']);
    const networkCalls = result.networkCalls || [];
    
    if (networkCalls.length === 0) return;
    
    const dataStr = JSON.stringify(networkCalls, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    chrome.downloads.download({
      url: url,
      filename: `network-calls-${timestamp}.json`,
      saveAs: true
    });
  } catch (error) {
    console.error('Error downloading data:', error);
  }
}

// Handle search input
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  if (!searchTerm) {
    filteredCalls = [...allCalls];
  } else {
    filteredCalls = allCalls.filter(call => 
      call.url.toLowerCase().includes(searchTerm) ||
      call.method.toLowerCase().includes(searchTerm) ||
      getEndpoint(call.url).toLowerCase().includes(searchTerm)
    );
  }
  
  renderCalls();
  updateStats();
}

// Update UI based on current state
async function updateUI() {
  try {
    const result = await chrome.storage.local.get(['isRecording', 'networkCalls']);
    isRecording = result.isRecording || false;
    allCalls = result.networkCalls || [];
    filteredCalls = [...allCalls];
    
    // Calculate max duration for waterfall scaling
    maxDuration = Math.max(...allCalls.map(c => c.duration || 0), 1);
    
    // Update recording button
    if (isRecording) {
      recordBtn.classList.add('recording');
      recordBtn.title = 'Stop recording';
    } else {
      recordBtn.classList.remove('recording');
      recordBtn.title = 'Start recording';
    }
    
    // Update buttons
    clearBtn.disabled = allCalls.length === 0;
    downloadBtn.disabled = allCalls.length === 0 || isRecording;
    
    // Render calls
    renderCalls();
    updateStats();
  } catch (error) {
    console.error('Error updating UI:', error);
  }
}

// Update statistics
function updateStats() {
  const total = allCalls.length;
  const filtered = filteredCalls.length;
  
  if (searchInput.value) {
    searchStats.textContent = `${filtered} of ${total}`;
  } else {
    searchStats.textContent = `${total} call${total !== 1 ? 's' : ''}`;
  }
}

// Render network calls
function renderCalls() {
  if (filteredCalls.length === 0) {
    if (allCalls.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <div class="empty-state-title">No network calls</div>
          <div class="empty-state-text">Start recording to capture requests</div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <div class="empty-state-title">No matches</div>
          <div class="empty-state-text">Try a different search term</div>
        </div>
      `;
    }
    return;
  }
  
  content.innerHTML = filteredCalls.map(call => createCallItem(call)).join('');
}

// Create a call item HTML
function createCallItem(call) {
  const method = call.method || 'GET';
  const status = call.status || 0;
  const statusClass = getStatusClass(status);
  const endpoint = getEndpoint(call.url);
  const domain = getDomain(call.url);
  const duration = call.duration || 0;
  const timestamp = call.timestamp ? new Date(call.timestamp) : new Date();
  const resourceType = getResourceType(call);
  const waterfallWidth = maxDuration > 0 ? (duration / maxDuration) * 100 : 0;
  
  return `
    <div class="call-item">
      <div class="call-status">
        <div class="call-method ${statusClass}">${method}</div>
        ${status ? `<div class="call-status-code">${status}</div>` : ''}
      </div>
      
      <div class="call-main">
        ${getResourceIcon(resourceType)}
        <div class="call-info">
          <div class="call-endpoint">${endpoint}</div>
          <div class="call-domain">${domain}</div>
        </div>
      </div>
      
      <div class="call-meta">
        <div class="call-duration">${formatDuration(duration)}</div>
        <div class="call-time">${formatTime(timestamp)}</div>
      </div>
      
      ${duration > 0 ? `<div class="call-waterfall" style="width: ${waterfallWidth}%"></div>` : ''}
    </div>
  `;
}

// Get status class based on status code
function getStatusClass(status) {
  if (!status) return 'pending';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  return 'error';
}

// Extract endpoint from URL (smart truncation)
function getEndpoint(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Get the last segment or filename
    const segments = pathname.split('/').filter(s => s);
    if (segments.length === 0) return '/';
    
    const lastSegment = segments[segments.length - 1];
    
    // If it looks like a file, return it
    if (lastSegment.includes('.')) {
      return lastSegment;
    }
    
    // If it's an API endpoint, show last 2-3 segments
    if (segments.length > 2) {
      return '/' + segments.slice(-2).join('/');
    }
    
    return pathname;
  } catch {
    return url.split('?')[0].slice(-40);
  }
}

// Extract domain from URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    let domain = urlObj.hostname;
    
    // Add first query param if exists (for context)
    if (urlObj.search) {
      const params = new URLSearchParams(urlObj.search);
      const firstParam = Array.from(params.entries())[0];
      if (firstParam) {
        const [key, value] = firstParam;
        const truncatedValue = value.length > 20 ? value.slice(0, 20) + '...' : value;
        domain += ` · ${key}=${truncatedValue}`;
      }
    }
    
    return domain;
  } catch {
    return url.split('/')[0];
  }
}

// Detect resource type from URL and content
function getResourceType(call) {
  const url = call.url || '';
  const contentType = call.responseHeaders?.['content-type'] || '';
  
  // Check content-type first
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('html')) return 'html';
  if (contentType.includes('image')) return 'image';
  if (contentType.includes('css')) return 'css';
  if (contentType.includes('javascript')) return 'js';
  if (contentType.includes('font')) return 'font';
  
  // Fallback to URL extension
  const ext = url.split('.').pop().split('?')[0].toLowerCase();
  if (['json', 'api'].includes(ext)) return 'json';
  if (['html', 'htm'].includes(ext)) return 'html';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image';
  if (['css'].includes(ext)) return 'css';
  if (['js', 'mjs'].includes(ext)) return 'js';
  if (['woff', 'woff2', 'ttf', 'eot'].includes(ext)) return 'font';
  
  // Check if it's a fetch/XHR API call
  if (call.requestType === 'fetch' || call.requestType === 'xhr') return 'json';
  
  return 'other';
}

// Get resource icon SVG
function getResourceIcon(type) {
  const icons = {
    json: `<svg class="call-type-icon icon-json" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M5 3h2v2h5v2H7v2h5v2H7v2h5v2H5v2h2v-2h3v2h2v-2h3v-2h-3v-2h3v-2h-3V7h3V5h-3V3h3V1H5v2zm0 16h2v2H5v-2zm9-2h-2v2h2v-2zm0-4h-2v2h2v-2zm0-4h-2v2h2v-2z"/>
    </svg>`,
    html: `<svg class="call-type-icon icon-html" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M12 17.56l-6.94 4.05 1.83-7.73L1 9.39l7.96-.58L12 2l3.04 6.81 7.96.58-5.89 4.49 1.83 7.73z"/>
    </svg>`,
    image: `<svg class="call-type-icon icon-image" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
    </svg>`,
    css: `<svg class="call-type-icon icon-css" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
    </svg>`,
    js: `<svg class="call-type-icon icon-js" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 18.5L4 16V8.5l8 4v8zm8-4.5l-8 4.5v-8l8-4V16z"/>
    </svg>`,
    font: `<svg class="call-type-icon icon-font" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/>
    </svg>`,
    other: `<svg class="call-type-icon icon-other" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>`
  };
  
  return icons[type] || icons.other;
}

// Format duration
function formatDuration(ms) {
  if (ms === 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Format time
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
