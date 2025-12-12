const API_BASE_URL = 'https://tutorialcost.replit.app';
const TIMEOUT_MS = 120000; // 2 minute timeout for analysis

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_ANALYSIS') {
    handleAnalysis(message.url, message.videoId);
    sendResponse({ status: 'started' });
  }
  
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['analysisState'], (result) => {
      sendResponse(result.analysisState || null);
    });
    return true;
  }
  
  if (message.type === 'CLEAR_ANALYSIS') {
    chrome.storage.local.remove(['analysisState'], () => {
      sendResponse({ status: 'cleared' });
    });
    return true;
  }
  
  if (message.type === 'VIDEO_DETECTED') {
    console.log('Video detected:', message.data);
  }
  
  return true;
});

async function handleAnalysis(url, videoId) {
  await chrome.storage.local.set({
    analysisState: {
      status: 'loading',
      videoId: videoId,
      url: url,
      message: 'Connecting to analysis server...',
      startTime: Date.now()
    }
  });
  
  const messages = [
    'Extracting video transcript...',
    'Identifying LLM experiments...',
    'Analyzing tool requirements...',
    'Calculating implementation costs...'
  ];
  
  let messageIndex = 0;
  const messageInterval = setInterval(async () => {
    messageIndex = (messageIndex + 1) % messages.length;
    const current = await chrome.storage.local.get(['analysisState']);
    if (current.analysisState?.status === 'loading') {
      await chrome.storage.local.set({
        analysisState: {
          ...current.analysisState,
          message: messages[messageIndex]
        }
      });
    } else {
      clearInterval(messageInterval);
    }
  }, 3000);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    clearInterval(messageInterval);
    
    if (!response.ok) {
      let errorMessage = 'Analysis failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `Server error (${response.status})`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data || !data.experiments || !data.tools) {
      throw new Error('Invalid response from server');
    }
    
    await chrome.storage.local.set({
      analysisState: {
        status: 'success',
        videoId: videoId,
        url: url,
        data: data,
        completedAt: Date.now()
      }
    });
    
  } catch (error) {
    clearInterval(messageInterval);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Analysis timed out. The video may be too long or the server is busy.';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Could not connect to the analysis server. Please check your internet connection.';
    } else if (error.message.includes('transcript')) {
      errorMessage = 'This video does not have captions/transcript available.';
    }
    
    await chrome.storage.local.set({
      analysisState: {
        status: 'error',
        videoId: videoId,
        url: url,
        error: errorMessage,
        failedAt: Date.now()
      }
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Tutorial Cost extension installed v1.0.4');
  chrome.storage.local.remove(['analysisState']);
});
