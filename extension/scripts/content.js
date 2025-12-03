(() => {
  let lastUrl = '';
  
  function extractVideoInfo() {
    const url = window.location.href;
    
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    if (!videoIdMatch) return null;
    
    const videoId = videoIdMatch[1];
    
    const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    const channelEl = document.querySelector('#channel-name a');
    
    return {
      url: url,
      videoId: videoId,
      title: titleEl?.textContent || document.title.replace(' - YouTube', ''),
      channel: channelEl?.textContent || 'Unknown Channel',
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    };
  }
  
  function notifyPopup() {
    const videoInfo = extractVideoInfo();
    if (videoInfo) {
      chrome.runtime.sendMessage({
        type: 'VIDEO_DETECTED',
        data: videoInfo
      }).catch(() => {});
    }
  }
  
  function checkForVideoChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(notifyPopup, 1000);
    }
  }
  
  const observer = new MutationObserver(() => {
    checkForVideoChange();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  checkForVideoChange();
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_VIDEO_INFO') {
      const videoInfo = extractVideoInfo();
      sendResponse(videoInfo);
    }
    return true;
  });
})();
