let allCalls = [];
let filteredCalls = [];
let isRecording = false;

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const recordBtn = document.getElementById('recordBtn');
const recordBtnText = document.getElementById('recordBtnText');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const searchBox = document.getElementById('searchBox');
const content = document.getElementById('content');
const totalCount = document.getElementById('totalCount');
const filteredCount = document.getElementById('filteredCount');

// Initialize
async function init() {
  await updateUI();
  
  // Event listeners
  recordBtn.addEventListener('click', toggleRecording);
  clearBtn.addEventListener('click', clearCalls);
  downloadBtn.addEventListener('click', downloadData);
  searchBox.addEventListener('input', handleSearch);
  
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
      alert('Extension context invalid. Please refresh the page.');
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
  if (confirm('Are you sure you want to clear all recorded network calls?')) {
    await chrome.storage.local.set({ networkCalls: [] });
    await updateUI();
  }
}

// Download recorded data
async function downloadData() {
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
      call.method.toLowerCase().includes(searchTerm)
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
    
    // Update status indicator
    if (isRecording) {
      statusIndicator.classList.add('recording');
      recordBtn.classList.remove('start');
      recordBtn.classList.add('stop');
      recordBtnText.textContent = 'Stop Recording';
      recordBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
        <span>${recordBtnText.textContent}</span>
      `;
    } else {
      statusIndicator.classList.remove('recording');
      recordBtn.classList.remove('stop');
      recordBtn.classList.add('start');
      recordBtnText.textContent = 'Start Recording';
      recordBtn.innerHTML = `
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8"/>
        </svg>
        <span>${recordBtnText.textContent}</span>
      `;
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
  totalCount.textContent = allCalls.length;
  filteredCount.textContent = filteredCalls.length;
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
          <div class="empty-state-title">No network calls recorded</div>
          <div class="empty-state-text">Click "Start Recording" to begin capturing network requests</div>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <div class="empty-state-title">No matching calls</div>
          <div class="empty-state-text">Try adjusting your search terms</div>
        </div>
      `;
    }
    return;
  }
  
  content.innerHTML = filteredCalls.map(call => {
    const method = call.method || 'GET';
    const status = call.status || 0;
    const statusClass = status >= 200 && status < 300 ? 'success' : 'error';
    const url = call.url || '';
    const timestamp = call.timestamp ? new Date(call.timestamp).toLocaleTimeString() : '';
    const duration = call.duration ? `${call.duration}ms` : '';
    const requestType = call.requestType || 'unknown';
    
    return `
      <div class="call-card">
        <div class="call-header">
          <span class="method-badge ${method}">${method}</span>
          ${status ? `<span class="status-badge ${statusClass}">${status}</span>` : ''}
        </div>
        <div class="call-url">${truncateUrl(url)}</div>
        <div class="call-meta">
          ${timestamp ? `<span class="call-meta-item">🕐 ${timestamp}</span>` : ''}
          ${duration ? `<span class="call-meta-item">⏱️ ${duration}</span>` : ''}
          <span class="call-meta-item">📡 ${requestType}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Truncate long URLs
function truncateUrl(url, maxLength = 60) {
  if (url.length <= maxLength) return url;
  
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    
    if (path.length > maxLength - 20) {
      return urlObj.origin + '...' + path.slice(-40);
    }
    
    return url.slice(0, maxLength) + '...';
  } catch {
    return url.slice(0, maxLength) + '...';
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
