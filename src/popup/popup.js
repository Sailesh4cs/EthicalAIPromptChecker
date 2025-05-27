// Popup script
import { getSettings, updateSettings } from '../utils/settings.js';

// DOM elements
const extensionToggle = document.getElementById('extensionToggle');
const statusIndicator = document.getElementById('statusIndicator');
const promptsChecked = document.getElementById('promptsChecked');
const violationsFound = document.getElementById('violationsFound');
const recentActivity = document.getElementById('recentActivity');
const ruleToggles = document.querySelectorAll('.rule-toggle');
const settingsBtn = document.getElementById('settingsBtn');
const reportBtn = document.getElementById('reportBtn');
const helpBtn = document.getElementById('helpBtn');

// Initialize popup
async function initializePopup() {
  // Load settings
  const settings = await getSettings();
  
  if (!settings) {
    return;
  }
  
  // Set extension toggle state
  extensionToggle.checked = settings.enabled;
  
  // Update status indicator
  updateStatusIndicator(settings.enabled);
  
  // Set rule toggle states
  ruleToggles.forEach(toggle => {
    const ruleName = toggle.dataset.rule;
    if (settings.rules[ruleName]) {
      toggle.checked = settings.rules[ruleName].enabled;
    }
  });
  
  // Load statistics
  await loadStatistics();
  
  // Load recent activity
  await loadRecentActivity();
  
  // Add event listeners
  addEventListeners();
}

// Update status indicator
function updateStatusIndicator(enabled) {
  const statusIcon = statusIndicator.querySelector('.status-icon');
  const statusText = statusIndicator.querySelector('.status-text');
  
  if (enabled) {
    statusIcon.classList.add('active');
    statusIcon.classList.remove('inactive');
    statusText.textContent = 'Active';
  } else {
    statusIcon.classList.remove('active');
    statusIcon.classList.add('inactive');
    statusText.textContent = 'Inactive';
  }
}

// Load statistics
async function loadStatistics() {
  // Get logs from storage
  const logsData = await chrome.storage.local.get('violationLogs');
  const logs = logsData.violationLogs || [];
  
  // Count prompts checked (estimate based on logs)
  const promptCount = logs.length;
  promptsChecked.textContent = promptCount;
  
  // Count violations
  const violationCount = logs.filter(log => 
    log.action === 'warn' || log.action === 'block'
  ).length;
  violationsFound.textContent = violationCount;
}

// Load recent activity
async function loadRecentActivity() {
  // Get logs from storage
  const logsData = await chrome.storage.local.get('violationLogs');
  const logs = logsData.violationLogs || [];
  
  // Sort logs by timestamp (most recent first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Take only the 5 most recent logs
  const recentLogs = logs.slice(0, 5);
  
  // Clear existing content
  recentActivity.innerHTML = '';
  
  // Display empty state if no logs
  if (recentLogs.length === 0) {
    recentActivity.innerHTML = `
      <div class="empty-state">
        <p>No recent activity to display</p>
      </div>
    `;
    return;
  }
  
  // Add activity items
  recentLogs.forEach(log => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    // Format timestamp
    const date = new Date(log.timestamp);
    const timeString = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    // Format action type
    let actionType = 'Checked';
    if (log.action === 'warn') {
      actionType = 'Warning';
    } else if (log.action === 'block') {
      actionType = 'Blocked';
    } else if (log.action === 'override') {
      actionType = 'Override';
    }
    
    // Get platform name
    let platformName = log.platform || 'Unknown';
    if (platformName === 'chatgpt') {
      platformName = 'ChatGPT';
    } else if (platformName === 'copilot') {
      platformName = 'Microsoft Copilot';
    } else if (platformName === 'claude') {
      platformName = 'Claude';
    } else if (platformName === 'github-copilot') {
      platformName = 'GitHub Copilot';
    }
    
    // Add content
    activityItem.innerHTML = `
      <div class="activity-header">
        <span class="activity-type">${actionType}</span>
        <span class="activity-time">${timeString}</span>
      </div>
      <div class="activity-content">
        Platform: ${platformName}
        ${log.violations && log.violations.length > 0 
          ? `<br>Rules: ${log.violations.map(v => v.rule).join(', ')}`
          : ''}
      </div>
    `;
    
    recentActivity.appendChild(activityItem);
  });
}

// Add event listeners
function addEventListeners() {
  // Extension toggle
  extensionToggle.addEventListener('change', async () => {
    const settings = await getSettings();
    
    if (!settings) {
      return;
    }
    
    settings.enabled = extensionToggle.checked;
    await updateSettings(settings);
    
    // Update status indicator
    updateStatusIndicator(settings.enabled);
    
    // Notify content scripts of the setting change
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        type: 'SETTINGS_UPDATED'
      });
    });
  });
  
  // Rule toggles
  ruleToggles.forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const ruleName = toggle.dataset.rule;
      const settings = await getSettings();
      
      if (!settings || !settings.rules[ruleName]) {
        return;
      }
      
      settings.rules[ruleName].enabled = toggle.checked;
      await updateSettings(settings);
    });
  });
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Report button
  reportBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/report/report.html') });
  });
  
  // Help button
  helpBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/help/help.html') });
  });
}

// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', initializePopup);