// Background script
import { checkPolicy } from '../utils/policyChecker.js';
import { getSettings } from '../utils/settings.js';

// Initialize settings when extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
 console.log("Background script initialized");
  if (!settings) {
    // Set default settings if none exist
    chrome.storage.sync.set({
      settings: {
        enabled: true,
        blockMode: 'warn', // 'warn', 'block'
        rules: {
          sensitiveData: {
            enabled: true,
            severity: 'high'
          },
          proprietaryInfo: {
            enabled: true,
            severity: 'high'
          },
          promptInjection: {
            enabled: true,
            severity: 'high'
          },
          ethicalConcerns: {
            enabled: true,
            severity: 'medium'
          }
        },
        logging: {
          enabled: true,
          retentionDays: 30
        }
      }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_PROMPT') {
    checkPrompt(message.prompt)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  } else if (message.type === 'LOG_VIOLATION') {
    logViolation(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Indicates async response
  }
});

// Check if a prompt violates policies
async function checkPrompt(prompt) {
  try {
    const settings = await getSettings();
    
    if (!settings || !settings.enabled) {
      return { allowed: true };
    }
    
    const result = await checkPolicy(prompt, settings.rules);
    return {
      allowed: result.violations.length === 0,
      violations: result.violations,
      action: determineAction(result.violations, settings)
    };
  } catch (error) {
    console.error('Error checking prompt:', error);
    // Fail open if there's an error checking the policy
    return { allowed: true, error: error.message };
  }
}

// Determine what action to take based on violations and settings
function determineAction(violations, settings) {
  if (violations.length === 0) {
    return 'allow';
  }
  
  // Check if any high severity violations exist
  const hasHighSeverity = violations.some(v => 
    settings.rules[v.rule] && 
    settings.rules[v.rule].severity === 'high'
  );
  
  if (hasHighSeverity && settings.blockMode === 'block') {
    return 'block';
  }
  
  return 'warn';
}

// Log policy violations for reporting
async function logViolation(data) {
  try {
    const settings = await getSettings();
    
    if (!settings || !settings.logging.enabled) {
      return;
    }
    
    // Get existing logs
    const existingData = await chrome.storage.local.get('violationLogs');
    const logs = existingData.violationLogs || [];
    
    // Add new log with timestamp
    logs.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Clean up old logs based on retention policy
    const retentionDays = settings.logging.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const filteredLogs = logs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );
    
    // Store updated logs
    await chrome.storage.local.set({ violationLogs: filteredLogs });
    
  } catch (error) {
    console.error('Error logging violation:', error);
  }
}