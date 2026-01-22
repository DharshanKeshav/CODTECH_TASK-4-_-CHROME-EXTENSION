// ByteBreak Background Service Worker - Core Tracking Logic
const BACKEND_URL = 'http://localhost:3000';

// Classification Lists
const PRODUCTIVE_DOMAINS = [
  'github.com', 'stackoverflow.com', 'leetcode.com', 'codechef.com',
  'hackerrank.com', 'coursera.org', 'udemy.com', 'udacity.com',
  'edx.org', 'khanacademy.org', 'freecodecamp.org', 'codecademy.com',
  'developer.mozilla.org', 'docs.python.org', 'nodejs.org',
  'reactjs.org', 'vuejs.org', 'angular.io', 'w3schools.com',
  'geeksforgeeks.org', 'medium.com', 'dev.to', 'hashnode.dev'
];

const UNPRODUCTIVE_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'snapchat.com', 'tiktok.com', 'reddit.com', 'pinterest.com',
  'netflix.com', 'youtube.com', 'twitch.tv', 'discord.com',
  'whatsapp.com', 'telegram.org', 'linkedin.com'
];

// State Management
let currentTab = null;
let currentDomain = null;
let startTime = null;
let trackingActive = false;
let timeData = {}; // Stores the daily session data

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('ByteBreak installed successfully');
  chrome.storage.local.set({ timeData: {} });
});

// Load existing data from storage when background script starts
chrome.storage.local.get(['timeData'], (result) => {
  if (result.timeData) {
    timeData = result.timeData;
  }
});

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

function classifyWebsite(domain) {
  if (!domain) return 'neutral';
  for (let site of PRODUCTIVE_DOMAINS) {
    if (domain.includes(site)) return 'productive';
  }
  for (let site of UNPRODUCTIVE_DOMAINS) {
    if (domain.includes(site)) return 'unproductive';
  }
  return 'neutral';
}

// THE HEARTBEAT: Saves the last second of work to storage
function saveTimeSpent() {
  if (currentTab && startTime && trackingActive) {
    const now = Date.now();
    const timeSpent = Math.floor((now - startTime) / 1000);

    if (timeSpent > 0) {
      const domain = getDomain(currentTab.url);
      const category = classifyWebsite(domain);

      if (domain) {
        if (!timeData[domain]) {
          timeData[domain] = {
            domain: domain,
            productive: 0,
            unproductive: 0,
            neutral: 0,
            total: 0,
            category: category
          };
        }

        // Increment the specific category and total
        timeData[domain][category] += timeSpent;
        timeData[domain].total += timeSpent;

        // Update local storage so the popup can display the "Tick"
        chrome.storage.local.set({ timeData: timeData });

        // Reset the start time for the next second tick
        startTime = now;

        // Backend Sync: Every 60 seconds of activity on this site
        if (timeData[domain].total % 60 === 0) {
          sendToBackend(domain, 60, category);
        }
      }
    }
  }
}

async function sendToBackend(domain, timeSpent, category) {
  try {
    await fetch(`${BACKEND_URL}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: domain,
        timeSpent: timeSpent,
        category: category,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.log('Backend offline - data saved locally only.');
  }
}

function startTracking(tab) {
  if (tab && tab.url && (tab.url.startsWith('http') || tab.url.startsWith('https'))) {
    saveTimeSpent(); // Save any pending time from previous tab
    currentTab = tab;
    startTime = Date.now();
    trackingActive = true;
  } else {
    stopTracking();
  }
}

function stopTracking() {
  saveTimeSpent();
  trackingActive = false;
  currentTab = null;
  startTime = null;
}

// --- EVENT LISTENERS ---

// Live Heartbeat - Fires every 1 second
setInterval(() => {
  if (trackingActive) {
    saveTimeSpent();
  }
}, 1000);

// Listen for tab switching
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    startTracking(tab);
  } catch (e) {}
});

// Listen for URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    startTracking(tab);
  }
});

// Listen for Window Focus (Stopping tracking if you leave Chrome)
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
  } else {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0]) startTracking(tabs[0]);
    });
  }
});