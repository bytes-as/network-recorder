let island, statusDot, counter, micButton, downloadBtn;

// Initialize DOM elements
function initElements() {
  island = document.getElementById('island');
  statusDot = document.getElementById('statusDot');
  counter = document.getElementById('counter');
  micButton = document.getElementById('micButton');
  downloadBtn = document.getElementById('downloadBtn');
}

// Update UI based on current state
async function updateUI() {
  if (!island || !micButton) return;
  
  const result = await chrome.storage.local.get(['isRecording', 'networkCalls']);
  const isRecording = result.isRecording || false;
  const callCount = result.networkCalls ? result.networkCalls.length : 0;
  
  // Update counter
  if (counter) {
    counter.textContent = callCount;
  }
  
  if (isRecording) {
    // Recording state
    island.classList.add('recording');
    statusDot?.classList.add('recording');
    counter?.classList.add('recording');
    micButton.classList.add('recording');
    if (downloadBtn) downloadBtn.disabled = true;
  } else {
    // Idle state
    island.classList.remove('recording');
    statusDot?.classList.remove('recording');
    counter?.classList.remove('recording');
    micButton.classList.remove('recording');
    if (downloadBtn) downloadBtn.disabled = callCount === 0;
  }
}

// Initialize
function init() {
  initElements();
  
  if (!micButton || !downloadBtn) {
    console.error('Required elements not found');
    return;
  }
  
  // Toggle recording
  micButton.addEventListener('click', async () => {
    const result = await chrome.storage.local.get(['isRecording']);
    const isRecording = result.isRecording || false;
    
    if (isRecording) {
      await chrome.storage.local.set({ isRecording: false });
      chrome.runtime.sendMessage({ action: 'stopRecording' });
    } else {
      await chrome.storage.local.set({ 
        isRecording: true,
        networkCalls: []
      });
      chrome.runtime.sendMessage({ action: 'startRecording' });
    }
    
    updateUI();
  });
  
  // Download recorded data
  downloadBtn.addEventListener('click', async () => {
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
  });
  
  // Initialize UI on popup open
  updateUI();
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      updateUI();
    }
  });
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}