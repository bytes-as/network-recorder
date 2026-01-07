let isRecording = false;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRecording') {
    isRecording = true;
  } else if (request.action === 'stopRecording') {
    isRecording = false;
  } else if (request.action === 'addNetworkCall') {
    // Receive network call data from content script
    addNetworkCall(request.data);
  }
});

async function addNetworkCall(callData) {
  try {
    const result = await chrome.storage.local.get(['isRecording', 'networkCalls', 'urlFilters']);
    if (!result.isRecording) return;
    
    const networkCalls = result.networkCalls || [];
    const urlFilters = result.urlFilters || [];
    
    // Apply URL filters if any exist
    if (urlFilters.length > 0) {
      const url = callData.url || '';
      let shouldInclude = false;
      
      for (const filterPattern of urlFilters) {
        try {
          const regex = new RegExp(filterPattern);
          if (regex.test(url)) {
            shouldInclude = true;
            break;
          }
        } catch (e) {
          console.warn('Invalid regex pattern:', filterPattern, e);
        }
      }
      
      // If filters exist but none match, skip this call
      if (!shouldInclude) return;
    }
    
    // Create a clean, serializable object
    const cleanCallData = {
      url: callData.url || '',
      method: callData.method || 'GET',
      requestType: callData.requestType || 'unknown',
      status: callData.status,
      statusText: callData.statusText || '',
      responseHeaders: callData.responseHeaders || {},
      responseBody: callData.responseBody,
      timestamp: callData.timestamp || new Date().toISOString(),
      duration: callData.duration || 0,
      error: callData.error
    };
    
    networkCalls.push(cleanCallData);
    await chrome.storage.local.set({ networkCalls });
  } catch (error) {
    console.error('Error adding network call:', error);
  }
}