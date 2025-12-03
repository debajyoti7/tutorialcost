const API_BASE_URL = 'https://content-analyzer.replit.app';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_DETECTED') {
    console.log('Video detected:', message.data);
  }
  return true;
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.url.includes('youtube.com')) {
    console.log('Opening popup for YouTube video');
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Content Analyzer extension installed');
});
