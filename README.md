# CODTECH_TASK-4-_-CHROME-EXTENSION

***CHROME-EXTENSION-FOR-TIME-TRACKING-AND-PRODUCTIVITY-ANALYTICS***

#  ⏱️Focus Pulse: Time & Productivity Tracker

****Focus Pulse is a full-stack productivity tool that combines a Chrome Extension with a local analytics server. It monitors your browsing habits in real-time, categorizing your time into "Productive" work and "Unproductive" distractions , then visualizes that data on a beautiful web dashboard.****

# 🚀 Project Overview

****The project is split into two main components:****

****Chrome Extension: The "sensor" that tracks active tab time and provides a quick-view popup.****

****Node.js Backend: A robust server that persists your data to data.json and provides API endpoints for deep analytics.****

# ✨ Key Features

****Real-time Tracking: Monitors active tab focus and browser window state to ensure accurate time logging.****

****Domain Classification: * Productive: GitHub, StackOverflow, MDN, Coursera, etc.****

****Cookie Jar: YouTube, Netflix, Reddit, and Social Media.****

****Quick Popup: A glassmorphism-styled extension popup to see your daily productivity percentage at a glance.****

****Analytics Dashboard: A full-screen web interface featuring Chart.js visualizations for weekly trends and daily summaries.****

****Local Persistence: Data is stored locally on your machine, ensuring your browsing habits stay private.****

# 🛠️ Tech Stack

****Frontend: HTML5, CSS3 (Custom Glassmorphism), JavaScript (ES6), Chart.js.****

****Extension: Manifest V3, Chrome Scripting & Storage APIs.****

****Backend: Node.js, Express.js, CORS, File System (fs) for JSON storage.****

# 📦 Installation & Setup

****1. The Backend (Analytics Server)****

****Navigate to the backend directory****

cd backend

****Install dependencies****

npm install

Start the server (runs on http://localhost:3000)

npm start

****2. The Chrome Extension****

****Open Chrome and navigate to chrome://extensions/.****

****Enable Developer Mode in the top-right corner.****

****Click Load Unpacked.****

****Select the folder containing your manifest.json and extension files.****

