// Settings management utilities

/**
 * Retrieves the current extension settings
 * @returns {Promise<Object>} The current settings
 */
export async function getSettings() {
  try {
    const data = await chrome.storage.sync.get('settings');
    return data.settings;
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return null;
  }
}

/**
 * Updates extension settings
 * @param {Object} newSettings - The new settings to save
 * @returns {Promise<boolean>} Success status
 */
export async function updateSettings(newSettings) {
  try {
    await chrome.storage.sync.set({ settings: newSettings });
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
}

/**
 * Resets settings to default values
 * @returns {Promise<boolean>} Success status
 */
export async function resetSettings() {
  try {
    const defaultSettings = {
      enabled: true,
      blockMode: 'warn',
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
    };
    
    await chrome.storage.sync.set({ settings: defaultSettings });
    return true;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return false;
  }
}

/**
 * Exports current settings and logs as JSON
 * @returns {Promise<Object>} Settings and logs data
 */
export async function exportData() {
  try {
    const settings = await getSettings();
    const logsData = await chrome.storage.local.get('violationLogs');
    
    return {
      settings: settings,
      logs: logsData.violationLogs || [],
      exportDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Imports settings from JSON
 * @param {Object} data - The data to import
 * @returns {Promise<boolean>} Success status
 */
export async function importSettings(data) {
  try {
    if (!data || !data.settings) {
      throw new Error('Invalid import data');
    }
    
    await chrome.storage.sync.set({ settings: data.settings });
    return true;
  } catch (error) {
    console.error('Error importing settings:', error);
    return false;
  }
}