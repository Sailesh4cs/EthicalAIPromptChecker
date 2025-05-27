// Report page script
import { formatDate } from '../utils/helpers.js';

// DOM elements
const totalChecksEl = document.getElementById('totalChecks');
const totalWarningsEl = document.getElementById('totalWarnings');
const totalBlocksEl = document.getElementById('totalBlocksEl');
const totalOverridesEl = document.getElementById('totalOverrides');
const violationsTableBody = document.getElementById('violationsTableBody');
const emptyState = document.getElementById('emptyState');
const rulesChart = document.getElementById('rulesChart');
const dateRangeFilter = document.getElementById('dateRangeFilter');
const actionFilter = document.getElementById('actionFilter');
const platformFilter = document.getElementById('platformFilter');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const paginationInfo = document.getElementById('paginationInfo');
const exportReportBtn = document.getElementById('exportReportBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const backBtn = document.getElementById('backBtn');

// Pagination state
let currentPage = 1;
const itemsPerPage = 10;
let filteredLogs = [];

// Initialize report
async function initializeReport() {
  // Load violation logs
  const logs = await loadViolationLogs();
  
  // Set initial filtered logs
  filteredLogs = [...logs];
  
  // Update summary statistics
  updateSummaryStats(logs);
  
  // Render table with initial logs
  renderViolationsTable(filteredLogs);
  
  // Render chart
  renderRulesChart(logs);
  
  // Add event listeners
  addEventListeners();
}

// Load violation logs from storage
async function loadViolationLogs() {
  try {
    const logsData = await chrome.storage.local.get('violationLogs');
    const logs = logsData.violationLogs || [];
    
    // Sort logs by timestamp (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return logs;
  } catch (error) {
    console.error('Error loading violation logs:', error);
    return [];
  }
}

// Update summary statistics
function updateSummaryStats(logs) {
  // Count total checks
  const totalChecks = logs.length;
  totalChecksEl.textContent = totalChecks;
  
  // Count warnings
  const totalWarnings = logs.filter(log => log.action === 'warn').length;
  totalWarningsEl.textContent = totalWarnings;
  
  // Count blocks
  const totalBlocks = logs.filter(log => log.action === 'block').length;
  if (totalBlocksEl) totalBlocksEl.textContent = totalBlocks;
  
  // Count overrides
  const totalOverrides = logs.filter(log => log.action === 'override').length;
  totalOverridesEl.textContent = totalOverrides;
}

// Render violations table
function renderViolationsTable(logs) {
  // Clear table body
  violationsTableBody.innerHTML = '';
  
  // Calculate pagination
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, logs.length);
  const currentLogs = logs.slice(startIndex, endIndex);
  
  // Update pagination info
  paginationInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  
  // Update pagination buttons
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
  
  // Show empty state if no logs
  if (currentLogs.length === 0) {
    emptyState.style.display = 'flex';
    return;
  } else {
    emptyState.style.display = 'none';
  }
  
  // Add rows to table
  currentLogs.forEach(log => {
    const row = document.createElement('tr');
    
    // Format timestamp
    const formattedDate = formatDate(log.timestamp);
    
    // Format action
    let actionText = 'Checked';
    let actionClass = '';
    if (log.action === 'warn') {
      actionText = 'Warning';
      actionClass = 'warn';
    } else if (log.action === 'block') {
      actionText = 'Blocked';
      actionClass = 'block';
    } else if (log.action === 'override') {
      actionText = 'Override';
      actionClass = 'override';
    }
    
    // Format platform
    let platformText = log.platform || 'Unknown';
    if (platformText === 'chatgpt') {
      platformText = 'ChatGPT';
    } else if (platformText === 'copilot') {
      platformText = 'Microsoft Copilot';
    } else if (platformText === 'claude') {
      platformText = 'Claude';
    } else if (platformText === 'github-copilot') {
      platformText = 'GitHub Copilot';
    }
    
    // Format violations
    const violationsCount = log.violations ? log.violations.length : 0;
    
    // Format rules
    const rulesText = log.violations 
      ? log.violations.map(v => v.rule).join(', ') 
      : 'None';
    
    // Add row content
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td><span class="action-tag ${actionClass}">${actionText}</span></td>
      <td>${platformText}</td>
      <td>${violationsCount}</td>
      <td>${rulesText}</td>
    `;
    
    violationsTableBody.appendChild(row);
  });
}

// Render rules chart
function renderRulesChart(logs) {
  // Get all violations
  const allViolations = logs
    .filter(log => log.violations && log.violations.length > 0)
    .flatMap(log => log.violations);
  
  // Count violations by rule
  const ruleCounts = {};
  allViolations.forEach(violation => {
    const ruleName = violation.rule;
    ruleCounts[ruleName] = (ruleCounts[ruleName] || 0) + 1;
  });
  
  // Convert to array and sort by count (descending)
  const ruleCountsArray = Object.entries(ruleCounts)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count);
  
  // Get max count for scaling
  const maxCount = Math.max(...ruleCountsArray.map(r => r.count), 1);
  
  // Clear chart
  rulesChart.innerHTML = '<div class="rule-bar-chart"></div>';
  const barChart = rulesChart.querySelector('.rule-bar-chart');
  
  // If no violations, show empty state
  if (ruleCountsArray.length === 0) {
    barChart.innerHTML = '<div class="empty-state">No violation data available</div>';
    return;
  }
  
  // Create bars for each rule
  ruleCountsArray.forEach(({ rule, count }) => {
    // Format rule name for display
    const displayRule = rule
      .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
    
    // Calculate height percentage
    const heightPercent = (count / maxCount) * 100;
    
    // Create bar element
    const bar = document.createElement('div');
    bar.className = 'rule-bar';
    bar.style.height = `${Math.max(heightPercent, 5)}%`; // Minimum 5% height for visibility
    
    // Add label and value
    bar.innerHTML = `
      <span class="rule-bar-value">${count}</span>
      <span class="rule-bar-label">${displayRule}</span>
    `;
    
    barChart.appendChild(bar);
  });
}

// Filter logs based on current filter settings
function filterLogs(logs) {
  const dateRange = dateRangeFilter.value;
  const action = actionFilter.value;
  const platform = platformFilter.value;
  
  return logs.filter(log => {
    // Filter by date range
    if (dateRange !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      
      if (dateRange === 'today') {
        // Only include logs from today
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (logDate < today) {
          return false;
        }
      } else if (dateRange === 'week') {
        // Only include logs from the last 7 days
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (logDate < weekAgo) {
          return false;
        }
      } else if (dateRange === 'month') {
        // Only include logs from the last 30 days
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        if (logDate < monthAgo) {
          return false;
        }
      }
    }
    
    // Filter by action
    if (action !== 'all' && log.action !== action) {
      return false;
    }
    
    // Filter by platform
    if (platform !== 'all' && log.platform !== platform) {
      return false;
    }
    
    return true;
  });
}

// Export report as CSV
async function exportReportAsCsv() {
  try {
    // Get all logs
    const logs = await loadViolationLogs();
    
    // Create CSV header
    let csv = 'Timestamp,Action,Platform,Violations,Rules\n';
    
    // Add rows
    logs.forEach(log => {
      const timestamp = log.timestamp;
      const action = log.action || '';
      const platform = log.platform || '';
      const violationsCount = log.violations ? log.violations.length : 0;
      const rules = log.violations 
        ? log.violations.map(v => v.rule).join(';') 
        : '';
      
      // Add row to CSV
      csv += `"${timestamp}","${action}","${platform}","${violationsCount}","${rules}"\n`;
    });
    
    // Create blob and download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-policy-guardian-report-${new Date().toISOString().slice(0, 10)}.csv`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error exporting report:', error);
    alert('Error exporting report. Please try again.');
  }
}

// Clear all logs
async function clearAllLogs() {
  if (!confirm('Are you sure you want to clear all violation logs? This action cannot be undone.')) {
    return;
  }
  
  try {
    // Clear logs from storage
    await chrome.storage.local.set({ violationLogs: [] });
    
    // Reload the page
    window.location.reload();
    
  } catch (error) {
    console.error('Error clearing logs:', error);
    alert('Error clearing logs. Please try again.');
  }
}

// Add event listeners
function addEventListeners() {
  // Filter change events
  dateRangeFilter.addEventListener('change', async () => {
    const logs = await loadViolationLogs();
    filteredLogs = filterLogs(logs);
    currentPage = 1;
    renderViolationsTable(filteredLogs);
    renderRulesChart(filteredLogs);
  });
  
  actionFilter.addEventListener('change', async () => {
    const logs = await loadViolationLogs();
    filteredLogs = filterLogs(logs);
    currentPage = 1;
    renderViolationsTable(filteredLogs);
    renderRulesChart(filteredLogs);
  });
  
  platformFilter.addEventListener('change', async () => {
    const logs = await loadViolationLogs();
    filteredLogs = filterLogs(logs);
    currentPage = 1;
    renderViolationsTable(filteredLogs);
    renderRulesChart(filteredLogs);
  });
  
  // Pagination events
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderViolationsTable(filteredLogs);
    }
  });
  
  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderViolationsTable(filteredLogs);
    }
  });
  
  // Export report button
  exportReportBtn.addEventListener('click', exportReportAsCsv);
  
  // Clear logs button
  clearLogsBtn.addEventListener('click', clearAllLogs);
  
  // Back button
  backBtn.addEventListener('click', () => {
    window.close();
  });
}

// Initialize the report when DOM is ready
document.addEventListener('DOMContentLoaded', initializeReport);