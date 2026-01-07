const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusDiv = document.getElementById('status');
const callCountDiv = document.getElementById('callCount');

// Update UI based on current state
async function updateUI() {
  const result = await chrome.storage.local.get(['isRecording', 'networkCalls']);
  const isRecording = result.isRecording || false;
  const callCount = result.networkCalls ? result.networkCalls.length : 0;
  
  if (isRecording) {
    statusDiv.textContent = 'Recording...';
    statusDiv.className = 'status recording';
    startBtn.disabled = true;
    stopBtn.disabled = false;
    downloadBtn.disabled = true;
  } else {
    statusDiv.textContent = 'Stopped';
    statusDiv.className = 'status stopped';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    downloadBtn.disabled = callCount === 0;
  }
  
  callCountDiv.textContent = `Calls recorded: ${callCount}`;
}

// Start recording
startBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ 
    isRecording: true,
    networkCalls: []
  });
  
  // Send message to background script
  chrome.runtime.sendMessage({ action: 'startRecording' });
  
  updateUI();
});

// Stop recording
stopBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ isRecording: false });
  
  // Send message to background script
  chrome.runtime.sendMessage({ action: 'stopRecording' });
  
  updateUI();
});

// Download recorded data
downloadBtn.addEventListener('click', async () => {
  const result = await chrome.storage.local.get(['networkCalls']);
  const networkCalls = result.networkCalls || [];
  
  if (networkCalls.length === 0) {
    alert('No network calls to download');
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