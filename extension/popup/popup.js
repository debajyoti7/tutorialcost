const API_BASE_URL = 'https://tutorialcost.replit.app';

let currentVideoUrl = null;
let currentVideoId = null;
let currentAnalysisId = null;
let statusCheckInterval = null;

const settingsElements = {
  panel: null,
  btn: null,
  closeBtn: null,
  apiKeyInput: null,
  saveBtn: null,
  removeBtn: null,
  keyConfigured: null,
  keyNotConfigured: null
};

function initSettings() {
  settingsElements.panel = document.getElementById('settings-panel');
  settingsElements.btn = document.getElementById('settings-btn');
  settingsElements.closeBtn = document.getElementById('close-settings');
  settingsElements.apiKeyInput = document.getElementById('api-key-input');
  settingsElements.saveBtn = document.getElementById('save-api-key');
  settingsElements.removeBtn = document.getElementById('remove-api-key');
  settingsElements.keyConfigured = document.getElementById('key-configured');
  settingsElements.keyNotConfigured = document.getElementById('key-not-configured');
  
  settingsElements.btn?.addEventListener('click', toggleSettings);
  settingsElements.closeBtn?.addEventListener('click', closeSettings);
  settingsElements.saveBtn?.addEventListener('click', saveApiKey);
  settingsElements.removeBtn?.addEventListener('click', removeApiKey);
  
  updateApiKeyStatus();
}

function toggleSettings() {
  if (settingsElements.panel) {
    settingsElements.panel.classList.toggle('hidden');
  }
}

function closeSettings() {
  if (settingsElements.panel) {
    settingsElements.panel.classList.add('hidden');
  }
}

async function updateApiKeyStatus() {
  const result = await chrome.storage.sync.get(['geminiApiKey']);
  const hasKey = Boolean(result.geminiApiKey);
  
  if (settingsElements.keyConfigured) {
    settingsElements.keyConfigured.classList.toggle('hidden', !hasKey);
  }
  if (settingsElements.keyNotConfigured) {
    settingsElements.keyNotConfigured.classList.toggle('hidden', hasKey);
  }
  if (settingsElements.btn) {
    settingsElements.btn.classList.toggle('has-key', hasKey);
  }
}

async function saveApiKey() {
  const key = settingsElements.apiKeyInput?.value?.trim();
  
  if (!key) {
    alert('Please enter an API key');
    return;
  }
  
  if (!key.startsWith('AIza')) {
    alert('Invalid API key format. Gemini API keys start with "AIza"');
    return;
  }
  
  await chrome.storage.sync.set({ geminiApiKey: key });
  settingsElements.apiKeyInput.value = '';
  updateApiKeyStatus();
  closeSettings();
}

async function removeApiKey() {
  await chrome.storage.sync.remove(['geminiApiKey']);
  updateApiKeyStatus();
}

const states = {
  notYoutube: document.getElementById('not-youtube'),
  videoDetected: document.getElementById('video-detected'),
  loading: document.getElementById('loading'),
  results: document.getElementById('results'),
  error: document.getElementById('error')
};

function showState(stateName) {
  Object.keys(states).forEach(key => {
    if (states[key]) {
      states[key].classList.add('hidden');
    }
  });
  if (states[stateName]) {
    states[stateName].classList.remove('hidden');
  }
}

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVideoThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getVideoInfo(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
        const channelEl = document.querySelector('#channel-name a');
        return {
          title: titleEl?.textContent || document.title.replace(' - YouTube', ''),
          channel: channelEl?.textContent || 'Unknown Channel'
        };
      }
    });
    return results[0]?.result || { title: 'YouTube Video', channel: 'Unknown Channel' };
  } catch (e) {
    return { title: 'YouTube Video', channel: 'Unknown Channel' };
  }
}

function startAnalysis() {
  // Send message to background worker to start analysis
  chrome.runtime.sendMessage({
    type: 'START_ANALYSIS',
    url: currentVideoUrl,
    videoId: currentVideoId
  });
  
  showState('loading');
  startStatusCheck();
}

function startStatusCheck() {
  // Clear any existing interval
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }
  
  // Check status immediately and then every 500ms
  checkStatus();
  statusCheckInterval = setInterval(checkStatus, 500);
}

function stopStatusCheck() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
}

async function checkStatus() {
  try {
    const state = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
        resolve(response);
      });
    });
    
    if (!state) return;
    
    // Only process if it's for the current video
    if (state.videoId !== currentVideoId) return;
    
    if (state.status === 'loading') {
      showState('loading');
      document.getElementById('loading-message').textContent = state.message || 'Analyzing...';
    } else if (state.status === 'success') {
      stopStatusCheck();
      displayResults(state.data);
    } else if (state.status === 'error') {
      stopStatusCheck();
      showState('error');
      document.getElementById('error-message').textContent = state.error || 'Analysis failed';
    }
  } catch (e) {
    console.error('Error checking status:', e);
  }
}

function displayResults(data) {
  currentAnalysisId = data.id;
  
  document.getElementById('experiments-count').textContent = data.experiments.length;
  document.getElementById('tools-count').textContent = data.tools.length;
  
  const costMin = data.summary.totalCostMin || 0;
  const costMax = data.summary.totalCostMax || 0;
  document.getElementById('cost-range').textContent = 
    costMin === costMax ? `$${costMin}` : `$${costMin}-${costMax}`;
  
  const experimentsList = document.getElementById('experiments-list');
  experimentsList.innerHTML = '';
  data.experiments.slice(0, 5).forEach(exp => {
    const li = document.createElement('li');
    li.textContent = exp.title;
    experimentsList.appendChild(li);
  });
  
  if (data.experiments.length > 5) {
    const li = document.createElement('li');
    li.textContent = `+${data.experiments.length - 5} more...`;
    li.style.color = 'var(--muted-foreground)';
    experimentsList.appendChild(li);
  }
  
  const toolsList = document.getElementById('tools-list');
  toolsList.innerHTML = '';
  data.tools.slice(0, 6).forEach(tool => {
    const badge = document.createElement('span');
    badge.className = 'tool-badge';
    badge.textContent = tool.name;
    toolsList.appendChild(badge);
  });
  
  if (data.tools.length > 6) {
    const badge = document.createElement('span');
    badge.className = 'tool-badge';
    badge.textContent = `+${data.tools.length - 6}`;
    badge.style.opacity = '0.7';
    toolsList.appendChild(badge);
  }
  
  showState('results');
}

async function init() {
  const tab = await getCurrentTab();
  
  if (!tab.url || !tab.url.includes('youtube.com')) {
    showState('notYoutube');
    return;
  }
  
  const videoId = extractVideoId(tab.url);
  if (!videoId) {
    showState('notYoutube');
    return;
  }
  
  currentVideoUrl = tab.url;
  currentVideoId = videoId;
  
  // Check if there's an existing analysis state for this video
  const state = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
      resolve(response);
    });
  });
  
  if (state && state.videoId === videoId) {
    if (state.status === 'loading') {
      showState('loading');
      document.getElementById('loading-message').textContent = state.message || 'Analyzing...';
      startStatusCheck();
      return;
    } else if (state.status === 'success') {
      displayResults(state.data);
      return;
    } else if (state.status === 'error') {
      showState('error');
      document.getElementById('error-message').textContent = state.error || 'Analysis failed';
      return;
    }
  }
  
  // No existing state, show video detected UI
  const videoInfo = await getVideoInfo(tab);
  
  document.getElementById('video-thumbnail').src = getVideoThumbnail(videoId);
  document.getElementById('video-title').textContent = videoInfo.title;
  document.getElementById('video-channel').textContent = videoInfo.channel;
  
  showState('videoDetected');
}

document.getElementById('analyze-btn')?.addEventListener('click', () => {
  if (currentVideoUrl) {
    // Clear any previous state for this video before starting new analysis
    chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS' }, () => {
      startAnalysis();
    });
  }
});

document.getElementById('retry-btn')?.addEventListener('click', () => {
  if (currentVideoUrl) {
    chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS' }, () => {
      startAnalysis();
    });
  }
});

document.getElementById('new-analysis-btn')?.addEventListener('click', () => {
  // Clear the analysis state and reinitialize
  chrome.runtime.sendMessage({ type: 'CLEAR_ANALYSIS' }, () => {
    init();
  });
});

document.getElementById('view-full-btn')?.addEventListener('click', () => {
  if (currentAnalysisId) {
    chrome.tabs.create({ url: `${API_BASE_URL}/analysis/${currentAnalysisId}` });
  }
});

document.getElementById('open-webapp')?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: API_BASE_URL });
});

// Clean up interval when popup closes
window.addEventListener('unload', () => {
  stopStatusCheck();
});

initSettings();
init();
