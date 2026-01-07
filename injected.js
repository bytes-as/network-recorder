// This script runs in the page context to intercept fetch and XHR
(function() {
    // Store original fetch and XMLHttpRequest
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Override fetch
    window.fetch = async function(...args) {
      const startTime = Date.now();
      const url = args[0];
      const options = args[1] || {};
      
      try {
        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();
        
        // Try to get response body
        let responseData = null;
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            responseData = await clonedResponse.json();
          } else if (contentType.includes('text') || contentType.includes('html') || contentType.includes('xml')) {
            responseData = await clonedResponse.text();
          } else {
            // For binary or unknown content
            const arrayBuffer = await clonedResponse.arrayBuffer();
            responseData = '[Binary data: ' + arrayBuffer.byteLength + ' bytes]';
          }
        } catch (e) {
          responseData = '[Could not parse response: ' + e.message + ']';
        }
        
        // Convert headers to plain object
        const headersObj = {};
        response.headers.forEach((value, key) => {
          headersObj[key] = value;
        });
        
        // Send to content script
        window.postMessage({
          type: 'NETWORK_RESPONSE',
          data: {
            url: typeof url === 'string' ? url : url.url,
            method: options.method || 'GET',
            requestType: 'fetch',
            status: response.status,
            statusText: response.statusText,
            responseHeaders: headersObj,
            responseBody: responseData,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime
          }
        }, '*');
        
        return response;
      } catch (error) {
        window.postMessage({
          type: 'NETWORK_RESPONSE',
          data: {
            url: typeof url === 'string' ? url : url.url,
            method: options.method || 'GET',
            requestType: 'fetch',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }, '*');
        throw error;
      }
    };
    
    // Override XMLHttpRequest
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
      this._method = method;
      this._url = url;
      this._startTime = Date.now();
      return originalXHROpen.call(this, method, url, ...rest);
    };
    
    XMLHttpRequest.prototype.send = function(...args) {
      this.addEventListener('load', function() {
        let responseData = null;
        try {
          const contentType = this.getResponseHeader('content-type') || '';
          if (contentType.includes('application/json')) {
            responseData = JSON.parse(this.responseText);
          } else if (contentType.includes('text') || contentType.includes('html')) {
            responseData = this.responseText;
          } else {
            responseData = '[Binary data]';
          }
        } catch (e) {
          responseData = this.responseText || '[Could not parse response]';
        }
        
        // Get response headers
        const responseHeaders = {};
        const headersString = this.getAllResponseHeaders();
        headersString.split('\r\n').forEach(line => {
          const parts = line.split(': ');
          if (parts.length === 2) {
            responseHeaders[parts[0]] = parts[1];
          }
        });
        
        window.postMessage({
          type: 'NETWORK_RESPONSE',
          data: {
            url: this._url,
            method: this._method,
            requestType: 'xhr',
            status: this.status,
            statusText: this.statusText,
            responseHeaders: responseHeaders,
            responseBody: responseData,
            timestamp: new Date().toISOString(),
            duration: Date.now() - this._startTime
          }
        }, '*');
      });
      
      this.addEventListener('error', function() {
        window.postMessage({
          type: 'NETWORK_RESPONSE',
          data: {
            url: this._url,
            method: this._method,
            requestType: 'xhr',
            error: 'Network error',
            timestamp: new Date().toISOString()
          }
        }, '*');
      });
      
      return originalXHRSend.apply(this, args);
    };
  })();