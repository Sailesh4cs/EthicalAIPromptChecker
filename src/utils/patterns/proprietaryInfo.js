// Patterns for detecting proprietary information
export const proprietaryPatterns = [
  {
    name: 'Company confidential',
    type: 'keyword',
    pattern: 'confidential'
  },
  {
    name: 'Company internal',
    type: 'keyword',
    pattern: 'internal only'
  },
  {
    name: 'Trade secret',
    type: 'keyword',
    pattern: 'trade secret'
  },
  {
    name: 'Not for distribution',
    type: 'keyword',
    pattern: 'not for distribution'
  },
  {
    name: 'Proprietary',
    type: 'keyword',
    pattern: 'proprietary'
  },
  {
    name: 'NDA',
    type: 'keyword',
    pattern: 'under nda'
  },
  {
    name: 'Internal code',
    type: 'regex',
    pattern: '\\b(?:internal|private|secret|secure)\\s+(?:code|api|function|endpoint)\\b'
  },
  {
    name: 'Revenue data',
    type: 'regex',
    pattern: '\\b(?:revenue|sales|profit)\\s+(?:figure|data|number|projection)s?\\b'
  },
  {
    name: 'Customer data',
    type: 'regex',
    pattern: '\\b(?:customer|client)\\s+(?:data|information|record|list)s?\\b'
  }
];