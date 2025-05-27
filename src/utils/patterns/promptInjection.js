// Patterns for detecting prompt injection attempts
export const promptInjectionPatterns = [
  {
    name: 'Ignore previous instructions',
    type: 'keyword',
    pattern: 'ignore previous instructions'
  },
  {
    name: 'Ignore above',
    type: 'keyword',
    pattern: 'ignore all of the above'
  },
  {
    name: 'Disregard',
    type: 'keyword',
    pattern: 'disregard your previous instructions'
  },
  {
    name: 'System prompt',
    type: 'keyword',
    pattern: 'system prompt'
  },
  {
    name: 'You are now',
    type: 'regex',
    pattern: 'you are now [a-z]+'
  },
  {
    name: 'Jailbreak',
    type: 'keyword',
    pattern: 'jailbreak'
  },
  {
    name: 'DAN',
    type: 'keyword',
    pattern: 'do anything now'
  },
  {
    name: 'Role play',
    type: 'regex',
    pattern: 'role\\s*play as [a-z]+'
  },
  {
    name: 'Command override',
    type: 'regex',
    pattern: '\\b(?:override|bypass)\\s+(?:filter|restriction|limitation|safeguard)s?\\b'
  }
];