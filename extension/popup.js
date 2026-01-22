// 1. Updated for Real-Time HH:MM:SS
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  // Returns format 00h 00m 00s
  const hDisplay = h > 0 ? `${h}h ` : "";
  const mDisplay = `${m.toString().padStart(2, '0')}m `;
  const sDisplay = `${s.toString().padStart(2, '0')}s`;
  
  return hDisplay + mDisplay + sDisplay;
}

function updateUI() {
  chrome.storage.local.get(['timeData'], (result) => {
    const timeData = result.timeData || {};
    
    let productiveTotal = 0;
    let unproductiveTotal = 0;
    let totalTime = 0;
    
    const websiteArray = [];
    
    for (let domain in timeData) {
      const site = timeData[domain];
      productiveTotal += site.productive || 0;
      unproductiveTotal += site.unproductive || 0;
      totalTime += site.total || 0;
      
      websiteArray.push({
        domain: domain,
        time: site.total,
        category: site.category
      });
    }
    
    // Update main totals
    document.getElementById('productive-time').textContent = formatTime(productiveTotal);
    document.getElementById('unproductive-time').textContent = formatTime(unproductiveTotal);
    document.getElementById('total-time').textContent = formatTime(totalTime);
    
    websiteArray.sort((a, b) => b.time - a.time);
    
    const websiteList = document.getElementById('website-list');
    websiteList.innerHTML = '';
    
    websiteArray.slice(0, 5).forEach(site => {
      const item = document.createElement('div');
      item.className = 'website-item';
      
      const badgeClass = site.category === 'productive' ? 'badge-productive' : 
                        site.category === 'unproductive' ? 'badge-unproductive' : 
                        'badge-neutral';
      
      item.innerHTML = `
        <span class="website-name">${site.domain || 'Unknown'}</span>
        <span class="category-badge ${badgeClass}">${site.category}</span>
        <span class="website-time" style="font-family: monospace;">${formatTime(site.time)}</span>
      `;
      
      websiteList.appendChild(item);
    });
    
    if (websiteArray.length === 0) {
      websiteList.innerHTML = '<p style="text-align: center; opacity: 0.7; padding: 20px; font-size: 13px;">No activity tracked yet. Start browsing!</p>';
    }
  });
}

// Event Listeners
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all tracking data?')) {
    chrome.storage.local.set({ timeData: {} }, () => {
      updateUI();
    });
  }
});

document.getElementById('dashboard-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});

// Initial load
updateUI();

// 2. Change to 1000ms (1 second) for real-time ticking
setInterval(updateUI, 1000);