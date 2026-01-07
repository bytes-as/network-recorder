# Network Call Recorder Chrome Extension

A simple Chrome extension that records network calls from webpages and saves them as JSON files.

## Features

- 🔴 Start/Stop recording with a floating button on any webpage
- 📊 Records all network requests including URL, method, headers, status codes
- 📄 **Captures response body content (JSON, text, HTML)**
- 💾 Download recorded data as JSON files
- 🎯 Simple popup interface for control
- 📦 Captures both fetch() and XMLHttpRequest calls
- ⏱️ Records request duration timing

## Installation

1. Create a new folder for the extension
2. Save all the files in that folder:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `background.js`
   - `content.js`

3. Create simple icon images (or use placeholders):
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing your extension files

## Usage

### Method 1: Floating Button
- A floating button appears in the bottom-right corner of every webpage
- Click to start/stop recording
- Button turns red when recording

### Method 2: Extension Popup
- Click the extension icon in the toolbar
- Use the "Start Recording" button
- Click "Stop Recording" when done
- Click "Download Recorded Data" to save as JSON

## Data Format

The extension saves network calls in the following JSON format:

```json
[
  {
    "url": "https://example.com/api/data",
    "method": "GET",
    "requestType": "fetch",
    "status": 200,
    "statusText": "OK",
    "responseHeaders": {
      "content-type": "application/json"
    },
    "responseBody": {
      "data": "actual response content here"
    },
    "timestamp": "2025-01-07T10:30:00.000Z",
    "duration": 245
  }
]
```

## Next Steps for Customization

- Add filtering by URL pattern or request type
- Add option to set custom save directory
- Include request/response body content
- Add export formats (CSV, HAR)
- Add search and filter in popup
- Show live preview of requests
- Add request grouping by domain
- Include timing information (duration, wait time)

## Permissions

- `activeTab`: To inject the recording button
- `webRequest`: To capture network calls
- `storage`: To save recording state and data
- `downloads`: To save JSON files
- `<all_urls>`: To monitor all network traffic