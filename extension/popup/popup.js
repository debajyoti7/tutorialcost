const API_BASE_URL = 'https://tutorialcost.replit.app';

let currentVideoUrl = null;
let currentAnalysisId = null;

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

async function analyzeVideo(url) {
  showState('loading');
  
  const messages = [
    'Extracting video transcript...',
    'Identifying LLM experiments...',
    'Analyzing tool requirements...',
    'Calculating implementation costs...'
  ];
  
  let messageIndex = 0;
  const messageInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    document.getElementById('loading-message').textContent = messages[messageIndex];
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
      throw new Error(errorData.error || 'Analysis failed');
    }
    
    const data = await response.json();
    displayResults(data);
    
  } catch (error) {
    clearInterval(messageInterval);
    showState('error');
    document.getElementById('error-message').textContent = error.message;
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
  
  const videoInfo = await getVideoInfo(tab);
  
  document.getElementById('video-thumbnail').src = getVideoThumbnail(videoId);
  document.getElementById('video-title').textContent = videoInfo.title;
  document.getElementById('video-channel').textContent = videoInfo.channel;
  
  showState('videoDetected');
}

document.getElementById('analyze-btn')?.addEventListener('click', () => {
  if (currentVideoUrl) {
    analyzeVideo(currentVideoUrl);
  }
});

document.getElementById('retry-btn')?.addEventListener('click', () => {
  if (currentVideoUrl) {
    analyzeVideo(currentVideoUrl);
  }
});

document.getElementById('new-analysis-btn')?.addEventListener('click', () => {
  init();
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

init();
