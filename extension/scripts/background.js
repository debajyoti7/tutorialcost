const API_BASE_URL = 'https://tutorialcost.replit.app';

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_ANALYSIS') {
    handleAnalysis(message.url, message.videoId);
    sendResponse({ status: 'started' });
  }
  
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['analysisState'], (result) => {
      sendResponse(result.analysisState || null);
    });
    return true; // Keep channel open for async response
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
  // Set initial loading state
  await chrome.storage.local.set({
    analysisState: {
      status: 'loading',
      videoId: videoId,
      url: url,
      message: 'Extracting video transcript...',
      startTime: Date.now()
    }
  });
  
  // Rotate loading messages
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
  }, 2500);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    clearInterval(messageInterval);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Analysis failed');
    }
    
    const data = await response.json();
    
    // Save successful result
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
    
    // Save error state
    await chrome.storage.local.set({
      analysisState: {
        status: 'error',
        videoId: videoId,
        url: url,
        error: error.message,
        failedAt: Date.now()
      }
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('Tutorial Cost extension installed');
  // Clear any stale analysis state on install/update
  chrome.storage.local.remove(['analysisState']);
});
