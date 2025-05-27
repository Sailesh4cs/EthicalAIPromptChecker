// Content script for intercepting LLM prompts
import { throttle } from '../utils/helpers.js';

// Track which platform we're on
let currentPlatform = detectPlatform();
let warningBanner = null;
let interceptors = {};
let promptSubmitHandlers = {};

// Initialize content script
function initialize() {
  alert("background");

  // Detect which LLM platform we're on
  currentPlatform = detectPlatform();
  
  if (!currentPlatform) {
    console.log('LLM Policy Guardian: Not on a supported LLM platform');
    return;
  }
  
  console.log(`LLM Policy Guardian: Running on ${currentPlatform}`);
  
  // Setup platform-specific interceptors
  setupInterceptors();
  
  // Create UI elements
  createWarningBanner();
}

// Detect which LLM platform we're on based on URL
function detectPlatform() {
  const url = window.location.href;
  
  if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (url.includes('copilot.microsoft.com')) {
    return 'copilot';
  } else if (url.includes('anthropic.com')) {
    return 'claude';
  } else if (url.includes('github.com')) {
    return 'github-copilot';
  }
  
  return null;
}

// Setup interceptors for the current platform
function setupInterceptors() {
  // Remove any existing interceptors
  Object.values(interceptors).forEach(cleanup => {
    if (typeof cleanup === 'function') {
      cleanup();
    }
  });
  
  // Clear existing interceptors
  interceptors = {};
  
  // Setup platform-specific interceptors
  switch (currentPlatform) {
    case 'chatgpt':
      interceptors.chatgpt = setupChatGptInterceptor();
      break;
    case 'copilot':
      interceptors.copilot = setupCopilotInterceptor();
      break;
    case 'claude':
      interceptors.claude = setupClaudeInterceptor();
      break;
    case 'github-copilot':
      interceptors.githubCopilot = setupGithubCopilotInterceptor();
      break;
  }
}

// ChatGPT interceptor
function setupChatGptInterceptor() {
  const chatGptHandler = throttle(async (event) => {
    // Only intercept if the button is a submit button
    if (!event.target.form || !event.target.closest('button[type="submit"]')) {
      return;
    }
    
    const textareaElement = event.target.form.querySelector('textarea');
    if (!textareaElement) {
      return;
    }
    
    const promptText = textareaElement.value;
    if (!promptText || promptText.trim() === '') {
      return;
    }
    
    // Check the prompt against policies
    const result = await checkPromptPolicy(promptText);
    
    if (!result.allowed && result.action !== 'allow') {
      event.preventDefault();
      event.stopPropagation();
      
      if (result.action === 'block') {
        showWarningBanner('Prompt blocked', result.violations, 'block');
      } else {
        showWarningBanner('Potential policy violation', result.violations, 'warn');
      }
      
      return false;
    }
  }, 300);
  
  // Add event listener to intercept form submissions
  document.addEventListener('click', chatGptHandler, true);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', chatGptHandler, true);
  };
}

// Microsoft Copilot interceptor
function setupCopilotInterceptor() {
  const copilotHandler = throttle(async (event) => {
    // Find the nearest button that's being clicked
    const button = event.target.closest('button');
    if (!button) {
      return;
    }
    
    // Find the text input field
    const textareaElement = document.querySelector('textarea[placeholder*="message"], textarea[placeholder*="Ask"], textarea[placeholder*="Copilot"]');
    if (!textareaElement) {
      return;
    }
    
    const promptText = textareaElement.value;
    if (!promptText || promptText.trim() === '') {
      return;
    }
    
    // Check the prompt against policies
    const result = await checkPromptPolicy(promptText);
    
    if (!result.allowed && result.action !== 'allow') {
      event.preventDefault();
      event.stopPropagation();
      
      if (result.action === 'block') {
        showWarningBanner('Prompt blocked', result.violations, 'block');
      } else {
        showWarningBanner('Potential policy violation', result.violations, 'warn');
      }
      
      return false;
    }
  }, 300);
  
  // Add event listener to intercept clicks
  document.addEventListener('click', copilotHandler, true);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', copilotHandler, true);
  };
}

// Claude interceptor
function setupClaudeInterceptor() {
  const claudeHandler = throttle(async (event) => {
    // Only intercept if the target is a submit button
    if (!event.target.closest('button[type="submit"]')) {
      return;
    }
    
    // Find the text input field
    const textareaElement = document.querySelector('div[contenteditable="true"]');
    if (!textareaElement) {
      return;
    }
    
    const promptText = textareaElement.textContent;
    if (!promptText || promptText.trim() === '') {
      return;
    }
    
    // Check the prompt against policies
    const result = await checkPromptPolicy(promptText);
    
    if (!result.allowed && result.action !== 'allow') {
      event.preventDefault();
      event.stopPropagation();
      
      if (result.action === 'block') {
        showWarningBanner('Prompt blocked', result.violations, 'block');
      } else {
        showWarningBanner('Potential policy violation', result.violations, 'warn');
      }
      
      return false;
    }
  }, 300);
  
  // Add event listener to intercept clicks
  document.addEventListener('click', claudeHandler, true);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('click', claudeHandler, true);
  };
}

// GitHub Copilot interceptor
function setupGithubCopilotInterceptor() {
  // GitHub Copilot is more complex as it doesn't have a simple text area
  // This is a placeholder for a more complex implementation
  return () => {
    // Cleanup function (empty for now)
  };
}

// Check prompt against policy
async function checkPromptPolicy(prompt) {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_PROMPT',
      prompt: prompt
    });
    
    return response;
  } catch (error) {
    console.error('Error checking prompt policy:', error);
    // Fail open if there's an error
    return { allowed: true, error: error.message };
  }
}

// Create warning banner UI
function createWarningBanner() {
  // Remove existing banner if it exists
  if (warningBanner) {
    warningBanner.remove();
  }
  
  // Create new banner element
  warningBanner = document.createElement('div');
  warningBanner.className = 'llm-policy-guardian-banner';
  warningBanner.style.display = 'none';
  
  // Add banner to the page
  document.body.appendChild(warningBanner);
}

// Show warning banner with violations
function showWarningBanner(title, violations, type) {
  if (!warningBanner) {
    createWarningBanner();
  }
  
  // Set banner type class
  warningBanner.className = 'llm-policy-guardian-banner';
  warningBanner.classList.add(`llm-policy-guardian-banner-${type}`);
  
  // Create banner content
  let violationsHtml = '';
  if (violations && violations.length > 0) {
    violationsHtml = '<ul class="llm-policy-guardian-violations">';
    violations.forEach(violation => {
      violationsHtml += `<li>
        <strong>${violation.rule}:</strong> ${violation.description}
      </li>`;
    });
    violationsHtml += '</ul>';
  }
  
  // Add buttons based on type
  let buttonsHtml = '';
  if (type === 'warn') {
    buttonsHtml = `
      <div class="llm-policy-guardian-actions">
        <button class="llm-policy-guardian-btn llm-policy-guardian-btn-edit">Edit Prompt</button>
        <button class="llm-policy-guardian-btn llm-policy-guardian-btn-proceed">Proceed Anyway</button>
      </div>
    `;
  } else {
    buttonsHtml = `
      <div class="llm-policy-guardian-actions">
        <button class="llm-policy-guardian-btn llm-policy-guardian-btn-edit">Edit Prompt</button>
      </div>
    `;
  }
  
  // Set banner content
  warningBanner.innerHTML = `
    <div class="llm-policy-guardian-banner-content">
      <div class="llm-policy-guardian-header">
        <span class="llm-policy-guardian-icon">${type === 'warn' ? '⚠️' : '🛑'}</span>
        <h2>${title}</h2>
        <button class="llm-policy-guardian-close">&times;</button>
      </div>
      <div class="llm-policy-guardian-body">
        <p>Your prompt may violate company policy for the following reasons:</p>
        ${violationsHtml}
      </div>
      ${buttonsHtml}
    </div>
  `;
  
  // Add event listeners to buttons
  const closeBtn = warningBanner.querySelector('.llm-policy-guardian-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideWarningBanner();
    });
  }
  
  const editBtn = warningBanner.querySelector('.llm-policy-guardian-btn-edit');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      hideWarningBanner();
    });
  }
  
  const proceedBtn = warningBanner.querySelector('.llm-policy-guardian-btn-proceed');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      hideWarningBanner();
      // Log this as a policy override
      chrome.runtime.sendMessage({
        type: 'LOG_VIOLATION',
        data: {
          action: 'override',
          violations: violations,
          platform: currentPlatform
        }
      });
    });
  }
  
  // Show the banner
  warningBanner.style.display = 'block';
  
  // Log this violation
  chrome.runtime.sendMessage({
    type: 'LOG_VIOLATION',
    data: {
      action: type,
      violations: violations,
      platform: currentPlatform
    }
  });
}

// Hide warning banner
function hideWarningBanner() {
  if (warningBanner) {
    warningBanner.style.display = 'none';
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  alert(message.type + " message.type");

  if (message.type === 'SETTINGS_UPDATED') {
    // Re-initialize if settings change
    initialize();
    sendResponse({ success: true });
  }
});

// Initialize the content script
initialize();