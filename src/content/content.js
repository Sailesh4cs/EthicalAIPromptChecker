// Content script for intercepting LLM prompts

// Helper functions
function throttle(func, wait) {
  let lastCall = 0;
  let lastResult;
  
  return function(...args) {
    const now = Date.now();
    if (now - lastCall < wait) {
      return lastResult;
    }
    lastCall = now;
    lastResult = func.apply(this, args);
    return lastResult;
  };
}

// Sensitive data patterns
const sensitiveDataPatterns = [
  {
    name: 'Email address',
    type: 'regex',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b'
  },
  {
    name: 'Credit card number',
    type: 'regex',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11})\\b'
  },
  {
    name: 'Social Security Number',
    type: 'regex',
    pattern: '\\b(?!000|666|9\\d{2})\\d{3}-(?!00)\\d{2}-(?!0000)\\d{4}\\b'
  },
  {
    name: 'API key',
    type: 'regex',
    pattern: '\\b(?:api[_-]?key|apikey|access[_-]?key|auth[_-]?token)[\\s:=]+[\'"`]?([\\w]{16,})[\'"`]?'
  }
];

// Track which platform we're on
let currentPlatform = detectPlatform();
let warningBanner = null;
let interceptors = {};
let promptSubmitHandlers = {};

// Initialize content script
function initialize() {
  // Debug log
  console.log('LLM Policy Guardian: Initializing content script');
  
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
  console.log('LLM Policy Guardian: Checking URL:', url);
  
  if (url.includes('chat.openai.com')) {
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
    console.log('LLM Policy Guardian: Intercepting ChatGPT submission');
    
    // Only intercept if the button is a submit button
    if (!event.target.form || !event.target.closest('button[type="submit"]')) {
      return;
    }
    
    const textareaElement = event.target.form.querySelector('textarea');
    if (!textareaElement) {
      console.log('LLM Policy Guardian: No textarea found');
      return;
    }
    
    const promptText = textareaElement.value;
    if (!promptText || promptText.trim() === '') {
      console.log('LLM Policy Guardian: Empty prompt');
      return;
    }
    
    console.log('LLM Policy Guardian: Checking prompt:', promptText);
    
    // Check for sensitive data
    const violations = checkSensitiveData(promptText);
    console.log('LLM Policy Guardian: Violations found:', violations);
    
    if (violations.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      showWarningBanner('Potential policy violation', violations, 'warn');
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

// Check for sensitive data in prompt
function checkSensitiveData(prompt) {
  const violations = [];
  const promptLower = prompt.toLowerCase();
  
  sensitiveDataPatterns.forEach(pattern => {
    if (new RegExp(pattern.pattern, 'i').test(promptLower)) {
      violations.push({
        rule: pattern.name,
        description: `Found potential ${pattern.name.toLowerCase()}`
      });
    }
  });
  
  return violations;
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
      console.log('LLM Policy Guardian: Policy override', violations);
    });
  }
  
  // Show the banner
  warningBanner.style.display = 'block';
}

// Hide warning banner
function hideWarningBanner() {
  if (warningBanner) {
    warningBanner.style.display = 'none';
  }
}

// Initialize the content script
initialize();