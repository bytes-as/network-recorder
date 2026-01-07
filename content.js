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

// Create a floating button on the webpage
function createRecorderButton() {
  const button = document.createElement('button');
  button.id = 'network-recorder-btn';
  button.innerHTML = '⏺️ Record';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 12px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
  
  button.addEventListener('click', toggleRecording);
  
  document.body.appendChild(button);
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
  const button = document.getElementById('network-recorder-btn');
  if (!button) return;
  
  const result = await chrome.storage.local.get(['isRecording']);
  const isRecording = result.isRecording || false;
  
  if (isRecording) {
    button.innerHTML = '⏹️ Stop';
    button.style.backgroundColor = '#f44336';
  } else {
    button.innerHTML = '⏺️ Record';
    button.style.backgroundColor = '#4CAF50';
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