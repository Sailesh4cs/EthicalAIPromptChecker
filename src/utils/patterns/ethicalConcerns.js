// Patterns for detecting ethical concerns
export const ethicalConcernPatterns = [
  {
    name: 'Generate harmful content',
    type: 'regex',
    pattern: '\\b(?:create|generate|write)\\s+(?:harmful|malicious|dangerous)\\s+(?:content|code|instructions)\\b'
  },
  {
    name: 'Illegal activities',
    type: 'regex',
    pattern: '\\b(?:how to|instructions for|steps to)\\s+(?:hack|steal|defraud|illegally)\\b'
  },
  {
    name: 'Discrimination',
    type: 'regex',
    pattern: '\\b(?:racial|sexist|homophobic|discriminatory)\\s+(?:content|language|slurs)\\b'
  },
  {
    name: 'Misinformation',
    type: 'regex',
    pattern: '\\b(?:fake|false|misleading)\\s+(?:news|information|facts)\\b'
  },
  {
    name: 'Harassment',
    type: 'regex',
    pattern: '\\b(?:harass|bully|intimidate|threaten)\\b'
  },
  {
    name: 'Privacy violation',
    type: 'regex',
    pattern: '\\b(?:dox|expose|reveal private)\\s+(?:information|identity|details)\\b'
  },
  {
    name: 'Malicious code',
    type: 'regex',
    pattern: '\\b(?:malware|virus|ransomware|spyware|backdoor)\\b'
  }
];