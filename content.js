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
  chrome.runtime.sendMessage({
    action: 'addNetworkCall',
    data: event.data.data
  });
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
  `;
  document.head.appendChild(style);
  
  const micButton = island.querySelector('.island-mic-button');
  const downloadButton = island.querySelector('.island-download-button');
  
  micButton.addEventListener('click', toggleRecording);
  downloadButton.addEventListener('click', downloadRecordedData);
  
  document.body.appendChild(island);
  updateButtonState();
}

async function toggleRecording() {
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
  
  updateButtonState();
}

async function updateButtonState() {
  const island = document.getElementById('network-recorder-island');
  const counter = island?.querySelector('.island-counter');
  const downloadButton = island?.querySelector('.island-download-button');
  if (!island) return;
  
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
}

async function downloadRecordedData() {
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