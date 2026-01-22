const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dashboard')));

const DATA_FILE = path.join(__dirname, 'tracking-data.json');

// Memory store structure
let trackingData = {
  sessions: [],
  summary: {}
};

// 1. IMPROVED DATA LOADING (Handles empty or corrupt files)
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const rawData = fs.readFileSync(DATA_FILE, 'utf8');
      if (rawData.trim()) {
        trackingData = JSON.parse(rawData);
        console.log(`✅ Loaded ${trackingData.sessions.length} sessions from disk.`);
      }
    }
  } catch (error) {
    console.error('❌ Error loading data file. Starting with fresh state.');
    trackingData = { sessions: [], summary: {} };
  }
}

// 2. DEBOUNCED SAVING (Protects SSD from writing every second)
let saveTimeout;
function saveData() {
  clearTimeout(saveTimeout);
  // Wait for 5 seconds of "silence" or until forced
  saveTimeout = setTimeout(() => {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(trackingData, null, 2));
      console.log('💾 Data successfully synced to disk.');
    } catch (error) {
      console.error('❌ File Save Error:', error);
    }
  }, 5000); 
}

loadData();

// 3. ROBUST TRACKING ROUTE
app.post('/track', (req, res) => {
  try {
    const { domain, timeSpent, category, timestamp } = req.body;
    
    if (!domain || timeSpent === undefined || !category) {
      return res.status(400).json({ error: 'Missing domain, timeSpent, or category' });
    }

    // Record the raw session
    trackingData.sessions.push({
      domain,
      timeSpent,
      category,
      timestamp: timestamp || new Date().toISOString()
    });
    
    // Initialize summary object for new domains safely
    if (!trackingData.summary[domain]) {
      trackingData.summary[domain] = {
        domain,
        productive: 0,
        unproductive: 0,
        neutral: 0,
        unknown: 0, // Catch-all for undefined categories
        total: 0,
        category: category
      };
    }
    
    // Increment specific category (using bracket notation for safety)
    const catKey = trackingData.summary[domain].hasOwnProperty(category) ? category : 'unknown';
    trackingData.summary[domain][catKey] += timeSpent;
    trackingData.summary[domain].total += timeSpent;
    
    saveData(); // Trigger the debounced save
    
    res.json({ success: true, total: trackingData.summary[domain].total });
  } catch (error) {
    console.error('Track Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. PERFORMANCE-OPTIMIZED SUMMARY ROUTE
app.get('/summary', (req, res) => {
  try {
    const summary = trackingData.summary;
    let totals = { productive: 0, unproductive: 0, neutral: 0, total: 0 };
    const websiteStats = [];
    
    // Calculate global totals and prepare table data
    for (let domain in summary) {
      const site = summary[domain];
      totals.productive += site.productive;
      totals.unproductive += site.unproductive;
      totals.neutral += (site.neutral || 0) + (site.unknown || 0);
      totals.total += site.total;
      
      websiteStats.push({
        domain: domain,
        time: site.total,
        category: site.category,
        productive: site.productive,
        unproductive: site.unproductive
      });
    }
    
    websiteStats.sort((a, b) => b.time - a.time);

    // Calculate Weekly Trend
    const now = new Date();
    const weeklyData = { days: [] };
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = { date: dateStr, productive: 0, unproductive: 0 };
      
      // Only process sessions from the last 7 days to keep it fast
      trackingData.sessions.forEach(session => {
        if (session.timestamp.startsWith(dateStr)) {
          if (session.category === 'productive') dayData.productive += session.timeSpent;
          if (session.category === 'unproductive') dayData.unproductive += session.timeSpent;
        }
      });
      
      weeklyData.days.push(dayData);
    }
    
    res.json({
      overview: {
        ...totals,
        productivityScore: totals.total > 0 ? Math.round((totals.productive / totals.total) * 100) : 0
      },
      websites: websiteStats,
      weekly: weeklyData
    });
  } catch (error) {
    console.error('Summary Error:', error);
    res.status(500).json({ error: 'Analytics calculation failed' });
  }
});

// 5. DATA MANAGEMENT
app.delete('/reset', (req, res) => {
  trackingData = { sessions: [], summary: {} };
  saveData();
  res.json({ success: true, message: 'All tracking data cleared' });
});

app.listen(PORT, () => {
  console.log(`
  🚀 FocusPulse Backend Active
  -------------------------------------------
  📡 API:       http://localhost:${PORT}
  📊 Dashboard: http://localhost:${PORT}/dashboard
  📂 Data File: ${DATA_FILE}
  -------------------------------------------
  `);
});