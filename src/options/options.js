// Options page script
import { getSettings, updateSettings, resetSettings, exportData, importSettings } from '../utils/settings.js';

// DOM elements
const enableExtensionToggle = document.getElementById('enableExtension');
const blockModeSelect = document.getElementById('blockMode');
const ruleToggles = document.querySelectorAll('.rule-toggle');
const ruleSeveritySelects = document.querySelectorAll('.rule-setting-select');
const enableLoggingToggle = document.getElementById('enableLogging');
const retentionPeriodSelect = document.getElementById('retentionPeriod');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');
const toast = document.getElementById('toast');

// Initialize options page
async function initializeOptions() {
  // Load settings
  const settings = await getSettings();
  
  if (!settings) {
    showToast('Error loading settings', 'error');
    return;
  }
  
  // Set form values based on settings
  enableExtensionToggle.checked = settings.enabled;
  blockModeSelect.value = settings.blockMode;
  
  // Set rule toggles and severities
  ruleToggles.forEach(toggle => {
    const ruleName = toggle.dataset.rule;
    if (settings.rules[ruleName]) {
      toggle.checked = settings.rules[ruleName].enabled;
    }
  });
  
  ruleSeveritySelects.forEach(select => {
    const ruleName = select.dataset.rule;
    if (settings.rules[ruleName]) {
      select.value = settings.rules[ruleName].severity;
    }
  });
  
  // Set logging settings
  enableLoggingToggle.checked = settings.logging.enabled;
  retentionPeriodSelect.value = settings.logging.retentionDays.toString();
  
  // Add event listeners
  addEventListeners();
}

// Save settings
async function saveSettings() {
  try {
    // Get current settings
    const currentSettings = await getSettings();
    
    if (!currentSettings) {
      showToast('Error: Could not retrieve current settings', 'error');
      return false;
    }
    
    // Create new settings object
    const newSettings = {
      enabled: enableExtensionToggle.checked,
      blockMode: blockModeSelect.value,
      rules: { ...currentSettings.rules },
      logging: {
        enabled: enableLoggingToggle.checked,
        retentionDays: parseInt(retentionPeriodSelect.value)
      }
    };
    
    // Update rule settings
    ruleToggles.forEach(toggle => {
      const ruleName = toggle.dataset.rule;
      if (newSettings.rules[ruleName]) {
        newSettings.rules[ruleName].enabled = toggle.checked;
      }
    });
    
    ruleSeveritySelects.forEach(select => {
      const ruleName = select.dataset.rule;
      if (newSettings.rules[ruleName]) {
        newSettings.rules[ruleName].severity = select.value;
      }
    });
    
    // Save new settings
    const success = await updateSettings(newSettings);
    
    if (success) {
      showToast('Settings saved successfully');
      return true;
    } else {
      showToast('Error saving settings', 'error');
      return false;
    }
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Error saving settings', 'error');
    return false;
  }
}

// Reset settings to default
async function resetSettingsToDefault() {
  if (!confirm('Are you sure you want to reset all settings to default?')) {
    return;
  }
  
  try {
    const success = await resetSettings();
    
    if (success) {
      showToast('Settings reset to default');
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return true;
    } else {
      showToast('Error resetting settings', 'error');
      return false;
    }
    
  } catch (error) {
    console.error('Error resetting settings:', error);
    showToast('Error resetting settings', 'error');
    return false;
  }
}

// Export settings
async function exportSettingsToFile() {
  try {
    const data = await exportData();
    
    if (!data) {
      showToast('Error exporting settings', 'error');
      return;
    }
    
    // Convert data to JSON string
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `llm-policy-guardian-settings-${new Date().toISOString().slice(0, 10)}.json`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Settings exported successfully');
    
  } catch (error) {
    console.error('Error exporting settings:', error);
    showToast('Error exporting settings', 'error');
  }
}

// Import settings
async function importSettingsFromFile(file) {
  try {
    // Read file contents
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Parse JSON
        const data = JSON.parse(event.target.result);
        
        // Validate data
        if (!data || !data.settings) {
          showToast('Invalid settings file', 'error');
          return;
        }
        
        // Confirm import
        if (!confirm('Are you sure you want to import these settings? This will override your current configuration.')) {
          return;
        }
        
        // Import settings
        const success = await importSettings(data);
        
        if (success) {
          showToast('Settings imported successfully');
          
          // Reload the page to reflect changes
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showToast('Error importing settings', 'error');
        }
        
      } catch (error) {
        console.error('Error parsing settings file:', error);
        showToast('Invalid settings file format', 'error');
      }
    };
    
    reader.readAsText(file);
    
  } catch (error) {
    console.error('Error importing settings:', error);
    showToast('Error importing settings', 'error');
  }
}

// Add event listeners
function addEventListeners() {
  // Save button
  saveBtn.addEventListener('click', saveSettings);
  
  // Reset button
  resetBtn.addEventListener('click', resetSettingsToDefault);
  
  // Export button
  exportBtn.addEventListener('click', exportSettingsToFile);
  
  // Import button
  importBtn.addEventListener('click', () => {
    importInput.click();
  });
  
  // Import input change
  importInput.addEventListener('change', (event) => {
    if (event.target.files.length > 0) {
      importSettingsFromFile(event.target.files[0]);
    }
  });
}

// Show toast message
function showToast(message, type = 'success') {
  // Set toast content
  toast.textContent = message;
  
  // Set toast type
  toast.className = 'toast';
  if (type === 'error') {
    toast.style.backgroundColor = 'var(--error-color)';
  } else {
    toast.style.backgroundColor = 'var(--success-color)';
  }
  
  // Show toast
  toast.classList.add('show');
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initialize the options page when DOM is ready
document.addEventListener('DOMContentLoaded', initializeOptions);